import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Lote } from '../../../lotes/models/lote.model';
import { LoteService } from '../../../lotes/services/lote';
import { Producto } from '../../../productos/models/producto.model';

export interface LotesProductoDialogData {
  producto: Producto;
  sucursalId: number;
  sucursalNombre: string;
}

type EstadoLote = 'VENCIDO' | 'POR_VENCER' | 'VIGENTE' | 'AGOTADO';

const DIAS_ALERTA = 30;

@Component({
  selector: 'app-lotes-producto-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './lotes-producto-dialog.html',
  styleUrl: './lotes-producto-dialog.css'
})
export class LotesProductoDialog implements OnInit {

  private readonly loteService = inject(LoteService);
  private readonly dialogRef = inject(MatDialogRef<LotesProductoDialog>);
  readonly data = inject<LotesProductoDialogData>(MAT_DIALOG_DATA);

  lotes: Lote[] = [];
  loading = false;
  error = false;

  private readonly hoy = this.inicioDelDia(new Date());

  ngOnInit(): void {
    this.cargarLotes();
  }

  // =====================================================
  // CARGA (solo lectura)
  // =====================================================

  cargarLotes(): void {
    this.loading = true;
    this.error = false;

    this.loteService.gets()
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: lotes => {
          this.lotes = lotes
            .filter(l =>
              Number(l.idSucursal) === this.data.sucursalId &&
              Number(l.idProducto) === this.data.producto.id
            )
            // Mismo orden en que se venden: primero los que vencen antes (FEFO).
            .sort((a, b) =>
              this.tiempo(a.fechaVencimiento) - this.tiempo(b.fechaVencimiento) ||
              a.id - b.id
            );
        },
        error: () => {
          this.lotes = [];
          this.error = true;
        }
      });
  }

  // =====================================================
  // RESUMEN
  // =====================================================

  get totalDisponible(): number {
    return this.lotes.reduce((total, l) => total + (Number(l.cantidadDisponible) || 0), 0);
  }

  get lotesConStock(): number {
    return this.lotes.filter(l => l.cantidadDisponible > 0).length;
  }

  get proximoVencimiento(): Lote | null {
    return this.lotes.find(l =>
      l.cantidadDisponible > 0 &&
      this.fecha(l.fechaVencimiento) !== null &&
      this.estado(l) !== 'VENCIDO'
    ) ?? null;
  }

  get lotesEnRiesgo(): number {
    return this.lotes.filter(l => {
      const estado = this.estado(l);
      return estado === 'VENCIDO' || estado === 'POR_VENCER';
    }).length;
  }

  // =====================================================
  // ESTADO DE CADA LOTE
  // =====================================================

  estado(lote: Lote): EstadoLote {
    if (!(lote.cantidadDisponible > 0)) {
      return 'AGOTADO';
    }

    const dias = this.diasParaVencer(lote);

    if (dias === null) return 'VIGENTE';
    if (dias < 0) return 'VENCIDO';
    if (dias <= DIAS_ALERTA) return 'POR_VENCER';
    return 'VIGENTE';
  }

  textoEstado(lote: Lote): string {
    const dias = this.diasParaVencer(lote);

    switch (this.estado(lote)) {
      case 'AGOTADO': return 'Agotado';
      case 'VENCIDO': return 'Vencido';
      case 'POR_VENCER': return dias === 0 ? 'Vence hoy' : `Vence en ${dias} ${dias === 1 ? 'día' : 'días'}`;
      default: return 'Vigente';
    }
  }

  claseEstado(lote: Lote): string {
    switch (this.estado(lote)) {
      case 'AGOTADO': return 'neutral';
      case 'VENCIDO': return 'danger';
      case 'POR_VENCER': return 'warning';
      default: return 'success';
    }
  }

  porcentajeDisponible(lote: Lote): number {
    return lote.cantidadInicial > 0
      ? Math.min((lote.cantidadDisponible / lote.cantidadInicial) * 100, 100)
      : 0;
  }

  diasParaVencer(lote: Lote): number | null {
    const vence = this.fecha(lote.fechaVencimiento);

    if (!vence) return null;

    return Math.round((vence.getTime() - this.hoy.getTime()) / 86_400_000);
  }

  // =====================================================
  // FECHAS
  // =====================================================

  /** Interpreta 'yyyy-MM-dd' como fecha local (sin desfase de zona horaria). */
  fecha(valor: Date | string | null | undefined): Date | null {
    if (!valor) return null;

    if (typeof valor === 'string') {
      const [anio, mes, dia] = valor.substring(0, 10).split('-').map(Number);
      if (!anio || !mes || !dia) return null;
      return new Date(anio, mes - 1, dia);
    }

    return this.inicioDelDia(valor);
  }

  private tiempo(valor: Date | string | null | undefined): number {
    return this.fecha(valor)?.getTime() ?? Number.MAX_SAFE_INTEGER;
  }

  private inicioDelDia(fecha: Date): Date {
    return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  }

  cerrar(): void {
    this.dialogRef.close();
  }
}
