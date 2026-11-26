import { Component, OnInit, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';

import { esAdministrador, idSucursalDeSesion } from '../../../core/services/permisos';
import { Sucursal } from '../../../features/sucursales/models/sucursal.model';
import { SucursalService } from '../../../features/sucursales/services/sucursal';

/**
 * Filtro de sucursal para los listados.
 *  - Administrador: elige "Todas las sucursales" o una en particular.
 *  - Vendedor: ve fija su sucursal (el backend igual filtra por su token).
 *
 * Emite `cambio` con el id elegido (null = todas) solo cuando el
 * administrador cambia la selección.
 */
@Component({
  selector: 'app-filtro-sucursal',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatIconModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" subscriptSizing="dynamic" class="filtro-sucursal">
      <mat-label>Sucursal</mat-label>
      <mat-icon matPrefix>storefront</mat-icon>
      <mat-select
        [(ngModel)]="seleccion"
        [disabled]="!esAdmin"
        (selectionChange)="cambio.emit(seleccion || null)"
        aria-label="Sucursal">
        @if (esAdmin) {
          <mat-option [value]="0">Todas las sucursales</mat-option>
        }
        @for (s of sucursales; track s.id) {
          <mat-option [value]="s.id">{{ s.nombre }}</mat-option>
        }
      </mat-select>
    </mat-form-field>
  `,
  styles: `
    :host { display: block; }
    .filtro-sucursal { width: 100%; min-width: 210px; }
  `
})
export class FiltroSucursalComponent implements OnInit {
  private readonly sucursalService = inject(SucursalService);

  readonly cambio = output<number | null>();

  readonly esAdmin = esAdministrador();

  /** 0 = todas las sucursales. */
  seleccion = this.esAdmin ? 0 : idSucursalDeSesion();

  sucursales: Sucursal[] = [];

  ngOnInit(): void {
    this.sucursalService.gets().subscribe({
      next: sucursales => {
        this.sucursales = this.esAdmin
          ? sucursales
          : sucursales.filter(s => s.id === this.seleccion);
      },
      error: () => this.sucursales = []
    });
  }
}
