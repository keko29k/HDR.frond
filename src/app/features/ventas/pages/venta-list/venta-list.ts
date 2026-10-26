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
import { MatIcon } from '@angular/material/icon';
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
    MatIcon
  ],
  templateUrl: './venta-list.html',
  styleUrl: './venta-list.css'
})
export class VentaListComponent implements OnInit {
  private ventaService = inject(VentaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  ventas: Venta[] = [];
  displayedColumns: string[] = ['id', 'fecha', 'total', 'metodoPago', 'observaciones','clienteId','usuarioId', 'acciones'];
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
        next: (response) => {
          this.ventas = response.data;
          this.meta = response.meta;

          console.log('Ventas cargadas:', this.ventas);

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

  editar(id: number): void {
    this.router.navigate(['/ventas/editar', id]);
  }

  eliminar(id: number): void {
    const confirmado = confirm('¿Está seguro de eliminar esta venta?');

    if (!confirmado) {
      return;
    }

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
}
