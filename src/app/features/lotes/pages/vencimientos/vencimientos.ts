import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LoteService } from '../../services/lote';
import { LoteVencimiento, NivelVencimiento, nivelVencimiento } from '../../models/lote-vencimiento.model';
import { SucursalService } from '../../../sucursales/services/sucursal';
import { Sucursal } from '../../../sucursales/models/sucursal.model';
import { Producto } from '../../../productos/models/producto.model';
import {
  LotesProductoDialog,
  LotesProductoDialogData
} from '../../../inventarioSucursales/pages/lotes-producto-dialog/lotes-producto-dialog';
import { RetirarLoteDialog } from '../retirar-lote-dialog/retirar-lote-dialog';
import { NotificationService } from '../../../../core/services/notification.service';

interface NivelInfo {
  id: NivelVencimiento;
  titulo: string;
  singular: string;
  descripcion: string;
  icono: string;
  accion: string;
  clase: string;
}

interface ResumenNivel {
  lotes: number;
  unidades: number;
  valor: number;
}

interface GrupoProducto {
  idProducto: number;
  producto: string;
  codigo: string;
  sucursales: string[];
  lotes: LoteVencimiento[];
  unidades: number;
  valorCosto: number;
  diasMinimo: number;
  nivel: NivelVencimiento;
}

@Component({
  selector: 'app-vencimientos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule
  ],
  templateUrl: './vencimientos.html',
  styleUrls: [
    '../../../../shared/styles/operaciones.css',
    './vencimientos.css'
  ]
})
export class VencimientosComponent implements OnInit {

  private readonly loteService = inject(LoteService);
  private readonly sucursalService = inject(SucursalService);
  private readonly dialog = inject(MatDialog);
  private readonly notificationService = inject(NotificationService);

  readonly niveles: NivelInfo[] = [
    { id: 'VENCIDO', titulo: 'Vencidos', singular: 'Vencido', descripcion: 'Ya pasó la fecha', icono: 'dangerous', accion: 'Retirar del inventario', clase: 'vencido' },
    { id: 'CRITICO', titulo: 'Críticos', singular: 'Crítico', descripcion: 'Vencen en 7 días o menos', icono: 'priority_high', accion: 'Vender ya / ofertar', clase: 'critico' },
    { id: 'ALERTA', titulo: 'En alerta', singular: 'En alerta', descripcion: 'Vencen en 8 a 30 días', icono: 'warning', accion: 'Promocionar', clase: 'alerta' },
    { id: 'PROXIMO', titulo: 'Próximos', singular: 'Próximo', descripcion: 'Vencen después de 30 días', icono: 'schedule', accion: 'Vender primero (FEFO)', clase: 'proximo' }
  ];

  readonly horizontes = [30, 60, 90, 180, 365];

  // Filtros
  horizonte = 90;
  idSucursal = 0;
  nivelFiltro: NivelVencimiento | null = null;
  buscar = '';
  vista: 'lote' | 'producto' = 'lote';

  // Datos
  lotes: LoteVencimiento[] = [];
  sucursales: Sucursal[] = [];

  loading = false;
  error = false;

  ngOnInit(): void {
    this.sucursalService.gets().subscribe({
      next: sucursales => this.sucursales = sucursales,
      error: () => this.sucursales = []
    });

    this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.error = false;

    this.loteService.getVencimientos(this.idSucursal || null, this.horizonte)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: lotes => this.lotes = lotes,
        error: () => {
          this.lotes = [];
          this.error = true;
        }
      });
  }

  // =====================================
  // CLASIFICACIÓN
  // =====================================

  nivel(lote: LoteVencimiento): NivelVencimiento {
    return nivelVencimiento(lote.diasRestantes);
  }

  info(nivel: NivelVencimiento): NivelInfo {
    return this.niveles.find(n => n.id === nivel)!;
  }

  resumen(nivel: NivelVencimiento): ResumenNivel {
    return this.lotes
      .filter(l => this.nivel(l) === nivel)
      .reduce<ResumenNivel>(
        (r, l) => ({
          lotes: r.lotes + 1,
          unidades: r.unidades + l.cantidadDisponible,
          valor: r.valor + l.valorCosto
        }),
        { lotes: 0, unidades: 0, valor: 0 }
      );
  }

  get valorEnRiesgo(): number {
    return this.lotes
      .filter(l => this.nivel(l) !== 'PROXIMO')
      .reduce((s, l) => s + l.valorCosto, 0);
  }

  toggleNivel(nivel: NivelVencimiento): void {
    this.nivelFiltro = this.nivelFiltro === nivel ? null : nivel;
  }

  // =====================================
  // LISTAS FILTRADAS
  // =====================================

  get lotesFiltrados(): LoteVencimiento[] {
    const texto = this.buscar.trim().toLowerCase();

    return this.lotes.filter(l =>
      (!this.nivelFiltro || this.nivel(l) === this.nivelFiltro) &&
      (!texto ||
        l.producto.toLowerCase().includes(texto) ||
        l.codigo.toLowerCase().includes(texto) ||
        l.numeroLote.toLowerCase().includes(texto))
    );
  }

  get productos(): GrupoProducto[] {
    const grupos = new Map<number, GrupoProducto>();

    for (const l of this.lotesFiltrados) {
      let g = grupos.get(l.idProducto);

      if (!g) {
        g = {
          idProducto: l.idProducto,
          producto: l.producto,
          codigo: l.codigo,
          sucursales: [],
          lotes: [],
          unidades: 0,
          valorCosto: 0,
          diasMinimo: l.diasRestantes,
          nivel: this.nivel(l)
        };
        grupos.set(l.idProducto, g);
      }

      g.lotes.push(l);
      g.unidades += l.cantidadDisponible;
      g.valorCosto += l.valorCosto;

      if (!g.sucursales.includes(l.sucursal)) {
        g.sucursales.push(l.sucursal);
      }

      if (l.diasRestantes < g.diasMinimo) {
        g.diasMinimo = l.diasRestantes;
        g.nivel = this.nivel(l);
      }
    }

    return [...grupos.values()].sort((a, b) => a.diasMinimo - b.diasMinimo);
  }

  // =====================================
  // PRESENTACIÓN
  // =====================================

  textoDias(dias: number): string {
    if (dias < 0) {
      const d = Math.abs(dias);
      return `Venció hace ${d} ${d === 1 ? 'día' : 'días'}`;
    }
    if (dias === 0) return 'Vence hoy';
    if (dias === 1) return 'Vence mañana';
    return `Vence en ${dias} días`;
  }

  /** Barra de cuenta regresiva: llena = urgente. */
  urgencia(dias: number): number {
    if (dias <= 0) return 100;
    return Math.max(4, 100 - (dias / this.horizonte) * 100);
  }

  porcentajeRestante(lote: LoteVencimiento): number {
    return lote.cantidadInicial > 0
      ? Math.min((lote.cantidadDisponible / lote.cantidadInicial) * 100, 100)
      : 0;
  }

  fechaTexto(fecha: string | null): string {
    if (!fecha) return '—';
    const [anio, mes, dia] = fecha.substring(0, 10).split('-');
    return `${dia}/${mes}/${anio}`;
  }

  limpiarFiltros(): void {
    this.buscar = '';
    this.nivelFiltro = null;
  }

  // =====================================
  // ACCIONES
  // =====================================

  verLotes(idProducto: number, producto: string, codigo: string, idSucursal: number, sucursal: string): void {
    this.dialog.open<LotesProductoDialog, LotesProductoDialogData>(LotesProductoDialog, {
      width: '860px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        // El diálogo solo usa id, nombre y código del producto.
        producto: { id: idProducto, nombre: producto, codigo } as Producto,
        sucursalId: idSucursal,
        sucursalNombre: sucursal
      }
    });
  }

  retirar(lote: LoteVencimiento): void {
    this.dialog
      .open<RetirarLoteDialog, LoteVencimiento, boolean>(RetirarLoteDialog, {
        width: '480px',
        maxWidth: '95vw',
        autoFocus: 'input',
        data: lote
      })
      .afterClosed()
      .subscribe(retirado => {
        if (retirado) {
          this.notificationService.success(`Lote ${lote.numeroLote} retirado del inventario.`);
          this.cargar();
        }
      });
  }

  exportarCsv(): void {
    const filas: (string | number)[][] = [
      ['Estado', 'Producto', 'Código', 'Lote', 'Sucursal', 'Vencimiento', 'Días restantes',
        'Disponible', 'Costo unit. (Bs)', 'Valor a costo (Bs)', 'Valor a venta (Bs)', 'Acción sugerida'],
      ...this.lotesFiltrados.map(l => {
        const info = this.info(this.nivel(l));
        return [
          info.titulo, l.producto, l.codigo, l.numeroLote, l.sucursal, l.fechaVencimiento,
          l.diasRestantes, l.cantidadDisponible, l.costoCompra, l.valorCosto, l.valorVenta, info.accion
        ];
      })
    ];

    const celda = (v: string | number) => {
      const texto = typeof v === 'number' ? String(v).replace('.', ',') : v;
      return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
    };

    const csv = filas.map(f => f.map(celda).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `vencimientos_${new Date().toISOString().substring(0, 10)}.csv`;
    enlace.click();
    URL.revokeObjectURL(url);
  }
}
