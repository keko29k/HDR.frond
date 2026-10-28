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

import {
  finalize,
  forkJoin
} from 'rxjs';

import { UsuarioService } from '../../services/usuario';

import { NotificationService } from '../../../../core/services/notification.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { SucursalService } from '../../../sucursales/services/sucursal';
import { Sucursal } from '../../../sucursales/models/sucursal.model';

import { UsuarioCreate } from '../../models/usuario-create.model';
import { UsuarioUpdate } from '../../models/usuario-update.model';


@Component({
  selector: 'app-usuario-form',
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

  templateUrl: './usuario-form.html',
  styleUrl: './usuario-form.css'
})
export class UsuarioFormComponent implements OnInit {

  private fb = inject(FormBuilder);

  private usuarioService = inject(UsuarioService);

  private sucursalService = inject(SucursalService);

  private notificationService =
    inject(NotificationService);

  private router = inject(Router);

  private route = inject(ActivatedRoute);


  sucursales: Sucursal[] = [];


  editando = false;

  usuarioId = 0;

  titulo = 'Nuevo usuario';

  loading = false;


  form = this.fb.group({

    idSucursal: [0, [
      Validators.required,
      Validators.min(1)
    ]],

    nombres: ['', [
      Validators.required,
      Validators.maxLength(100)
    ]],

    apellidos: ['', [
      Validators.required,
      Validators.maxLength(100)
    ]],

    rol: ['', [
      Validators.required
    ]],

    usuario1: ['', [
      Validators.required,
      Validators.maxLength(100)
    ]],

    clave: ['', [
      Validators.maxLength(255)
    ]],

    telefono: ['', [
      Validators.maxLength(30)
    ]],

    correo: ['', [
      Validators.maxLength(150)
    ]]

  });


  ngOnInit(): void {

    const id =
      this.route.snapshot.paramMap.get('id');


    this.cargarSucursales();


    if (id) {

      this.editando = true;

      this.usuarioId = Number(id);

      this.titulo = 'Editar usuario';


      this.form
        .get('clave')
        ?.clearValidators();

      this.form
        .get('clave')
        ?.updateValueAndValidity();


      this.cargarUsuario(this.usuarioId);

    }

    else {

      this.form
        .get('clave')
        ?.setValidators([
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(255)
        ]);

      this.form
        .get('clave')
        ?.updateValueAndValidity();

    }

  }


  cargarSucursales(): void {

    this.loading = true;

    this.sucursalService.gets()
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (sucursales) => {

          this.sucursales = sucursales;

        },

        error: () => {

          this.notificationService.error(
            'No se pudieron cargar las sucursales.'
          );

        }

      });

  }


  cargarUsuario(id: number): void {

    this.loading = true;

    this.usuarioService.getById(id)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (usuario) => {

          this.form.patchValue({

            idSucursal: usuario.idSucursal,

            nombres: usuario.nombres,

            apellidos: usuario.apellidos,

            rol: usuario.rol,

            usuario1: usuario.usuario1,

            clave: '',

            telefono: usuario.telefono,

            correo: usuario.correo

          });

        },

        error: () => {

          this.notificationService.error(
            'No se pudo cargar el usuario.'
          );

          this.router.navigate([
            '/usuarios'
          ]);

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

    }

    else {

      this.crear();

    }

  }


  crear(): void {

    const data: UsuarioCreate = {

      idSucursal:
        this.form.value.idSucursal!,

      nombres:
        this.form.value.nombres!,

      apellidos:
        this.form.value.apellidos!,

      rol:
        this.form.value.rol!,

      Usuario1:
        this.form.value.usuario1!,

      clave:
        this.form.value.clave!,

      telefono:
        this.form.value.telefono ?? '',

      correo:
        this.form.value.correo ?? '',

      foto: ''

    };


    console.log(
      'DATA CREAR USUARIO:',
      data
    );


    this.loading = true;

    this.usuarioService.create(data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Usuario creado correctamente.'
          );

          this.router.navigate([
            '/usuarios'
          ]);

        },

        error: (error) => {

          console.error(
            'Error crear usuario:',
            error
          );

          const mensaje =
            error?.error?.mensaje ||
            'No se pudo crear el usuario.';

          this.notificationService.error(
            mensaje
          );

        }

      });

  }


  actualizar(): void {

    const data: UsuarioUpdate = {

      idSucursal:
        this.form.value.idSucursal!,

      nombres:
        this.form.value.nombres!,

      apellidos:
        this.form.value.apellidos!,

      rol:
        this.form.value.rol!,

      usuario1:
        this.form.value.usuario1!,

      clave:
        this.form.value.clave ?? '',

      telefono:
        this.form.value.telefono ?? '',

      correo:
        this.form.value.correo ?? '',

      foto: ''

    };


    console.log(
      'DATA ACTUALIZAR USUARIO:',
      data
    );


    this.loading = true;

    this.usuarioService
      .update(this.usuarioId, data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Usuario actualizado correctamente.'
          );

          this.router.navigate([
            '/usuarios'
          ]);

        },

        error: (error) => {

          console.error(
            'Error actualizar usuario:',
            error
          );

          const mensaje =
            error?.error?.mensaje ||
            'No se pudo actualizar el usuario.';

          this.notificationService.error(
            mensaje
          );

        }

      });

  }


  cancelar(): void {

    this.router.navigate([
      '/usuarios'
    ]);

  }

}