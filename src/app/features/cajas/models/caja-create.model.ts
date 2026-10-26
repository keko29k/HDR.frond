export interface CajaCreate {

  idSucursal : number;
  idUsuarioApertura: number;
  idUsuarioCierre? : number | null;  
  fechaApertura: Date;  
  fechaCierre ?: Date | null;   
  montoInicial: number; 
  montoFinal:number | null;
  estadoCaja :   string;
  observacion:string;

}
