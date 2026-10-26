export interface ProductoUpdate {
  idCategoria : number;
  idMarca : number | null;
  codigo : string;
  codigoBarras : string | null;
  nombre: string;
  nombreGenerico : string | null;
  descripcion: string | null ;
  precioCompra: number;
  precioVenta: number;
  peso : number | null ;
  controlaInventario : boolean ; 
  manejaLotes : boolean;
  tieneVencimiento: boolean;
  permiteVenta: boolean;

}

