
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MarcaService } from '../../services/marca';
import {MatIconModule} from '@angular/material/icon';

@Component({
  selector: 'app-marca-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './marca-form.html',
  styleUrl: './marca-form.css'
})
export class MarcaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private marcaService = inject(MarcaService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editando = false;
  marcaId = 0;
  titulo = 'Nueva marca';
  loading = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.maxLength(250)]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.editando = true;
      this.marcaId = Number(id);
      this.titulo = 'Editar marca';
      this.cargarMarca(this.marcaId);
    }
  }

  cargarMarca(id: number): void {
    this.loading = true;

    this.marcaService.getById(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (marca) => {
          this.form.patchValue({
            nombre: marca.nombre,
            descripcion: marca.descripcion ?? ''
          });
        },
        error: () => {
          this.notificationService.error('No se pudo cargar la marca.');
          this.router.navigate(['/marcas']);
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
      descripcion: this.form.value.descripcion || ''
    };

    this.loading = true;

    this.marcaService.create(data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Marca creada correctamente.');
          this.router.navigate(['/marcas']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo crear la marca.';
          this.notificationService.error(mensaje);
        }
      });
  }

  actualizar(): void {
    const data = {
      nombre: this.form.value.nombre!,
      descripcion: this.form.value.descripcion || ''
    };

    this.loading = true;

    this.marcaService.update(this.marcaId, data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Marca actualizada correctamente.');
          this.router.navigate(['/marcas']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo actualizar la marca.';
          this.notificationService.error(mensaje);
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/marcas']);
  }
}

