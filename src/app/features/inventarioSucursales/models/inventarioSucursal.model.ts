export interface InventarioSucursal {
  id: number;
  idSucursal: number;
  idProducto: number;
  nombreProducto: string;
  nombreSucursal: string;
  ubicacion: string;
  stockActual: number;
  stockMinimo: number;
  stockMaximo: number;
  estadoStock: string;
}

export type EstadoStockFiltro = 'BAJO' | 'SIN_EXISTENCIAS' | 'NORMAL' | 'SOBRESTOCK';

export interface LotePorVencer {
  id: number;
  idProducto: number;
  nombreProducto: string;
  idSucursal: number;
  nombreSucursal: string;
  numeroLote: string;
  fechaVencimiento: Date | string;
  cantidadDisponible: number;
  diasParaVencer: number;
}

export interface InventarioSucursalResumen {
  unidadesEnInventario: number;
  stockBajo: number;
  sinExistencias: number;
  lotesPorVencer: number;
  productosStockBajo: InventarioSucursal[];
  detalleLotesPorVencer: LotePorVencer[];
}
