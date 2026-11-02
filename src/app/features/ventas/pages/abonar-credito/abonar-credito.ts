
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta';

@Component({
  selector: 'app-abonar-credito',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './abonar-credito.html',
  styleUrl: './abonar-credito.css'
})
export class AbonarCredito {

  private fb = inject(FormBuilder);
  private ventaService = inject(VentaService);

  private dialogRef = inject(MatDialogRef<AbonarCredito>);

  venta = inject<Venta>(MAT_DIALOG_DATA);

  loading = false;

  formulario = this.fb.group({
    monto: [
      null as number | null,
      [
        Validators.required,
        Validators.min(0.01),
        Validators.max(this.venta.saldoPendiente)
      ]
    ],
    metodoPago: ['EFECTIVO', Validators.required],
    referencia: [''],
    observacion: ['']
  });

  get saldoRestante(): number {
    const monto = Number(
      this.formulario.get('monto')?.value || 0
    );

    return Math.max(0, this.venta.saldoPendiente - monto);
  }

  cancelar(): void {
    if (!this.loading) {
      this.dialogRef.close(false);
    }
  }

  registrarAbono(): void {
    if (this.formulario.invalid || this.loading) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();

    const dto = {
      monto: Number(valores.monto),
      metodoPago: valores.metodoPago as 'EFECTIVO' | 'QR',
      referencia: valores.referencia?.trim() || undefined,
      observacion: valores.observacion?.trim() || undefined
    };

    this.loading = true;

    this.ventaService
      .registrarAbonoCredito(this.venta.id, dto)
      .subscribe({
        next: () => {
          this.loading = false;
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;

          const mensaje =
            error?.error?.mensaje ||
            'No se pudo registrar el abono. Intente nuevamente.';

          alert(mensaje);
        }
      });
  }


  
}
