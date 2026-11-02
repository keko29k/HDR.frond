// Respuesta de GET /api/Lote/vencimientos

export interface LoteVencimiento {
  idLote: number;
  numeroLote: string;

  idProducto: number;
  codigo: string;
  producto: string;

  idSucursal: number;
  sucursal: string;

  fechaFabricacion: string | null;
  fechaVencimiento: string;

  /** Negativo cuando el lote ya venció. */
  diasRestantes: number;

  cantidadInicial: number;
  cantidadDisponible: number;

  costoCompra: number;
  precioVenta: number;

  valorCosto: number;
  valorVenta: number;
}

export type NivelVencimiento = 'VENCIDO' | 'CRITICO' | 'ALERTA' | 'PROXIMO';

/** Clasifica un lote según los días que le quedan. */
export function nivelVencimiento(diasRestantes: number): NivelVencimiento {
  if (diasRestantes < 0) return 'VENCIDO';
  if (diasRestantes <= 7) return 'CRITICO';
  if (diasRestantes <= 30) return 'ALERTA';
  return 'PROXIMO';
}
