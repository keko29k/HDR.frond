export interface Venta {
  id: number;
  idSucursal:number;
  idCliente:number;
  idUsuario:number;
  acredito: boolean;
  montoPagado: number;
  saldoPendiente: number;
  fechaLimitePago: Date;
  fechaVenta  : Date;
  total: number;
  observacion: string;
  estadoVenta: boolean;
}
