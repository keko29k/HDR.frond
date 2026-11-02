import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, debounceTime, distinctUntilChanged, finalize, of } from 'rxjs';

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

import { GastoService } from '../../services/gasto';
import { Gasto } from '../../models/gasto.model';
import { ReporteService } from '../../../reportes/services/reporte';
import { ReporteGeneral } from '../../../reportes/models/reporte-general.model';

@Component({
  selector: 'app-gasto-list',
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
  templateUrl: './gasto-list.html',
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './gasto-list.css'
  ]
})
export class GastoListComponent implements OnInit {
  private gastoService = inject(GastoService);
  private reporteService = inject(ReporteService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  gastos: Gasto[] = [];

  displayedColumns: string[] = [
    'id',
    'fecha',
    'concepto',
    'numeroComprobante',
    'idCaja',
    'monto',
    'acciones'
  ];

  loading = false;
  error = false;

  /** Resumen del mes actual (desde el endpoint de reportes). */
  resumenMes: ReporteGeneral | null = null;

  buscarControl = new FormControl('', {
    nonNullable: true
  });

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
    this.cargarGastos();
    this.cargarResumenMes();

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(valor => {
        this.filter.buscar = valor;
        this.filter.pageNumber = 1;
        this.cargarGastos();
      });
  }

  cargarGastos(): void {
    this.loading = true;
    this.error = false;

    this.gastoService
      .getAll(this.filter)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: (response) => {
          this.gastos = response.data;
          this.meta = response.meta;
        },
        error: () => {
          this.error = true;
          this.gastos = [];
          this.notificationService.error(
            'No se pudo cargar la lista de gastos.'
          );
        }
      });
  }

  private cargarResumenMes(): void {
    const hoy = new Date();
    const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    this.reporteService
      .getReporteGeneral(this.formatoFecha(inicio), this.formatoFecha(hoy), null)
      .pipe(catchError(() => of(null)))
      .subscribe(reporte => this.resumenMes = reporte);
  }

  actualizar(): void {
    this.cargarGastos();
    this.cargarResumenMes();
  }

  cambiarPagina(event: PageEvent): void {
    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;
    this.cargarGastos();
  }

  limpiarBusqueda(): void {
    this.buscarControl.setValue('');
  }

  // =========================
  // RESUMEN
  // =========================

  get totalPagina(): number {
    return this.gastos.reduce((total, g) => total + (g.monto ?? 0), 0);
  }

  get sinComprobante(): number {
    return this.gastos.filter(g => !g.numeroComprobante?.trim()).length;
  }

  get conceptoPrincipal(): { concepto: string; monto: number } | null {
    return this.resumenMes?.gastosPorConcepto[0] ?? null;
  }

  // =========================
  // PRESENTACIÓN
  // =========================

  iconoConcepto(concepto: string | null | undefined): string {
    const valor = (concepto ?? '').toLowerCase();

    if (/(luz|agua|internet|tel[eé]fono|servicio|gas\b)/.test(valor)) return 'bolt';
    if (/(transporte|pasaje|taxi|flete|combustible|gasolina)/.test(valor)) return 'local_shipping';
    if (/(alquiler|renta)/.test(valor)) return 'home_work';
    if (/(sueldo|salario|pago personal|planilla|adelanto)/.test(valor)) return 'badge';
    if (/(limpieza|mantenimiento|reparaci)/.test(valor)) return 'build';
    if (/(insumo|material|papel|bolsa|útil|util)/.test(valor)) return 'inventory';
    if (/(comida|almuerzo|refrigerio|alimento)/.test(valor)) return 'restaurant';
    if (/(impuesto|tributo|patente)/.test(valor)) return 'account_balance';

    return 'receipt_long';
  }

  nuevo(): void {
    this.router.navigate([
      '/gastos/nuevo'
    ]);
  }

  editar(id: number): void {
    this.router.navigate([
      '/gastos/editar',
      id
    ]);
  }

  eliminar(id: number): void {
    const confirmado = confirm(
      '¿Está seguro de eliminar este gasto?'
    );

    if (!confirmado) {
      return;
    }

    this.loading = true;

    this.gastoService
      .delete(id)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({
        next: () => {
          this.notificationService.success(
            'Gasto eliminado correctamente.'
          );

          if (
            this.gastos.length === 1 &&
            this.filter.pageNumber > 1
          ) {
            this.filter.pageNumber--;
          }

          this.cargarGastos();
          this.cargarResumenMes();
        },
        error: () => {
          this.notificationService.error(
            'No se pudo eliminar el gasto.'
          );
        }
      });
  }

  private formatoFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
}
