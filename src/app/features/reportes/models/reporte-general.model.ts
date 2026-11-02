// Respuesta de GET /api/Reporte/general

export interface ReporteGeneral {
  desde: string;
  hasta: string;
  idSucursal: number | null;
  sucursal: string;

  resumen: ReporteResumen;
  ventasPorDia: ReporteVentaDia[];
  ventasPorMetodo: ReporteMetodoPago[];
  ventasPorVendedor: ReporteVendedor[];
  productos: ReporteProducto[];
  comprasPorProveedor: ReporteProveedor[];
  gastosPorConcepto: ReporteGastoConcepto[];
  cuentasPorCobrar: ReporteCuentasPorCobrar;
  inventario: ReporteInventario;
}

export interface ReporteResumen {
  totalVentas: number;
  cantidadVentas: number;
  ticketPromedio: number;
  unidadesVendidas: number;

  costoVentas: number;
  utilidadBruta: number;
  margenBruto: number;

  totalGastos: number;
  utilidadNeta: number;
  margenNeto: number;

  totalCobrado: number;
  ventasContado: number;
  ventasCredito: number;

  totalCompras: number;
  cantidadCompras: number;
}

export interface ReporteVentaDia {
  fecha: string;
  cantidadVentas: number;
  total: number;
  costo: number;
  utilidad: number;
}

export interface ReporteMetodoPago {
  metodo: string;
  cantidadPagos: number;
  monto: number;
}

export interface ReporteVendedor {
  idUsuario: number;
  vendedor: string;
  cantidadVentas: number;
  total: number;
}

export interface ReporteProducto {
  idProducto: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  ventas: number;
  costo: number;
  utilidad: number;
  margen: number;
}

export interface ReporteProveedor {
  idProveedor: number;
  proveedor: string;
  cantidadCompras: number;
  total: number;
}

export interface ReporteGastoConcepto {
  concepto: string;
  cantidad: number;
  monto: number;
}

export interface ReporteCuentasPorCobrar {
  totalPendiente: number;
  creditosPendientes: number;
  montoVencido: number;
  creditosVencidos: number;
  creditos: ReporteCredito[];
}

export interface ReporteCredito {
  idVenta: number;
  cliente: string;
  fechaVenta: string;
  total: number;
  saldoPendiente: number;
  fechaLimitePago: string | null;
  diasVencido: number;
}

export interface ReporteInventario {
  valorInventario: number;
  productosStockBajo: number;
  lotesPorVencer: number;
  stockBajo: ReporteStockBajo[];
  proximosVencimientos: ReporteLoteVencimiento[];
}

export interface ReporteStockBajo {
  idProducto: number;
  producto: string;
  sucursal: string;
  stockActual: number;
  stockMinimo: number;
}

export interface ReporteLoteVencimiento {
  idLote: number;
  producto: string;
  numeroLote: string;
  sucursal: string;
  fechaVencimiento: string;
  cantidadDisponible: number;
  diasRestantes: number;
}
