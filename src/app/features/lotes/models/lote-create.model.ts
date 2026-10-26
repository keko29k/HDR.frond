export interface LoteCreate {
  idSucursal: number;
  idProducto : number;
  numeroLote : string;
  fechaFabricacion: Date;
  fechaVencimiento: Date ;

  cantidadInicial: number;
  cantidadDisponible : number ; 
  costoCompra: number;
}
