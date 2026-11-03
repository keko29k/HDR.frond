import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationService } from '../../../../core/services/notification.service';
import { VentaService } from '../../services/venta';
import { VentaVista } from '../../models/venta-vista.model';
import { bs, escaparHtml, fechaCorta, fechaHora, imprimirHtml } from '../../../../shared/utils/impresion';

/** Resultado al cerrar: 'abonar' pide abrir el registro de abono. */
export type VentaDetalleResultado = 'abonar' | undefined;

@Component({
  selector: 'app-venta-detalle-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatProgressSpinnerModule],
  templateUrl: './venta-detalle-dialog.html',
  styleUrls: [
    '../../../../shared/styles/detalle-dialog.css',
    './venta-detalle-dialog.css'
  ]
})
export class VentaDetalleDialog implements OnInit {

  private readonly ventaService = inject(VentaService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialogRef = inject(MatDialogRef<VentaDetalleDialog, VentaDetalleResultado>);
  readonly idVenta = inject<number>(MAT_DIALOG_DATA);

  venta: VentaVista | null = null;
  loading = false;
  error = false;

  readonly fechaCorta = fechaCorta;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = false;

    this.ventaService.getDetalle(this.idVenta)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: venta => this.venta = venta,
        error: () => this.error = true
      });
  }

  // =====================================
  // PRESENTACIÓN
  // =====================================

  get estado(): { texto: string; clase: string } {
    const v = this.venta;
    if (!v) return { texto: '', clase: 'neutral' };
    if ((v.estadoVenta ?? '').toUpperCase() === 'ANULADA') return { texto: 'Anulada', clase: 'neutral' };
    if (!v.acredito) return { texto: 'Contado', clase: 'neutral' };
    if (v.saldoPendiente > 0) return { texto: 'Crédito pendiente', clase: 'danger' };
    return { texto: 'Crédito pagado', clase: 'success' };
  }

  get unidades(): number {
    return (this.venta?.items ?? []).reduce((s, i) => s + i.cantidad, 0);
  }

  get creditoVencido(): boolean {
    const v = this.venta;
    if (!v?.acredito || v.saldoPendiente <= 0 || !v.fechaLimitePago) return false;
    const hoy = new Date();
    const hoyTexto = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
    return v.fechaLimitePago.substring(0, 10) < hoyTexto;
  }

  iconoMetodo(metodo: string): string {
    const valor = (metodo ?? '').toUpperCase();
    if (valor === 'QR') return 'qr_code_2';
    if (valor === 'EFECTIVO') return 'payments';
    return 'receipt';
  }

  /** Pagos registrados junto con la venta (hasta 2 min después) vs. abonos posteriores. */
  esAbono(fechaPago: string): boolean {
    if (!this.venta) return false;
    const diferencia = new Date(fechaPago).getTime() - new Date(this.venta.fechaVenta).getTime();
    return diferencia > 2 * 60 * 1000;
  }

  // =====================================
  // ACCIONES
  // =====================================

  abonar(): void {
    this.dialogRef.close('abonar');
  }

  cerrar(): void {
    this.dialogRef.close();
  }

  reimprimir(): void {
    const v = this.venta;
    if (!v) return;

    const filas = v.items.map(i => `
      <tr>
        <td class="producto">
          ${escaparHtml(i.producto)}
          <small>${i.cantidad} x ${bs(i.precioVenta)}${i.numeroLote ? ' · Lote ' + escaparHtml(i.numeroLote) : ''}</small>
        </td>
        <td class="importe">${bs(i.subTotal)}</td>
      </tr>`).join('');

    const pagos = v.pagos.map(p => `
      <div class="linea"><span>${fechaHora(p.fecha)} · ${escaparHtml(p.metodoPago)}</span><strong>${bs(p.monto)}</strong></div>`).join('');

    const credito = v.acredito
      ? `<div class="linea"><span>Saldo pendiente</span><strong>${bs(v.saldoPendiente)}</strong></div>
         ${v.fechaLimitePago && v.saldoPendiente > 0 ? `<div class="linea"><span>Fecha límite</span><strong>${fechaCorta(v.fechaLimitePago)}</strong></div>` : ''}`
      : '';

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>Comprobante de venta #${v.id}</title>
      <style>
        @page { size: 80mm auto; margin: 4mm; }
        * { box-sizing: border-box; }
        body { width: 72mm; margin: 0 auto; color: #111; font-family: Arial, sans-serif; font-size: 11px; }
        .center { text-align: center; }
        h1 { margin: 0 0 4px; font-size: 19px; letter-spacing: 1px; }
        .sub { font-size: 10px; margin-bottom: 4px; }
        .copia { display: inline-block; margin-top: 4px; padding: 2px 6px; border: 1px solid #111; font-size: 9px; font-weight: bold; }
        .sep { margin: 9px 0; border-top: 1px dashed #555; }
        .linea { display: flex; justify-content: space-between; gap: 8px; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 5px 0; border-bottom: 1px solid #333; text-align: left; }
        td { padding: 6px 0; vertical-align: top; }
        .producto { width: 65%; overflow-wrap: anywhere; }
        .producto small { display: block; margin-top: 3px; font-size: 9px; }
        .importe { text-align: right; white-space: nowrap; }
        .total { margin-top: 8px; font-size: 17px; font-weight: bold; }
        .msg { margin-top: 15px; text-align: center; font-size: 10px; }
      </style></head><body>
      <div class="center">
        <h1>HEREDEROS DEL REY</h1>
        <div class="sub">COMPROBANTE DE VENTA</div>
        <span class="copia">REIMPRESIÓN</span>
      </div>
      <div class="sep"></div>
      <div class="linea"><span>Venta:</span><strong>#${v.id}</strong></div>
      <div class="linea"><span>Fecha:</span><strong>${fechaHora(v.fechaVenta)}</strong></div>
      <div class="linea"><span>Sucursal:</span><strong>${escaparHtml(v.sucursal)}</strong></div>
      <div class="linea"><span>Cliente:</span><strong>${escaparHtml(v.cliente)}</strong></div>
      ${v.clienteDocumento ? `<div class="linea"><span>NIT/CI:</span><strong>${escaparHtml(v.clienteDocumento)}</strong></div>` : ''}
      <div class="linea"><span>Vendedor:</span><strong>${escaparHtml(v.vendedor)}</strong></div>
      <div class="sep"></div>
      <table><thead><tr><th>Producto</th><th style="text-align:right">Importe</th></tr></thead><tbody>${filas}</tbody></table>
      <div class="sep"></div>
      <div class="linea"><span>Unidades:</span><strong>${this.unidades}</strong></div>
      <div class="linea total"><span>TOTAL</span><strong>${bs(v.total)}</strong></div>
      <div class="sep"></div>
      <div class="linea"><span>Tipo de venta:</span><strong>${v.acredito ? 'CRÉDITO' : 'CONTADO'}</strong></div>
      ${pagos ? `<div style="margin-top:6px;font-weight:bold">Pagos</div>${pagos}` : ''}
      <div class="linea"><span>Total pagado</span><strong>${bs(v.montoPagado)}</strong></div>
      ${credito}
      ${v.observacion ? `<div style="margin-top:8px"><strong>Observación:</strong> ${escaparHtml(v.observacion)}</div>` : ''}
      <div class="sep"></div>
      <div class="msg">¡Gracias por su compra!<br>HEREDEROS DEL REY</div>
      </body></html>`;

    if (!imprimirHtml(html, 420, 700)) {
      this.notificationService.error('El navegador bloqueó la ventana de impresión. Permite las ventanas emergentes.');
    }
  }
}
