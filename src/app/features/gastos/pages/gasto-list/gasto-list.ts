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

import { GastoService } from '../../services/gasto';
import { Gasto } from '../../models/gasto.model';

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
  styleUrl: './gasto-list.css'
})
export class GastoListComponent implements OnInit {
  private gastoService = inject(GastoService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  gastos: Gasto[] = [];

  displayedColumns: string[] = [
    'id',
    'idCaja',
    'idUsuario',
    'concepto',
    'numeroComprobante',
    'monto',
    'observacion',
    'acciones'
  ];

  loading = false;

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
          this.notificationService.error(
            'No se pudo cargar la lista de gastos.'
          );
        }
      });
  }

  cambiarPagina(event: PageEvent): void {
    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;
    this.cargarGastos();
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
        },
        error: () => {
          this.notificationService.error(
            'No se pudo eliminar el gasto.'
          );
        }
      });
  }
}