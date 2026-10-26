import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CategoriaService } from '../../services/categoria';

@Component({
  selector: 'app-categoria-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './categoria-form.html',
  styleUrl: './categoria-form.css'
})
export class CategoriaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoriaService = inject(CategoriaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editando = false;
  categoriaId = 0;
  titulo = 'Nuevo categoria';
  loading = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: [''],
    });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.editando = true;
      this.categoriaId = Number(id);
      this.titulo = 'Editar categoria';

      this.cargarCategoria(this.categoriaId);
    } 
  }

  cargarCategoria(id: number): void {
    this.loading = true;

    this.categoriaService.getById(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: categoria => {
          this.form.patchValue({
            nombre: categoria.nombre,
            descripcion: categoria.descripcion
          });
        },
        error: () => {
          this.notificationService.error('No se pudo cargar la categoria.');
          this.router.navigate(['/categorias']);
        }
      });
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error('Complete correctamente el formulario.');
      return;
    }

    if (this.editando) {
      this.actualizar();
    } else {
      this.crear();
    }
  }

  crear(): void {
    const data = {
      nombre: this.form.value.nombre!,
      descripcion: this.form.value.descripcion!
    };

    this.loading = true;

    this.categoriaService.create(data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Categoria creado correctamente.');
          this.router.navigate(['/categorias']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo crear el categoria.';
          this.notificationService.error(mensaje);
        }
      });
  }

  actualizar(): void {
    const data = {
      id: this.categoriaId,
      nombre: this.form.value.nombre!,
      descripcion: this.form.value.descripcion!
    };

    this.loading = true;

    this.categoriaService.update(this.categoriaId, data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Categoria actualizado correctamente.');
          this.router.navigate(['/categorias']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo actualizar el categoria.';
          this.notificationService.error(mensaje);
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/categorias']);
  }
}
