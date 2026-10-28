
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editando = false;
  cajaId = 0;

  titulo = 'Nueva caja';

  loading = false;


  // ==========================================
  // FORMULARIO
  // ==========================================

  form = this.fb.group({

    idSucursal: [
      0,
      [
        Validators.required,
        Validators.min(1)
      ]
    ],

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

    }

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

            idSucursal: caja.idSucursal,

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
  const data: CajaCreate = {
    idSucursal: this.form.value.idSucursal!,
    idUsuarioApertura: Number(localStorage.getItem('Id')),
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
