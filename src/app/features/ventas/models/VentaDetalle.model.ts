export interface VentaDetalleDto {
  venta: VentaDetalleCabeceraCreate;
  detalle: VentaDetalleLineaCreate[];
  pagos: VentaPagoCreate[];
}

export interface VentaDetalleCabeceraCreate {
  idCliente: number;
  acredito: boolean;
  fechaLimitePago: string | null;
  observacion: string;
  estadoVenta: 'COMPLETADA';
}

export interface VentaDetalleLineaCreate {
  idProducto: number;
  cantidad: number;
  idLote?: number;
}

export interface VentaPagoCreate {
  idCaja: number;
  metodoPago: string;
  monto: number;
  referencia: string | null;
  observacion: string | null;
}
