import { DetalleVenta } from "./detalleVenta.model";
import { VentaCreate } from "./venta-create.model";

export interface VentaDetalleDto  {
  venta: VentaCreate;
  detalle: DetalleVenta[];
}