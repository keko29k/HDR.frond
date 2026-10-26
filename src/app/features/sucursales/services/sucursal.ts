import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';

import { Sucursal } from '../models/sucursal.model';
import { SucursalCreate } from '../models/sucursal-create.model';
import { SucursalUpdate } from '../models/sucursal-update.model';

import { QueryFilter } from '../../../core/models/query-filter.model';
import { ApiResponse } from '../../../core/models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class SucursalService {

  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/Sucursale`;


  getAll(filter: QueryFilter): Observable<ApiResponse<Sucursal[]>> {

    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber)
      .set('PageSize', filter.pageSize)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<Sucursal[]>>(
      `${this.apiUrl}/Paginacion`,
      { params }
    );
  }


  getById(id: number): Observable<Sucursal> {

    return this.http.get<Sucursal>(
      `${this.apiUrl}/${id}`
    );
  }


  create(data: SucursalCreate): Observable<Sucursal> {

    return this.http.post<Sucursal>(
      this.apiUrl,
      data
    );
  }


  update(id: number, data: SucursalUpdate): Observable<void> {

    return this.http.put<void>(
      `${this.apiUrl}/${id}`,
      data
    );
  }


  delete(id: number): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${id}`
    );
  }


  gets(): Observable<Sucursal[]> {

    return this.http.get<Sucursal[]>(
      this.apiUrl
    );
  }

}