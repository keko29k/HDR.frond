import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { QueryFilter } from '../../../core/models/query-filter.model';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { DetalleVenta } from '../models/detalleVenta.model';
import { DetalleVentaCreate } from '../models/detalleVentaCreate.model';
import { DetalleVentaUpdate } from '../models/detalleVentaUpdate.model';

@Injectable({
  providedIn: 'root',
})
export class DetalleVentaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Compra`;

  getAll(filter: QueryFilter): Observable<ApiResponse<DetalleVenta[]>> {
    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber)
      .set('PageSize', filter.pageSize)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<DetalleVenta[]>>( `${this.apiUrl}/paginacion`, { params });
  }

  getById(id: number): Observable<DetalleVenta> {
    return this.http.get<DetalleVenta>(`${this.apiUrl}/${id}`);
  }

  create(data: DetalleVentaCreate): Observable<DetalleVenta> {
    return this.http.post<DetalleVenta>(this.apiUrl, data);
  }

  update(id: number, data: DetalleVentaUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
