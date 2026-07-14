export interface ContabilidadConfiguracion {
  idContabilidadConfiguracion: number;
  idEmpresa: number;
  moduloContratado: boolean;
  integracionAutomatica: boolean;
  generarCOGSAutomatico: boolean;
  separarAsientoCOGS: boolean;
}

export interface ActualizarContabilidadConfiguracionRequest {
  idEmpresa: number;
  integracionAutomatica: boolean;
  generarCOGSAutomatico: boolean;
  separarAsientoCOGS: boolean;
}
