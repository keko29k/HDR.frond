import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  EstadoStockFiltro,
  InventarioSucursal as InventarioSucursalModel,
  InventarioSucursalResumen
} from '../models/inventarioSucursal.model';

@Injectable({
  providedIn: 'root',
})
export class InventarioSucursalService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/InventarioSucursal`;

  getPaginacion(
    idSucursal: number | null,
    pageNumber: number,
    pageSize: number,
    buscar: string,
    estadoStock: EstadoStockFiltro | null
  ): Observable<ApiResponse<InventarioSucursalModel[]>> {
    let params = new HttpParams()
      .set('pageNumber', pageNumber)
      .set('pageSize', pageSize);

    if (idSucursal !== null) {
      params = params.set('idSucursal', idSucursal);
    }
    if (buscar.trim()) {
      params = params.set('buscar', buscar.trim());
    }
    if (estadoStock) {
      params = params.set('estadoStock', estadoStock);
    }

    return this.http.get<ApiResponse<InventarioSucursalModel[]>>(
      `${this.apiUrl}/Paginacion`,
      { params }
    );
  }

  getResumen(idSucursal: number | null): Observable<InventarioSucursalResumen> {
    const params = idSucursal === null
      ? new HttpParams()
      : new HttpParams().set('idSucursal', idSucursal);

    return this.http.get<InventarioSucursalResumen>(`${this.apiUrl}/Resumen`, { params });
  }
}
