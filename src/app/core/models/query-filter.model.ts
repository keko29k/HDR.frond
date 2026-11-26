import { HttpParams } from '@angular/common/http';

/** Agrega `IdSucursal` a los parámetros si el filtro trae una sucursal. */
export function conSucursal(params: HttpParams, filter: QueryFilter): HttpParams {
  return filter.idSucursal ? params.set('IdSucursal', filter.idSucursal) : params;
}

export interface QueryFilter {
  pageNumber: number;
  pageSize: number;
  buscar: string;
  /**
   * Solo listados por sucursal (ventas, compras, cajas, gastos, lotes).
   * null/0 = todas. Al vendedor el backend siempre le aplica la suya.
   */
  idSucursal?: number | null;
  /** Inventario por sucursal: solo productos en o bajo su stock mínimo. */
  soloStockBajo?: boolean;
}
