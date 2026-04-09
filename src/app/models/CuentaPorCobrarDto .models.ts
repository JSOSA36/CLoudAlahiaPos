export interface CuentaPorCobrarDto {
  idCliente: number;        // 🔹 ID del cliente
  nombreCliente: string;    // 🔹 Nombre comercial o del cliente
  telefono: string;         // 🔹 Teléfono de contacto
  totalDeuda: number;       // 🔹 Total de deuda pendiente (RD$)
}
