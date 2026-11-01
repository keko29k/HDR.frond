
export interface VentaDetalleDto {
  venta: VentaDetalleCabeceraCreate;
  detalle: VentaDetalleLineaCreate[];
  pagos: VentaPagoCreate[];
}

// Datos principales de la venta
export interface VentaDetalleCabeceraCreate {
  idCliente: number | null;
  acredito: boolean;
  fechaLimitePago: string | null;
  observacion: string;
  estadoVenta: 'COMPLETADA';
}

// Productos que se venderán.
// El backend se encarga de asignar los lotes automáticamente.
export interface VentaDetalleLineaCreate {
  idProducto: number;
  cantidad: number;
}

// Pagos realizados en la venta
export interface VentaPagoCreate {
  idCaja: number;
  metodoPago: string;
  monto: number;
  referencia: string | null;
  observacion: string | null;
}
