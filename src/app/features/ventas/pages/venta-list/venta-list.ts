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
import { MatDialog } from '@angular/material/dialog';
import { AbonarCredito } from '../abonar-credito/abonar-credito';

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
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './venta-list.css'
  ]
})
export class VentaListComponent implements OnInit {
  private ventaService = inject(VentaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private dialog = inject(MatDialog);

  ventas: Venta[] = [];
  displayedColumns: string[] = [
    'id',
    'fecha',
    'cliente',
    'vendedor',
    'metodoPago',
    'total',
    'montoPagado',
    'saldoPendiente',
    'estadoPago',
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
    this.error = false;

    this.ventaService.getAll(this.filter)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => {
          this.ventas = response.data;
          this.meta = response.meta;
        },
        error: () => {
          this.error = true;
          this.ventas = [];
          this.notificationService.error('No se pudo cargar la lista de ventas.');
        }
      });
  }

  cambiarPagina(event: PageEvent): void {
    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;
    this.cargarVentas();
  }

  limpiarBusqueda(): void {
    this.buscarControl.setValue('');
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

  // =====================================
  // RESUMEN (PÁGINA ACTUAL)
  // =====================================

  get totalVendidoPagina(): number {
    return this.ventas.reduce((sum, v) => sum + (v.total ?? 0), 0);
  }

  get totalCobradoPagina(): number {
    return this.ventas.reduce((sum, v) => sum + (v.montoPagado ?? 0), 0);
  }

  get saldoPendientePagina(): number {
    return this.ventas.reduce((sum, v) => sum + Math.max(v.saldoPendiente ?? 0, 0), 0);
  }

  get creditosPendientesPagina(): number {
    return this.ventas.filter(v => this.esCreditoPendiente(v)).length;
  }

  // =====================================
  // PRESENTACIÓN
  // =====================================

  iniciales(nombre: string | null | undefined): string {
    const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean);

    if (!partes.length) return 'CF';

    return partes
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
  }

  iconoMetodo(metodo: string | null | undefined): string {
    const valor = (metodo ?? '').trim().toUpperCase();

    if (valor === 'QR') return 'qr_code_2';
    if (valor === 'EFECTIVO') return 'payments';
    if (valor.includes('TARJETA')) return 'credit_card';
    if (valor.includes('TRANSFER')) return 'account_balance';

    return 'receipt';
  }

  esCreditoPendiente(venta: Venta): boolean {
    return venta.acredito && venta.saldoPendiente > 0;
  }

  esCreditoCancelado(venta: Venta): boolean {
    return venta.acredito && venta.saldoPendiente <= 0;
  }

  textoEstado(venta: Venta): string {
    if (!venta.acredito) return 'Contado';
    if (venta.saldoPendiente > 0) return 'Crédito pendiente';
    return 'Crédito pagado';
  }

  claseEstado(venta: Venta): string {
    if (this.esCreditoPendiente(venta)) return 'danger';
    if (this.esCreditoCancelado(venta)) return 'success';
    return 'neutral';
  }

  claseFila(venta: Venta): string {
    if (this.esCreditoPendiente(venta)) return 'row-credit-pending';
    if (this.esCreditoCancelado(venta)) return 'row-credit-paid';
    return '';
  }

  abonarCredito(venta: Venta): void {

    if (!this.esCreditoPendiente(venta)) {
      return;
    }

    const dialogRef = this.dialog.open(AbonarCredito, {
      width: '520px',
      maxWidth: '95vw',
      disableClose: true,
      data: venta
    });

    dialogRef.afterClosed().subscribe(resultado => {

      if (resultado === true) {
        this.notificationService.success(
          'Abono registrado correctamente.'
        );

        this.cargarVentas();
      }

    });
  }
}
