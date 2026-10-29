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

import { MarcaService } from '../../services/marca';
import { Marca } from '../../models/marca.model';

@Component({
  selector: 'app-marca-list',
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
  templateUrl: './marca-list.html',
  styleUrl: './marca-list.css'
})
export class MarcaListComponent implements OnInit {

  // ==========================================
  // INYECCIÓN DE SERVICIOS
  // ==========================================

  private marcaService = inject(MarcaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);


  // ==========================================
  // LISTADO
  // ==========================================

  marcas: Marca[] = [];


  // ==========================================
  // COLUMNAS DE LA TABLA
  // ==========================================

  displayedColumns: string[] = [
    'id',
    'nombre',
    'descripcion',
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
  // METADATA DE PAGINACIÓN
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

    this.CargarMarca();

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(valor => {

        this.filter.buscar = valor;

        // Cuando se realiza una nueva búsqueda
        // volvemos a la primera página
        this.filter.pageNumber = 1;

        this.CargarMarca();
      });
  }


  // ==========================================
  // CARGAR MARCAS
  // ==========================================

  CargarMarca(): void {

    this.loading = true;
    this.error = false;

    this.marcaService
      .getAll(this.filter)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: (response) => {

          this.error = false;
          this.marcas = response.data;

          this.meta = response.meta;
        },

        error: () => {

          this.error = true;
          this.notificationService.error(
            'No se pudo cargar la lista de marcas.'
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

    this.CargarMarca();
  }


  // ==========================================
  // NUEVA MARCA
  // ==========================================

  nuevo(): void {

    this.router.navigate([
      '/marcas/nuevo'
    ]);
  }


  // ==========================================
  // EDITAR MARCA
  // ==========================================

  editar(id: number): void {

    this.router.navigate([
      '/marcas/editar',
      id
    ]);
  }


  // ==========================================
  // ELIMINAR MARCA
  // ==========================================

  eliminar(id: number): void {

    const confirmado = confirm(
      '¿Está seguro de eliminar esta marca?'
    );

    if (!confirmado) {
      return;
    }

    this.loading = true;

    this.marcaService
      .delete(id)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Marca eliminada correctamente.'
          );

          // Si eliminamos el último registro
          // de una página diferente a la primera,
          // retrocedemos una página.
          if (
            this.marcas.length === 1 &&
            this.filter.pageNumber > 1
          ) {

            this.filter.pageNumber--;
          }

          // Volvemos a cargar el listado
          this.CargarMarca();
        },

        error: () => {

          this.notificationService.error(
            'No se pudo eliminar esta marca.'
          );

        }

      });
  }

}