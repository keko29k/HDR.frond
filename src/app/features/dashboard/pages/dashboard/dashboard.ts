import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReporteService } from '../../../reportes/services/reporte';
import { ReporteGeneral, ReporteVentaDia } from '../../../reportes/models/reporte-general.model';
import { VentaService } from '../../../ventas/services/venta';
import { Venta } from '../../../ventas/models/venta.model';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { Sucursal } from '../../../sucursales/models/sucursal.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './dashboard.css'
  ]
})
export class DashboardComponent implements OnInit {

  private readonly reporteService = inject(ReporteService);
  private readonly ventaService = inject(VentaService);
  private readonly sucursalService = inject(SucursalService);
  private readonly router = inject(Router);

  // =====================================
  // ESTADO
  // =====================================

  /** Últimos 30 días: gráfico, productos, métodos y alertas. */
  periodo: ReporteGeneral | null = null;
  hoy: ReporteGeneral | null = null;
  mes: ReporteGeneral | null = null;
  mesAnterior: ReporteGeneral | null = null;
  ultimasVentas: Venta[] = [];

  sucursales: Sucursal[] = [];
  /** 0 = todas las sucursales. */
  idSucursal = 0;

  loading = false;
  error = false;

  readonly fechaHoy = new Date();
  nombreUsuario = '';

  ngOnInit(): void {
    this.nombreUsuario = this.leerNombreUsuario();

    this.sucursalService.gets().subscribe({
      next: sucursales => this.sucursales = sucursales,
      error: () => this.sucursales = []
    });

    this.cargar();
  }

  // =====================================
  // CARGA (solo lectura)
  // =====================================

  cargar(): void {
    const hoy = new Date();
    const hace29 = new Date(hoy);
    hace29.setDate(hoy.getDate() - 29);

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
    // Mismo tramo del mes anterior (1 al día de hoy) para comparar de forma justa.
    const ultimoMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0).getDate();
    const finMesAnterior = new Date(
      hoy.getFullYear(),
      hoy.getMonth() - 1,
      Math.min(hoy.getDate(), ultimoMesAnterior)
    );

    const f = (d: Date) => this.formatoFecha(d);
    const suc = this.idSucursal || null;

    this.loading = true;
    this.error = false;

    forkJoin({
      periodo: this.reporteService.getReporteGeneral(f(hace29), f(hoy), suc),
      hoy: this.reporteService.getReporteGeneral(f(hoy), f(hoy), suc),
      mes: this.reporteService.getReporteGeneral(f(inicioMes), f(hoy), suc),
      mesAnterior: this.reporteService
        .getReporteGeneral(f(inicioMesAnterior), f(finMesAnterior), suc)
        .pipe(catchError(() => of(null))),
      ventas: this.ventaService
        .getAll({ pageNumber: 1, pageSize: 6, buscar: '' })
        .pipe(catchError(() => of(null)))
    })
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: res => {
          this.periodo = res.periodo;
          this.hoy = res.hoy;
          this.mes = res.mes;
          this.mesAnterior = res.mesAnterior;
          this.ultimasVentas = res.ventas?.data ?? [];
        },
        error: () => {
          this.error = true;
        }
      });
  }

  // =====================================
  // INDICADORES
  // =====================================

  get fechaLarga(): string {
    return new Intl.DateTimeFormat('es-BO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(this.fechaHoy);
  }

  get saludo(): string {
    const hora = this.fechaHoy.getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
  }

  /** Variación % de ventas del mes frente al mismo tramo del mes anterior. */
  get variacionMes(): number | null {
    const actual = this.mes?.resumen.totalVentas ?? 0;
    const anterior = this.mesAnterior?.resumen.totalVentas ?? 0;

    if (!this.mesAnterior || anterior === 0) return null;

    return ((actual - anterior) / anterior) * 100;
  }

  get totalAlertas(): number {
    if (!this.periodo) return 0;

    return this.periodo.cuentasPorCobrar.creditosVencidos +
      this.periodo.inventario.productosStockBajo +
      this.periodo.inventario.lotesPorVencer;
  }

  // =====================================
  // GRÁFICO
  // =====================================

  get dias(): ReporteVentaDia[] {
    return this.periodo?.ventasPorDia ?? [];
  }

  get maxDia(): number {
    return Math.max(...this.dias.map(d => d.total), 0);
  }

  get promedioDiario(): number {
    return this.dias.length
      ? this.dias.reduce((s, d) => s + d.total, 0) / this.dias.length
      : 0;
  }

  altoBarra(dia: ReporteVentaDia): number {
    const max = this.maxDia;
    return max > 0 ? Math.max((dia.total / max) * 100, dia.total > 0 ? 2 : 0) : 0;
  }

  get altoPromedio(): number {
    return this.maxDia > 0 ? (this.promedioDiario / this.maxDia) * 100 : 0;
  }

  // =====================================
  // DISTRIBUCIONES
  // =====================================

  get totalMetodos(): number {
    return (this.periodo?.ventasPorMetodo ?? []).reduce((s, m) => s + m.monto, 0);
  }

  /** Segmentos para el gráfico de anillo (stroke-dasharray sobre circunferencia 100). */
  get segmentosMetodo(): { metodo: string; monto: number; pct: number; offset: number; color: string }[] {
    const colores = ['#0b6e55', '#1d5fa8', '#e0a43a', '#8b5cf6', '#94a3b8'];
    const total = this.totalMetodos;
    let acumulado = 0;

    return (this.periodo?.ventasPorMetodo ?? []).map((m, i) => {
      const pct = total > 0 ? (m.monto / total) * 100 : 0;
      const segmento = { metodo: m.metodo, monto: m.monto, pct, offset: -acumulado, color: colores[i % colores.length] };
      acumulado += pct;
      return segmento;
    });
  }

  porcentaje(valor: number, total: number): number {
    return total > 0 ? (valor / total) * 100 : 0;
  }

  // =====================================
  // PRESENTACIÓN
  // =====================================

  fechaTexto(fecha: string): string {
    const [anio, mes, dia] = fecha.substring(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  diaCorto(fecha: string): string {
    return fecha.substring(8, 10);
  }

  iniciales(nombre: string | null | undefined): string {
    const partes = (nombre ?? '').trim().split(/\s+/).filter(Boolean);
    return partes.length
      ? partes.slice(0, 2).map(p => p[0].toUpperCase()).join('')
      : 'CF';
  }

  estadoVenta(venta: Venta): { texto: string; clase: string } {
    if (!venta.acredito) return { texto: 'Contado', clase: 'neutral' };
    if (venta.saldoPendiente > 0) return { texto: 'Crédito pendiente', clase: 'danger' };
    return { texto: 'Crédito pagado', clase: 'success' };
  }

  ir(ruta: string): void {
    this.router.navigate([ruta]);
  }

  // =====================================
  // UTILIDADES
  // =====================================

  private formatoFecha(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private leerNombreUsuario(): string {
    try {
      const datos = JSON.parse(localStorage.getItem('usuario') ?? 'null') as { nombreUsuario?: string } | null;
      return (datos?.nombreUsuario ?? '').trim().split(/\s+/)[0] ?? '';
    } catch {
      return '';
    }
  }
}
