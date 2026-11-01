
export interface Venta {
  id: number;
  idSucursal: number;
  idCliente: number | null;
  idUsuario: number;

  acredito: boolean;
  montoPagado: number;
  saldoPendiente: number;

  fechaLimitePago: string | null;
  fechaVenta: string;

  total: number;
  observacion: string | null;
  estadoVenta: string;

  clienteNombre: string;
  usuarioNombre: string;
  metodoPago: string;
}
