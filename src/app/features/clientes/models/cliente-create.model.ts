export interface ClienteCreate {
  nombres: string;
  apellidos: string;
  nitCi: string;
  telefono: string;
  correo : string;
  direccion : string;
  fechaNacimiento : string | null;
  observacion: string;
}
