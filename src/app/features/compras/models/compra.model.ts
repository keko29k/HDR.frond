export interface Compra {
  id: number;

  idSucursal: number;
  sucursal: string;

  idProveedor: number;
  proveedor: string;

  idUsuario: number;
  usuario: string;

  tipoDocumento: string;
  numeroDocumento?: string;
  fechaCompra: Date;

  subTotal: number;
  descuento: number;
  impuesto: number;
  total: number;

  observacion?: string;
  estadoCompra: string;
}