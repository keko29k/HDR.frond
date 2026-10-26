import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  debounceTime,
  distinctUntilChanged,
  finalize
} from 'rxjs';

import { UsuarioService } from '../../services/usuario';

import { NotificationService } from '../../../../core/services/notification.service';

import { Usuario } from '../../models/usuario.model';

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
  selector: 'app-usuario-list',
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

  templateUrl: './usuario-list.html',
  styleUrl: './usuario-list.css'
})


export class UsuarioListComponent implements OnInit {

  // ==========================================
  // INYECCIÓN DE SERVICIOS
  // ==========================================

  private usuarioService = inject(UsuarioService);

  private notificationService = inject(NotificationService);

  private router = inject(Router);


  // ==========================================
  // LISTADO DE USUARIOS
  // ==========================================

  usuarios: Usuario[] = [];


  // ==========================================
  // COLUMNAS DE LA TABLA
  // ==========================================

  displayedColumns: string[] = [
    'id',
    'nombres',
    'apellidos',
    'rol',
    'usuario1',
    'telefono',
    'correo',
    'acciones'
  ];


  // ==========================================
  // ESTADO DE CARGA
  // ==========================================

  loading = false;


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

    this.cargarUsuarios();


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

        // Reiniciar a la primera página
        this.filter.pageNumber = 1;

        this.cargarUsuarios();

      });

  }


  // ==========================================
  // CARGAR USUARIOS
  // ==========================================

  cargarUsuarios(): void {

    this.loading = true;

    this.usuarioService
      .getAll(this.filter)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: (response) => {

          this.usuarios = response.data;

          this.meta = response.meta;

          console.log(
            'Usuarios:',
            this.usuarios
          );

          console.log(
            'Meta:',
            this.meta
          );

        },

        error: () => {

          this.notificationService.error(
            'No se pudo cargar la lista de usuarios.'
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

    this.cargarUsuarios();

  }


  // ==========================================
  // NUEVO USUARIO
  // ==========================================

  nuevo(): void {

    this.router.navigate([
      '/usuarios/nuevo'
    ]);

  }


  // ==========================================
  // EDITAR USUARIO
  // ==========================================

  editar(id: number): void {

    this.router.navigate([
      '/usuarios/editar',
      id
    ]);

  }


  // ==========================================
  // ELIMINAR USUARIO
  // ==========================================

  eliminar(id: number): void {

    const confirmado = confirm(
      '¿Está seguro de eliminar este usuario?'
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

    this.usuarioService
      .delete(id)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Usuario eliminado correctamente.'
          );


          // Si eliminamos el último usuario
          // de una página que no sea la primera

          if (
            this.usuarios.length === 1 &&
            this.filter.pageNumber > 1
          ) {

            this.filter.pageNumber--;

          }


          // Recargar listado

          this.cargarUsuarios();

        },

        error: () => {

          this.notificationService.error(
            'No se pudo eliminar el usuario.'
          );

        }

      });

  }

}