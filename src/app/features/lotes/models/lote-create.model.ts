export interface LoteCreate {
  idSucursal: number;
  idProducto : number;
  numeroLote : string;
  fechaFabricacion: string;
  fechaVencimiento: string;

  cantidadInicial: number;
  cantidadDisponible : number ; 
  costoCompra: number;
}
