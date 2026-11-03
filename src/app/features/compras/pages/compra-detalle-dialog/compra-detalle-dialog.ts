import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationService } from '../../../../core/services/notification.service';
import { CompraService } from '../../services/compra';
import { CompraVista } from '../../models/compra-vista.model';
import { bs, escaparHtml, fechaCorta, imprimirHtml } from '../../../../shared/utils/impresion';

@Component({
  selector: 'app-compra-detalle-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './compra-detalle-dialog.html',
  styleUrls: ['../../../../shared/styles/detalle-dialog.css']
})
export class CompraDetalleDialog implements OnInit {

  private readonly compraService = inject(CompraService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<CompraDetalleDialog>);
  readonly idCompra = inject<number>(MAT_DIALOG_DATA);

  compra: CompraVista | null = null;
  loading = false;
  error = false;

  readonly fechaCorta = fechaCorta;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = false;

    this.compraService.getDetalle(this.idCompra)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: compra => this.compra = compra,
        error: () => this.error = true
      });
  }

  get unidades(): number {
    return (this.compra?.items ?? []).reduce((s, i) => s + i.cantidad, 0);
  }

  get conLotes(): number {
    return (this.compra?.items ?? []).filter(i => i.numeroLote).length;
  }

  get claseEstado(): string {
    const valor = (this.compra?.estadoCompra ?? '').trim().toUpperCase();
    if (['ANULADA', 'CANCELADA', 'RECHAZADA'].includes(valor)) return 'danger';
    if (['PENDIENTE', 'BORRADOR'].includes(valor)) return 'warning';
    if (['REGISTRADA', 'COMPLETADA', 'RECIBIDA', 'PAGADA'].includes(valor)) return 'success';
    return 'neutral';
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  imprimir(): void {
    const c = this.compra;
    if (!c) return;

    const filas = c.items.map(i => `
      <tr>
        <td>${escaparHtml(i.codigo)}</td>
        <td>${escaparHtml(i.producto)}</td>
        <td>${i.numeroLote ? escaparHtml(i.numeroLote) : '—'}</td>
        <td>${i.fechaVencimiento ? fechaCorta(i.fechaVencimiento) : '—'}</td>
        <td class="n">${i.cantidad}</td>
        <td class="n">${bs(i.precioCompra)}</td>
        <td class="n">${bs(i.subTotal)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>Compra #${c.id}</title>
      <style>
        body { margin: 28px; color: #12201c; font-family: Arial, sans-serif; font-size: 12px; }
        .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
        h1 { margin: 0; font-size: 20px; }
        .muted { color: #62736d; }
        .doc { text-align: right; }
        .doc strong { display: block; font-size: 18px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; margin: 20px 0; padding: 14px; border: 1px solid #dfe7e4; border-radius: 8px; }
        .grid span { display: block; color: #62736d; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 7px 8px; border-bottom: 1px solid #dfe7e4; text-align: left; }
        th { background: #f3f6f5; font-size: 11px; text-transform: uppercase; }
        .n { text-align: right; white-space: nowrap; }
        .totals { width: 280px; margin: 16px 0 0 auto; }
        .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
        .totals .grand { margin-top: 6px; padding-top: 8px; border-top: 2px solid #12201c; font-size: 16px; font-weight: bold; }
        .obs { margin-top: 18px; padding: 10px 12px; background: #f3f6f5; border-radius: 6px; }
        .firmas { display: flex; justify-content: space-around; margin-top: 60px; }
        .firmas div { width: 200px; padding-top: 6px; border-top: 1px solid #12201c; text-align: center; font-size: 11px; }
      </style></head><body>
      <div class="head">
        <div>
          <h1>Herederos del Rey</h1>
          <div class="muted">Registro de compra · ${escaparHtml(c.sucursal)}</div>
        </div>
        <div class="doc">
          <span class="muted">Compra</span>
          <strong>#${c.id}</strong>
          <span>${fechaCorta(c.fechaCompra)}</span>
        </div>
      </div>
      <div class="grid">
        <div><span>Proveedor</span><strong>${escaparHtml(c.proveedor)}</strong>${c.proveedorNit ? ` · NIT ${escaparHtml(c.proveedorNit)}` : ''}</div>
        <div><span>Documento</span><strong>${escaparHtml(c.tipoDocumento)}${c.numeroDocumento ? ' N.º ' + escaparHtml(c.numeroDocumento) : ''}</strong></div>
        <div><span>Registrado por</span><strong>${escaparHtml(c.usuario)}</strong></div>
        <div><span>Estado</span><strong>${escaparHtml(c.estadoCompra)}</strong></div>
      </div>
      <table>
        <thead><tr><th>Código</th><th>Producto</th><th>Lote</th><th>Vence</th><th class="n">Cant.</th><th class="n">Costo</th><th class="n">Subtotal</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>${bs(c.subTotal)}</span></div>
        <div><span>Descuento</span><span>− ${bs(c.descuento)}</span></div>
        <div><span>Impuesto</span><span>${bs(c.impuesto)}</span></div>
        <div class="grand"><span>TOTAL</span><span>${bs(c.total)}</span></div>
      </div>
      ${c.observacion ? `<div class="obs"><strong>Observación:</strong> ${escaparHtml(c.observacion)}</div>` : ''}
      <div class="firmas"><div>Entregado por</div><div>Recibido por</div></div>
      <p class="muted" style="margin-top:24px">Impreso el ${new Date().toLocaleString('es-BO')}</p>
      </body></html>`;

    if (!imprimirHtml(html)) {
      this.notificationService.error('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.');
    }
  }
}
