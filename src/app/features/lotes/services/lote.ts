import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Lote as LoteModel } from '../models/lote.model';
import { LoteVencimiento } from '../models/lote-vencimiento.model';
import { LoteCreate } from '../models/lote-create.model';
import { LoteUpdate } from '../models/lote-update.model';

@Injectable({
  providedIn: 'root'
})
export class LoteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Lote`;

  gets(): Observable<LoteModel[]> {
    return this.http.get<LoteModel[]>(this.apiUrl);
  }

  getById(id: number): Observable<LoteModel> {
    return this.http.get<LoteModel>(`${this.apiUrl}/${id}`);
  }

  create(data: LoteCreate): Observable<LoteModel> {
    return this.http.post<LoteModel>(this.apiUrl, data);
  }

  update(id: number, data: LoteUpdate): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** Lotes con stock vencidos o que vencen dentro de `dias` (1–365). */
  getVencimientos(idSucursal: number | null, dias = 90): Observable<LoteVencimiento[]> {
    let params = new HttpParams().set('dias', dias);

    if (idSucursal) {
      params = params.set('idSucursal', idSucursal);
    }

    return this.http.get<LoteVencimiento[]>(`${this.apiUrl}/vencimientos`, { params });
  }

  /** Avisa cuando cambian las unidades de algún lote (p. ej. tras un retiro). */
  readonly cambios = new Subject<void>();

  /** Da de baja unidades del lote y del stock de su sucursal (sin historial). */
  retirar(idLote: number, cantidad: number): Observable<{ mensaje: string }> {
    return this.http
      .post<{ mensaje: string }>(`${this.apiUrl}/${idLote}/retirar`, { cantidad })
      .pipe(tap(() => this.cambios.next()));
  }
}
