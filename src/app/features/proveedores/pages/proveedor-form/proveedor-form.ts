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

import { NotificationService } from '../../../../core/services/notification.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ProveedorService } from '../../services/proveedor';

import { ProveedorCreate } from '../../models/proveedor-create.model';
import { ProveedorUpdate } from '../../models/proveedor-update.model';


@Component({
  selector: 'app-proveedor-form',
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],

  templateUrl: './proveedor-form.html',
  styleUrl: './proveedor-form.css'
})
export class ProveedorFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private proveedorService = inject(ProveedorService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);


  editando = false;
  proveedorId = 0;

  titulo = 'Nuevo proveedor';

  loading = false;


  form = this.fb.group({

    nombre: ['', [
      Validators.required,
      Validators.maxLength(100)
    ]],

    telefono: ['', [
      Validators.required,
      Validators.maxLength(30)
    ]],

    contacto: ['', [
      Validators.maxLength(100)
    ]],

    nit: ['', [
      Validators.maxLength(30)
    ]],

    correo: ['', [
      Validators.email,
      Validators.maxLength(150)
    ]],

    direccion: ['', [
      Validators.maxLength(200)
    ]],

    observacion: ['', [
      Validators.maxLength(500)
    ]]

  });


  ngOnInit(): void {

    const id = this.route.snapshot.paramMap.get('id');

    if (id) {

      this.editando = true;

      this.proveedorId = Number(id);

      this.titulo = 'Editar proveedor';

      this.cargarProveedor(this.proveedorId);

    }

  }


  cargarProveedor(id: number): void {

    this.loading = true;

    this.proveedorService.getById(id)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (proveedor) => {

          this.form.patchValue({

            nombre: proveedor.nombre,

            telefono: proveedor.telefono,

            contacto: proveedor.contacto,

            nit: proveedor.nit,

            correo: proveedor.correo,

            direccion: proveedor.direccion,

            observacion: proveedor.observacion

          });

        },

        error: () => {

          this.notificationService.error(
            'No se pudo cargar el proveedor.'
          );

          this.router.navigate(['/proveedores']);

        }

      });

  }


  guardar(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      this.notificationService.error(
        'Complete correctamente el formulario.'
      );

      return;

    }


    if (this.editando) {

      this.actualizar();

    } else {

      this.crear();

    }

  }


  crear(): void {

    const data: ProveedorCreate = {

      nombre: this.form.value.nombre!,

      telefono: this.form.value.telefono!,

      contacto: this.form.value.contacto ?? '',

      nit: this.form.value.nit ?? '',

      correo: this.form.value.correo ?? '',

      direccion: this.form.value.direccion ?? '',

      observacion: this.form.value.observacion ?? ''

    };


    console.log(
      'DATA CREAR PROVEEDOR:',
      data
    );


    this.loading = true;

    this.proveedorService.create(data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Proveedor creado correctamente.'
          );

          this.router.navigate(['/proveedores']);

        },

        error: (error) => {

          console.error(
            'Error crear proveedor:',
            error
          );

          const mensaje =
            error?.error?.mensaje ||
            'No se pudo crear el proveedor.';

          this.notificationService.error(
            mensaje
          );

        }

      });

  }


  actualizar(): void {

    const data: ProveedorUpdate = {

      nombre: this.form.value.nombre!,

      telefono: this.form.value.telefono!,

      contacto: this.form.value.contacto ?? '',

      nit: this.form.value.nit ?? '',

      correo: this.form.value.correo ?? '',

      direccion: this.form.value.direccion ?? '',

      observacion: this.form.value.observacion ?? ''

    };


    console.log(
      'DATA ACTUALIZAR PROVEEDOR:',
      data
    );


    this.loading = true;

    this.proveedorService
      .update(this.proveedorId, data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Proveedor actualizado correctamente.'
          );

          this.router.navigate(['/proveedores']);

        },

        error: (error) => {

          console.error(
            'Error actualizar proveedor:',
            error
          );

          const mensaje =
            error?.error?.mensaje ||
            'No se pudo actualizar el proveedor.';

          this.notificationService.error(
            mensaje
          );

        }

      });

  }


  cancelar(): void {

    this.router.navigate(['/proveedores']);

  }

}