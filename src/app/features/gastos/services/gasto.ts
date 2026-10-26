import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { QueryFilter } from '../../../core/models/query-filter.model';
import { ApiResponse } from '../../../core/models/api-response.model';
import { Gasto } from '../models/gasto.model';
import { GastoUpdate } from '../models/gasto-update.model';
import { GastoCreate } from '../models/gasto-create.model';
import { Marca } from '../../marcas/models/marca.model';

@Injectable({
  providedIn: 'root'
})
export class GastoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Gastos`;

getAll(filter: QueryFilter): Observable<ApiResponse<Gasto[]>> {
  const params = new HttpParams()
    .set('PageNumber', String(filter.pageNumber))
    .set('PageSize', String(filter.pageSize))
    .set('Buscar', String(filter.buscar));

  return this.http.get<ApiResponse<Gasto[]>>(
    `${this.apiUrl}/Paginacion`,
    { params }
  );
}
  

  getById(id: number): Observable<Gasto> {
    return this.http.get<Gasto>(`${this.apiUrl}/${id}`);
  }

  create(data: GastoCreate): Observable<Gasto> {
    return this.http.post<Gasto>(this.apiUrl, data);
  }

  update(id: number, data: GastoUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
