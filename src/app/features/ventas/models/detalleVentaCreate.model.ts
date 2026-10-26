export interface DetalleVentaCreate {
  cantidad: number;
  precioUnitario: number;
  precioCompra: number;
  subtotal: number;
  ventaId: number;
  productoId : number;
}