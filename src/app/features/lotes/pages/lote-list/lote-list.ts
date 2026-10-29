import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EMPTY, finalize, forkJoin, switchMap } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto';
import { Sucursal } from '../../../sucursales/models/sucursal.model';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { UsuarioService } from '../../../usuarios/services/usuario';
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
  private loteService = inject(LoteService);
  private productoService = inject(ProductoService);
  private sucursalService = inject(SucursalService);
  private usuarioService = inject(UsuarioService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  lotes: LoteModel[] = [];
  productos: Producto[] = [];
  sucursalActual: Sucursal | null = null;
  sucursalId = 0;
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
    const usuarioId = Number(localStorage.getItem('Id'));
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      this.error = true;
      this.notificationService.error('No se encontró el usuario de la sesión. Inicia sesión nuevamente.');
      return;
    }

    this.loading = true;
    this.error = false;
    this.usuarioService.getById(usuarioId)
      .pipe(
        switchMap(usuario => {
          if (!Number.isInteger(Number(usuario.idSucursal)) || Number(usuario.idSucursal) <= 0) {
            this.error = true;
            this.notificationService.error('El usuario no tiene una sucursal asignada.');
            return EMPTY;
          }

          this.sucursalId = Number(usuario.idSucursal);
          return forkJoin({
            lotes: this.loteService.gets(),
            productos: this.productoService.gets(),
            sucursal: this.sucursalService.getById(this.sucursalId)
          });
        }),
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: ({ lotes, productos, sucursal }) => {
          this.lotes = lotes.filter(lote => Number(lote.idSucursal) === this.sucursalId);
          this.productos = productos;
          this.sucursalActual = sucursal;
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

  nombreSucursal(id: number): string {
    return Number(id) === this.sucursalId
      ? this.sucursalActual?.nombre ?? `Sucursal ${id}`
      : `Sucursal ${id}`;
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
