import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router
} from '@angular/router';

import { finalize } from 'rxjs';

import { SucursalService } from '../../services/sucursal';

import { NotificationService } from '../../../../core/services/notification.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SucursalCreate } from '../../models/sucursal-create.model';
import { SucursalUpdate } from '../../models/sucursal-update.model';


@Component({
  selector: 'app-sucursal-form',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],

  templateUrl: './sucursal-form.html',
  styleUrl: './sucursal-form.css'
})
export class SucursalFormComponent implements OnInit {

  private fb = inject(FormBuilder);

  private sucursalService = inject(SucursalService);

  private notificationService = inject(NotificationService);

  private router = inject(Router);

  private route = inject(ActivatedRoute);


  editando = false;

  sucursalId = 0;

  titulo = 'Nueva sucursal';

  loading = false;

  guardando = false;


  form = this.fb.nonNullable.group({

    nombre: ['', [
      Validators.required,
      Validators.maxLength(100)
    ]],

    telefono: ['', [
      Validators.maxLength(30),
      Validators.pattern(/^[0-9+\-\s()]*$/)
    ]],

    direccion: ['', [
      Validators.maxLength(250)
    ]],

    correo: ['', [
      Validators.email,
      Validators.maxLength(150)
    ]]

  });


  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {

      this.editando = true;

      this.sucursalId = Number(id);

      this.titulo = 'Editar sucursal';

      this.cargarSucursal(this.sucursalId);

    }

  }


  // ==========================================
  // CARGAR SUCURSAL (EDICIÓN)
  // ==========================================

  cargarSucursal(id: number): void {

    this.loading = true;

    this.sucursalService.getById(id)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (sucursal) => {

          this.form.patchValue({

            nombre: sucursal.nombre ?? '',

            telefono: sucursal.telefono ?? '',

            direccion: sucursal.direccion ?? '',

            correo: sucursal.correo ?? ''

          });

        },

        error: () => {

          this.notificationService.error(
            'No se pudo cargar la sucursal.'
          );

          this.router.navigate(['/sucursales']);

        }

      });

  }


  // ==========================================
  // GUARDAR
  // ==========================================

  guardar(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.notificationService.error(
        'Revisa los campos marcados en rojo.'
      );

      return;

    }

    if (this.editando) {

      this.actualizar();

    }

    else {

      this.crear();

    }

  }


  /** Valores del formulario sin espacios sobrantes */
  private datos(): SucursalCreate {

    const v = this.form.getRawValue();

    return {

      nombre: v.nombre.trim(),

      telefono: v.telefono.trim(),

      direccion: v.direccion.trim(),

      correo: v.correo.trim()

    };

  }


  // ==========================================
  // CREAR
  // ==========================================

  crear(): void {

    const data: SucursalCreate = this.datos();

    this.guardando = true;

    this.sucursalService.create(data)
      .pipe(
        finalize(() => this.guardando = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Sucursal creada.'
          );

          this.router.navigate(['/sucursales']);

        },

        error: (error) => {

          console.error('Error crear sucursal:', error);

          const mensaje =
            error?.error?.mensaje ||
            'No se pudo crear la sucursal.';

          this.notificationService.error(mensaje);

        }

      });

  }


  // ==========================================
  // ACTUALIZAR
  // ==========================================

  actualizar(): void {

    const data: SucursalUpdate = this.datos();

    this.guardando = true;

    this.sucursalService
      .update(this.sucursalId, data)
      .pipe(
        finalize(() => this.guardando = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Sucursal actualizada.'
          );

          this.router.navigate(['/sucursales']);

        },

        error: (error) => {

          console.error('Error actualizar sucursal:', error);

          const mensaje =
            error?.error?.mensaje ||
            'No se pudo actualizar la sucursal.';

          this.notificationService.error(mensaje);

        }

      });

  }


  // ==========================================
  // CANCELAR
  // ==========================================

  cancelar(): void {

    this.router.navigate(['/sucursales']);

  }

}