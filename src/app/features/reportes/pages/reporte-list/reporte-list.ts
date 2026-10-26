import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ReporteService } from '../../services/reporte';
import { ReporteDto } from '../../models/reporteDto.model';

@Component({
  selector: 'app-reporte-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './reporte-list.html',
  styleUrl: './reporte-list.css',
})
export class ReporteListComponent implements OnInit {

  private reporteService = inject(ReporteService);

  reporte!: ReporteDto;
  loading = false;
  error = '';

  fechaInicial!: Date;
  fechaFinal!: Date;

  displayedColumns: string[] = [
    'nombre',
    'cantidad',
    'precioVenta',
    'precioCompra',
    'precioVentaT',
    'precioCompraT',
    'ganancia',
  ];

  ngOnInit(): void {}

  obtenerReporte(): void {

    if (!this.fechaInicial || !this.fechaFinal) {
      this.error = 'Selecciona ambas fechas';
      return;
    }

    this.loading = true;
    this.error = '';

    this.reporteService.getReporte(this.fechaInicial, this.fechaFinal)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: (data: any) => {

          // 🔥 SI backend devuelve array
          const r = Array.isArray(data) ? data[0] : data;

          this.reporte = {
            fechaInicio: new Date(r.fechaInicio),
            fechaFinal: new Date(r.fechaFinal),
            totalGen: r.totalGen,
            inversionTotal: r.inversionTotal,
            gastoTotal: r.gastoTotal,
            gananciaTotal: r.ganaciaNeta,
            productos: r.productos
          };

          console.log('REPORTE:', this.reporte);
        },
        error: () => {
          this.error = 'No se pudo cargar el reporte';
        }
      });
  }
}