import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Compra } from '../models/compra.model';
import { Observable } from 'rxjs';
import { QueryFilter } from '../../../core/models/query-filter.model';
import { CompraCreate } from '../models/compraCreate.model';
import { CompraUpdate } from '../models/compraUpdate.model';
import { CompraDetalleDto } from '../models/compraDetalleDto';

@Injectable({
  providedIn: 'root',
})
export class CompraService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Compra`;

  getAll(filter: QueryFilter): Observable<ApiResponse<Compra[]>> {
    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber)
      .set('PageSize', filter.pageSize)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<Compra[]>>( `${this.apiUrl}/paginacion`, { params });
  }

  getById(id: number): Observable<Compra> {
    return this.http.get<Compra>(`${this.apiUrl}/${id}`);
  }

  create(data: CompraCreate): Observable<Compra> {
    return this.http.post<Compra>(this.apiUrl, data);
  }

  update(id: number, data: CompraUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  compraDetalle(dto: CompraDetalleDto): Observable<any> {
      return this.http.post(`${this.apiUrl}/compra-detalle`, dto);
    }

}
