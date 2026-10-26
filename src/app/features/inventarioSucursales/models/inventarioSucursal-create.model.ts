export interface InventarioSucursalCreate {
  idSucursal : number;
  idProducto : number;
  stockActual : number;
  stockMinimo : number;
  stockMaximo : number;
  puntoReorden : number ;
  ubicacion : string;
}
