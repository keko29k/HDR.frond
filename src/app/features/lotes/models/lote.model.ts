

export interface Lote {
  id: number;
  idSucursal: number;
  idProducto : number;
  numeroLote : string;
  fechaFabricacion: Date;
  fechaVencimiento: Date ;

  cantidadInicial: number;
  cantidadDisponible : number ; 
  costoCompra: number;
}
