export interface InventarioSucursal {
  id: number;
  idSucursal : number;
  idProducto : number;
  stockActual : number;
  stockMinimo : number;
  stockMaximo : number;
  puntoReorden : number ;
  ubicacion : string;
}
