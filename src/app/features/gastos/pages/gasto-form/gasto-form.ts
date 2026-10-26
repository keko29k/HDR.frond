
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
import { GastoService } from '../../services/gasto';
import {  MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-gasto-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './gasto-form.html',
  styleUrl: './gasto-form.css'
})
export class GastoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private gastoService = inject(GastoService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editando = false;
  gastoId = 0;
  titulo = 'Nuevo gasto';
  loading = false;

  form = this.fb.group({
    idCaja: [0, [Validators.required, Validators.min(1)]],
    idUsuario: [0, [Validators.required, Validators.min(1)]],
    concepto: [0, [Validators.required, Validators.min(1)]],
    numeroComprobante: ['', [Validators.maxLength(100)]],
    monto: [0, [Validators.required, Validators.min(0.01)]],
    observacion: ['', [Validators.maxLength(500)]]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.editando = true;
      this.gastoId = Number(id);
      this.titulo = 'Editar gasto';
      this.form.get('idCaja')?.disable();
      this.form.get('idUsuario')?.disable();
      this.cargarGasto(this.gastoId);
    }
  }

  cargarGasto(id: number): void {
    this.loading = true;

    this.gastoService.getById(id)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (gasto) => {
          this.form.patchValue({
            idCaja: gasto.idCaja,
            idUsuario: gasto.idUsuario,
            concepto: gasto.concepto,
            numeroComprobante: gasto.numeroComprobante ?? '',
            monto: gasto.monto,
            observacion: gasto.observacion ?? ''
          });
        },
        error: () => {
          this.notificationService.error('No se pudo cargar el gasto.');
          this.router.navigate(['/gastos']);
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
      idCaja: this.form.getRawValue().idCaja!,
      idUsuario: this.form.getRawValue().idUsuario!,
      concepto: this.form.getRawValue().concepto!,
      numeroComprobante: this.form.getRawValue().numeroComprobante || '',
      monto: this.form.getRawValue().monto!,
      observacion: this.form.getRawValue().observacion || ''
    };

    this.loading = true;

    this.gastoService.create(data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Gasto creado correctamente.');
          this.router.navigate(['/gastos']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo crear el gasto.';
          this.notificationService.error(mensaje);
        }
      });
  }

  actualizar(): void {
    const data = {
      concepto: this.form.getRawValue().concepto!,
      numeroComprobante: this.form.getRawValue().numeroComprobante || '',
      monto: this.form.getRawValue().monto!,
      observacion: this.form.getRawValue().observacion || ''
    };

    this.loading = true;

    this.gastoService.update(this.gastoId, data)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: () => {
          this.notificationService.success('Gasto actualizado correctamente.');
          this.router.navigate(['/gastos']);
        },
        error: (error) => {
          const mensaje = error?.error?.mensaje || 'No se pudo actualizar el gasto.';
          this.notificationService.error(mensaje);
        }
      });
  }

  cancelar(): void {
    this.router.navigate(['/gastos']);
  }
}

