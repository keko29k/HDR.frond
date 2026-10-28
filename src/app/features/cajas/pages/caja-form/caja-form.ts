
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';
import { CajaService } from '../../services/caja';
import { UsuarioService } from '../../../usuarios/services/usuario';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { Sucursal } from '../../../sucursales/models/sucursal.model';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { CajaCreate } from '../../models/caja-create.model';
import { CajaUpdate } from '../../models/caja-update.model';

@Component({
  selector: 'app-caja-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './caja-form.html',
  styleUrl: './caja-form.css'
})
export class CajaFormComponent implements OnInit {

  private fb = inject(FormBuilder);
  private cajaService = inject(CajaService);
  private notificationService = inject(NotificationService);
  private usuarioService = inject(UsuarioService);
  private sucursalService = inject(SucursalService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editando = false;
  cajaId = 0;
  usuarioId = 0;
  sucursalAsignada: Sucursal | null = null;
  cargandoContexto = false;
  contextoCargado = false;

  titulo = 'Nueva caja';

  loading = false;


  // ==========================================
  // FORMULARIO
  // ==========================================

  form = this.fb.group({
    montoInicial: [
      0,
      [
        Validators.required,
        Validators.min(0)
      ]
    ],

    estadoCaja: [
      'ABIERTA',
      Validators.required
    ],

    observacion: [
      '',
      [
        Validators.maxLength(500)
      ]
    ]

  });


  // ==========================================
  // INICIO
  // ==========================================

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {

      this.editando = true;

      this.cajaId = Number(id);

      this.titulo = 'Editar caja';

      this.cargarCaja(this.cajaId);
    } else {
      this.cargarContextoApertura();
    }
  }

  private cargarContextoApertura(): void {
    this.usuarioId = Number(localStorage.getItem('Id'));
    if (!Number.isInteger(this.usuarioId) || this.usuarioId <= 0) {
      this.notificationService.error('No se pudo identificar al usuario. Inicie sesión nuevamente.');
      return;
    }

    this.cargandoContexto = true;
    this.usuarioService.getById(this.usuarioId).subscribe({
      next: usuario => {
        if (!Number.isInteger(usuario.idSucursal) || usuario.idSucursal <= 0) {
          this.cargandoContexto = false;
          this.notificationService.error('El usuario no tiene una sucursal asignada.');
          return;
        }

        this.sucursalService.getById(usuario.idSucursal)
          .pipe(finalize(() => this.cargandoContexto = false))
          .subscribe({
            next: sucursal => {
              this.sucursalAsignada = sucursal;
              this.contextoCargado = true;
            },
            error: error => {
              console.error('Error al cargar la sucursal asignada al usuario:', error);
              this.notificationService.error('No se pudo cargar la sucursal del usuario.');
            }
          });
      },
      error: error => {
        this.cargandoContexto = false;
        console.error('Error al cargar el usuario que abrirá la caja:', error);
        this.notificationService.error('No se pudieron cargar los datos del usuario.');
      }
    });
  }

  // ==========================================
  // CARGAR CAJA
  // ==========================================

  cargarCaja(id: number): void {

    this.loading = true;

    this.cajaService
      .getById(id)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: (caja) => {

          this.form.patchValue({
            montoInicial: caja.montoInicial,

            estadoCaja: caja.estadoCaja,

            observacion: caja.observacion ?? ''

          });

        },

        error: (error) => {

          console.error(
            'Error al cargar caja:',
            error
          );

          this.notificationService.error(
            'No se pudo cargar la caja.'
          );

          this.router.navigate(['/cajas']);

        }

      });

  }


  // ==========================================
  // GUARDAR
  // ==========================================

  guardar(): void {
    if (!this.editando && !this.contextoCargado) {
      this.notificationService.error('No se puede abrir la caja sin confirmar el usuario y su sucursal.');
      return;
    }

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


 // ==========================================
// CREAR / ABRIR CAJA
// ==========================================

crear(): void {
  if (!this.sucursalAsignada || this.usuarioId <= 0) {
    this.notificationService.error('No se puede abrir la caja sin un usuario y sucursal válidos.');
    return;
  }

  const data: CajaCreate = {
    idSucursal: this.sucursalAsignada.id,
    idUsuarioApertura: this.usuarioId,
    idUsuarioCierre: null,
    fechaApertura: new Date(),
    fechaCierre: null,
    montoInicial: this.form.value.montoInicial!,
    montoFinal: null,
    estadoCaja: 'ABIERTA',
    observacion: this.form.value.observacion || " "
  };

  this.loading = true;

  this.cajaService.create(data)
    .pipe(finalize(() => this.loading = false))
    .subscribe({
      next: () => {
        this.notificationService.success('Caja abierta correctamente.');
        this.router.navigate(['/cajas']);
      },
      error: (error) => {
        console.error('Error al abrir caja:', error);
        const mensaje = error?.error?.mensaje || 'No se pudo abrir la caja.';
        this.notificationService.error(mensaje);
      }
    });
}

  // ==========================================
  // ACTUALIZAR CAJA
  // ==========================================

  actualizar(): void {

    const data: CajaUpdate = {

      estadoCaja:
        this.form.value.estadoCaja!,

      observacion:
        this.form.value.observacion || ''

    };

    this.loading = true;

    this.cajaService
      .update(this.cajaId, data)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe({

        next: () => {

          this.notificationService.success(
            'Caja actualizada correctamente.'
          );

          this.router.navigate(['/cajas']);

        },

        error: (error) => {

          console.error(
            'Error al actualizar caja:',
            error
          );

          const mensaje =
            error?.error?.mensaje ||
            'No se pudo actualizar la caja.';

          this.notificationService.error(mensaje);

        }

      });

  }


  // ==========================================
  // CANCELAR
  // ==========================================

  cancelar(): void {

    this.router.navigate(['/cajas']);

  }

}
