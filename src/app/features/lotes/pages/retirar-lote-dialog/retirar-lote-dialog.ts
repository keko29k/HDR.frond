import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { LoteService } from '../../services/lote';
import { LoteVencimiento } from '../../models/lote-vencimiento.model';

@Component({
  selector: 'app-retirar-lote-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './retirar-lote-dialog.html',
  styleUrl: './retirar-lote-dialog.css'
})
export class RetirarLoteDialog {

  private readonly loteService = inject(LoteService);
  private readonly dialogRef = inject(MatDialogRef<RetirarLoteDialog, boolean>);
  readonly lote = inject<LoteVencimiento>(MAT_DIALOG_DATA);

  /** Por defecto se retira todo lo disponible. */
  cantidad = this.lote.cantidadDisponible;
  guardando = false;
  error = '';

  get cantidadValida(): boolean {
    return Number.isFinite(this.cantidad) &&
      this.cantidad > 0 &&
      this.cantidad <= this.lote.cantidadDisponible;
  }

  get retiraTodo(): boolean {
    return this.cantidad === this.lote.cantidadDisponible;
  }

  get valorRetirado(): number {
    return this.cantidadValida ? this.cantidad * this.lote.costoCompra : 0;
  }

  usarTodo(): void {
    this.cantidad = this.lote.cantidadDisponible;
  }

  confirmar(): void {
    if (!this.cantidadValida || this.guardando) {
      return;
    }

    this.guardando = true;
    this.error = '';

    this.loteService.retirar(this.lote.idLote, this.cantidad)
      .pipe(finalize(() => this.guardando = false))
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: err => {
          this.error = err?.status === 401
            ? 'Tu sesión expiró. Inicia sesión nuevamente.'
            : err?.error?.mensaje || 'No se pudo retirar el lote.';
        }
      });
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
