import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  finalize
} from 'rxjs';

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

import { ProveedorService } from '../../services/proveedor';
import { Proveedor } from '../../models/proveedor.model';


@Component({
  selector: 'app-proveedor-list',
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

  templateUrl: './proveedor-list.html',
  styleUrl: './proveedor-list.css'
})


export class ProveedorListComponent implements OnInit {

  // ==========================================
  // INYECCIÓN DE SERVICIOS
  // ==========================================

  private proveedorService = inject(ProveedorService);

  private notificationService = inject(NotificationService);

  private router = inject(Router);


  // ==========================================
  // LISTADO
  // ==========================================

  proveedores: Proveedor[] = [];


  // ==========================================
  // COLUMNAS DE LA TABLA
  // ==========================================

  displayedColumns: string[] = [
    'id',
    'nombre',
    'telefono',
    'contacto',
    'nit',
    'correo',
    'direccion',
    'observacion',
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

    this.cargarProveedores();


    // ========================================
    // BUSCADOR
    // ========================================

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(valor => {

        this.filter.buscar = valor;

        // Reiniciar paginación al buscar
        this.filter.pageNumber = 1;

        this.cargarProveedores();

      });

  }


  // ==========================================
  // CARGAR PROVEEDORES
  // ==========================================

  cargarProveedores(): void {

    this.loading = true;
    this.error = false;

    this.proveedorService
      .getAll(this.filter)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: (response) => {

          this.error = false;
          this.proveedores = response.data;

          this.meta = response.meta;

        },

        error: () => {

          this.error = true;
          this.notificationService.error(
            'No se pudo cargar la lista de proveedores.'
          );

        }

      });

  }


  // ==========================================
  // CAMBIAR PÁGINA
  // ==========================================

  cambiarPagina(event: PageEvent): void {

    this.filter.pageNumber =
      event.pageIndex + 1;

    this.filter.pageSize =
      event.pageSize;

    this.cargarProveedores();

  }


  // ==========================================
  // NUEVO PROVEEDOR
  // ==========================================

  nuevo(): void {

    this.router.navigate([
      '/proveedores/nuevo'
    ]);

  }


  // ==========================================
  // EDITAR PROVEEDOR
  // ==========================================

  editar(id: number): void {

    this.router.navigate([
      '/proveedores/editar',
      id
    ]);

  }


  // ==========================================
  // ELIMINAR PROVEEDOR
  // ==========================================

  eliminar(id: number): void {

    const confirmado = confirm(
      '¿Está seguro de eliminar este proveedor?'
    );


    // ========================================
    // CANCELAR
    // ========================================

    if (!confirmado) {
      return;
    }


    // ========================================
    // ELIMINAR
    // ========================================

    this.loading = true;

    this.proveedorService
      .delete(id)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Proveedor eliminado correctamente.'
          );


          // Si eliminamos el último registro
          // de una página que no sea la primera

          if (
            this.proveedores.length === 1 &&
            this.filter.pageNumber > 1
          ) {

            this.filter.pageNumber--;

          }


          // Recargar listado

          this.cargarProveedores();

        },

        error: () => {

          this.notificationService.error(
            'No se pudo eliminar este proveedor.'
          );

        }

      });

  }

}