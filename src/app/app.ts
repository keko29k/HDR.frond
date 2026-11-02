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
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { AuthService } from './features/auth/services/auth';
import { LoteService } from './features/lotes/services/lote';

interface ItemMenu {
  ruta: string;
  titulo: string;
  icono: string;
  /** Muestra el número de lotes vencidos o críticos. */
  alertaVencimientos?: boolean;
}

/** Cada cuánto se vuelve a consultar el contador de vencimientos. */
const INTERVALO_ALERTAS_MS = 5 * 60 * 1000;

interface GrupoMenu {
  titulo: string | null;
  items: ItemMenu[];
}

const CLAVE_MENU_COMPACTO = 'menuCompacto';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatMenuModule,
    MatTooltipModule,
    RouterModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly router = inject(Router);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly usuarioService = inject(UsuarioService);
  private readonly sucursalService = inject(SucursalService);
  private readonly cajaService = inject(CajaService);
  private readonly authService = inject(AuthService);
  private readonly loteService = inject(LoteService);

  /** Lotes con stock vencidos o que vencen en 7 días (globito del menú). */
  alertasVencimiento = 0;
  private ultimaConsultaAlertas = 0;

  // =====================================
  // MENÚ LATERAL
  // =====================================

  readonly menu: GrupoMenu[] = [
    {
      titulo: null,
      items: [
        { ruta: '/dashboard', titulo: 'Dashboard', icono: 'space_dashboard' }
      ]
    },
    {
      titulo: 'Operaciones',
      items: [
        { ruta: '/ventas', titulo: 'Ventas', icono: 'point_of_sale' },
        { ruta: '/compras', titulo: 'Compras', icono: 'shopping_cart' },
        { ruta: '/cajas', titulo: 'Cajas', icono: 'payments' }
      ]
    },
    {
      titulo: 'Catálogo',
      items: [
        { ruta: '/productos', titulo: 'Productos', icono: 'inventory_2' },
        { ruta: '/inventario', titulo: 'Inventario por sucursal', icono: 'warehouse' },
        { ruta: '/vencimientos', titulo: 'Vencimientos', icono: 'event_busy', alertaVencimientos: true },
        { ruta: '/categorias', titulo: 'Categorías', icono: 'sell' },
        { ruta: '/marcas', titulo: 'Marcas', icono: 'branding_watermark' },
        { ruta: '/proveedores', titulo: 'Proveedores', icono: 'local_shipping' }
      ]
    },
    {
      titulo: 'Gestión',
      items: [
        { ruta: '/clientes', titulo: 'Clientes', icono: 'group' },
        { ruta: '/usuarios', titulo: 'Usuarios', icono: 'manage_accounts' },
        { ruta: '/sucursales', titulo: 'Sucursales', icono: 'storefront' }
      ]
    },
    {
      titulo: 'Finanzas',
      items: [
        { ruta: '/gastos', titulo: 'Gastos', icono: 'receipt_long' },
        { ruta: '/reportes', titulo: 'Reportes', icono: 'bar_chart' }
      ]
    }
  ];

  /** Páginas que no están en el menú pero necesitan título en la cabecera. */
  private readonly paginasExtra: Record<string, { grupo: string; titulo: string; icono: string }> = {
    '/lotes': { grupo: 'Catálogo', titulo: 'Lotes', icono: 'layers' }
  };

  paginaGrupo = '';
  paginaTitulo = '';
  paginaAccion = '';
  paginaIcono = 'space_dashboard';

  /** En escritorio el menú puede quedar compacto (solo íconos). */
  menuCompacto = this.leerMenuCompacto();

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
      .subscribe(() => {
        this.actualizarPagina();
        this.cargarContextoUsuario();

        if (this.isMobile) {
          this.sidebarOpened = false;
        }
      });

    // Tras retirar un lote, el globito del menú se actualiza al momento.
    this.loteService.cambios.subscribe(() => {
      this.ultimaConsultaAlertas = 0;
      this.cargarAlertasVencimiento(this.usuarioActual?.idSucursal ?? 0);
    });

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
    if (this.isMobile) {
      this.sidebarOpened = !this.sidebarOpened;
      return;
    }

    this.menuCompacto = !this.menuCompacto;

    try {
      localStorage.setItem(CLAVE_MENU_COMPACTO, String(this.menuCompacto));
    } catch {
      // Preferencia visual: si no se puede guardar, se ignora.
    }
  }

  cerrarSesion(): void {
    this.authService.logout();
    localStorage.removeItem('Id');
    this.router.navigate(['/login']);
  }

  get horaCaja(): string {
    return this.cajaActual ? this.formatearHora(this.cajaActual.fechaApertura) : '';
  }

  get correoUsuario(): string {
    return this.usuarioActual?.correo ?? '';
  }

  private actualizarPagina(): void {
    const url = this.router.url.split(/[?#]/)[0];
    const base = '/' + (url.split('/')[1] ?? '');

    const grupo = this.menu.find(g => g.items.some(i => i.ruta === base));
    const item = grupo?.items.find(i => i.ruta === base);
    const extra = this.paginasExtra[base];

    this.paginaGrupo = grupo?.titulo ?? extra?.grupo ?? 'Inicio';
    this.paginaTitulo = item?.titulo ?? extra?.titulo ?? 'Dashboard';
    this.paginaIcono = item?.icono ?? extra?.icono ?? 'space_dashboard';

    this.paginaAccion = url.includes('/nuevo')
      ? 'Nuevo registro'
      : url.includes('/editar')
        ? 'Editar registro'
        : '';
  }

  private cargarAlertasVencimiento(idSucursal: number): void {
    // Al entrar a la vista de vencimientos se refresca siempre; en el resto, cada 5 minutos.
    const enVencimientos = this.router.url.startsWith('/vencimientos');
    if (!enVencimientos && Date.now() - this.ultimaConsultaAlertas < INTERVALO_ALERTAS_MS) {
      return;
    }

    this.ultimaConsultaAlertas = Date.now();

    this.loteService.getVencimientos(idSucursal || null, 7).subscribe({
      next: lotes => this.alertasVencimiento = lotes.length,
      error: () => this.alertasVencimiento = 0
    });
  }

  private leerMenuCompacto(): boolean {
    try {
      return localStorage.getItem(CLAVE_MENU_COMPACTO) === 'true';
    } catch {
      return false;
    }
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
        this.cargarAlertasVencimiento(usuario.idSucursal);
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
