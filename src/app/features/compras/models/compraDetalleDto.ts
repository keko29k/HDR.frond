import { Compra } from "./compra.model";
import { CompraCreate } from "./compraCreate.model";
import { DetalleCompra } from "./detalleCompra.model";

export interface CompraDetalleDto  {
  compra: CompraCreate;
  detalle: DetalleCompra[];
}