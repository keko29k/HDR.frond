
export interface Gasto {
  id: number;
  idCaja : number;
  idUsuario : number;
  concepto : string;
  numeroComprobante : string | null;
  monto: number;
  observacion : string | null;
  fechaRegistro?: string;
}
