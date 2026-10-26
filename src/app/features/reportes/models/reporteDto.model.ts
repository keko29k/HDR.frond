import { ProductoReporte } from "./productoReporte.model";

export interface ReporteDto {
  fechaInicio: Date;
  fechaFinal: Date;
  totalGen: number;
  inversionTotal: number;
  gastoTotal: number;
  gananciaTotal: number;
  productos: ProductoReporte[];
}