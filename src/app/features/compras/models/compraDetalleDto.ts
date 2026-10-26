import { Compra } from "./compra.model";
import { DetalleCompra } from "./detalleCompra.model";

export interface CompraDetalleDto  {
  compra: Compra;
  detalle: DetalleCompra[];
}