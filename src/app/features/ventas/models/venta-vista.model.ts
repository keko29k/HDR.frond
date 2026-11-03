// Respuesta de GET /api/Venta/{id}/detalle

export interface VentaVista {
  id: number;
  fechaVenta: string;
  estadoVenta: string;

  acredito: boolean;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  fechaLimitePago: string | null;
  observacion: string | null;

  cliente: string;
  clienteDocumento: string | null;
  vendedor: string;
  sucursal: string;

  items: VentaVistaItem[];
  pagos: VentaVistaPago[];
}

export interface VentaVistaItem {
  idProducto: number;
  codigo: string;
  producto: string;
  numeroLote: string | null;
  fechaVencimiento: string | null;
  cantidad: number;
  precioVenta: number;
  descuento: number;
  subTotal: number;
}

export interface VentaVistaPago {
  id: number;
  fecha: string;
  metodoPago: string;
  monto: number;
  idCaja: number;
  referencia: string | null;
  observacion: string | null;
}
