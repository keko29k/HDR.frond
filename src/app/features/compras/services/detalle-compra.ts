import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { QueryFilter } from '../../../core/models/query-filter.model';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { DetalleCompra } from '../models/detalleCompra.model';
import { DetalleCompraCreate } from '../models/detalleCompraCreate.model';
import { DetalleCompraUpdate } from '../models/detalleCompraUpdate.model';

@Injectable({
  providedIn: 'root',
})
export class DetalleCompraService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Compra`;

  getAll(filter: QueryFilter): Observable<ApiResponse<DetalleCompra[]>> {
    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber)
      .set('PageSize', filter.pageSize)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<DetalleCompra[]>>( `${this.apiUrl}/paginacion`, { params });
  }

  getById(id: number): Observable<DetalleCompra> {
    return this.http.get<DetalleCompra>(`${this.apiUrl}/${id}`);
  }

  create(data: DetalleCompraCreate): Observable<DetalleCompra> {
    return this.http.post<DetalleCompra>(this.apiUrl, data);
  }

  update(id: number, data: DetalleCompraUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  
}
