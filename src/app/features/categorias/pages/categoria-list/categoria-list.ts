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
import { CategoriaService } from '../../services/categoria';
import { Categoria } from '../../models/categoria.model';

@Component({
  selector: 'app-categoria-list',
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
  templateUrl: './categoria-list.html',
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './categoria-list.css'
  ]
})
export class CategoriaListComponent implements OnInit {
  private categoriaService = inject(CategoriaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);

  categorias: Categoria[] = [];
  displayedColumns: string[] = ['id', 'nombre', 'descripcion', 'acciones'];
  loading = false;
  error = false;

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
    this.cargarCategorias();

    this.buscarControl.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(valor => {
        this.filter.buscar = valor;
        this.filter.pageNumber = 1;
        this.cargarCategorias();
      });
  }

  cargarCategorias(): void {
    this.loading = true;
    this.error = false;

    this.categoriaService.getAll(this.filter)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (response) => {
          this.error = false;
          this.categorias = response.data;
          this.meta = response.meta;
        },
        error: () => {
          this.error = true;
          this.notificationService.error('No se pudo cargar la lista de categorias.');
        }
      });
  }

  cambiarPagina(event: PageEvent): void {
    this.filter.pageNumber = event.pageIndex + 1;
    this.filter.pageSize = event.pageSize;
    this.cargarCategorias();
  }

  // =====================================
  // PRESENTACIÓN (solo lectura)
  // =====================================

  /** Cuántos registros de la página tienen el campo con dato. */
  conDato(campo: keyof Categoria): number {
    return this.categorias.filter(item => String(item[campo] ?? '').trim() !== '').length;
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
    this.router.navigate(['/categorias/nuevo']);
  }

  editar(id: number): void {
    this.router.navigate(['/categorias/editar', id]);
  }

  eliminar(id: number): void {
    const confirmado = confirm('¿Está seguro de eliminar este categoria?');

    if (!confirmado) {
      return;
    }

    this.loading = true;

    this.categoriaService.delete(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Categoria eliminado correctamente.');

          if (this.categorias.length === 1 && this.filter.pageNumber > 1) {
            this.filter.pageNumber--;
          }

          this.cargarCategorias();
        },
        error: () => {
          this.notificationService.error('No se pudo eliminar el Categoria.');
        }
      });
  }
}
