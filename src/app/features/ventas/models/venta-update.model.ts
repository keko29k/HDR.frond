export interface VentaUpdate {
  acredito: boolean;
  montoPagado: number;
  saldoPendiente: number;
  fechaLimitePago: Date;
  observacion: string;
  estadoVenta: boolean;
}