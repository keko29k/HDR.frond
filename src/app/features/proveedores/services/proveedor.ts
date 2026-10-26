import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { QueryFilter } from '../../../core/models/query-filter.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Proveedor } from '../models/proveedor.model';
import { ProveedorUpdate } from '../models/proveedor-update.model';
import { ProveedorCreate } from '../models/proveedor-create.model';

@Injectable({
  providedIn: 'root'
})
export class ProveedorService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Proveedor`;

  getAll(filter: QueryFilter): Observable<ApiResponse<Proveedor[]>> {
    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber)
      .set('PageSize', filter.pageSize)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<Proveedor[]>>( `${this.apiUrl}/paginacion`, { params });
  }

  getById(id: number): Observable<Proveedor> {
    return this.http.get<Proveedor>(`${this.apiUrl}/${id}`);
  }

  create(data: ProveedorCreate): Observable<Proveedor> {
    return this.http.post<Proveedor>(this.apiUrl, data);
  }

  update(id: number, data: ProveedorUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

   gets() : Observable<Proveedor[]>
        {
          return this.http.get<Proveedor[]>(`${this.apiUrl}`);
        }
}
