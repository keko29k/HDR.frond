import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { QueryFilter } from '../../../core/models/query-filter.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Categoria } from '../models/categoria.model';
import { CategoriaUpdate } from '../models/categoria-update.model';
import { CategoriaCreate } from '../models/categoria-create.model';

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Categoria`;

  getAll(filter: QueryFilter): Observable<ApiResponse<Categoria[]>> {
    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber)
      .set('PageSize', filter.pageSize)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<Categoria[]>>( `${this.apiUrl}/paginacion`, { params });
  }

  getById(id: number): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/${id}`);
  }

  create(data: CategoriaCreate): Observable<Categoria> {
    return this.http.post<Categoria>(this.apiUrl, data);
  }

  update(id: number, data: CategoriaUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  gets() : Observable<Categoria[]>
  {
    return this.http.get<Categoria[]>(`${this.apiUrl}`);
  }
}
