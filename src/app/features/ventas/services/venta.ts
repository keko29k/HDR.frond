
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { QueryFilter } from '../../../core/models/query-filter.model';
import { ApiResponse } from '../../../core/models/api-response.model';

import { Venta } from '../models/venta.model';
import { VentaCreate } from '../models/venta-create.model';
import { VentaUpdate } from '../models/venta-update.model';
import { VentaDetalleDto } from '../models/VentaDetalle.model';
import { VentaVista } from '../models/venta-vista.model';

// DTO PARA REGISTRAR ABONOS A CRÉDITO
export interface RegistrarAbonoCreditoDto {
  monto: number;
  metodoPago: 'EFECTIVO' | 'QR';
  referencia?: string;
  observacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VentaService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/Venta`;

  // ==========================================
  // OBTENER VENTAS PAGINADAS
  // ==========================================
  getAll(filter: QueryFilter): Observable<ApiResponse<Venta[]>> {

    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber)
      .set('PageSize', filter.pageSize)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<Venta[]>>(
      `${this.apiUrl}/paginacion`,
      { params }
    );
  }

  // ==========================================
  // OBTENER VENTA POR ID
  // ==========================================
  getById(id: number): Observable<Venta> {

    return this.http.get<Venta>(
      `${this.apiUrl}/${id}`
    );
  }

  // ==========================================
  // DETALLE COMPLETO (productos, lotes y pagos)
  // ==========================================
  getDetalle(id: number): Observable<VentaVista> {

    return this.http.get<VentaVista>(
      `${this.apiUrl}/${id}/detalle`
    );
  }

  // ==========================================
  // REGISTRAR VENTA
  // ==========================================
  create(data: VentaCreate): Observable<Venta> {

    return this.http.post<Venta>(
      this.apiUrl,
      data
    );
  }

  // ==========================================
  // ACTUALIZAR VENTA
  // ==========================================
  update(id: number, data: VentaUpdate): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      data
    );
  }

  // ==========================================
  // ELIMINAR VENTA
  // ==========================================
  delete(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }

  // ==========================================
  // REGISTRAR VENTA CON DETALLE
  // ==========================================
  ventaDetalle(dto: VentaDetalleDto): Observable<{
    message: string;
    idVenta: number;
  }> {

    return this.http.post<{
      message: string;
      idVenta: number;
    }>(
      `${this.apiUrl}/venta-detalle`,
      dto
    );
  }

  // ==========================================
  // REGISTRAR ABONO DE CRÉDITO
  // ==========================================
  registrarAbonoCredito(
    idVenta: number,
    dto: RegistrarAbonoCreditoDto
  ): Observable<{ mensaje: string }> {

    return this.http.post<{ mensaje: string }>(
      `${this.apiUrl}/${idVenta}/abonar-credito`,
      dto
    );
  }

}
