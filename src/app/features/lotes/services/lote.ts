import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { Lote as LoteModel } from '../models/lote.model';
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
}
