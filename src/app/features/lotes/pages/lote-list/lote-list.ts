import { esAdministrador, esVendedor, idSucursalDeSesion } from '../../../../core/services/permisos';
import { FiltroSucursalComponent } from '../../../../shared/components/filtro-sucursal/filtro-sucursal';
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto';
import { Sucursal } from '../../../sucursales/models/sucursal.model';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { Lote as LoteModel } from '../../models/lote.model';
import { LoteService } from '../../services/lote';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';

@Component({
  selector: 'app-lote-list',
  standalone: true,
  imports: [
    CommonModule,
    FiltroSucursalComponent,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule
  ],
  templateUrl: './lote-list.html',
  styleUrl: './lote-list.css'
})
export class LoteList implements OnInit {

  /** El vendedor solo consulta: sin crear, editar ni eliminar. */
  readonly soloConsulta = esVendedor();

  get columnasVisibles(): string[] {
    return this.soloConsulta
      ? this.displayedColumns.filter(c => c !== 'acciones')
      : this.displayedColumns;
  }
  private loteService = inject(LoteService);
  private productoService = inject(ProductoService);
  private sucursalService = inject(SucursalService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  /** Administrador: elige sucursal (null = todas). Vendedor: siempre la suya. */
  readonly esAdmin = esAdministrador();

  /** Lotes recibidos del backend (al vendedor ya le llegan solo los de su sucursal). */
  private todosLosLotes: LoteModel[] = [];

  lotes: LoteModel[] = [];
  productos: Producto[] = [];
  sucursales: Sucursal[] = [];
  sucursalActual: Sucursal | null = null;
  sucursalId: number | null = this.esAdmin ? null : idSucursalDeSesion();
  loading = false;
  error = false;
  filtroEstado: 'TODOS' | 'VIGENTES' | 'VENCIDOS' | 'AGOTADOS' = 'TODOS';
  buscarControl = new FormControl('', { nonNullable: true });

  displayedColumns = [
    'numeroLote',
    'producto',
    'sucursal',
    'fechaFabricacion',
    'fechaVencimiento',
    'cantidadDisponible',
    'costoCompra',
    'estado',
    'acciones'
  ];

  get lotesFiltrados(): LoteModel[] {
    const termino = this.buscarControl.value.trim().toLocaleLowerCase();
    return this.lotes.filter(lote => {
      const coincideBusqueda = !termino ||
        lote.numeroLote.toLocaleLowerCase().includes(termino) ||
        this.nombreProducto(lote.idProducto).toLocaleLowerCase().includes(termino) ||
        this.nombreSucursal(lote.idSucursal).toLocaleLowerCase().includes(termino);
      const estado = this.estadoLote(lote);
      const coincideEstado = this.filtroEstado === 'TODOS' ||
        (this.filtroEstado === 'VIGENTES' && estado === 'VIGENTE') ||
        (this.filtroEstado === 'VENCIDOS' && estado === 'VENCIDO') ||
        (this.filtroEstado === 'AGOTADOS' && estado === 'AGOTADO');
      return coincideBusqueda && coincideEstado;
    });
  }

  get lotesVencidos(): number {
    return this.lotes.filter(lote => this.estadoLote(lote) === 'VENCIDO').length;
  }

  get lotesVigentes(): number {
    return this.lotes.filter(lote => this.estadoLote(lote) === 'VIGENTE').length;
  }

  get lotesAgotados(): number {
    return this.lotes.filter(lote => this.estadoLote(lote) === 'AGOTADO').length;
  }

  get existenciasTotales(): number {
    return this.lotes
      .filter(lote => this.estadoLote(lote) === 'VIGENTE')
      .reduce((total, lote) => total + Number(lote.cantidadDisponible), 0);
  }

  ngOnInit(): void {
    this.cargarLotes();
  }

  cargarLotes(): void {
    if (!this.esAdmin && !this.sucursalId) {
      this.error = true;
      this.notificationService.error('Tu usuario no tiene una sucursal asignada. Inicia sesión nuevamente.');
      return;
    }

    this.loading = true;
    this.error = false;
    forkJoin({
      lotes: this.loteService.gets(),
      productos: this.productoService.gets(),
      sucursales: this.sucursalService.gets()
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: ({ lotes, productos, sucursales }) => {
          this.todosLosLotes = lotes;
          this.productos = productos;
          this.sucursales = sucursales;
          this.aplicarSucursal();
        },
        error: (error) => {
          this.error = true;
          console.error('Error al cargar lotes:', error);
          this.notificationService.error('No se pudo cargar el listado de lotes.');
        }
      });
  }

  nombreProducto(id: number): string {
    return this.productos.find(producto => Number(producto.id) === Number(id))?.nombre
      ?? `Producto ${id}`;
  }

  /** Solo el administrador cambia de sucursal (null = todas). */
  cambiarSucursal(idSucursal: number | null): void {
    if (!this.esAdmin) return;
    this.sucursalId = idSucursal;
    this.aplicarSucursal();
  }

  private aplicarSucursal(): void {
    const id = this.sucursalId;
    this.lotes = id
      ? this.todosLosLotes.filter(lote => Number(lote.idSucursal) === id)
      : this.todosLosLotes;
    this.sucursalActual = id
      ? this.sucursales.find(s => s.id === id) ?? null
      : null;
  }

  nombreSucursal(id: number): string {
    return this.sucursales.find(s => s.id === Number(id))?.nombre ?? `Sucursal ${id}`;
  }

  estadoLote(lote: LoteModel): 'VIGENTE' | 'VENCIDO' | 'AGOTADO' {
    const producto = this.productos.find(item => Number(item.id) === Number(lote.idProducto));
    if (Number(lote.cantidadDisponible) <= 0) return 'AGOTADO';
    if (producto?.tieneVencimiento && this.fechaVencido(lote.fechaVencimiento)) return 'VENCIDO';
    return 'VIGENTE';
  }

  private fechaVencido(fecha: Date | string): boolean {
    return this.fechaCorta(fecha) < this.fechaLocal(new Date());
  }

  formatearFecha(fecha: Date | string): string {
    const fechaCorta = this.fechaCorta(fecha);
    const [anio, mes, dia] = fechaCorta.split('-').map(Number);
    return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${anio}`;
  }

  private fechaCorta(fecha: Date | string): string {
    return typeof fecha === 'string'
      ? fecha.slice(0, 10)
      : this.fechaLocal(fecha);
  }

  private fechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  nuevo(): void {
    this.router.navigate(['/lotes/nuevo']);
  }

  editar(id: number): void {
    this.router.navigate(['/lotes/editar', id]);
  }

  eliminar(lote: LoteModel): void {
    if (!confirm(`¿Está seguro de eliminar el lote "${lote.numeroLote}"?`)) {
      return;
    }

    this.loading = true;
    this.loteService.delete(lote.id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Lote eliminado correctamente.');
          this.cargarLotes();
        },
        error: (error) => {
          console.error('Error al eliminar lote:', error);
          this.notificationService.error(
            error?.error?.mensaje || 'No se pudo eliminar el lote.'
          );
        }
      });
  }
}
