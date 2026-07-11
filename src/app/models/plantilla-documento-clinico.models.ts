export class PlantillaDocumentoClinico {
  idPlantilla: number = 0;
  idEmpresa: number = 0;
  nombre: string = '';
  tipoDocumento: string = '';
  contenidoHTML: string = '';
  esPredeterminada: boolean = false;
  activa: boolean = true;
  fechaCreacion?: string;
  idUsuarioCreacion: number = 0;
}
