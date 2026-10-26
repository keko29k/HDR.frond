import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { QueryFilter } from '../../../core/models/query-filter.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Marca } from '../models/marca.model';
import { MarcaUpdate } from '../models/marca-update.model';

@Injectable({
  providedIn: 'root'
})
export class MarcaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Marca`;

  getAll(filter: QueryFilter): Observable<ApiResponse<Marca[]>> {
    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber)
      .set('PageSize', filter.pageSize)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<Marca[]>>(`${this.apiUrl}/paginacion`, { params });
  }

  getById(id: number): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/${id}`);
  }

  create(data: MarcaUpdate): Observable<Marca> {
    return this.http.post<Marca>(this.apiUrl, data);
  }

  update(id: number, data: MarcaUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

    gets() : Observable<Marca[]>
    {
      return this.http.get<Marca[]>(`${this.apiUrl}`);
    }
}
