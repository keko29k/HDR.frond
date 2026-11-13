
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import {
  catchError,
  debounceTime,
  EMPTY,
  finalize,
  map,
  Observable,
  Subject,
  switchMap
} from 'rxjs';

import { MetaData } from '../../../../core/models/metadata.model';
import { NotificationService } from '../../../../core/services/notification.service';

// PRODUCTOS
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto';

// USUARIOS
import { UsuarioService } from '../../../usuarios/services/usuario';

// SUCURSALES
import { Sucursal } from '../../../sucursales/models/sucursal.model';
import { SucursalService } from '../../../sucursales/services/sucursal';

// LOTES
import { LotesProductoDialog, LotesProductoDialogData } from '../lotes-producto-dialog/lotes-producto-dialog';

@Component({
  selector: 'app-inventario-sucursal-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatPaginatorModule,
    MatTooltipModule
  ],
  templateUrl: './inventario-sucursal-list.html',
  styleUrl: './inventario-sucursal-list.css',
})
export class InventarioSucursalList implements OnInit {

  // =====================================================
  // SERVICIOS
  // =====================================================

  private readonly productoService = inject(ProductoService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly sucursalService = inject(SucursalService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);

  // Control de recarga
  private readonly recargar$ = new Subject<void>();

  // =====================================================
  // DATOS
  // =====================================================

  productos: Producto[] = [];

  sucursalActual: Sucursal | null = null;

  sucursalId = 0;

  // El administrador puede ver el inventario de cualquier sucursal.
  esAdmin = false;
  sucursales: Sucursal[] = [];

  // Totales de la página actual
  totalUnidades = 0;

  // =====================================================
  // ESTADOS
  // =====================================================

  loading = false;
  cargandoSucursal = false;
  errorCarga = false;

  // =====================================================
  // PAGINACIÓN
  // =====================================================

  readonly pageSizeOptions = [5, 10, 20, 50];

  meta: MetaData = {
    totalCount: 0,
    pageSize: 10,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };

  // =====================================================
  // BÚSQUEDA
  // =====================================================

  readonly buscarControl = new FormControl('', {
    nonNullable: true
  });

  // =====================================================
  // INICIALIZACIÓN
  // =====================================================

  ngOnInit(): void {

    this.configurarCargaProductos();

    this.configurarBusqueda();

    this.cargarSucursalDeSesion();
  }

  // =====================================================
  // OBTENER SUCURSAL DEL USUARIO CONECTADO
  // =====================================================

  cargarSucursalDeSesion(): void {

    const usuarioId = this.leerNumero('Id');

    if (!usuarioId) {

      this.errorCarga = true;

      this.notificationService.error(
        'No se encontró el usuario de la sesión. Inicia sesión nuevamente.'
      );

      return;
    }

    this.cargandoSucursal = true;
    this.errorCarga = false;

    this.usuarioService.getById(usuarioId)
      .pipe(

        switchMap((usuario): Observable<Sucursal | null> => {

          const rol = (usuario.rol ?? '').trim().toUpperCase();
          this.esAdmin = rol === 'ADMINISTRADOR' || rol === 'ADMIN';

          // Administrador: carga todas las sucursales y empieza por la suya
          // (o por la primera si no tiene una asignada).
          if (this.esAdmin) {
            return this.sucursalService
              .getAll({ pageNumber: 1, pageSize: 100, buscar: '' })
              .pipe(
                map(respuesta => {
                  this.sucursales = respuesta.data ?? [];

                  const inicial =
                    this.sucursales.find(s => s.id === usuario.idSucursal) ??
                    this.sucursales[0] ??
                    null;

                  this.sucursalId = inicial?.id ?? 0;
                  return inicial;
                })
              );
          }

          // Verificar que el usuario tenga sucursal asignada
          if (
            !Number.isInteger(usuario.idSucursal) ||
            usuario.idSucursal <= 0
          ) {

            this.sucursalId = 0;
            this.sucursalActual = null;
            this.productos = [];
            this.totalUnidades = 0;

            this.errorCarga = true;

            this.notificationService.error(
              'El usuario no tiene una sucursal asignada.'
            );

            return EMPTY;
          }

          this.sucursalId = usuario.idSucursal;

          // Consultar la sucursal asignada
          return this.sucursalService.getById(this.sucursalId);
        }),

        finalize(() => {
          this.cargandoSucursal = false;
        })

      )
      .subscribe({

        next: sucursal => {

          if (!sucursal) {
            this.sucursalActual = null;
            this.errorCarga = true;
            this.notificationService.error('No hay sucursales registradas.');
            return;
          }

          this.sucursalActual = sucursal;

          // Iniciar desde la primera página
          this.meta.currentPage = 1;

          // Consultar productos de esa sucursal
          this.cargarProductos();
        },

        error: error => {

          console.error(
            'Error al consultar la sucursal del usuario:',
            error
          );

          this.sucursalActual = null;
          this.sucursalId = 0;
          this.productos = [];
          this.totalUnidades = 0;

          this.errorCarga = true;

          this.notificationService.error(
            'No se pudo consultar la sucursal asignada a tu usuario.'
          );
        }

      });
  }

  // =====================================================
  // CONFIGURAR CONSULTA DE PRODUCTOS
  // =====================================================

  private configurarCargaProductos(): void {

    this.recargar$
      .pipe(

        switchMap(() => {

          if (!this.sucursalId || this.sucursalId <= 0) {
            return EMPTY;
          }

          this.loading = true;
          this.errorCarga = false;

          return this.productoService.getBySucursal(
            this.sucursalId,
            {
              pageNumber: this.meta.currentPage,
              pageSize: this.meta.pageSize,
              buscar: this.buscarControl.value
            }
          ).pipe(

            finalize(() => {

              
              this.loading = false;
            }),

            catchError(error => {

              console.error(
                'Error al consultar productos de la sucursal:',
                error
              );

              this.productos = [];
              this.totalUnidades = 0;

              this.meta = {
                ...this.meta,
                totalCount: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
              };

              this.errorCarga = true;

              this.notificationService.error(
                'No se pudieron cargar los productos de la sucursal.'
              );

              return EMPTY;
            })

          );
        })

      )
      .subscribe(response => {

        // Guardar productos recibidos
        this.productos = response.data ?? [];


        console.log('Productos cargados:', this.productos);
        // Actualizar metadatos de paginación
        this.meta = response.meta;

        // Calcular unidades de los productos de la página actual
        this.totalUnidades = this.productos.reduce(
          (total, producto) => total + (producto.stockActual || 0),
          0
        );

      });
  }

  // =====================================================
  // CONFIGURAR BÚSQUEDA
  // =====================================================

  private configurarBusqueda(): void {

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(350)
      )
      .subscribe(() => {

        this.meta.currentPage = 1;

        this.cargarProductos();
      });
  }

  // =====================================================
  // CARGAR PRODUCTOS
  // =====================================================

  cargarProductos(): void {
    this.recargar$.next();
  }

  // Mantener este método por compatibilidad con el HTML anterior
  cargarInventario(): void {
    this.cargarProductos();
  }

  // =====================================================
  // CAMBIAR SUCURSAL (solo administrador)
  // =====================================================

  cambiarSucursal(valor: string): void {

    const id = Number(valor);
    const sucursal = this.sucursales.find(s => s.id === id);

    if (!this.esAdmin || !sucursal || id === this.sucursalId) {
      return;
    }

    this.sucursalId = sucursal.id;
    this.sucursalActual = sucursal;
    this.meta.currentPage = 1;

    this.cargarProductos();
  }

  // =====================================================
  // LIMPIAR BÚSQUEDA
  // =====================================================

  limpiarBusqueda(): void {

    this.buscarControl.setValue('');

    this.meta.currentPage = 1;

    this.cargarProductos();
  }

  // =====================================================
  // CAMBIAR PÁGINA
  // =====================================================

  cambiarPagina(event: PageEvent): void {

    this.meta.currentPage = event.pageIndex + 1;

    this.meta.pageSize = event.pageSize;

    this.cargarProductos();
  }

  // =====================================================
  // LOTES
  // =====================================================

  verLotes(producto: Producto): void {

    if (!this.sucursalId) {
      return;
    }

    this.dialog.open<LotesProductoDialog, LotesProductoDialogData>(LotesProductoDialog, {
      width: '860px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        producto,
        sucursalId: this.sucursalId,
        sucursalNombre: this.sucursalActual?.nombre ?? `Sucursal ${this.sucursalId}`
      }
    });
  }

  verTodosLosLotes(): void {
    this.router.navigate(['/lotes']);
  }

  // =====================================================
  // LEER DATOS DE SESIÓN
  // =====================================================

  private leerNumero(clave: string): number {

    const valor = Number(localStorage.getItem(clave));

    return Number.isInteger(valor) && valor > 0
      ? valor
      : 0;
  }

}
