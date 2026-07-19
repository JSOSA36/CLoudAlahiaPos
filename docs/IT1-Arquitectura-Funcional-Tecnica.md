# Arquitectura funcional y técnica — Módulo IT-1 / Anexo A (Alahia ERP)

**Tipo de documento:** Plano maestro de arquitectura  
**Alcance:** IT-1 + Anexo A (DGII)  
**Estilo de diseño:** Reutilizar al máximo el modelo actual de Alahia (Ventas, Compras/606, NC, Contabilidad, Tesorería, e-CF)  
**No incluye:** código, migraciones ejecutables, pantallas ni lógica implementada  

**Principio rector:** el IT-1 no es un formulario aislado; es una **liquidación mensual** que consolida:
1. agregados de **607** (ventas / NC / ND),
2. agregados de **606** (compras FACTC),
3. clasificación del **ITBIS crédito**,
4. retenciones sufridas y practicadas,
5. ajustes y saldos autorizados.

> **Amendo vinculante:** ver `docs/IT1-SprintA-Diseno-Autorizacion.md` (decisiones D1–D10: foto fiscal, destino pendiente de validar, forma venta congelada, Gastos≠crédito, auditoría casillas, versionado, redondeo, propina legal). Ese documento prevalece donde haya conflicto con borradores anteriores.
>
> **Sprint B — desacoplamiento obligatorio:** ver `docs/IT1-SprintB-Impacto-Desacoplamiento.md` (versión oficial). DGII opcional por empresa; FACTC **nunca** bloquea por falta de `DestinoItbis` (solo cierra IT-1 futuro); estados foto `NO_APLICA`/`PENDIENTE_GENERAR`/`GENERADA`/`PENDIENTE_VALIDAR`/`ERROR_FISCAL`; 606 TXT intacto.
>
> **Motor Fiscal Central (vinculante):** ver `docs/Arquitectura-Motor-Fiscal-Central.md`. Principio de arquitectura aprobado: la fuente fiscal son las fotografías + e-CF; 606/607/IT-1/Anexo A son reportes derivados del Motor Fiscal, nunca la fuente primaria. Todo reporte consume el Motor Fiscal, no la base comercial directamente.

---

## Criterios de diseño (Alahia-first)

| Decisión | Motivo |
|----------|--------|
| Extender `FacturaHeaders`, `OrdenCompraHeaders`, `NotasCredito`, `Proveedores`, `Productos`, `Empresas` | Ya son la fuente operativa del negocio |
| No convertir `Gastos` en fuente fiscal principal | Carece de NCF/ITBIS; el crédito fiscal vive en **FACTC** (`OrdenCompraHeaders`) |
| Reutilizar `ContabilidadCuentaMapeo.CodigoConcepto` | Ya existe infraestructura de mapeo concepto→cuenta |
| Reutilizar `ParametrosConfigs` / `Parametros` para tasas y flags simples | Ya usan `ImpuestoItbis` |
| Crear tablas nuevas solo para: configuración tributaria empresarial, catálogos DGII seed, **snapshot de declaración**, importaciones DGA y ajustes de periodo | No pertenecen al documento operativo diario |
| 606/607 como capa intermedia obligatoria | Así lo exige la Oficina Virtual (cuadre Anexo A ↔ formatos) |

---

# 1. Tablas existentes

## 1.1 Mapa de reutilización

| Tabla | Rol en IT-1 | Columnas que ya sirven | Reutilizable sin cambio | Ya se genera automáticamente |
|-------|-------------|------------------------|-------------------------|------------------------------|
| `Empresas` | Datos generales Anexo A / IT-1 | `RNC`, `NombreComercial`, `Telefono`, `CorreElectronico`, FE (`EsEmisorElectronico`, `AmbienteFE`) | Identidad + flags FE | Datos de empresa en factura/ticket |
| `FacturaHeaders` | Base 607 / Anexo A II–IV | `NCF`, `RNC`, `SubTotal`, `TotalItbis`, `Total`, `MontoEfectivo/Tarjeta*/Transferencia/Cheques/NotaCredito`, `TipoFactura`, `FormaPago`, `EstaCancelada`, `IdTipoDocumentos`, `FechaInseccion`, `IdEmpresa` | Parcial (montos y NCF) | Totales, ITBIS, NCF al facturar |
| `FacturaDetalles` | Base / tasa futura | `Itbis`, `SubTotal`, `IdProducto`, `Descuento` | Parcial | ITBIS línea según producto |
| `NotasCredito` | 607 casilla 4 + Anexo A 43 | `IdFacturaHeader`, `NCF`, `NCFModificado`, `RNC`, `SubTotal`, `TotalItbis`, `Total`, `FechaInseccion` | Parcial (ya tiene factura origen) | NC desde devolución |
| `NotasCreditoDetalle` | Detalle NC | `Itbis`, `SubTotal`, `IdFacturaDetalle` | Sí para montos | Detalle al emitir NC |
| `OrdenCompraHeaders` | 606 / Anexo A IX / IT-1 A | `NCF`, `NcfModificado`, `IdTipoBienesServicios`, `FormaPagoDgii`, montos bienes/servicios, `TotalItbis`, `ItbisRetenido`, `ItbisProporcionalidad`, `ItbisLlevadoAlCosto`, `TipoRetencionIsr`, `MontoRetencionRenta`, `FechaPagoFiscal`, `Estado`, `IdTipoDocumentos` | **Alta** para 606 | FACTC + TXT 606 |
| `OrdenCompraDetalles` | Destino / activos / gastos | `Itbis`, `SubTotal`, `TipoComportamientoLinea`, `IdGastoGenerado`, `IdActivoFijoGenerado` | Parcial (puente a activo/gasto) | Recepción inventarios/activos |
| `Proveedores` | 606 tipo ID / régimen | `RNC`, `NombreComercial` | Parcial | Maestro |
| `Clientes` | 607 RNC receptor | `CedulaRNC`, `NombreComercial` | Parcial | Maestro |
| `Productos` | Gravado/exento | `Itbis` (bool), `EsServicio`, `TipoComportamiento` | Solo flag grava/no grava | POS aplica ITBIS |
| `TipoBienesServices` | 606 campo tipo | códigos 1–11 | Sí | Catálogo seed |
| `TipoDocumentos` | Discriminar FACT / FACTC / etc. | `IdTipoDocumentos`, `Descripcion` | Parcial (IDs mágicos hoy) | Documentos |
| `SecuenciaDocumentos` / `SecuenciaECF` | Emisión NCF/e-NCF | `TipoNCF`, series | Sí para emisión | Numeración |
| `ECFEncabezado` | e-CF → 607/Anexo A | `TipoECF`, `ENCF`, `MontoGravado`, `TotalITBIS`, `TotalGeneral`, `EstadoDGII`, `IdFacturaInterna` | Alta para emisores FE | Envío DGII |
| `ParametrosConfigs` | Tasa ITBIS | `ImpuestoItbis` | Parcial (una sola tasa) | Config POS |
| `Parametros` | Flags POS/empresa KV | `Clave`/`Valor` | Extensible | Config |
| `ContabilidadCuentaMapeo` | Conciliación | `CodigoConcepto`, `IdCuentaContable` | Extensible (semillas ITBIS) | Contabilidad |
| `AsientosContables` + detalle | Validación | Debe/Haber periodo | Solo conciliación | Integración contable |
| `CuentaFinanciera` / `MovimientoFinanciero` | Medios pago / 08-04 | montos, referencia, fecha | Conciliación | Tesorería |
| `PagosFacturasClientes` | Desglose cobro crédito | `FormaPago`, `Monto`, `IdFacturaHeader` | Parcial Anexo A 12–18 si crédito cobrado luego | CxC |
| `PagosProveedor` | Fecha pago / retenciones | `FormaPago`, `Monto`, `IdOrdenCompraHeader` | Parcial vs `FechaPagoFiscal` | CxP |
| `ActivosFijos` | Cat. activo / venta | `ValorAdquisicion`, vínculo compra, `Estado` | Parcial (falta categoría DGII y venta) | Alta desde compra |
| `Gastos` | **No fiscal DGII** | operativo | No como fuente ITBIS | Solo gasto operativo |
| `ClientesDGII` | Validación RNC | `RNC`, `Regimen` | Auxiliar | Sync DGII |

## 1.2 Información que el sistema ya genera solo

- NCF/e-NCF al emitir factura (según secuencia).
- `TotalItbis` / línea `Itbis` en ventas (tasa global `ImpuestoItbis`).
- Desglose de montos de cobro en factura (`MontoEfectivo`, tarjetas, transferencia, cheques, NC).
- FACTC con campos 606 y TXT Formal 606.
- NC vinculada a `IdFacturaHeader`.
- ITBIS llevado al costo / proporcionalidad / retenido en compra (captura manual en FACTC).
- Snapshot e-CF con `MontoGravado`.

## 1.3 Límites actuales (por qué no alcanza para IT-1)

- Ventas: no tipifican NCF DGII (01/02/…/31/32), ni base por tasa múltiple, ni tipo de ingreso, ni mapeo formal a códigos 607 de forma de pago.
- 607 incompleto (no TXT oficial; NC fuera del reporte).
- Compras: faltan **destino del ITBIS** (casillas 45–53) y split explícito local/servicios/importaciones; importaciones DGA no existen.
- Producto: solo `Itbis` bool → no tasa 16/9/8 ni exención por destino.
- No hay entidad de **declaración / periodo / saldo a favor**.

---

# 2. Cambios requeridos (tablas existentes)

Convenciones: `decimal(18,2)` montos; `nvarchar` códigos; defaults seguros para no romper facturación actual.

## 2.1 `Empresas`

| Campo nuevo | Tipo | Default | Justificación fiscal | Impacto |
|-------------|------|---------|----------------------|---------|
| `DgiiRegimenTributario` | `nvarchar(20)` | `'ORDINARIO'` | RST / ordinario / especial → reglas casillas 1–8 | UI empresa; filtros IT-1 |
| `DgiiEsConstructor` | `bit` | `0` | Habilita sección VI Anexo A | Oculta/muestra vertical |
| `DgiiEsComisionista` | `bit` | `0` | Sección VII Anexo A | Idem |
| `DgiiObligadoLibroVentasSF` | `bit` | `0` | Excepción auto-carga 1–8 | Motor Anexo A |
| `DgiiRazonSocial` | `nvarchar(200)` null | null | Nombre legal ≠ nombre comercial | Cabecera declaración |
| `DgiiDeclaranteNombre` | `nvarchar(150)` null | null | Juramento | Declaración |
| `DgiiDeclaranteCalidad` | `nvarchar(80)` null | null | “Gerente”, “Contador” | Declaración |

**Alternativa preferida si se quiere no engordar `Empresas`:** mover estos flags a `DgiiConfiguracionEmpresa` (sección 3) y dejar en `Empresas` solo identidad ya existente.

**Recomendación arquitectónica:** usar **tabla satélite** `DgiiConfiguracionEmpresa` (1:1) y no saturar `Empresas`.

## 2.2 `FacturaHeaders`

| Campo nuevo | Tipo | Default | Justificación | Impacto |
|-------------|------|---------|---------------|---------|
| `CodigoTipoComprobanteDgii` | `nvarchar(2)` null | null (se deriva de NCF/`TipoComprobante` al grabar) | Casillas Anexo A 1–8 / 607 | POS/FE al emitir; backfill por prefijo NCF |
| `TipoIngresoDgii` | `tinyint` | `1` (operaciones) | Anexo A 20–25 | Default POS; editable en casos especiales |
| `IndicadorFacturacion` | `tinyint` null | null | 1 gravada / 2 exenta / etc. (compatible e-CF) | 607 + IT-1 2–15 |
| `MontoGravado` | `decimal(18,2)` | `0` | Base gravada sin ITBIS | Anexo A montos; IT-1 |
| `MontoExento` | `decimal(18,2)` | `0` | Operaciones exentas | IT-1 4,5,8 |
| `MontoGravadoI1` | `decimal(18,2)` | `0` | Base tasa principal (18%) | IT-1 11 |
| `MontoGravadoI2` | `decimal(18,2)` | `0` | Base 16% | IT-1 12 |
| `MontoGravadoI3` | `decimal(18,2)` | `0` | Base 9% | IT-1 13 |
| `MontoGravadoI4` | `decimal(18,2)` | `0` | Base 8% | IT-1 14 |
| `MontoPropinaLegal` | `decimal(18,2)` | `0` o mapear `MontoPropina` | 607 propina | Reportes |
| `ItbisRetenidoTercero` | `decimal(18,2)` | `0` | Retención sufrida en la venta (Estado, sociedades) | Anexo A 29–31 |
| `ItbisRetenidoTarjeta0804` | `decimal(18,2)` | `0` | Norma 08-04 | Anexo A 27 |
| `EsExportacion` | `bit` | `0` | IT-1 2–3 | Clasificación |
| `EsExentoPorDestino` | `bit` | `0` | IT-1 5 | Ventas a régimen especial |
| `IdActivoFijoVendido` | `int` null | null | Anexo A 24 / IT-1 15 | Ventas de activos |

**Reutilización sin duplicar:**  
`MontoEfectivo`+`MontoCheques`+`MontoTransferencia`+tarjetas+`TipoFactura=Credito` → casillas 12–15 vía **mapeo en motor**, no hace falta columnas nuevas de medio de pago si se documenta la regla:

- 12 ← `MontoEfectivo`  
- 13 ← `MontoCheques + MontoTransferencia`  
- 14 ← `MontoTarjetaVisa + MontoTarjetaMasterCard`  
- 15 ← si `TipoFactura` crédito: `Pendiente` inicial / total comprometido  
- 16–18 ← requieren campos nuevos solo si el negocio usa bonos/permutas (ver opcionales)

| Campo opcional | Tipo | Default | Uso |
|----------------|------|---------|-----|
| `MontoBonos` | `decimal(18,2)` | `0` | Casilla 16 |
| `MontoPermuta` | `decimal(18,2)` | `0` | Casilla 17 |
| `MontoOtraFormaVenta` | `decimal(18,2)` | `0` | Casilla 18 |

**Impacto sistema:** POS y `ProcesarFactura` deben popular bases al cerrar; reportes 607; e-CF ya tiene `MontoGravado` → sincronizar a header.

## 2.3 `FacturaDetalles`

| Campo nuevo | Tipo | Default | Justificación | Impacto |
|-------------|------|---------|---------------|---------|
| `TasaItbis` | `decimal(5,2)` | `0` o tasa param | Multi-tasa | Cálculo línea; agregación header |
| `IndicadorFacturacion` | `tinyint` | `1` | Gravado/exento línea | |
| `TipoIngresoDgii` | `tinyint` null | null (hereda header) | Override línea | Casos mixtos |

## 2.4 `NotasCredito`

| Campo nuevo | Tipo | Default | Justificación | Impacto |
|-------------|------|---------|---------------|---------|
| `CodigoTipoComprobanteDgii` | `nvarchar(2)` | `'04'` / `'34'` | Casilla 4 | 607 |
| `FechaFacturaOrigen` | `datetime` null | se copia de factura | Casilla 43 (>30 días) | Cálculo al emitir |
| `DiasDesdeFactura` | `int` computed/null | — | Ayuda consulta | Reportes |
| `AfectaOtrasOperacionesPositivas` | `bit` | `0` | Casilla 9 si >30 días y se decide ajustar | Usuario/contabilidad |
| `MontoGravado` / tasas | iguales a venta | `0` | Consistencia liquidación | |

(`IdFacturaHeader` **ya existe** → no crear otro vínculo.)

## 2.5 `OrdenCompraHeaders`

| Campo nuevo | Tipo | Default | Justificación | Impacto |
|-------------|------|---------|---------------|---------|
| `DestinoItbis` | `tinyint` | `2` (= deducible bienes/servicios gravados, ver catálogo) | Casillas 45–53 | FACTC form; Anexo A IX |
| `ItbisComprasLocales` | `decimal(18,2)` | `0` | Columna “Compras locales” | Distribución 606→Anexo A |
| `ItbisServicios` | `decimal(18,2)` | `0` | Columna “Servicios” | Idem |
| `ItbisImportaciones` | `decimal(18,2)` | `0` | Columna “Importaciones” | Idem |
| `TasaItbis` | `decimal(5,2)` | `18` | Retenciones RST 16/18 | Sección A IT-1 |
| `CodigoNormaRetencionItbis` | `nvarchar(20)` null | null | IT-1 39–48 | Tipificación retención |
| `BaseRetencionItbis` | `decimal(18,2)` | `0` | Base sujeta a retención | |
| `EsRegimenEspecialProveedor` | `bit` | `0` | Casilla 44 | Puede derivarse de proveedor/NCF |
| `EsImportacion` | `bit` | `0` | Columna importaciones | Documentos importación |

**Reutilizar existentes:**  
`ItbisLlevadoAlCosto`, `ItbisProporcionalidad`, `ItbisRetenido`, `TotalItbis`, bienes/servicios, `TipoRetencionIsr` (ISR, no ITBIS) — no reemplazar; complementar.

**Impacto:** formulario FACTC; validación suma columnas = ITBIS a clasificar; motor 606 puede seguir igual; Anexo A exige las nuevas.

## 2.6 `OrdenCompraDetalles`

| Campo nuevo | Tipo | Default | Justificación | Impacto |
|-------------|------|---------|---------------|---------|
| `DestinoItbis` | `tinyint` null | hereda header | Destino por línea (activo vs gasto) | Si línea genera activo → cat. I |
| `TasaItbis` | `decimal(5,2)` | `18` | Multi-tasa compra | |

Si `IdActivoFijoGenerado` ≠ null → sugerir destino “Activo Cat. I” (casilla 46).

## 2.7 `Proveedores`

| Campo nuevo | Tipo | Default | Justificación | Impacto |
|-------------|------|---------|---------------|---------|
| `TipoIdentificacionDgii` | `tinyint` | derivado de largo RNC | 606 tipo ID estable | Menos heurística |
| `RegimenDgii` | `nvarchar(20)` | `'ORDINARIO'` | RST / especial | Casilla 44, retenciones |
| `EsAgenteRetencion` | `bit` | `0` | Informativo | |
| `ClasificacionRetencionDefault` | `nvarchar(20)` null | null | Prefill factura compra | UX |

## 2.8 `Clientes`

| Campo nuevo | Tipo | Default | Justificación | Impacto |
|-------------|------|---------|---------------|---------|
| `TipoIdentificacionDgii` | `tinyint` | derivado | 607 | |
| `EsRegimenEspecial` | `bit` | `0` | IT-1 casilla 5 (exento por destino) | POS al elegir cliente |
| `TipoClienteFiscal` | `nvarchar(20)` null | null | Gubernamental / exportación / etc. | Prefill tipo NCF |

## 2.9 `Productos`

| Campo nuevo | Tipo | Default | Justificación | Impacto |
|-------------|------|---------|---------------|---------|
| `TasaItbis` | `decimal(5,2)` null | null = usar param global | Multi-tasa | POS cálculo |
| `CodigoExencionDgii` | `nvarchar(20)` null | null | IT-1 4/8 | |
| `TipoIngresoDgiiDefault` | `tinyint` | `1` | Anexo A 20–25 | |
| Mantener `Itbis` bool | — | — | Compatibilidad | `Itbis=0` ⇒ exento |

## 2.10 `ActivosFijos`

| Campo nuevo | Tipo | Default | Justificación | Impacto |
|-------------|------|---------|---------------|---------|
| `CategoriaDepreciacionDgii` | `tinyint` null | null | Cat. I / II / III | Casilla 46 vs IT-1 15 |
| `ItbisCapitalizado` | `decimal(18,2)` | `0` | ITBIS no deducible en activo | Anexo A 46 |
| `FechaVenta` / `MontoVenta` / `IdFacturaVenta` | fecha/decimal/int null | null | Anexo A 24 | Baja/venta |

## 2.11 `MovimientoFinanciero`

| Campo nuevo | Tipo | Default | Justificación | Impacto |
|-------------|------|---------|---------------|---------|
| `CodigoConceptoFiscal` | `nvarchar(40)` null | null | `ITBIS_PAGO`, `RET_0804`, `PAGO_CUENTA_IT1` | Anexo A 27; IT-1 31 |
| (reutiliza `ReferenciaTipo`/`ReferenciaId`) | — | — | Vínculo a factura/pago | Sin romper tesorería |

## 2.12 `ContabilidadCuentaMapeo`

**Sin columnas nuevas.** Agregar **semillas** de `CodigoConcepto`:

`ITBIS_POR_PAGAR`, `ITBIS_CREDITO_FISCAL`, `INGRESO_GRAVADO`, `INGRESO_EXENTO`, `ITBIS_RETENIDO_POR_PAGAR`, …

## 2.13 `Gastos`

**No agregar NCF/ITBIS aquí** (evitar doble fuente). Regla:

> Todo crédito fiscal entra por `OrdenCompraHeaders` (FACTC).  
> `Gastos` permanece operativo; si una línea de compra genera gasto (`IdGastoGenerado`), el ITBIS ya quedó en la compra.

## 2.14 `ParametrosConfigs`

Nuevas claves (filas, no columnas):

| Clave | Ejemplo | Uso |
|-------|---------|-----|
| `ImpuestoItbis` | `18` | Ya existe |
| `ImpuestoItbis16` | `16` | Tasa reducida |
| `ImpuestoItbis9` | `9` | Ley 690-16 |
| `ImpuestoItbis8` | `8` | Ley 690-16 |
| `DgiiDiaLimiteIt1` | `20` | Validaciones |

---

# 3. Nuevas tablas (solo las necesarias)

## 3.1 `DgiiConfiguracionEmpresa` (1:1 con `Empresas`)

**Por qué nueva:** no contaminar `Empresas` (ya muy ancha: FE, SMTP, planes).  
**Relación:** `IdEmpresa` PK/FK → `Empresas`.  
**Resuelve:** régimen, verticales, declarante, flags de auto-carga 1–8.  
**Almacena:** campos listados en 2.1 (versión satélite).

## 3.2 Catálogos seed del sistema (`DgiiCatalogo*` o una sola `DgiiCatalogo` tipada)

Ver sección 4. Preferible **una tabla** `DgiiCatalogo`:

| Columna | Tipo |
|---------|------|
| `Id` | int |
| `TipoCatalogo` | nvarchar(40) |
| `Codigo` | nvarchar(20) |
| `Nombre` | nvarchar(200) |
| `Activo` | bit |
| `Orden` | int |
| `MetaJson` | nvarchar(max) null |

**Por qué no usar solo enums en código:** DGII cambia normas; Alahia ya tiene patrón seed (`TipoBienesServices`).  
**Por qué no por empresa:** códigos oficiales son nacionales; la empresa solo elige defaults.

## 3.3 `DgiiIt1Periodo` (cabecera de declaración)

**Por qué no cabe en tablas operativas:** una liquidación es un **snapshot inmutable** del periodo (auditoría, rectificativas, saldos).  
**Relación:** `IdEmpresa` + `PeriodoAAAA MM` únicos por versión.  
**Resuelve:** guardar borrador/presentada/rectificativa; arrastre casilla 29/34.  
**Almacena:** periodo, tipo declaración, estado, totales clave, usuario, fechas, vínculo a archivos.

Campos mínimos:

- `IdIt1Periodo`, `IdEmpresa`, `Periodo` (yyyymm), `TipoDeclaracion` (ORIGINAL/RECTIFICATIVA), `Estado` (BORRADOR/CALCULADO/PRESENTADO)
- Saldos: `SaldoAFavorAnterior`, `SaldosCompensables`, `OtrosPagosACuenta`, `CompensacionesReembolsos`
- Penalidades %/montos
- Declarante, juramento timestamp
- `IdIt1PeriodoRectifica` null

## 3.4 `DgiiIt1Casilla` (detalle normalizado Anexo A + IT-1)

**Por qué:** evitar 100 columnas rígidas y permitir diff de versiones DGII.  
**Relación:** N:1 → `DgiiIt1Periodo`.  
**Almacena:** `Formulario` (`ANEXO_A`|`IT1`), `NumeroCasilla`, `Columna` (`MONTO`|`CANTIDAD`|`LOCAL`|`SERVICIO`|`IMPORT`), `Valor`, `EsManual`, `Origen` (`AUTO_607`|`AUTO_606`|`FORMULA`|`USUARIO`).

## 3.5 `DgiiAjustePeriodo` (casillas 9–10 y similares)

**Por qué no forzar en FacturaHeaders:** muestras, faltantes, primera placa, retiro personal no siempre son facturas.  
**Relación:** `IdEmpresa`, periodo; opcional `IdDocumentoOrigen`.  
**Resuelve:** auditoría de ajustes manuales del Anexo A.  
**Almacena:** tipo ajuste (+/−), monto, cantidad, glosa, usuario.

## 3.6 `DgiiImportacionItbis` (DGA)

**Por qué no forzar en OrdenCompra:** muchas liquidaciones aduaneras no son FACTC local.  
**Relación:** `IdEmpresa`, periodo; opcional vínculo a compra.  
**Resuelve:** columna Importaciones Anexo A / IT-1 24.  
**Almacena:** DUA, fecha, ITBIS pagado, `DestinoItbis`, montos.

## 3.7 `DgiiRetencionSufrida` (opcional si no cabe en factura)

Útil cuando la retención 08-04 llega por **liquidación bancaria**, no por factura.

- Relación a `MovimientoFinanciero` / periodo / factura opcional  
- Norma, monto, fecha  

Si el volumen es bajo, puede bastar `FacturaHeaders.ItbisRetenidoTarjeta0804` + movimientos tipificados.

## 3.8 Tablas que **NO** se crean

| Tentación | Decisión |
|-----------|----------|
| Tabla “VentasFiscales” espejo | Duplicaría `FacturaHeaders`; extender header |
| Tabla “ITBISCompras” espejo | Extender `OrdenCompraHeaders` |
| Gastos fiscales paralelos | Unificar en FACTC |
| Copiar todo el XLS DGII en Excel-like tables | Usar `DgiiIt1Casilla` |

---

# 4. Catálogos fiscales

| Catálogo | Códigos ejemplo | ¿Fijo sistema? | ¿Parametrizable empresa? |
|----------|-----------------|----------------|---------------------------|
| Tipo comprobante DGII | 01,02,03,04,12,14,15,16 + 31–46 | **Fijo** (seed) | Solo default de emisión |
| Tipo bienes/servicios 606 | 1–11 | **Fijo** (ya `TipoBienesServices`) | Default proveedor |
| Forma pago DGII | 1–7 | **Fijo** (ya en compras) | Default |
| Tipo ingreso Anexo A | 1=Ops … 6=Otros (→ casillas 20–25) | **Fijo** | Default producto/empresa |
| Indicador facturación / exención | gravado, exento Art.343, exento destino, exportación bien/servicio | **Fijo** | Asignación producto/cliente |
| Destino ITBIS | 1 NoDed-Exento, 2 ActivoCat1, 3 OtroNoDed, 4 Ded-Export, 5 Ded-BienGrav, 6 Ded-ServGrav, 7 Proporcional | **Fijo** | Default empresa + override compra |
| Régimen tributario | ORDINARIO, RST, ESPECIAL, SF | **Fijo** | **Sí** en config empresa/proveedor/cliente |
| Tipo retención ISR 606 | 1–9 | **Fijo** (ya) | Default |
| Norma retención ITBIS | 08-04, 02-05, 07-09, 01-11, 07-07, RST, COMP_COMPRAS | **Fijo** | Default proveedor |
| Tasa ITBIS | 18,16,9,8,0 | **Fijo** lista; **valores** en `ParametrosConfigs` | Empresa puede desactivar tasas no usadas |
| Tipo declaración IT-1 | ORIGINAL, RECTIFICATIVA | **Fijo** | — |
| Categoría activo DGII | 1,2,3 | **Fijo** | En activo |
| Concepto movimiento fiscal | ITBIS_PAGO, RET_0804, … | **Fijo** seed | Mapping cuentas empresa vía `ContabilidadCuentaMapeo` |
| Tipo ajuste periodo | MUESTRA, FALTANTE, AUTOCONSUMO, IMPUESTO_AJENO, OTRO_POS, OTRO_NEG | **Fijo** | — |

**Ya existente reutilizable:** `TipoBienesServices`, prefijos `SecuenciaECF.TipoNCF`, catalogos TS frontend `dgii-606.catalog.ts` (formalizar en BD).

---

# 5. Flujo completo de información

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────┐
│ POS / FE    │────►│ FacturaHeaders│────►│ Motor 607   │────►│ Anexo A  │
│ NC/ND       │────►│ NotasCredito  │────►│ (agregados) │     │ 1-8,12-26│
└─────────────┘     └──────────────┘     └──────────────┘     │ 43       │
                                                              │          │
┌─────────────┐     ┌──────────────────┐  ┌─────────────┐   │          │
│ FACTC       │────►│ OrdenCompraHeaders│─►│ Motor 606   │──►│ 44,45-56 │
│ Importación │────►│ DgiiImportacion…  │─►│ + destino   │   │          │
└─────────────┘     └──────────────────┘  └─────────────┘   │          │
                                                              │          │
┌─────────────┐     ┌──────────────────┐                      │          │
│ Ajustes     │────►│ DgiiAjustePeriodo │─────────────────────►│ 9-10     │
│ Tarjeta/OV  │────►│ Retención sufrida │─────────────────────►│ 27-32    │
└─────────────┘     └──────────────────┘                      └────┬─────┘
                                                                   │
                                                                   ▼
                                                            ┌──────────┐
                                                            │   IT-1   │
                                                            │ 1-68…    │
                                                            └────┬─────┘
                                                                   │
                    ┌──────────────────┐                           │
                    │ Contabilidad     │◄── validación saldos ──────┘
                    │ CuentaMapeo      │
                    └──────────────────┘
                    ┌──────────────────┐
                    │ Tesorería        │── cuadre 12-14 / pago casilla 31
                    └──────────────────┘
```

### Cómo viaja cada dato

1. **Al facturar:** se guardan NCF, bases, tasas, tipo ingreso, montos por medio de pago.  
2. **Al emitir NC:** se guarda vínculo a factura + fecha origen.  
3. **Al registrar FACTC:** se guardan campos 606 + `DestinoItbis` + split columnas.  
4. **Cierre de periodo (job/servicio):**  
   - lee ventas/NC → agrega 607 → escribe casillas Anexo A auto;  
   - lee compras/importaciones → agrega 606 + destinos → casillas 44–56;  
   - aplica ajustes y retenciones sufridas;  
   - calcula fórmulas Anexo A;  
   - proyecta IT-1;  
   - persiste `DgiiIt1Periodo` + `DgiiIt1Casilla`.  
5. **Usuario:** completa solo casillas `EsManual` y confirma saldos/compensaciones.  
6. **Contabilidad:** compara ITBIS por pagar/crédito vs declaración (no genera casillas).  
7. **Bancos:** opcionalmente alimentan 08-04 y pagos a cuenta.

---

# 6. Casillas del IT-1

Leyenda origen: **A** = Anexo A, **V** = Ventas, **C** = Compras, **CFG** = config/usuario, **F** = fórmula.

| # | Nombre | Origen | Tabla primaria | Campo / derivación | Auto | Usuario | Fórmula / regla | Dependencias |
|---|--------|--------|----------------|--------------------|------|---------|-----------------|--------------|
| 1 | Total operaciones periodo | A | `DgiiIt1Casilla` / Anexo A 11 | suma | Sí | No | = Anexo A 11 | A11 |
| 2 | Exportaciones bienes | V | `FacturaHeaders` | `EsExportacion` + no servicio | Condicional | Ajuste | Sum `MontoGravado+Exento` filtrado | V |
| 3 | Exportaciones servicios | V | igual | servicio + exportación | Condicional | Ajuste | Sum base | V |
| 4 | Exentos locales Art.343/344 | V | `MontoExento` / indicador | | Condicional | Ajuste | Sum | V |
| 5 | Exentos por destino | V+Cli | `EsExentoPorDestino` / cliente régimen | | Condicional | Ajuste | Sum | V |
| 6 | No sujetas construcción | A | Anexo A 38 | | Sí | No | = A38 | A38 |
| 7 | No sujetas comisiones | A | Anexo A 42 | | Sí | No | = A42 | A42 |
| 8 | Exentos Art.343 III/IV | V | código exención | | Condicional | Ajuste | Sum | V |
| 9 | Total no gravadas | F | | | Sí | No | 2+3+4+5+6+7+8 | 2–8 |
| 10 | Total gravadas | F | | | Sí | No | 1−9 | 1,9 |
| 11 | Gravadas 18% | V | `MontoGravadoI1` | | Condicional | Ajuste | Sum | V |
| 12 | Gravadas 16% | V | `MontoGravadoI2` | | Condicional | Ajuste | Sum | V |
| 13 | Gravadas 9% | V | `MontoGravadoI3` | | Condicional | Ajuste | Sum | V |
| 14 | Gravadas 8% | V | `MontoGravadoI4` | | Condicional | Ajuste | Sum | V |
| 15 | Activos dep. cat 2–3 | V+AF | venta activo | | Condicional | Ajuste | Sum | AF |
| 16 | ITBIS 18% | F | | | Sí | No | 11×18% | 11 |
| 17 | ITBIS 16% | F | | | Sí | No | 12×16% | 12 |
| 18 | ITBIS 9% | F | | | Sí | No | 13×9% | 13 |
| 19 | ITBIS 8% | F | | | Sí | No | 14×8% | 14 |
| 20 | ITBIS activos | F | | | Sí | No | 15×18% | 15 |
| 21 | Total ITBIS cobrado | F | | | Sí | No | 16+…+20 | 16–20 |
| 22 | ITBIS compras locales | A | Anexo A 56 col LOCAL | | Sí | No | = A56 local | A56 |
| 23 | ITBIS servicios | A | A56 SERV | | Sí | No | = A56 serv | A56 |
| 24 | ITBIS importaciones | A | A56 IMP | | Sí | No | = A56 imp | A56 |
| 25 | Total ITBIS deducible | F | | | Sí | No | 22+23+24 | 22–24 |
| 26 | Impuesto a pagar | F | | | Sí | No | max(21−25,0) | 21,25 |
| 27 | Saldo a favor | F | | | Sí | No | max(25−21,0) | 21,25 |
| 28 | Saldos compensables | CFG | `DgiiIt1Periodo` | | No | **Sí** | Manual autorizado | OV/DGII |
| 29 | Saldo a favor anterior | CFG/periodo | periodo previo casilla 34 | Semi | Confirmar | Traer anterior | Histórico |
| 30 | Pagos computables retenciones | A | Anexo A 33 | | Sí | No | = A33 | A33 |
| 31 | Otros pagos a cuenta | CFG/Bancos | movimiento fiscal / periodo | Semi | **Sí** | | Tesorería |
| 32 | Compensaciones/reembolsos | CFG | periodo | | No | **Sí** | | OV |
| 33 | Diferencia a pagar | F | | | Sí | No | si (26−28−29−30−31−32)>0 | 26–32 |
| 34 | Nuevo saldo a favor | F | | | Sí | No | reglas instructivo | 26–32 |
| 35 | Recargos | CFG | % | Semi | % usuario | base×% | 33 |
| 36 | Interés indemnizatorio | CFG | % | Semi | % usuario | | 33 |
| 37 | Sanciones | CFG | | | No | **Sí** | | |
| 38 | Total a pagar | F | | | Sí | No | 33+35+36+37 | |
| **A. Retenciones practicadas** | | | | | | | |
| 39 | Serv. retención PF | C | compras + norma PF | Condicional | Ajuste | Sum bases | C |
| 40 | Serv. ISFL 01-11 | C | | Condicional | Ajuste | | C |
| 41 | Total 39+40 | F | | | Sí | No | 39+40 | |
| 42 | Serv. sociedades 07-09 | C | | Condicional | Ajuste | | C |
| 43 | Serv. 02-05/07-07 | C | | Condicional | Ajuste | | C |
| 44 | RST 18% base | C | | Condicional | Ajuste | | C |
| 45 | RST 16% base | C | | Condicional | Ajuste | | C |
| 46 | Total RST bases | F | | | Sí | No | 44+45 | |
| 47 | Comp. compras 18% | C | | Condicional | Ajuste | | C |
| 48 | Comp. compras 16% | C | | Condicional | Ajuste | | C |
| 49 | Total comp. compras | F | | | Sí | No | 47+48 | |
| 50 | ITBIS ret PF/ISFL | F | | | Sí | No | 41×18% | 41 |
| 51 | ITBIS ret 07-09 | F | | | Sí | No | 42×18% | 42 |
| 52 | ITBIS ret 02-05/07-07 | F | | | Sí | No | 43×18%×0.30 | 43 |
| 53–55 | ITBIS RST | F | | | Sí | No | 44×18%; 45×16%; suma | |
| 56–58 | ITBIS comp. compras | F | | | Sí | No | tasas | |
| 59 | ITBIS percibido venta | CFG/V | | Poco frecuente | **Sí** inicio | | Norma percepción |
| 60 | Impuesto a pagar A | F | | | Sí | No | 50+51+52+55+58+59 | |
| 61 | Pagos a cuenta A | CFG | | | No | **Sí** | | |
| 62–63 | Diff / saldo A | F | | | Sí | No | | |
| 64–66 | Penalidades A | CFG | | Semi | | | |
| 67 | Total pagar A | F | | | Sí | No | 62+64+65+66 | |
| 68 | Total general | F | | | Sí | No | 38+67 | |

---

# 7. Casillas del Anexo A

| # | Nombre | Origen | Tabla | Campo | Auto | Usuario | Fórmula | Dependencias |
|---|--------|--------|-------|-------|------|---------|---------|--------------|
| DG | RNC, razón, comercial, correo, tel, periodo, tipo decl. | CFG/Emp | `Empresas`+config+periodo | varios | Semi | Confirmar | — | — |
| 1 | NCF crédito fiscal 01/31 | V | `FacturaHeaders` (+ECF) | tipo+`MontoGravado`… | Sí* | No* | Count/Sum | 607 |
| 2 | Consumo 02/32 | V | idem | | Sí* | No* | | 607 |
| 3 | ND 03/33 | V | | | Sí* | | | 607 |
| 4 | NC 04/34 | NC | `NotasCredito` | | Sí* | | | 607 |
| 5 | RUI 12 | V | | | Sí* | | | 607 |
| 6 | Rég. especiales 14/44 | V | | | Sí* | | | 607 |
| 7 | Gubernamentales 15/45 | V | | | Sí* | | | 607 |
| 8 | Exportaciones 16/46 | V | | | Sí* | | | 607 |
| 9 | Otras ops positivas | Ajuste | `DgiiAjustePeriodo` | tipo + | No | **Sí** | Sum | Inventarios/manual |
| 10 | Otras ops negativas | Ajuste | idem | tipo − | No | **Sí** | Sum | Manual |
| 11 | Total operaciones | F | | | Sí | No | 1+2+3−4+5+6+7+8+9−10 | 1–10 |
| 12 | Efectivo | V | `MontoEfectivo` | | Sí | Ajuste | Sum Total con imp. | V |
| 13 | Cheque/Transferencia | V | cheques+transfer | | Sí | Ajuste | | V |
| 14 | Tarjeta | V | visas+mc | | Sí | Ajuste | | V |
| 15 | A crédito | V | tipo crédito / pendiente | | Semi | Ajuste | Regla negocio | V |
| 16 | Bonos | V | `MontoBonos` | | Si campo | **Sí** si usa | | |
| 17 | Permutas | V | `MontoPermuta` | | Si campo | **Sí** | | |
| 18 | Otras formas | V | `MontoOtraFormaVenta` | | Si campo | **Sí** | | |
| 19 | Total tipo venta | F | | | Sí | No | 12…18 | *No debe =11 necesariamente* |
| 20 | Ingresos operaciones | V | `TipoIngresoDgii=1` | base s/imp | Sí | Ajuste | | V |
| 21 | Financieros | V | tipo=2 | | Semi | **Sí** tip | | |
| 22 | Extraordinarios | V | tipo=3 | | Semi | **Sí** | | |
| 23 | Arrendamientos | V | tipo=4 | | Semi | **Sí** | | |
| 24 | Venta activos dep. | V+AF | tipo=5 / activo | | Semi | **Sí** | | |
| 25 | Otros ingresos | V | tipo=6 | | Semi | **Sí** | | |
| 26 | Total tipo ingreso | F | | | Sí | No | 20…25 | |
| 27 | Retención 08-04 | V/Bancos | `ItbisRetenidoTarjeta0804` / ret sufrida | | Semi | Confirmar | Sum | Liquidaciones |
| 28 | Pasajes aéreos 02-05 | Manual/sector | | | No | **Sí** | | Vertical |
| 29 | Otras retenciones 02-05 | V/Manual | `ItbisRetenidoTercero` | | Semi | **Sí** | | |
| 30 | Paquetes hotel | Manual | | | No | **Sí** | | Vertical |
| 31 | Retención Estado | V/Manual | | | Semi | **Sí** | | |
| 32 | ITBIS percibido | Manual | | | No | **Sí**/disable | | Norma |
| 33 | Total ret/perc | F | | | Sí | No | 27…32 | |
| 34–36 | Constructoras | Config+manual | | | No** | **Sí** si constructor | | Flag empresa |
| 37 | Total constructoras | F | | | Sí | No | 34+35(+36 monto) | |
| 38 | No sujetas construcción | F | | | Sí | No | Facturado37 − Monto37 | |
| 39–40 | Comisionistas | Manual | | | No** | **Sí** si comisionista | | |
| 41 | Total comisionistas | F | | | Sí | No | 39+40 | |
| 42 | No sujetas comisiones | F | | | Sí | No | Fact−Monto | |
| 43 | NC >30 días | NC | fechas origen | | Sí | Revisar | Sum NC con días>30 | NC |
| 44 | Compras régimen especial | C | NCF14 / flag proveedor | | Sí | Revisar | Sum total 606 | 606 |
| 45 | ITBIS no ded. exentos | C | `DestinoItbis=1` | split cols | Semi | Clasificar | Sum ITBIS | 606 |
| 46 | ITBIS a activo cat I | C/AF | destino=2 | | Semi | Clasificar | | |
| 47 | Otros no deducibles | C | destino=3 | | Semi | Clasificar | | |
| 48 | Total no deducible | F | | | Sí | No | 45+46+47 | |
| 49 | Ded. exportación | C | destino=4 | | Semi | Clasificar | | |
| 50 | Ded. bienes gravados | C | destino=5 | | Semi | Clasificar | | |
| 51 | Ded. servicios gravados | C | destino=6 | | Semi | Clasificar | | |
| 52 | Total ded. no proporc. | F | | | Sí | No | 49+50+51 | |
| 53 | Sujeto proporcionalidad | C | destino=7 / `ItbisProporcionalidad` | | Semi | Clasificar | | Art.349 |
| 54 | Coeficiente % | F from IT-1 | (2+5+10)/1×100 | | Sí | Revisar | | IT-1 1,2,5,10 |
| 55 | ITBIS admitido proporc. | F | | | Sí | No | 53×54 | |
| 56 | Total ITBIS deducible | F | | | Sí | No | 52+55 | **Cuadre 606** |

\*Auto salvo regímenes donde OV no autocompleta desde 607 (RST, Libro SF, solo e-CF): entonces el motor usa los mismos fuentes internos pero marca origen `AUTO_LIBRO`/`AUTO_ECF`.  
\*\*Secciones deshabilitadas si flags empresa = false.

---

# 8. Datos faltantes (prioridad)

## Obligatorio (bloquea IT-1 confiable)

| Dato | Dónde residirá |
|------|----------------|
| Código tipo comprobante DGII en ventas/NC | `FacturaHeaders` / `NotasCredito` |
| Bases `MontoGravado` / exento / por tasa | `FacturaHeaders` (+ detalle tasa) |
| Inclusión NC en agregación 607 | proceso + `NotasCredito` |
| Fecha factura origen en NC (ya hay Id; falta materializar fecha) | `NotasCredito.FechaFacturaOrigen` |
| `DestinoItbis` + split local/servicios/import. | `OrdenCompraHeaders` |
| Tipificación norma/base retención ITBIS en compras | compras |
| Config régimen empresa | `DgiiConfiguracionEmpresa` |
| Snapshot periodo declaración | `DgiiIt1Periodo` + casillas |
| 607 completo (campos oficiales) | extensión reporte existente |
| Cuadre ITBIS por adelantar 606 ↔ Anexo A 56 | validación motor |

## Recomendado

| Dato | Dónde |
|------|-------|
| Tipo ingreso DGII | factura/producto |
| Flags cliente/proveedor régimen | maestros |
| `TasaItbis` en producto | `Productos` |
| Categoría DGII activo + ITBIS capitalizado | `ActivosFijos` |
| Retención 08-04 trazable | factura y/o movimiento |
| Importaciones DGA | `DgiiImportacionItbis` |
| Ajustes 9–10 auditables | `DgiiAjustePeriodo` |
| Mapeo contable ITBIS | semillas `ContabilidadCuentaMapeo` |
| Bonos/permutas | montos en factura |

## Opcional (vertical / fase posterior)

| Dato | Notas |
|------|-------|
| Constructoras / comisionistas detalladas | solo si flags |
| ITBIS percibido | casilla 32/59 |
| Integración OV DGII API | compatibilidad futura |
| Multi-tasa 9/8 | si productos Ley 690-16 |

---

# 9. Riesgos

## 9.1 Qué puede romperse

| Área | Riesgo | Mitigación |
|------|--------|------------|
| POS / `ProcesarFactura` | Nuevos campos not-null sin default | Defaults + backfill nullable |
| FACTC UI | Más campos obligatorios → fricción | Defaults inteligentes por producto/proveedor |
| 606 TXT actual | Cambiar semántica de `ItbisProporcionalidad` | Mantener campos 606; destino Anexo A es capa aparte |
| Reportes existentes | Agregaciones asumen una sola tasa 18% | Dual path: legacy + fiscal |
| Contabilidad integración | Asientos sin cuentas ITBIS | Semillas mapeo antes de conciliar |
| Performance cierre mensual | Scan de todas facturas/compras | Índices `(IdEmpresa, FechaInseccion)` + materializar snapshot |

## 9.2 Procesos fiscales delicados

1. Cuadre **606 ITBIS por adelantar** vs suma Anexo A deducible+proporcional (local+servicios).  
2. Casillas **1–8** vs regímenes especiales de auto-completado.  
3. **NC > 30 días** (43) vs ajuste casilla 9.  
4. **Proporcionalidad Art. 349** y casilla 54 (debe recalcularse desde IT-1).  
5. Credito vs contado en casillas **12–15** (momento del compromiso vs cobro).  
6. Retenciones sección A vs **IR-17** (alerta OV).  

## 9.3 Diferencias posibles vs DGII

- Redondeos (definir política 2 decimales por línea vs documento).  
- Propina legal incluida/excluida de bases.  
- e-CF `MontoGravado` vs `SubTotal − descuentos`.  
- Heurística forma de pago vs realidad del cobro posterior (`PagosFacturasClientes`).  
- Compras en `Gastos` sin NCF omitidas (correcto fiscalmente, sorprende al usuario).  

## 9.4 Validaciones obligatorias del motor

- Σ (11…15) = casilla 10 IT-1.  
- A56 local+serv ≤ ITBIS por adelantar 606 (según reglas OV).  
- A11 coherente con Σ tipos NCF ± ajustes.  
- Periodo cerrado: no incluir `EstaCancelada` / FACTC `ANULADA`/`BORRADOR`.  
- Empresa RNC requerido.  
- Rectificativa referencia a periodo original.  
- Destino ITBIS requerido si `TotalItbis > 0` en FACTC.

---

# 10. Roadmap de implementación (tareas ordenadas)

## Sprint A — Modelo de datos fiscal mínimo
1. Crear `DgiiCatalogo` + seeds (tipos NCF, destino ITBIS, tipo ingreso, normas).  
2. Crear `DgiiConfiguracionEmpresa`.  
3. Extender `FacturaHeaders` (tipo comprobante, bases, tasas, tipo ingreso).  
4. Extender `FacturaDetalles` (`TasaItbis`).  
5. Extender `NotasCredito` (`FechaFacturaOrigen`, tipo comprobante, bases).  
6. Extender `OrdenCompraHeaders` (destino + columnas ITBIS + norma retención).  
7. Extender `Proveedores` / `Clientes` (régimen).  
8. Extender `Productos` (`TasaItbis` nullable).  
9. Scripts Dev-only (`AlahiaPos_Dev`); backfill: derivar tipo NCF desde prefijo; destino default=5/6 según bienes/servicios.

## Sprint B — Captura operativa (sin UI IT-1)
10. Ajustar **POS / ProcesarFactura** para persistir bases y tipo comprobante.  
11. Ajustar **emisión NC** (fecha origen, inclusión fiscal).  
12. Ajustar **FACTC** (destino ITBIS, split columnas, norma).  
13. Defaults desde producto/proveedor/cliente.  
14. Pruebas de no regresión venta/compra.

## Sprint C — 607 completo
15. Ampliar DTO/servicio 607 a layout DGII.  
16. Incluir NC/ND; tipos 01–16/31–46.  
17. Mapear formas de pago a columnas DGII.  
18. Generar **TXT 607**.  
19. UI reporte 607 (export) — mínima.  
20. Validaciones de completitud NCF/RNC.

## Sprint D — 606 alineado a Anexo A
21. Mantener TXT 606 actual.  
22. Validar que `ItbisLlevadoAlCosto` / proporcionalidad alimenten destinos.  
23. Reporte auxiliar: “ITBIS por destino” del periodo.  
24. Regla casilla 44 (régimen especial).  
25. (Opcional) tipificar retención ITBIS distinta de ISR.

## Sprint E — Motor Anexo A
26. Crear `DgiiIt1Periodo` + `DgiiIt1Casilla` + `DgiiAjustePeriodo`.  
27. Servicio `CalcularAnexoA(idEmpresa, periodo)`.  
28. Agregadores desde 607/606/ajustes/retenciones.  
29. Fórmulas 11,19,26,33,38,42,48,52,54–56.  
30. Persistencia snapshot + marca `EsManual`.  
31. Validación cuadre 606.

## Sprint F — Motor liquidación IT-1
32. Servicio `CalcularIt1` leyendo Anexo A + ventas clasificadas.  
33. Casillas 1–38 + sección A 39–68 (según datos).  
34. Saldo a favor anterior automático desde periodo previo.  
35. Penalidades semi-auto.  
36. Estados BORRADOR → CALCULADO.

## Sprint G — Conciliación y datos de apoyo
37. Semillas `ContabilidadCuentaMapeo` ITBIS.  
38. Reporte diferencia GL vs declaración.  
39. `CodigoConceptoFiscal` en movimientos (08-04 / pago ITBIS).  
40. Módulo importaciones DGA (si aplica).  
41. Categoría DGII en activos.

## Sprint H — UI y cierre
42. Pantalla configuración fiscal empresa.  
43. Pantalla clasificación destinos compras (masiva).  
44. Pantalla declaración IT-1 (revisión casillas, overrides).  
45. Ajustes 9–10 UI.  
46. Export PDF/Excel de apoyo (no sustituye OV).  
47. Bloqueo de periodo / auditoría.

## Sprint I — Pruebas y cumplimiento
48. Casos: solo B01/B02 retail; con NC; con crédito; FE e-CF.  
49. Caso mixto gravado/exento → proporcionalidad.  
50. Caso FACTC con retenciones.  
51. Comparar totales vs Excel DGII `IT-1-2020.xls` con juego de datos controlado.  
52. Documentar limitaciones (RST, constructores) para clientes.

**Orden estricto:** A → B → C → D → E → F → (G en paralelo a E/F) → H → I.

---

# 11. Recomendaciones de arquitecto

## Qué haría diferente (y por qué)

1. **Tratar 607/606 como contratos internos versionados**, no solo “reportes TXT”. El Anexo A debe consumir la misma API de agregación que el TXT.  
2. **Preferir satélite `DgiiConfiguracionEmpresa`** antes de seguir engordando `Empresas`.  
3. **No fiscalizar `Gastos`**: forzar que el crédito pase por FACTC evita doble verdad.  
4. **Snapshot de casillas (`DgiiIt1Casilla`)** en lugar de 120 columnas: DGII cambia instructivos; Alahia ya sufrió eso con FE.  
5. **Derivar tipo comprobante al emitir**, no pedírselo siempre al cajero; el cajero elige B01/B02 como hoy, el sistema guarda código DGII.

## Errores a evitar

- Generar IT-1 **sin** 607/606 consistentes.  
- Usar `SubTotal` como si siempre fuera base gravada (descuentos, exentos, propina).  
- Mezclar **ISR retenido** (`TipoRetencionIsr`) con **ITBIS retenido** en la misma semántica.  
- Hardcodear “todo es 18%” en el motor nuevo.  
- Calcular casilla 15/19 Anexo A esperando igualdad con casilla 11.  
- Implementar UI IT-1 antes de endurecer captura en POS/FACTC (basura entrada → basura declaración).  
- Romper el TXT 606 actual al agregar destinos Anexo A.

## Qué dejar preparado

- `CodigoConcepto` contable alineado a futuros **ISR / IR-17**.  
- Catálogo DGII genérico reutilizable.  
- Periodo fiscal genérico (`DgiiIt1Periodo` renombrable mentalmente a `DgiiDeclaracionPeriodo` con `TipoFormulario`).  
- Hooks de evento `PeriodoFiscalCalculado` para notificaciones/OV.  
- Idempotencia de cálculo (re-corridas no duplican; versionan).

## Mejoras de arquitectura ERP

- Separar **capa de compliance DGII** (`AlahiaPos.DataAccess/Servicios/Dgii/`) de POS.  
- Un único **TaxClassificationService** usado por POS, FACTC, 606, 607, IT-1.  
- Política de redondeo documentada y unit-testeada.  
- Backfill tools (Dev) para reclasificar históricos antes de primer IT-1 real.

---

# 12. Compatibilidad futura

| Capacidad futura | ¿La arquitectura lo soporta? | Cómo |
|------------------|------------------------------|------|
| **IR-17** | Sí | Reutiliza compras tipificadas + normas retención; nueva declaración periodo `TipoFormulario=IR17` con mismas tablas casilla; ya hay ISR en 606 |
| **ISR (IR-1/IR-2)** | Parcial → Sí | Necesitará agregados de resultado (contabilidad + activos + nómina si aplica); el patrón periodo+casillas+catálogo escala |
| **Estados financieros** | Sí (paralelo) | Contabilidad ya existe; mapeo conceptos evita mezclar fiscal DGII con NIIF/local books |
| **Declaraciones automáticas** | Sí | Snapshots + estado PRESENTADO + jobs mensuales |
| **Integración Oficina Virtual DGII** | Sí | Capa adaptadora sobre `DgiiIt1Periodo`; no acoplar POS a OV; guardar `TrackId`/acuse como en `ECFEncabezado` |
| **e-CF masivo** | Sí | `ECFEncabezado` ya es fuente; unificar códigos tipo 31–46 con `CodigoTipoComprobanteDgii` |
| **Multi-empresa / SaaS** | Sí | Todo filtrado por `IdEmpresa` (patrón Alahia) |
| **Cambios instructivo IT-1** | Sí | Catálogo + casillas normalizadas; versionar `VersionInstructivo` en periodo |

**Límite consciente:** nómina / seguridad social no están en este plano; ISR de personas físicas laborales requeriría módulo RRHH futuro.

---

## Apéndice A — Decisiones de reutilización (resumen ejecutivo)

| Necesidad fiscal | Solución Alahia |
|------------------|-----------------|
| Ventas gravadas | Extender `FacturaHeaders` |
| NC | Extender `NotasCredito` (ya FK factura) |
| Compras / 606 | Extender `OrdenCompraHeaders` (ya DGII) |
| Config | Nueva `DgiiConfiguracionEmpresa` |
| Declaración | Nuevas `DgiiIt1Periodo` + `DgiiIt1Casilla` |
| Ajustes 9–10 | Nueva `DgiiAjustePeriodo` |
| Importaciones | Nueva `DgiiImportacionItbis` |
| Catálogos | `DgiiCatalogo` (+ reusar `TipoBienesServices`) |
| Conciliación | Semillas `ContabilidadCuentaMapeo` |
| No tocar como fuente ITBIS | `Gastos` |

---

## Apéndice B — Relación con el documento de análisis previo

Este plano **concreta** `docs/IT1-Analisis-Almacenamiento-Datos.md` en decisiones de esquema y secuencia de trabajo alineadas al código real de Alahia.  
Cualquier implementación posterior debe:

1. respetar este orden de sprints,  
2. no inventar tablas espejo de ventas/compras,  
3. mantener 606 TXT estable,  
4. trabajar solo contra **`AlahiaPos_Dev`** hasta autorización explícita de Prod.

---

**Fin del plano maestro.**
