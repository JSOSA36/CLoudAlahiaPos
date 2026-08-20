/** Mensaje claro (texto plano) cuando el voucher no cubre lo adeudado. */
export function mensajeMontoInsuficiente(body: {
  montoVoucherDop?: number;
  totalAdeudadoDop?: number;
  montoPlanDop?: number;
  montoReconexionDop?: number;
  faltanteDop?: number;
}): string {
  const voucher = Number(body?.montoVoucherDop || 0);
  const total = Number(body?.totalAdeudadoDop || 0);
  const plan = Number(body?.montoPlanDop || 0);
  const reconex = Number(body?.montoReconexionDop || 0);
  const faltante = Number(
    body?.faltanteDop != null ? body.faltanteDop : Math.max(0, total - voucher)
  );

  const rd = (n: number) =>
    `RD$ ${n.toLocaleString('es-DO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;

  const lineas: string[] = [
    'El monto de su voucher no cubre lo adeudado.',
    '',
    `Monto del voucher:   ${rd(voucher)}`,
    `Total adeudado:      ${rd(total)}`
  ];

  if (plan > 0) {
    lineas.push(`   · Servicio / plan: ${rd(plan)}`);
  }
  if (reconex > 0) {
    lineas.push(`   · Reconexión:      ${rd(reconex)}`);
  }

  lineas.push(
    '',
    `Falta por depositar: ${rd(faltante)}`,
    '',
    'Transfiera el total completo y adjunte nuevamente el comprobante.'
  );

  return lineas.join('\n');
}
