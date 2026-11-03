// Respuesta de GET /api/Compra/{id}/detalle

export interface CompraVista {
  id: number;
  fechaCompra: string;
  estadoCompra: string;

  tipoDocumento: string;
  numeroDocumento: string | null;

  subTotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  observacion: string | null;

  proveedor: string;
  proveedorNit: string | null;
  sucursal: string;
  usuario: string;

  items: CompraVistaItem[];
}

export interface CompraVistaItem {
  idProducto: number;
  codigo: string;
  producto: string;
  numeroLote: string | null;
  fechaVencimiento: string | null;
  cantidad: number;
  precioCompra: number;
  descuento: number;
  impuesto: number;
  subTotal: number;
}
