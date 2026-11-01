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

import { VentaService } from '../../services/venta';
import { Venta } from '../../models/venta.model';

@Component({
  selector: 'app-venta-list',
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
  templateUrl: './venta-list.html',
  styleUrl: './venta-list.css'
})
export class VentaListComponent implements OnInit {
  private ventaService = inject(VentaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  ventas: Venta[] = [];
  displayedColumns: string[] = [
    'id',
    'fecha',
    'cliente',
    'vendedor',
    'total',
    'montoPagado',
    'saldoPendiente',
    'metodoPago',
    'estadoPago',
    'observaciones',
    'acciones'
  ];

  loading = false;
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
    this.cargarVentas();

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(valor => {
        this.filter.buscar = valor;
        this.filter.pageNumber = 1;
        this.cargarVentas();
      });
  }

  cargarVentas(): void {
    this.loading = true;

    this.ventaService.getAll(this.filter)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => {
          this.ventas = response.data;
          this.meta = response.meta;
        },
        error: () => {
          this.notificationService.error('No se pudo cargar la lista de ventas.');
        }
      });
  }

  cambiarPagina(event: PageEvent): void {
    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;
    this.cargarVentas();
  }

  nuevo(): void {
    this.router.navigate(['/ventas/nuevo']);
  }

  eliminar(id: number): void {
    const confirmado = confirm('¿Está seguro de eliminar esta venta?');

    if (!confirmado) return;

    this.loading = true;

    this.ventaService.delete(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Venta eliminada correctamente.');

          if (this.ventas.length === 1 && this.filter.pageNumber > 1) {
            this.filter.pageNumber--;
          }

          this.cargarVentas();
        },
        error: () => {
          this.notificationService.error('No se pudo eliminar la venta.');
        }
      });
  }

  esCreditoPendiente(venta: Venta): boolean {
    return venta.acredito && venta.saldoPendiente > 0;
  }

  esCreditoCancelado(venta: Venta): boolean {
    return venta.acredito && venta.saldoPendiente <= 0;
  }

  textoEstado(venta: Venta): string {
    if (!venta.acredito) return 'CONTADO';
    if (venta.saldoPendiente > 0) return 'CRÉDITO PENDIENTE';
    return 'CRÉDITO CANCELADO';
  }

  claseEstado(venta: Venta): string {
    if (this.esCreditoPendiente(venta)) return 'status-pending';
    if (this.esCreditoCancelado(venta)) return 'status-paid';
    return 'status-normal';
  }

  claseFila(venta: Venta): string {
    if (this.esCreditoPendiente(venta)) return 'row-credit-pending';
    if (this.esCreditoCancelado(venta)) return 'row-credit-paid';
    return '';
  }
}