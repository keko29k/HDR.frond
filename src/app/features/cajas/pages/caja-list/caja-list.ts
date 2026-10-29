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
import { CajaService } from '../../services/caja';
import { Caja } from '../../models/caja.model';

@Component({
  selector: 'app-caja-list',
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
  templateUrl: './caja-list.html',
  styleUrl: './caja-list.css'
})
export class CajaListComponent implements OnInit {

  private cajaService = inject(CajaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  cajas: Caja[] = [];

  displayedColumns: string[] = [
    'id',
    'idSucursal',
    'idUsuarioApertura',  
    'fechaApertura',
    'fechaCierre',
    'montoInicial',
    'montoFinal',
    'estadoCaja',
    'observacion',
    'acciones'
  ];

  loading = false;
  error = false;

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

    this.cargarCajas();

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(valor => {

        this.filter.buscar = valor;
        this.filter.pageNumber = 1;

        this.cargarCajas();
      });
  }

  cargarCajas(): void {

    this.loading = true;
    this.error = false;

    this.cajaService
      .getAll(this.filter)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (response) => {

          this.cajas = response.data;
          this.meta = response.meta;
        },

        error: (error) => {

          console.error('Error al cargar cajas:', error);
          this.error = true;

          this.notificationService.error(
            'No se pudo cargar la lista de cajas.'
          );
        }
      });
  }

  cambiarPagina(event: PageEvent): void {

    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;

    this.cargarCajas();
  }

  nuevo(): void {

    this.router.navigate(['/cajas/nuevo']);
  }

  editar(id: number): void {

    this.router.navigate(['/cajas/editar', id]);
  }

  eliminar(id: number): void {

    const confirmado = confirm(
      '¿Está seguro de eliminar esta caja?'
    );

    if (!confirmado) {
      return;
    }

    this.loading = true;

    this.cajaService
      .delete(id)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Caja eliminada correctamente.'
          );

          if (
            this.cajas.length === 1 &&
            this.filter.pageNumber > 1
          ) {
            this.filter.pageNumber--;
          }

          this.cargarCajas();
        },

        error: (error) => {

          console.error('Error al eliminar caja:', error);

          this.notificationService.error(
            'No se pudo eliminar la caja.'
          );
        }
      });
  }

  cerrar(id: number): void {

    const confirmado = confirm(
      '¿Está seguro de cerrar esta caja?'
    );

    if (!confirmado) {
      return;
    }

    this.loading = true;

    this.cajaService
      .cerrarCaja(id)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (res) => {

          if (res) {

            this.notificationService.success(
              'Caja cerrada correctamente.'
            );

            this.cargarCajas();

          } else {

            this.notificationService.error(
              'No se pudo cerrar la caja.'
            );
          }
        },

        error: (error) => {

          console.error('Error al cerrar caja:', error);

          this.notificationService.error(
            'Ocurrió un error al cerrar la caja.'
          );
        }
      });
  }
}