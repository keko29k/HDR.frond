import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { QueryFilter } from '../../../core/models/query-filter.model';
import { Observable, Subject, tap } from 'rxjs';
import { ApiResponse } from '../../../core/models/api-response.model';
import { CajaCreate } from '../models/caja-create.model';
import { CajaUpdate } from '../models/caja-update.model';
import { Caja } from '../models/caja.model';

@Injectable({
  providedIn: 'root',
})
export class CajaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Caja`;
  readonly cambios = new Subject<{ tipo: 'abierta'; caja: Caja } | { tipo: 'actualizada' }>();

  getAll(filter: QueryFilter): Observable<ApiResponse<Caja[]>> {
    const params = new HttpParams()
      .set('PageNumber', filter.pageNumber || 1)
      .set('PageSize', filter.pageSize || 10)
      .set('Buscar', filter.buscar || '');

    return this.http.get<ApiResponse<Caja[]>>( `${this.apiUrl}/paginacion`, { params });
  }

  getById(id: number): Observable<Caja> {
    return this.http.get<Caja>(`${this.apiUrl}/${id}`);
  }

  create(data: CajaCreate): Observable<Caja> {
    return this.http.post<Caja>(this.apiUrl, data).pipe(
      tap(caja => this.cambios.next({ tipo: 'abierta', caja }))
    );
  }

  update(id: number, data: CajaUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  cerrarCaja(id: number): Observable<boolean> {
    return this.http.put<boolean>(`${this.apiUrl}/Cerrar/${id}`, {}).pipe(
      tap(cerrada => {
        if (cerrada) {
          this.cambios.next({ tipo: 'actualizada' });
        }
      })
    );
  }
}
