export interface LavadorConsumoDetalle {
  fecha: string
  concepto: string
  monto: number
}

export interface LavadorDashboard {
  idEmpleado: number
  nombreLavador: string
  totalConsumido: number
  comisionGenerada: number
  pagoNetoEstimado: number
  consumos: LavadorConsumoDetalle[]
}