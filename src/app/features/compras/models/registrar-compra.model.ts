export interface RegistrarCompraDto {
  idProveedor: number;
  tipoDocumento: string;
  numeroDocumento?: string | null;
  fechaCompra: string;
  observacion?: string | null;
  detalles: RegistrarDetalleCompraDto[];
}

export interface RegistrarDetalleCompraDto {
  idProducto: number;
  cantidad: number;
  precioCompra: number;
  descuento: number;
  impuesto: number;
  numeroLote?: string | null;
  fechaFabricacion?: string | null;
  fechaVencimiento?: string | null;
}