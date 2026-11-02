import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { ReporteDto } from '../models/reporteDto.model';
import { ReporteGeneral } from '../models/reporte-general.model';

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

  /**
   * Reporte general del negocio.
   * Las fechas van como 'yyyy-MM-dd' (sin hora) para evitar desfases de zona horaria;
   * el backend incluye el día completo de la fecha final.
   */
  getReporteGeneral(desde: string, hasta: string, idSucursal: number | null): Observable<ReporteGeneral> {
    let params = new HttpParams()
      .set('desde', desde)
      .set('hasta', hasta);

    if (idSucursal) {
      params = params.set('idSucursal', idSucursal);
    }

    return this.http.get<ReporteGeneral>(`${this.apiUrl}/general`, { params });
  }
}
