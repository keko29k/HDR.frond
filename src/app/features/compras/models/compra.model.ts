export interface Compra {
  id: number;
  fecha: Date;
  total: number;
  descripcion: string;
  proveedorId: number;
  usuarioId: number;
}
