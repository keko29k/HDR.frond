import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  finalize
} from 'rxjs';

import { SucursalService } from '../../services/sucursal';

import { NotificationService } from '../../../../core/services/notification.service';

import { Sucursal } from '../../models/sucursal.model';

import { QueryFilter } from '../../../../core/models/query-filter.model';
import { MetaData } from '../../../../core/models/metadata.model';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';


@Component({
  selector: 'app-sucursal-list',
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
    MatIconModule
  ],

  templateUrl: './sucursal-list.html',
  styleUrl: './sucursal-list.css'
})
export class SucursalListComponent implements OnInit {

  // ==========================================
  // INYECCIÓN DE SERVICIOS
  // ==========================================

  private sucursalService = inject(SucursalService);

  private notificationService = inject(NotificationService);

  private router = inject(Router);

  private destroyRef = inject(DestroyRef);


  // ==========================================
  // LISTADO DE SUCURSALES
  // ==========================================

  sucursales: Sucursal[] = [];


  // ==========================================
  // COLUMNAS DE LA TABLA
  // ==========================================

  displayedColumns: string[] = [
    'id',
    'nombre',
    'telefono',
    'direccion',
    'correo',
    'acciones'
  ];


  // ==========================================
  // ESTADO DE CARGA
  // ==========================================

  loading = false;
  error = false;


  // ==========================================
  // BUSCADOR
  // ==========================================

  buscarControl = new FormControl('', {
    nonNullable: true
  });


  // ==========================================
  // FILTROS
  // ==========================================

  filter: QueryFilter = {
    pageNumber: 1,
    pageSize: 10,
    buscar: ''
  };


  // ==========================================
  // METADATA
  // ==========================================

  meta: MetaData = {
    totalCount: 0,
    pageSize: 10,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };


  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {

    this.cargarSucursales();

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(valor => {

        this.filter.buscar = valor.trim();

        // Reiniciar a la primera página
        this.filter.pageNumber = 1;

        this.cargarSucursales();

      });

  }


  // ==========================================
  // CARGAR SUCURSALES
  // ==========================================

  cargarSucursales(): void {

    this.loading = true;
    this.error = false;

    this.sucursalService
      .getAll(this.filter)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (response) => {

          this.error = false;
          this.sucursales = response.data;

          this.meta = response.meta;

        },

        error: () => {

          this.error = true;
          this.notificationService.error(
            'No se pudo cargar la lista de sucursales.'
          );

        }

      });

  }


  // ==========================================
  // CAMBIAR PÁGINA
  // ==========================================

  cambiarPagina(event: PageEvent): void {

    this.filter.pageNumber = event.pageIndex + 1;

    this.filter.pageSize = event.pageSize;

    this.cargarSucursales();

  }


  // ==========================================
  // LIMPIAR BÚSQUEDA
  // ==========================================

  limpiarBusqueda(): void {

    this.buscarControl.setValue('');

  }


  // ==========================================
  // NUEVA SUCURSAL
  // ==========================================

  nuevo(): void {

    this.router.navigate(['/sucursales/nuevo']);

  }


  // ==========================================
  // EDITAR SUCURSAL
  // ==========================================

  editar(id: number): void {

    this.router.navigate(['/sucursales/editar', id]);

  }


  // ==========================================
  // ELIMINAR SUCURSAL
  // ==========================================

  eliminar(sucursal: Sucursal): void {

    const confirmado = confirm(
      `¿Eliminar la sucursal "${sucursal.nombre}"? Esta acción no se puede deshacer.`
    );

    if (!confirmado) {
      return;
    }

    this.loading = true;

    this.sucursalService
      .delete(sucursal.id!)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Sucursal eliminada.'
          );

          // Si era la última fila de una página que no es la primera
          if (
            this.sucursales.length === 1 &&
            this.filter.pageNumber > 1
          ) {

            this.filter.pageNumber--;

          }

          this.cargarSucursales();

        },

        error: (error) => {

          // Suele fallar si la sucursal tiene usuarios, cajas o ventas asociadas
          const mensaje =
            error?.error?.mensaje ||
            'No se pudo eliminar la sucursal. Revisa que no tenga usuarios, cajas o ventas asociadas.';

          this.notificationService.error(mensaje);

        }

      });

  }

}