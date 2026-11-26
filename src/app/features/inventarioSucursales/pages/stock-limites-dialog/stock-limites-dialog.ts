import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { finalize } from 'rxjs';

import { NotificationService } from '../../../../core/services/notification.service';
import { Producto } from '../../../productos/models/producto.model';
import { InventarioSucursalService } from '../../services/inventario-sucursal';

export interface StockLimitesDialogData {
  producto: Producto;
  sucursalId: number;
  sucursalNombre: string;
}

/** El máximo (si se indica) no puede ser menor que el mínimo. */
function maximoNoMenorQueMinimo(group: AbstractControl): ValidationErrors | null {
  const minimo = Number(group.get('stockMinimo')?.value) || 0;
  const valorMax = group.get('stockMaximo')?.value;

  if (valorMax === null || valorMax === '' || Number(valorMax) === 0) {
    return null;
  }

  return Number(valorMax) < minimo ? { maximoMenor: true } : null;
}

@Component({
  selector: 'app-stock-limites-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './stock-limites-dialog.html',
  styleUrl: './stock-limites-dialog.css'
})
export class StockLimitesDialog {

  private readonly inventarioService = inject(InventarioSucursalService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<StockLimitesDialog>);
  readonly data = inject<StockLimitesDialogData>(MAT_DIALOG_DATA);

  guardando = false;

  readonly form = new FormGroup(
    {
      stockMinimo: new FormControl<number>(this.data.producto.stockMinimo ?? 0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)]
      }),
      stockMaximo: new FormControl<number | null>(this.data.producto.stockMaximo ?? null, {
        validators: [Validators.min(0)]
      })
    },
    { validators: maximoNoMenorQueMinimo }
  );

  /** Cantidad sugerida con los valores que se están escribiendo. */
  get sugerido(): number {
    const minimo = Number(this.form.controls.stockMinimo.value) || 0;
    const maximo = Number(this.form.controls.stockMaximo.value) || 0;
    const actual = this.data.producto.stockActual || 0;

    if (minimo <= 0 || actual > minimo || maximo <= actual) {
      return 0;
    }

    return maximo - actual;
  }

  guardar(): void {
    if (this.form.invalid || this.guardando) {
      this.form.markAllAsTouched();
      return;
    }

    const minimo = Number(this.form.controls.stockMinimo.value) || 0;
    const maximoValor = Number(this.form.controls.stockMaximo.value) || 0;

    this.guardando = true;

    this.inventarioService.guardarLimites({
      idProducto: this.data.producto.id,
      idSucursal: this.data.sucursalId,
      stockMinimo: minimo,
      stockMaximo: maximoValor > 0 ? maximoValor : null
    })
      .pipe(finalize(() => (this.guardando = false)))
      .subscribe({
        next: () => {
          this.notificationService.success('Stock mínimo y máximo guardados.');
          this.dialogRef.close(true);
        },
        error: error => {
          console.error('Error al guardar los límites de stock:', error);
          this.notificationService.error(
            error?.error?.mensaje || 'No se pudieron guardar los límites de stock.'
          );
        }
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
