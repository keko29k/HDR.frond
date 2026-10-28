import { Component, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter, Observable, of, switchMap } from 'rxjs';
import { Caja } from './features/cajas/models/caja.model';
import { CajaService } from './features/cajas/services/caja';
import { Sucursal } from './features/sucursales/models/sucursal.model';
import { SucursalService } from './features/sucursales/services/sucursal';
import { Usuario } from './features/usuarios/models/usuario.model';
import { UsuarioService } from './features/usuarios/services/usuario';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, MatListModule, RouterModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly usuarioService = inject(UsuarioService);
  private readonly sucursalService = inject(SucursalService);
  private readonly cajaService = inject(CajaService);
  isMobile = false;
  sidebarOpened = true;
  usuarioAutenticado = false;
  nombreUsuarioSesion = '';
  rolUsuarioSesion = '';
  usuarioActual: Usuario | null = null;
  sucursalActual: Sucursal | null = null;
  cajaActual: Caja | null = null;
  cargandoContexto = false;
  errorSucursal = false;
  errorCaja = false;

  constructor() {
    this.breakpointObserver.observe('(max-width: 860px)').subscribe(({ matches }) => {
      this.isMobile = matches;
      this.sidebarOpened = !matches;
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.cargarContextoUsuario());

    this.cajaService.cambios.subscribe(cambio => {
      if (cambio.tipo === 'actualizada') {
        this.cajaActual = null;
        this.cargarContextoUsuario();
        return;
      }

      const { caja } = cambio;
      if (
        caja.idUsuarioApertura === this.usuarioActual?.id &&
        (caja.estadoCaja ?? '').trim().toLocaleUpperCase() === 'ABIERTA'
      ) {
        this.cajaActual = caja;
        this.errorCaja = false;
        this.cargandoContexto = false;
        return;
      }

      this.cargarContextoUsuario();
    });
    this.cargarContextoUsuario();
  }

  toggleMenu(): void {
    this.sidebarOpened = !this.sidebarOpened;
  }

  abrirCaja(): void {
    if (this.cajaActual || this.cargandoContexto || this.errorCaja) {
      return;
    }

    this.router.navigate(['/cajas/nuevo']);
  }

  reintentarEstadoCaja(): void {
    this.cargarContextoUsuario();
  }

  get nombreCompleto(): string {
    const nombrePerfil = this.usuarioActual
      ? `${this.usuarioActual.nombres} ${this.usuarioActual.apellidos}`.trim()
      : '';
    return nombrePerfil || this.nombreUsuarioSesion;
  }

  get inicialesUsuario(): string {
    return (this.nombreCompleto || 'U')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(nombre => nombre.charAt(0).toLocaleUpperCase())
      .join('');
  }

  get estadoCajaTexto(): string {
    if (this.cargandoContexto) {
      return 'Consultando caja…';
    }
    if (this.errorCaja) {
      return 'Estado de caja no disponible';
    }
    if (!this.cajaActual) {
      return 'Sin caja abierta';
    }

    return `Caja abierta desde ${this.formatearHora(this.cajaActual.fechaApertura)}`;
  }

  cargarContextoUsuario(): void {
    const token = localStorage.getItem('token');
    if (this.router.url.startsWith('/login') || !token) {
      this.usuarioAutenticado = false;
      this.nombreUsuarioSesion = '';
      this.rolUsuarioSesion = '';
      this.usuarioActual = null;
      this.sucursalActual = null;
      this.cajaActual = null;
      this.cargandoContexto = false;
      return;
    }

    this.usuarioAutenticado = true;
    this.leerUsuarioDeSesion();
    this.cargandoContexto = true;
    this.errorSucursal = false;
    this.errorCaja = false;

    const usuarioId = Number(localStorage.getItem('Id'));
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      this.errorSucursal = true;
      this.errorCaja = true;
      this.cargandoContexto = false;
      console.error('No se encontró un identificador de usuario válido en la sesión.');
      return;
    }

    this.usuarioService.getById(usuarioId).subscribe({
      next: usuario => {
        this.usuarioActual = usuario;
        this.nombreUsuarioSesion = `${usuario.nombres} ${usuario.apellidos}`.trim();
        this.rolUsuarioSesion = usuario.rol;
        this.sucursalActual = null;
        this.cargarSucursal(usuario.idSucursal);
        this.buscarCajaAbierta(usuario.id, 1).subscribe({
          next: caja => {
            if (caja || !this.cajaActual) {
              this.cajaActual = caja;
            }
            this.cargandoContexto = false;
          },
          error: error => {
            console.error('Error al consultar el estado de la caja:', error);
            this.errorCaja = true;
            this.cargandoContexto = false;
          }
        });
      },
      error: error => {
        console.error('Error al consultar los datos del usuario actual:', error);
        this.errorSucursal = true;
        this.errorCaja = true;
        this.cargandoContexto = false;
      }
    });
  }

  private leerUsuarioDeSesion(): void {
    const usuarioGuardado = localStorage.getItem('usuario');
    if (!usuarioGuardado) {
      return;
    }

    try {
      const datos: unknown = JSON.parse(usuarioGuardado);
      if (typeof datos !== 'object' || datos === null) {
        return;
      }

      const sesion = datos as { nombreUsuario?: unknown; rol?: unknown };
      if (typeof sesion.nombreUsuario === 'string') {
        this.nombreUsuarioSesion = sesion.nombreUsuario;
      }
      if (typeof sesion.rol === 'string') {
        this.rolUsuarioSesion = sesion.rol;
      }
    } catch (error) {
      console.error('No se pudieron leer los datos del usuario guardados en la sesión:', error);
    }
  }

  private cargarSucursal(sucursalId: number): void {
    this.sucursalService.getById(sucursalId).subscribe({
      next: sucursal => {
        this.sucursalActual = sucursal;
      },
      error: error => {
        console.error('Error al consultar la sucursal del usuario actual:', error);
        this.errorSucursal = true;
      }
    });
  }

  private buscarCajaAbierta(usuarioId: number, pagina: number): Observable<Caja | null> {
    return this.cajaService.getAll({
      pageNumber: pagina,
      pageSize: 50,
      buscar: ''
    }).pipe(
      switchMap(response => {
        const cajaAbierta = response.data.find(caja =>
          caja.idUsuarioApertura === usuarioId &&
          (caja.estadoCaja ?? '').trim().toLocaleUpperCase() === 'ABIERTA'
        );

        if (cajaAbierta || pagina >= response.meta.totalPages) {
          return of(cajaAbierta ?? null);
        }

        return this.buscarCajaAbierta(usuarioId, pagina + 1);
      })
    );
  }

  private formatearHora(fecha: Date): string {
    const fechaApertura = new Date(fecha);
    if (Number.isNaN(fechaApertura.getTime())) {
      return 'hoy';
    }

    return new Intl.DateTimeFormat('es', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(fechaApertura);
  }
}
