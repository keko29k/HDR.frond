import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';
import { QueryFilter } from '../../../../core/models/query-filter.model';
import { MetaData } from '../../../../core/models/metadata.model';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CompraService } from '../../services/compra';
import { Compra } from '../../models/compra.model';

@Component({
  selector: 'app-compra-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './compra-list.html',
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './compra-list.css'
  ]
})
export class CompraListComponent implements OnInit {

  private compraService = inject(CompraService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  compras: Compra[] = [];

  displayedColumns: string[] = [
    'id',
    'fechaCompra',
    'proveedor',
    'documento',
    'sucursal',
    'usuario',
    'total',
    'estadoCompra',
    'acciones'
  ];

  loading = false;
  error = false;

  buscarControl = new FormControl('', { nonNullable: true });

  filter: QueryFilter = {
    pageNumber: 1,
    pageSize: 10,
    buscar: ''
  };

  meta: MetaData = {
    totalCount: 0,
    pageSize: 10,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };

  ngOnInit(): void {
    this.cargarCompras();

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(valor => {
        this.filter.buscar = valor;
        this.filter.pageNumber = 1;
        this.cargarCompras();
      });
  }

  cargarCompras(): void {
    this.loading = true;
    this.error = false;

    this.compraService.getAll(this.filter)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.compras = response.data;
          this.meta = response.meta;
        },
        error: () => {
          this.error = true;
          this.compras = [];

          this.notificationService.error(
            'No se pudo cargar la lista de compras.'
          );
        }
      });
  }

  cambiarPagina(event: PageEvent): void {
    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;

    this.cargarCompras();
  }

  // =========================
  // RESUMEN (PÁGINA ACTUAL)
  // =========================

  get totalPagina(): number {
    return this.compras.reduce((total, c) => total + (c.total ?? 0), 0);
  }

  get promedioPagina(): number {
    return this.compras.length ? this.totalPagina / this.compras.length : 0;
  }

  get proveedoresPagina(): number {
    return new Set(this.compras.map(c => c.idProveedor)).size;
  }

  // =========================
  // PRESENTACIÓN
  // =========================

  iniciales(nombre: string | null | undefined): string {
    const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean);

    if (!partes.length) {
      return '—';
    }

    return partes
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }

  claseEstado(estado: string | null | undefined): string {
    const valor = (estado ?? '').trim().toUpperCase();

    if (['ANULADA', 'CANCELADA', 'ELIMINADA', 'RECHAZADA'].includes(valor)) {
      return 'danger';
    }

    if (['PENDIENTE', 'BORRADOR', 'EN PROCESO'].includes(valor)) {
      return 'warning';
    }

    if (['REGISTRADA', 'COMPLETADA', 'RECIBIDA', 'PAGADA', 'ACTIVA'].includes(valor)) {
      return 'success';
    }

    return 'neutral';
  }

  limpiarBusqueda(): void {
    this.buscarControl.setValue('');
  }

  nuevo(): void {
    this.router.navigate(['/compras/nuevo']);
  }

  editar(id: number): void {
    this.router.navigate(['/compras/editar', id]);
  }

  eliminar(id: number): void {
    const confirmado = confirm(
      '¿Está seguro de eliminar esta compra?'
    );

    if (!confirmado) {
      return;
    }

    this.loading = true;

    this.compraService.delete(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success(
            'Compra eliminada correctamente.'
          );

          if (
            this.compras.length === 1 &&
            this.filter.pageNumber > 1
          ) {
            this.filter.pageNumber--;
          }

          this.cargarCompras();
        },
        error: () => {
          this.notificationService.error(
            'No se pudo eliminar la compra.'
          );
        }
      });
  }
}
