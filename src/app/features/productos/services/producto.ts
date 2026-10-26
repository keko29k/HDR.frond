import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { QueryFilter } from '../../../core/models/query-filter.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Producto } from '../models/producto.model';
import { ProductoCreate } from '../models/producto-create.model';
import { ProductoUpdate } from '../models/producto-update.model';

@Injectable({
  providedIn: 'root'
})
export class ProductoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Producto`;

  getAll(filter: QueryFilter): Observable<ApiResponse<Producto[]>> {
    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber)
      .set('PageSize', filter.pageSize)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<Producto[]>>( `${this.apiUrl}/paginacion`, { params });
  }

  getById(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  create(data: ProductoCreate): Observable<Producto> {
    return this.http.post<Producto>(this.apiUrl, data);
  }

  update(id: number, data: ProductoUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  gets() : Observable<Producto[]>
          {
            return this.http.get<Producto[]>(`${this.apiUrl}`);
          }
}
