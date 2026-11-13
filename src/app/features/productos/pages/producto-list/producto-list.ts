import { esVendedor } from '../../../../core/services/permisos';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

import { ProductoService } from '../../services/producto';
import { Producto } from '../../models/producto.model';


@Component({
  selector: 'app-producto-list',
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
    MatTooltipModule,
    MatIconModule
  ],

  templateUrl: './producto-list.html',
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './producto-list.css'
  ]
})


export class ProductoListComponent implements OnInit {

  /** El vendedor solo consulta: sin crear, editar ni eliminar. */
  readonly soloConsulta = esVendedor();

  get columnasVisibles(): string[] {
    return this.soloConsulta
      ? this.displayedColumns.filter(c => c !== 'acciones')
      : this.displayedColumns;
  }

  // ==========================================
  // INYECCIÓN DE SERVICIOS
  // ==========================================

  private productoService = inject(ProductoService);

  private notificationService = inject(NotificationService);

  private router = inject(Router);


  // ==========================================
  // LISTADO DE PRODUCTOS
  // ==========================================

  productos: Producto[] = [];


  // ==========================================
  // COLUMNAS DE LA TABLA
  // ==========================================

  displayedColumns: string[] = [
    'nombre',
    'stock',
    'precios',
    'control',
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

  totalProductos = 0;
  productosConVencimiento = 0;
  productosConLote = 0;


  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  ngOnInit(): void {

    this.cargarProductos();


    // ========================================
    // BUSCADOR
    // ========================================

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(valor => {

        this.filter.buscar = valor.trim();

        // Al buscar, volver a la primera página
        this.filter.pageNumber = 1;

        this.cargarProductos();

      });

  }


  // ==========================================
  // CARGAR PRODUCTOS
  // ==========================================

  cargarProductos(): void {

    this.loading = true;
    this.error = false;

    this.productoService
      .getAll(this.filter)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: (response) => {

          this.error = false;
          this.productos = response.data;

          this.meta = response.meta;
          this.totalProductos = response.meta.totalCount;
          this.productosConVencimiento = response.data.filter(
            producto => producto.tieneVencimiento
          ).length;
          this.productosConLote = response.data.filter(
            producto => producto.manejaLotes
          ).length;

        },

        error: () => {

          this.error = true;
          this.notificationService.error(
            'No se pudo cargar la lista de productos.'
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

    this.cargarProductos();

  }


  // ==========================================
  // NUEVO PRODUCTO
  // ==========================================

  // =====================================
  // PRESENTACIÓN (solo lectura)
  // =====================================

  /** Cuántos registros de la página tienen el campo con dato. */
  conDato(campo: keyof Producto): number {
    return this.productos.filter(item => String(item[campo] ?? '').trim() !== '').length;
  }

  /** Productos de la página sin stock. */
  get sinStock(): number {
    return this.productos.filter(p => (p.stockActual ?? 0) <= 0).length;
  }

  /** Margen sobre el precio de venta, en %. */
  margen(p: Producto): number {
    return p.precioVenta > 0 ? ((p.precioVenta - p.precioCompra) / p.precioVenta) * 100 : 0;
  }

  iniciales(...partes: (string | null | undefined)[]): string {
    const letras = partes
      .join(' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');
    return letras || '?';
  }

  nuevo(): void {

    this.router.navigate([
      '/productos/nuevo'
    ]);

  }

  verLotes(): void {

    this.router.navigate(['/lotes']);

  }


  // ==========================================
  // EDITAR PRODUCTO
  // ==========================================

  editar(id: number): void {

    this.router.navigate([
      '/productos/editar',
      id
    ]);

  }


  // ==========================================
  // ELIMINAR PRODUCTO
  // ==========================================

  eliminar(id: number): void {

    const confirmado = confirm(
      '¿Está seguro de eliminar este producto?'
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

    this.productoService
      .delete(id)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Producto eliminado correctamente.'
          );


          // Si eliminamos el último producto
          // de una página diferente a la primera,
          // retrocedemos una página.

          if (
            this.productos.length === 1 &&
            this.filter.pageNumber > 1
          ) {

            this.filter.pageNumber--;

          }


          // Recargar listado

          this.cargarProductos();

        },

        error: () => {

          this.notificationService.error(
            'No se pudo eliminar el producto.'
          );

        }

      });

  }

}