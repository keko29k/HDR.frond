import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ReporteDto } from '../models/reporteDto.model';

@Injectable({
  providedIn: 'root',
})
export class ReporteService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/Reporte`;

  getReporte  (fechaInicial: Date, fechaFinal: Date) : Observable<ReporteDto>{
    const params = {
      fechaInicial: fechaInicial.toISOString(),
      fechaFinal: fechaFinal.toISOString(),
    };
    return this.http.get<ReporteDto>(`${this.apiUrl}`, { params });
  }
}
