import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  catchError,
  debounceTime,
  EMPTY,
  finalize,
  forkJoin,
  merge,
  Subject,
  switchMap
} from 'rxjs';

import { MetaData } from '../../../../core/models/metadata.model';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  EstadoStockFiltro,
  InventarioSucursal,
  InventarioSucursalResumen
} from '../../models/inventarioSucursal.model';
import { InventarioSucursalService } from '../../services/inventario-sucursal';
import { Sucursal } from '../../../sucursales/models/sucursal.model';
import { SucursalService } from '../../../sucursales/services/sucursal';

@Component({
  selector: 'app-inventario-sucursal-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatPaginatorModule],
  templateUrl: './inventario-sucursal-list.html',
  styleUrl: './inventario-sucursal-list.css',
})
export class InventarioSucursalList implements OnInit {
  private readonly inventarioService = inject(InventarioSucursalService);
  private readonly sucursalService = inject(SucursalService);
  private readonly notificationService = inject(NotificationService);
  private readonly recargar$ = new Subject<void>();

  inventarios: InventarioSucursal[] = [];
  sucursales: Sucursal[] = [];
  resumen: InventarioSucursalResumen | null = null;
  loading = false;
  errorCarga = false;
  readonly pageSizeOptions = [5, 10, 20, 50];
  meta: MetaData = {
    totalCount: 0,
    pageSize: 10,
    currentPage: 1,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false
  };

  readonly buscarControl = new FormControl('', { nonNullable: true });
  readonly filtroEstado = new FormControl('todos', { nonNullable: true });
  readonly filtroSucursal = new FormControl('todas', { nonNullable: true });

  ngOnInit(): void {
    this.sucursalService.gets().subscribe({
      next: sucursales => this.sucursales = sucursales,
      error: error => {
        console.error('Error al cargar sucursales para el inventario:', error);
        this.notificationService.error('No se pudieron cargar las sucursales.');
      }
    });

    this.recargar$
      .pipe(
        switchMap(() => {
          this.loading = true;
          this.errorCarga = false;
          const idSucursal = this.filtroSucursal.value === 'todas'
            ? null
            : Number(this.filtroSucursal.value);

          return forkJoin({
            pagina: this.inventarioService.getPaginacion(
              idSucursal,
              this.meta.currentPage,
              this.meta.pageSize,
              this.buscarControl.value,
              this.estadoSeleccionado()
            ),
            resumen: this.inventarioService.getResumen(idSucursal)
          }).pipe(
            finalize(() => this.loading = false),
            catchError(error => {
              this.inventarios = [];
              this.resumen = null;
              this.meta = {
                ...this.meta,
                totalCount: 0,
                totalPages: 0,
                hasNextPage: false,
                hasPreviousPage: false
              };
              this.errorCarga = true;
              console.error('Error al cargar inventario y resumen:', error);
              this.notificationService.error('No se pudo cargar el inventario o su resumen.');
              return EMPTY;
            })
          );
        })
      )
      .subscribe(({ pagina, resumen }) => {
        this.inventarios = pagina.data;
        this.meta = pagina.meta;
        this.resumen = resumen;
      });

    merge(
      this.buscarControl.valueChanges.pipe(debounceTime(350)),
      this.filtroEstado.valueChanges,
      this.filtroSucursal.valueChanges
    ).subscribe(() => {
      this.meta.currentPage = 1;
      this.cargarInventario();
    });

    this.cargarInventario();
  }

  cargarInventario(): void {
    this.recargar$.next();
  }

  cambiarPagina(event: PageEvent): void {
    this.meta.currentPage = event.pageIndex + 1;
    this.meta.pageSize = event.pageSize;
    this.cargarInventario();
  }

  estadoTexto(estado: string): string {
    switch (estado) {
      case 'BAJO': return 'Stock bajo';
      case 'SIN_EXISTENCIAS': return 'Sin existencias';
      case 'SOBRESTOCK': return 'Sobrestock';
      case 'NORMAL': return 'Normal';
      default: return estado;
    }
  }

  estadoClase(estado: string): string {
    switch (estado) {
      case 'BAJO': return 'status-low';
      case 'SIN_EXISTENCIAS': return 'status-empty';
      case 'SOBRESTOCK': return 'status-overstock';
      default: return 'status-ok';
    }
  }

  private estadoSeleccionado(): EstadoStockFiltro | null {
    const estado = this.filtroEstado.value;
    return estado === 'todos' ? null : estado as EstadoStockFiltro;
  }
}
