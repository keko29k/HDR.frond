

export interface Lote {
  id: number;
  idSucursal: number;
  idProducto : number;
  numeroLote : string;
  fechaFabricacion: Date | string;
  fechaVencimiento: Date | string;

  cantidadInicial: number;
  cantidadDisponible : number ; 
  costoCompra: number;
}
