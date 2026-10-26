export interface LoteUpdate {
  idProducto : number;
  numeroLote : string;
  fechaFabricacion: Date;
  fechaVencimiento: Date ;

  cantidadInicial: number;
  cantidadDisponible : number ; 
  costoCompra: number;
}
