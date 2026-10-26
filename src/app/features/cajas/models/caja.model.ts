export interface Caja {
  id: number;
  idSucursal : number;
  idUsuarioApertura: number;
  idUsuarioCierre?: number;  
  fechaApertura: Date;  
  fechaCierre? : Date;   
  montoInicial: number; 
  montoFinal?:number;
  estadoCaja :   string;
  observacion?:string;  
}
