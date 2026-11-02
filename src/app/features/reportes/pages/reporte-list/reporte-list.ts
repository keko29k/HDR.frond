import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationService } from '../../../../core/services/notification.service';
import { ReporteService } from '../../services/reporte';
import { ReporteGeneral, ReporteProducto, ReporteVentaDia } from '../../models/reporte-general.model';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { Sucursal } from '../../../sucursales/models/sucursal.model';

type Seccion = 'resumen' | 'productos' | 'compras' | 'creditos' | 'inventario';
type Rango = 'hoy' | 'ayer' | '7dias' | '30dias' | 'mes' | 'mesAnterior' | 'anio' | 'personalizado';
type OrdenProducto = 'ventas' | 'cantidad' | 'utilidad' | 'margen';

@Component({
  selector: 'app-reporte-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reporte-list.html',
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './reporte-list.css'
  ]
})
export class ReporteListComponent implements OnInit {

  private reporteService = inject(ReporteService);
  private sucursalService = inject(SucursalService);
  private notificationService = inject(NotificationService);

  // =====================================
  // FILTROS
  // =====================================

  readonly rangos: { id: Rango; label: string }[] = [
    { id: 'hoy', label: 'Hoy' },
    { id: 'ayer', label: 'Ayer' },
    { id: '7dias', label: '7 días' },
    { id: '30dias', label: '30 días' },
    { id: 'mes', label: 'Este mes' },
    { id: 'mesAnterior', label: 'Mes anterior' },
    { id: 'anio', label: 'Este año' }
  ];

  readonly secciones: { id: Seccion; label: string; icon: string }[] = [
    { id: 'resumen', label: 'Resumen', icon: 'insights' },
    { id: 'productos', label: 'Productos', icon: 'inventory_2' },
    { id: 'compras', label: 'Compras y gastos', icon: 'shopping_cart' },
    { id: 'creditos', label: 'Cuentas por cobrar', icon: 'request_quote' },
    { id: 'inventario', label: 'Inventario', icon: 'warehouse' }
  ];

  rango: Rango = 'mes';
  desde = '';
  hasta = '';
  /** 0 = todas las sucursales. */
  idSucursal = 0;

  sucursales: Sucursal[] = [];

  seccion: Seccion = 'resumen';

  // =====================================
  // ESTADO
  // =====================================

  reporte: ReporteGeneral | null = null;
  loading = false;
  error = '';

  buscarProducto = '';
  ordenProducto: OrdenProducto = 'ventas';

  ngOnInit(): void {
    this.aplicarRango('mes', false);
    this.cargarSucursales();
    this.generar();
  }

  // =====================================
  // CARGA
  // =====================================

  private cargarSucursales(): void {
    this.sucursalService.gets().subscribe({
      next: sucursales => this.sucursales = sucursales,
      error: () => this.sucursales = []
    });
  }

  generar(): void {
    if (!this.desde || !this.hasta) {
      this.error = 'Selecciona la fecha inicial y la fecha final.';
      return;
    }

    if (this.desde > this.hasta) {
      this.error = 'La fecha inicial no puede ser mayor que la fecha final.';
      return;
    }

    this.loading = true;
    this.error = '';

    this.reporteService.getReporteGeneral(this.desde, this.hasta, this.idSucursal || null)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: reporte => this.reporte = reporte,
        error: err => {
          this.reporte = null;
          this.error =
            err?.error?.mensaje ||
            (err?.status === 401
              ? 'Tu sesión expiró. Inicia sesión nuevamente.'
              : 'No se pudo generar el reporte. Verifica la conexión con el servidor.');
          this.notificationService.error(this.error);
        }
      });
  }

  // =====================================
  // RANGOS DE FECHA
  // =====================================

  aplicarRango(rango: Rango, recargar = true): void {
    const hoy = new Date();
    let desde = new Date(hoy);
    let hasta = new Date(hoy);

    switch (rango) {
      case 'ayer':
        desde.setDate(hoy.getDate() - 1);
        hasta = new Date(desde);
        break;
      case '7dias':
        desde.setDate(hoy.getDate() - 6);
        break;
      case '30dias':
        desde.setDate(hoy.getDate() - 29);
        break;
      case 'mes':
        desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        break;
      case 'mesAnterior':
        desde = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        hasta = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
      case 'anio':
        desde = new Date(hoy.getFullYear(), 0, 1);
        break;
    }

    this.rango = rango;
    this.desde = this.formatoFecha(desde);
    this.hasta = this.formatoFecha(hasta);

    if (recargar) {
      this.generar();
    }
  }

  cambioFechaManual(): void {
    this.rango = 'personalizado';
  }

  // =====================================
  // DATOS DERIVADOS
  // =====================================

  get maxVentaDia(): number {
    return Math.max(...(this.reporte?.ventasPorDia ?? []).map(d => d.total), 0);
  }

  altoBarra(dia: ReporteVentaDia): number {
    const max = this.maxVentaDia;
    return max > 0 ? Math.max((dia.total / max) * 100, dia.total > 0 ? 2 : 0) : 0;
  }

  get mejorDia(): ReporteVentaDia | null {
    const dias = this.reporte?.ventasPorDia ?? [];
    return dias.reduce<ReporteVentaDia | null>(
      (mejor, d) => (d.total > (mejor?.total ?? 0) ? d : mejor),
      null
    );
  }

  get productosFiltrados(): ReporteProducto[] {
    const texto = this.buscarProducto.trim().toLowerCase();
    const lista = (this.reporte?.productos ?? []).filter(p =>
      !texto ||
      p.nombre.toLowerCase().includes(texto) ||
      p.codigo.toLowerCase().includes(texto)
    );

    return [...lista].sort((a, b) => b[this.ordenProducto] - a[this.ordenProducto]);
  }

  get totalesProductos() {
    return this.productosFiltrados.reduce(
      (t, p) => ({
        cantidad: t.cantidad + p.cantidad,
        ventas: t.ventas + p.ventas,
        costo: t.costo + p.costo,
        utilidad: t.utilidad + p.utilidad
      }),
      { cantidad: 0, ventas: 0, costo: 0, utilidad: 0 }
    );
  }

  get topProductos(): ReporteProducto[] {
    return (this.reporte?.productos ?? []).slice(0, 5);
  }

  porcentaje(valor: number, total: number): number {
    return total > 0 ? (valor / total) * 100 : 0;
  }

  get totalMetodos(): number {
    return (this.reporte?.ventasPorMetodo ?? []).reduce((s, m) => s + m.monto, 0);
  }

  get totalVendedores(): number {
    return (this.reporte?.ventasPorVendedor ?? []).reduce((s, v) => s + v.total, 0);
  }

  get totalProveedores(): number {
    return (this.reporte?.comprasPorProveedor ?? []).reduce((s, p) => s + p.total, 0);
  }

  get totalGastosConcepto(): number {
    return (this.reporte?.gastosPorConcepto ?? []).reduce((s, g) => s + g.monto, 0);
  }

  iconoMetodo(metodo: string): string {
    const valor = (metodo ?? '').toUpperCase();
    if (valor === 'QR') return 'qr_code_2';
    if (valor === 'EFECTIVO') return 'payments';
    return 'receipt';
  }

  claseMargen(margen: number): string {
    if (margen < 0) return 'danger';
    if (margen < 15) return 'warning';
    return 'success';
  }

  // =====================================
  // EXPORTAR
  // =====================================

  exportarCsv(): void {
    if (!this.reporte) return;

    const r = this.reporte;
    let nombre = 'reporte';
    let filas: (string | number)[][] = [];

    switch (this.seccion) {
      case 'resumen':
        nombre = 'resumen';
        filas = [
          ['Indicador', 'Valor'],
          ['Ventas totales (Bs)', r.resumen.totalVentas],
          ['Cantidad de ventas', r.resumen.cantidadVentas],
          ['Ticket promedio (Bs)', r.resumen.ticketPromedio],
          ['Unidades vendidas', r.resumen.unidadesVendidas],
          ['Costo de lo vendido (Bs)', r.resumen.costoVentas],
          ['Utilidad bruta (Bs)', r.resumen.utilidadBruta],
          ['Margen bruto (%)', r.resumen.margenBruto],
          ['Gastos (Bs)', r.resumen.totalGastos],
          ['Utilidad neta (Bs)', r.resumen.utilidadNeta],
          ['Margen neto (%)', r.resumen.margenNeto],
          ['Total cobrado (Bs)', r.resumen.totalCobrado],
          ['Ventas al contado (Bs)', r.resumen.ventasContado],
          ['Ventas a crédito (Bs)', r.resumen.ventasCredito],
          ['Compras (Bs)', r.resumen.totalCompras],
          [],
          ['Fecha', 'Ventas', 'Total (Bs)', 'Costo (Bs)', 'Utilidad (Bs)'],
          ...r.ventasPorDia.map(d => [d.fecha, d.cantidadVentas, d.total, d.costo, d.utilidad])
        ];
        break;
      case 'productos':
        nombre = 'productos';
        filas = [
          ['Código', 'Producto', 'Cantidad', 'Ventas (Bs)', 'Costo (Bs)', 'Utilidad (Bs)', 'Margen (%)'],
          ...this.productosFiltrados.map(p => [p.codigo, p.nombre, p.cantidad, p.ventas, p.costo, p.utilidad, p.margen])
        ];
        break;
      case 'compras':
        nombre = 'compras-gastos';
        filas = [
          ['Proveedor', 'Compras', 'Total (Bs)'],
          ...r.comprasPorProveedor.map(p => [p.proveedor, p.cantidadCompras, p.total]),
          [],
          ['Concepto de gasto', 'Registros', 'Monto (Bs)'],
          ...r.gastosPorConcepto.map(g => [g.concepto, g.cantidad, g.monto])
        ];
        break;
      case 'creditos':
        nombre = 'cuentas-por-cobrar';
        filas = [
          ['Venta', 'Cliente', 'Fecha venta', 'Total (Bs)', 'Saldo (Bs)', 'Fecha límite', 'Días vencido'],
          ...r.cuentasPorCobrar.creditos.map(c => [
            c.idVenta, c.cliente, c.fechaVenta.substring(0, 10), c.total, c.saldoPendiente, c.fechaLimitePago ?? '', c.diasVencido
          ])
        ];
        break;
      case 'inventario':
        nombre = 'inventario';
        filas = [
          ['Producto', 'Sucursal', 'Stock actual', 'Stock mínimo'],
          ...r.inventario.stockBajo.map(s => [s.producto, s.sucursal, s.stockActual, s.stockMinimo]),
          [],
          ['Producto', 'Lote', 'Sucursal', 'Vencimiento', 'Cantidad', 'Días restantes'],
          ...r.inventario.proximosVencimientos.map(l => [
            l.producto, l.numeroLote, l.sucursal, l.fechaVencimiento, l.cantidadDisponible, l.diasRestantes
          ])
        ];
        break;
    }

    const csv = filas
      .map(fila => fila.map(c => this.celdaCsv(c)).join(';'))
      .join('\r\n');

    // BOM para que Excel reconozca los acentos.
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `reporte-${nombre}_${r.desde}_a_${r.hasta}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  }

  imprimir(): void {
    if (!this.reporte) return;

    const r = this.reporte;
    const ventana = window.open('', '_blank', 'width=900,height=700');

    if (!ventana) {
      this.notificationService.error('El navegador bloqueó la ventana de impresión.');
      return;
    }

    const bs = (v: number) => `Bs ${this.numero(v)}`;
    const esc = (v: string) => (v ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const filasProductos = r.productos.map(p => `
      <tr>
        <td>${esc(p.codigo)}</td><td>${esc(p.nombre)}</td>
        <td class="n">${this.numero(p.cantidad, 0)}</td><td class="n">${bs(p.ventas)}</td>
        <td class="n">${bs(p.costo)}</td><td class="n">${bs(p.utilidad)}</td>
        <td class="n">${this.numero(p.margen)}%</td>
      </tr>`).join('');

    const filasMetodo = r.ventasPorMetodo.map(m => `
      <tr><td>${esc(m.metodo)}</td><td class="n">${m.cantidadPagos}</td><td class="n">${bs(m.monto)}</td></tr>`).join('');

    ventana.document.open();
    ventana.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
      <title>Reporte ${r.desde} a ${r.hasta}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#12201c;margin:24px;font-size:12px}
        h1{margin:0;font-size:20px}h2{margin:22px 0 8px;font-size:14px;color:#0b6e55}
        .meta{color:#62736d;margin-top:4px}
        .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px}
        .kpi{border:1px solid #dfe7e4;border-radius:8px;padding:10px}
        .kpi span{display:block;color:#62736d;font-size:11px}.kpi strong{font-size:15px}
        table{width:100%;border-collapse:collapse}th,td{padding:6px 8px;border-bottom:1px solid #dfe7e4;text-align:left}
        th{background:#f3f6f5;font-size:11px;text-transform:uppercase}.n{text-align:right}
      </style></head><body>
      <h1>Herederos del Rey · Reporte del negocio</h1>
      <div class="meta">Del ${this.fechaTexto(r.desde)} al ${this.fechaTexto(r.hasta)} · ${esc(r.sucursal)}</div>
      <div class="kpis">
        <div class="kpi"><span>Ventas</span><strong>${bs(r.resumen.totalVentas)}</strong></div>
        <div class="kpi"><span>Costo de lo vendido</span><strong>${bs(r.resumen.costoVentas)}</strong></div>
        <div class="kpi"><span>Utilidad bruta</span><strong>${bs(r.resumen.utilidadBruta)}</strong></div>
        <div class="kpi"><span>Gastos</span><strong>${bs(r.resumen.totalGastos)}</strong></div>
        <div class="kpi"><span>Utilidad neta</span><strong>${bs(r.resumen.utilidadNeta)}</strong></div>
        <div class="kpi"><span>Margen neto</span><strong>${this.numero(r.resumen.margenNeto)}%</strong></div>
        <div class="kpi"><span>N.º de ventas</span><strong>${r.resumen.cantidadVentas}</strong></div>
        <div class="kpi"><span>Por cobrar</span><strong>${bs(r.cuentasPorCobrar.totalPendiente)}</strong></div>
      </div>
      <h2>Cobros por método de pago</h2>
      <table><thead><tr><th>Método</th><th class="n">Pagos</th><th class="n">Monto</th></tr></thead>
      <tbody>${filasMetodo || '<tr><td colspan="3">Sin cobros en el periodo</td></tr>'}</tbody></table>
      <h2>Rentabilidad por producto</h2>
      <table><thead><tr><th>Código</th><th>Producto</th><th class="n">Cant.</th><th class="n">Ventas</th>
      <th class="n">Costo</th><th class="n">Utilidad</th><th class="n">Margen</th></tr></thead>
      <tbody>${filasProductos || '<tr><td colspan="7">Sin ventas en el periodo</td></tr>'}</tbody></table>
      <p class="meta">Generado el ${new Date().toLocaleString('es-BO')}</p>
      </body></html>`);
    ventana.document.close();

    setTimeout(() => {
      if (!ventana.closed) {
        ventana.focus();
        ventana.print();
      }
    }, 300);
  }

  // =====================================
  // UTILIDADES
  // =====================================

  fechaTexto(fecha: string): string {
    const [anio, mes, dia] = fecha.substring(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  private formatoFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private numero(valor: number, decimales = 2): string {
    return (valor ?? 0).toLocaleString('es-BO', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  }

  private celdaCsv(valor: string | number | undefined): string {
    if (valor === undefined || valor === null) return '';
    // Separador ';' y coma decimal: formato que Excel en español abre directamente.
    const texto = typeof valor === 'number' ? String(valor).replace('.', ',') : valor;
    return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  }
}
