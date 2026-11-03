
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';

import { ClienteService } from '../../services/cliente';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-cliente-list',
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
  templateUrl: './cliente-list.html',
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './cliente-list.css'
  ]
})
export class ClienteListComponent implements OnInit {

  private clienteService = inject(ClienteService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  clientes: Cliente[] = [];

  displayedColumns: string[] = [
    'id',
    'nombres',
    'nitCi',
    'contacto',
    'direccion',
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

    this.cargarClientes();

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(valor => {

        this.filter.buscar = valor;
        this.filter.pageNumber = 1;

        this.cargarClientes();
      });
  }

  cargarClientes(): void {

    this.loading = true;
    this.error = false;

    this.clienteService
      .getAll(this.filter)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (response) => {

          this.error = false;
          this.clientes = response.data;
          this.meta = response.meta;

        },

        error: () => {

          this.error = true;
          this.notificationService.error(
            'No se pudo cargar la lista de clientes.'
          );

        }

      });
  }

  cambiarPagina(event: PageEvent): void {

    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;

    this.cargarClientes();
  }

  // =====================================
  // PRESENTACIÓN (solo lectura)
  // =====================================

  /** Cuántos registros de la página tienen el campo con dato. */
  conDato(campo: keyof Cliente): number {
    return this.clientes.filter(item => String(item[campo] ?? '').trim() !== '').length;
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
      '/clientes/nuevo'
    ]);
  }

  editar(id: number): void {

    this.router.navigate([
      '/clientes/editar',
      id
    ]);
  }

  eliminar(id: number): void {

    const confirmado = confirm(
      '¿Está seguro de eliminar este cliente?'
    );

    if (!confirmado) {
      return;
    }

    this.loading = true;

    this.clienteService
      .delete(id)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Cliente eliminado correctamente.'
          );

          // Si eliminamos el último registro de la página
          // y no estamos en la primera página, retrocedemos.
          if (
            this.clientes.length === 1 &&
            this.filter.pageNumber > 1
          ) {
            this.filter.pageNumber--;
          }

          this.cargarClientes();
        },

        error: () => {

          this.notificationService.error(
            'No se pudo eliminar el cliente.'
          );

        }

      });
  }
}
