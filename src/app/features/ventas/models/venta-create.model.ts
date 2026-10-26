export interface VentaCreate {
  idSucursal:number;
  idCliente:number;
  idUsuario:number;
  acredito: boolean;
  montoPagado: number;
  saldoPendiente: number;
 fechaLimitePago?: Date | null;
  fechaVenta  : Date;
  total: number;
  observacion: string;
  estadoVenta: boolean;

}