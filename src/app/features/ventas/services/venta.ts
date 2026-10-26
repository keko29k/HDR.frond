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

@Injectable({
  providedIn: 'root'
})
export class VentaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Venta`;

  getAll(filter: QueryFilter): Observable<ApiResponse<Venta[]>> {
    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber)
      .set('PageSize', filter.pageSize)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<Venta[]>>( `${this.apiUrl}/paginacion`, { params });
  }

  getById(id: number): Observable<Venta> {
    return this.http.get<Venta>(`${this.apiUrl}/${id}`);
  }

  create(data: VentaCreate): Observable<Venta> {
    return this.http.post<Venta>(this.apiUrl, data);
  }

  update(id: number, data: VentaUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  ventaDetalle(dto: VentaDetalleDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/venta-detalle`, dto);
  }

}
