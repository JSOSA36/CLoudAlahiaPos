# Sprint C — Plano Maestro: Motor 607 desacoplado

**Estado:** Documento de diseño (sin implementación)  
**Prerrequisitos:** Sprint A (modelo fiscal) + Sprint B/B.1 (desacoplamiento + outbox)  
**Base normativa:** Norma General 07-2018, Norma General 05-2019  
**Objetivo:** Definir columna por columna el layout oficial DGII 607, mapear cada campo a Alahia ERP, identificar brechas y establecer la hoja de ruta para construir un motor 607 que sea la **fuente oficial** para alimentar Anexo A e IT-1 en sprints posteriores.

**Regla cardinal:** Toda la información del 607 proviene de la **fotografía fiscal** capturada en Sprint A/B. El motor 607 **nunca recalcula** desde el POS; solo lee datos ya congelados.

> **Principio de arquitectura vinculante:** ver `docs/Arquitectura-Motor-Fiscal-Central.md`. El 607 no es el centro de la arquitectura fiscal. Es un **generador derivado** del Motor Fiscal Central. La fuente oficial son las fotografías fiscales + e-CF. Este sprint implementa el primer generador de esa arquitectura.

---

## 1. Estructura general del archivo TXT 607

El archivo TXT generado por la herramienta oficial DGII se compone de:

| Sección | Formato | Separador |
|---------|---------|-----------|
| **Encabezado** (1 línea) | `607\|RNC_EMISOR\|PERIODO_AAAAMM\|CANTIDAD_REGISTROS` | Pipe `\|` |
| **Detalle** (N líneas) | 23 campos por línea, separados por pipe | Pipe `\|` |

Máximo 65,000 registros por archivo.  
Decimales con punto (`.`), formato `0.00`.  
Fechas en formato `AAAAMMDD`.

---

## 2. Layout columna por columna — Detalle del 607

### 2.1 Tabla maestra de columnas

| # | Columna DGII | Tipo | Formato | Obligatorio | Regla DGII |
|---|-------------|------|---------|-------------|------------|
| 1 | RNC/Cédula o Pasaporte del comprador | Alfanumérico | 9 (RNC), 11 (Céd), variable (Pasaporte) | Sí para B01/B14/B15; Opcional para B02 < 250K | Solo dígitos para RNC/Céd |
| 2 | Tipo Identificación | Numérico | 1 dígito | Sí | 1=RNC, 2=Cédula, 3=Pasaporte |
| 3 | Número Comprobante Fiscal (NCF) | Alfanumérico | 11 o 13 posiciones (e-CF) | Sí | Incluye serie+secuencia. 19 pos. solo pre-mayo-2018 |
| 4 | NCF Modificado | Alfanumérico | 11 o 13 posiciones | Solo NC/ND | NCF de factura afectada por NC (B04) o ND (B03) |
| 5 | Tipo de Ingreso | Numérico | 1 dígito | Sí | 1-6 (ver §2.2) |
| 6 | Fecha Comprobante | Fecha | AAAAMMDD | Sí | Fecha de emisión del documento |
| 7 | Fecha de Retención | Fecha | AAAAMMDD | Condicional | Obligatorio si cols 10 o 12 > 0. Vacío si no aplica |
| 8 | Monto Facturado | Decimal | 0.00 | Sí | Valor venta **sin** impuestos (base imponible + exento) |
| 9 | ITBIS Facturado | Decimal | 0.00 | Sí | ITBIS cobrado al cliente (sin otros impuestos) |
| 10 | ITBIS Retenido por Terceros | Decimal | 0.00 | Condicional | ITBIS que el cliente retuvo. Requiere campo 7 |
| 11 | ITBIS Percibido | Decimal | 0.00 | No habilitado | Siempre 0 (sin normativa vigente) |
| 12 | Retención Renta por Terceros (ISR) | Decimal | 0.00 | Condicional | ISR retenido por el cliente. Requiere campo 7 |
| 13 | ISR Percibido | Decimal | 0.00 | No habilitado | Siempre 0 (sin normativa vigente) |
| 14 | Impuesto Selectivo al Consumo | Decimal | 0.00 | No | Solo si venta gravada con ISC |
| 15 | Otros Impuestos/Tasas | Decimal | 0.00 | No | Impuestos no especificados en otros campos |
| 16 | Monto Propina Legal | Decimal | 0.00 | No | Propina Ley 54-32 (10%) |
| 17 | Efectivo | Decimal | 0.00 | Condicional | Porción cobrada en efectivo **con impuestos** |
| 18 | Cheque/Transferencia/Depósito | Decimal | 0.00 | Condicional | Porción por cheque, transferencia o depósito **con impuestos** |
| 19 | Tarjeta Débito/Crédito | Decimal | 0.00 | Condicional | Porción por tarjeta **con impuestos** |
| 20 | Venta a Crédito | Decimal | 0.00 | Condicional | Porción a crédito **con impuestos** |
| 21 | Bonos o Certificados de Regalo | Decimal | 0.00 | Condicional | Porción en bonos **con impuestos** |
| 22 | Permuta | Decimal | 0.00 | Condicional | Porción por permuta **con impuestos** |
| 23 | Otras Formas de Venta | Decimal | 0.00 | Condicional | Otras formas **con impuestos** |

**Regla de cuadre medios de pago:** `Col17 + Col18 + Col19 + Col20 + Col21 + Col22 + Col23 = MontoFacturado + ITBIS + ISC + OtrosImpuestos + Propina` (total bruto).

### 2.2 Tipos de Ingreso (Campo 5)

| Código | Descripción | Casilla Anexo A |
|--------|-------------|-----------------|
| 1 | Ingresos por operaciones (no financieras) | 20 |
| 2 | Ingresos financieros | 21 |
| 3 | Ingresos extraordinarios | 22 |
| 4 | Ingresos por arrendamientos | 23 |
| 5 | Ingresos por venta de activo depreciable | 24 |
| 6 | Otros ingresos | 25 |

### 2.3 Tipos de NCF que entran al 607

| Serie | Tipo | Descripción | Entra al 607 |
|-------|------|-------------|:------------:|
| B01 | Crédito Fiscal | Factura a empresa con RNC | Sí |
| B02 | Consumo | Factura consumidor final | Sí (≥250K detallado; <250K resumen) |
| B03 | Nota de Débito | Ajuste en aumento | Sí |
| B04 | Nota de Crédito | Devolución / ajuste | Sí (con NCF modificado) |
| B12 | Registro Único Ingresos | Gastos menores | Sí |
| B14 | Regímenes Especiales | Exonerados / zonas francas | Sí |
| B15 | Gubernamental | Ventas al gobierno | Sí |
| B16 | Exportación | Ventas al exterior | Sí |
| E31 | e-CF Crédito Fiscal | Equivalente electrónico B01 | Sí |
| E32 | e-CF Consumo | Equivalente electrónico B02 | Sí |
| E33 | e-CF Nota de Débito | Equivalente electrónico B03 | Sí |
| E34 | e-CF Nota de Crédito | Equivalente electrónico B04 | Sí |
| E44 | e-CF Regímenes Especiales | Equivalente electrónico B14 | Sí |
| E45 | e-CF Gubernamental | Equivalente electrónico B15 | Sí |
| E46 | e-CF Exportación | Equivalente electrónico B16 | Sí |

---

## 3. Mapeo columna → origen en Alahia ERP

### 3.1 Documentos fuente

El 607 incluye **facturas de venta** y **notas de crédito** del periodo. En Alahia ERP esto se traduce en:

| Tipo documento | Entidad ERP | Filtro |
|----------------|-------------|--------|
| Factura de venta | `FacturaHeaders` | `IdTipoDocumentos = 1`, `EstaCancelada = false`, con NCF |
| Nota de crédito | `NotasCredito` | Con NCF, periodo fiscal, empresa |

### 3.2 Mapeo detallado columna por columna

| # | Columna DGII | Origen Alahia ERP | ¿Existe hoy? | Fuente (foto/operativo/nuevo) | Notas |
|---|-------------|-------------------|:-------------:|-------------------------------|-------|
| 1 | RNC/Cédula Comprador | **Factura:** `FacturaHeaders.RNC` (del cliente) → limpieza dígitos. Si vacío, buscar `Clientes.CedulaRNC` via `IDCliente`. **NC:** `NotasCredito.RNC` o `Clientes.CedulaRNC` via `IdCliente` | **Parcial** | Operativo | B02 sin RNC: campo vacío si < 250K. B01/B14/B15: obligatorio |
| 2 | Tipo Identificación | Derivado de longitud del campo 1: 9 dígitos = 1 (RNC), 11 dígitos = 2 (Cédula). Si `Clientes.TipoIdentificacionDgii` existe, usar ese valor. Pasaporte = 3 | **Parcial** | Operativo + Sprint A (`TipoIdentificacionDgii`) | `Clientes.TipoIdentificacionDgii` fue creado en Sprint A pero no siempre está poblado. Fallback: inferir por longitud |
| 3 | NCF | **Factura:** `FacturaHeaders.NCF`. **NC:** `NotasCredito.NCF` | **Sí** | Operativo | Trim + uppercase. Validar 11 o 13 posiciones |
| 4 | NCF Modificado | **NC:** `NotasCredito.NCFModificado`. **Factura normal:** vacío | **Sí** (NC) | Operativo | Solo aplica para B04/E34 (NC) y B03/E33 (ND) |
| 5 | Tipo de Ingreso | **Factura:** `FacturaHeaders.TipoIngresoDgii`. **NC:** `NotasCredito.TipoIngresoDgii` | **Sí** | Fotografía fiscal (Sprint A) | Default = 1 (operaciones no financieras). Fotografía lo congela al emitir |
| 6 | Fecha Comprobante | **Factura:** `FacturaHeaders.FechaInseccion`. **NC:** `NotasCredito.FechaInseccion` | **Sí** | Operativo | Formato AAAAMMDD |
| 7 | Fecha Retención | **No existe.** Requiere campo nuevo o derivación | **No** | **NUEVO** | Solo se llena si col 10 o 12 > 0. Fuente: fecha en que el cliente (agente retenedor) practicó la retención |
| 8 | Monto Facturado | **Factura:** `FacturaHeaders.MontoGravado + FacturaHeaders.MontoExento` (foto fiscal). **NC:** `NotasCredito.MontoGravado + NotasCredito.MontoExento` | **Sí** | Fotografía fiscal (Sprint A) | Base sin impuestos. Usar foto, no recalcular SubTotal-ITBIS |
| 9 | ITBIS Facturado | **Factura:** `FacturaHeaders.TotalItbis`. **NC:** `NotasCredito.TotalItbis` | **Sí** | Operativo (congelado en foto) | Cuadre: MontoGravado × TasaItbis ≈ TotalItbis |
| 10 | ITBIS Retenido por Terceros | **No existe.** Campo nuevo en FacturaHeaders | **No** | **NUEVO** | Cuando el cliente es agente de retención (Norma 02-05). Requiere fecha retención (col 7) |
| 11 | ITBIS Percibido | Siempre `0.00` | N/A | Constante | Sin normativa vigente que habilite percepción |
| 12 | Retención Renta por Terceros (ISR) | **No existe.** Campo nuevo en FacturaHeaders | **No** | **NUEVO** | ISR retenido por el cliente al pagar. Requiere fecha retención (col 7) |
| 13 | ISR Percibido | Siempre `0.00` | N/A | Constante | Sin normativa vigente |
| 14 | Impuesto Selectivo al Consumo | **No existe.** Campo nuevo si aplica | **No** | **NUEVO** | Aplica solo a productos gravados con ISC (bebidas alcohólicas, tabaco, etc.). Raro en POS retail |
| 15 | Otros Impuestos/Tasas | **No existe.** | **No** | **NUEVO** | Otros tributos fuera de ITBIS/ISC. Normalmente 0 |
| 16 | Monto Propina Legal | **Factura:** `FacturaHeaders.MontoPropina` (campo existente). También en foto: `FacturaHeaders.MontoPropinaLegal` | **Sí** | Operativo / Fotografía | Ley 54-32 (10%). Usar `MontoPropinaLegal` de la foto si está poblado; fallback a `MontoPropina` |
| 17 | Efectivo | **Factura:** `FacturaHeaders.MontoEfectivo` | **Sí** | Operativo | **Incluir impuestos.** Debe sumarse con cols 18-23 para igualar total bruto |
| 18 | Cheque/Transfer/Depósito | **Factura:** `FacturaHeaders.MontoTransferencia + FacturaHeaders.MontoCheques` | **Sí** | Operativo | Sumar transferencias + cheques en una sola columna |
| 19 | Tarjeta Débito/Crédito | **Factura:** `FacturaHeaders.MontoTarjetaVisa + FacturaHeaders.MontoTarjetaMasterCard` | **Sí** | Operativo | Sumar ambas marcas |
| 20 | Venta a Crédito | **Factura:** derivado de `FacturaHeaders.Pendiente` si `TipoFactura` contiene "Credito" o `Plazo != ""` | **Parcial** | Operativo + derivación | Si la factura es a crédito, el monto total bruto va aquí. Mixto: prorratear |
| 21 | Bonos/Certificados Regalo | **Factura:** `FacturaHeaders.MontoNotaCredito` (pago con NC) | **Parcial** | Operativo | Mapear pagos con NC del cliente como "bonos" o evaluar si es "Otras formas" |
| 22 | Permuta | **No existe.** | **No** | **NUEVO** | Raro en operación Alahia típica. Default 0 |
| 23 | Otras Formas de Venta | Residuo: Total bruto - suma(cols 17-22) | **Derivado** | Cálculo | Catch-all para cuadrar |

### 3.3 Columnas para Notas de Crédito

Las NC se reportan en el 607 con las mismas 23 columnas. Diferencias clave:

| Aspecto | Factura | Nota de Crédito |
|---------|---------|-----------------|
| NCF | `NotasCredito.NCF` (B04/E34) | Mismo campo |
| NCF Modificado (col 4) | Vacío | `NotasCredito.NCFModificado` (NCF de factura afectada) |
| Montos | Positivos | **Positivos** (DGII resta internamente) |
| Medios de pago (17-23) | Desglose real | Total bruto en col 23 ("Otras formas") salvo evidencia del medio original |
| Tipo Ingreso | Del documento | Heredado de la factura origen (foto fiscal) |
| Fecha Comprobante | Fecha emisión NC | `NotasCredito.FechaInseccion` |

---

## 4. Análisis de brechas

### 4.1 Campos que ya existen y son suficientes

| # | Columna | Fuente actual | Estado |
|---|---------|---------------|--------|
| 3 | NCF | `FacturaHeaders.NCF` / `NotasCredito.NCF` | OK |
| 4 | NCF Modificado | `NotasCredito.NCFModificado` | OK |
| 5 | Tipo Ingreso | `FacturaHeaders.TipoIngresoDgii` / `NotasCredito.TipoIngresoDgii` | OK (foto Sprint A) |
| 6 | Fecha Comprobante | `FechaInseccion` | OK |
| 8 | Monto Facturado | `MontoGravado + MontoExento` (foto) | OK |
| 9 | ITBIS Facturado | `TotalItbis` | OK |
| 11 | ITBIS Percibido | Constante 0 | OK |
| 13 | ISR Percibido | Constante 0 | OK |
| 16 | Propina Legal | `MontoPropina` / `MontoPropinaLegal` | OK |
| 17 | Efectivo | `MontoEfectivo` | OK |
| 18 | Cheque/Transfer | `MontoTransferencia + MontoCheques` | OK (sumar) |
| 19 | Tarjeta | `MontoTarjetaVisa + MontoTarjetaMasterCard` | OK (sumar) |

### 4.2 Campos que existen parcialmente (requieren lógica de derivación)

| # | Columna | Situación | Acción requerida |
|---|---------|-----------|------------------|
| 1 | RNC/Cédula | `FacturaHeaders.RNC` a veces vacío o con formato inconsistente | Fallback a `Clientes.CedulaRNC`. Limpiar a solo dígitos |
| 2 | Tipo Identificación | `Clientes.TipoIdentificacionDgii` creado Sprint A pero raramente poblado | Inferir por longitud: 9=RNC, 11=Cédula. Usar `TipoIdentificacionDgii` si existe |
| 20 | Venta a Crédito | No hay campo directo; deducible de `TipoFactura`, `Plazo`, `Pendiente` | Crear lógica: si factura crédito, col 20 = total bruto |
| 21 | Bonos/Certificados | `MontoNotaCredito` cubre pago con NC pero no es exactamente "bono DGII" | Evaluar mapping; posiblemente → col 23 |

### 4.3 Campos que NO existen (brechas Sprint C)

| # | Columna | Campo propuesto | Prioridad | Notas |
|---|---------|----------------|:---------:|-------|
| 7 | Fecha Retención | `FechaRetencionTercero` en `FacturaHeaders` (nullable `DateTime?`) | Media | Solo aplica si cliente es agente retenedor. Vacío la mayoría del tiempo |
| 10 | ITBIS Retenido por Terceros | `ItbisRetenidoPorTercero` en `FacturaHeaders` (decimal, default 0) | Media | Cuando gobierno o gran contribuyente retiene ITBIS al pagar |
| 12 | Retención ISR por Terceros | `IsrRetenidoPorTercero` en `FacturaHeaders` (decimal, default 0) | Media | ISR retenido por el cliente |
| 14 | Impuesto Selectivo Consumo | `ImpuestoSelectivoConsumo` en `FacturaHeaders` (decimal, default 0) | Baja | Raro en retail/servicios Alahia típico |
| 15 | Otros Impuestos/Tasas | `OtrosImpuestos` en `FacturaHeaders` (decimal, default 0) | Baja | Normalmente 0 |
| 22 | Permuta | `MontoPermuta` en `FacturaHeaders` (decimal, default 0) | Baja | Raro en operación típica |

### 4.4 Campo derivado (no requiere columna nueva)

| # | Columna | Derivación |
|---|---------|------------|
| 23 | Otras Formas | `TotalBruto - (Efectivo + Cheque/Transfer + Tarjeta + Crédito + Bonos + Permuta)` |

### 4.5 Dato faltante en Notas de Crédito para medios de pago

`NotasCredito` actualmente **no tiene** campos de medios de pago (MontoEfectivo, MontoTarjeta, etc.). Para el 607, las NC pueden reportar el total bruto en columna 23 ("Otras formas") como simplificación válida, ya que la DGII acepta un solo medio de pago en NC.

---

## 5. Reglas de validación pre-exportación

### 5.1 Validaciones por registro

| # | Validación | Severidad | Acción |
|---|-----------|-----------|--------|
| V1 | NCF no vacío, longitud 11 o 13, formato alfanumérico | **Error** | Excluir del TXT; marcar alerta |
| V2 | NCF sin duplicados en el periodo (mismo NCF + mismo RNC) | **Error** | Eliminar duplicado |
| V3 | RNC/Cédula: si B01/B14/B15 y vacío → error | **Error** | Alerta "Cliente sin RNC" |
| V4 | RNC/Cédula: si presente, solo dígitos; longitud 9 o 11 (no pasaporte) | **Advertencia** | Limpiar formato |
| V5 | Tipo Identificación coherente con longitud RNC | **Error** | Auto-corregir si posible |
| V6 | Tipo Ingreso entre 1 y 6 | **Error** | Default a 1 si null/fuera de rango |
| V7 | Fecha Comprobante dentro del periodo declarado | **Advertencia** | Permitir pero alertar |
| V8 | Fecha Retención: obligatoria si ITBIS Retenido > 0 o ISR Retenido > 0 | **Error** | Excluir retención o alertar |
| V9 | Monto Facturado ≥ 0 | **Error** | No puede ser negativo |
| V10 | Cuadre medios de pago: `sum(cols 17-23) = MontoFacturado + ITBIS + ISC + OtrosImpuestos + Propina` (con tolerancia ±0.02) | **Error** | Ajustar col 23 con residuo |
| V11 | NCF Modificado: obligatorio para B04/E34; vacío para otros tipos | **Error** | Alertar si falta en NC |
| V12 | Factura anulada (`EstaCancelada = true`) excluida | **Filtro** | No incluir |
| V13 | Factura sin NCF excluida (documentos internos) | **Filtro** | No incluir |
| V14 | B02 < 250K: no detallado individualmente; va al Resumen de Facturas de Consumo | **Regla** | Separar en bloque resumen |

### 5.2 Validaciones globales del archivo

| # | Validación | Regla |
|---|-----------|-------|
| G1 | Cantidad registros del encabezado = líneas de detalle | Obligatorio |
| G2 | RNC encabezado = `Empresas.RNC` (limpio, solo dígitos) | Obligatorio |
| G3 | Periodo formato AAAAMM | Obligatorio |
| G4 | Total ITBIS Facturado debe cuadrar con declaración IT-1 del periodo | Advertencia cruzada |
| G5 | NCF no repetidos en todo el archivo | Error |

---

## 6. Diseño del motor 607 — Arquitectura desacoplada

### 6.1 Principios

1. **Solo lectura de fotografía fiscal.** El motor 607 consulta datos congelados; nunca modifica estados comerciales.
2. **Desacoplado del POS.** Se ejecuta como servicio batch, invocable desde API o worker.
3. **Reutiliza infraestructura Sprint A/B.** Usa `FiscalFeatureFlags`, `FiscalFeatureService`, `EstadoFiscalDocumento`.
4. **Guard de activación.** Si `Generar607 = false`, el motor retorna vacío sin procesar.
5. **Patrón idéntico al 606.** DTO + servicio + generador TXT + controlador API. Mismo patrón probado.

### 6.2 Componentes propuestos

```
┌──────────────────────────────────────────────────┐
│                API Controller                     │
│   GET /api/Reporte607/{idEmpresa}                │
│   ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&periodo=    │
└──────────────┬───────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│          Reporte607Service                        │
│  (AlahiaPos.DataAccess.Servicios.Dgii)           │
│                                                   │
│  1. Verificar FiscalFeatureFlags.Generar607       │
│  2. Consultar FacturaHeaders (foto fiscal)        │
│  3. Consultar NotasCredito (foto fiscal)          │
│  4. Mapear cada doc → Reporte607LineaDto          │
│  5. Ejecutar validaciones (§5)                    │
│  6. Generar encabezado + detalle TXT              │
│  7. Calcular bloque Resumen FC < 250K             │
│  8. Retornar Reporte607Dto completo               │
└──────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────┐
│          Reporte607Dto / Reporte607LineaDto       │
│  (AlahiaPos.Entities.Dto)                        │
│  - Reemplaza el Reporte607Dto actual (6 campos)  │
│    por uno completo con 23 campos + alertas       │
└──────────────────────────────────────────────────┘
```

### 6.3 DTO propuesto: `Reporte607LineaDto` (nuevo, completo)

| Propiedad | Tipo | Columna DGII |
|-----------|------|:------------:|
| `IdDocumento` | `int` | — (interno) |
| `TipoDocumentoAlahia` | `string` | — (Venta/NC) |
| `RncCedulaComprador` | `string` | 1 |
| `TipoIdentificacion` | `int` | 2 |
| `Ncf` | `string` | 3 |
| `NcfModificado` | `string?` | 4 |
| `TipoIngreso` | `int` | 5 |
| `FechaComprobante` | `DateTime` | 6 |
| `FechaRetencion` | `DateTime?` | 7 |
| `MontoFacturado` | `decimal` | 8 |
| `ItbisFacturado` | `decimal` | 9 |
| `ItbisRetenidoPorTercero` | `decimal` | 10 |
| `ItbisPercibido` | `decimal` | 11 |
| `IsrRetenidoPorTercero` | `decimal` | 12 |
| `IsrPercibido` | `decimal` | 13 |
| `ImpuestoSelectivoConsumo` | `decimal` | 14 |
| `OtrosImpuestos` | `decimal` | 15 |
| `MontoPropinaLegal` | `decimal` | 16 |
| `Efectivo` | `decimal` | 17 |
| `ChequeTransferenciaDeposito` | `decimal` | 18 |
| `TarjetaDebitoCredito` | `decimal` | 19 |
| `VentaCredito` | `decimal` | 20 |
| `BonosCertificados` | `decimal` | 21 |
| `Permuta` | `decimal` | 22 |
| `OtrasFormasVenta` | `decimal` | 23 |
| `Alertas` | `List<string>` | — (validación) |
| `EsValidaParaEnvio` | `bool` | — (sin alertas) |

### 6.4 DTO propuesto: `Reporte607Dto` (contenedor)

| Propiedad | Tipo | Descripción |
|-----------|------|-------------|
| `IdEmpresa` | `int` | |
| `RncEmpresa` | `string` | RNC empresa emisora |
| `NombreEmpresa` | `string` | |
| `Periodo` | `string` | AAAAMM |
| `Desde` / `Hasta` | `DateTime` | Rango |
| `CantidadRegistros` | `int` | Líneas detalle |
| `CantidadConAlertas` | `int` | |
| `TotalMontoFacturado` | `decimal` | Suma col 8 |
| `TotalItbisFacturado` | `decimal` | Suma col 9 |
| `ResumenFCCantidad` | `int` | Facturas B02 < 250K |
| `ResumenFCMonto` | `decimal` | Total facturado FC < 250K |
| `ResumenFCItbis` | `decimal` | ITBIS FC < 250K |
| `ContenidoTxt` | `string` | Archivo TXT generado |
| `Lineas` | `List<Reporte607LineaDto>` | Detalle |

### 6.5 Resumen de Facturas de Consumo

Las facturas B02 con valor < RD$250,000 **no** van en el detalle del TXT. Se reportan como totales en la Oficina Virtual al momento de la remisión:

- Cantidad de facturas de consumo
- Monto total facturado
- Monto ITBIS de facturas de consumo

El motor debe calcular estos totales por separado y devolverlos en el DTO para que el usuario los ingrese manualmente en la OFV.

---

## 7. Lógica de mapeo detallada por campo

### 7.1 Campo 1 — RNC/Cédula Comprador

```
1. rnc = FacturaHeaders.RNC ?? ""
2. Si vacío → rnc = Clientes.CedulaRNC (via IDCliente)
3. Limpiar: solo dígitos (quitar guiones, espacios)
4. Si B01/B14/B15/E31/E44/E45 y vacío → Alerta "Cliente sin RNC"
5. Si B02/E32 y vacío → permitido (consumidor final)
```

### 7.2 Campo 2 — Tipo Identificación

```
1. Si Clientes.TipoIdentificacionDgii != null → usar ese valor
2. Sino, inferir:
   - len(rnc) == 9  → 1 (RNC)
   - len(rnc) == 11 → 2 (Cédula)
   - otro           → 3 (Pasaporte)
3. Si rnc vacío (B02) → 2 por defecto
```

### 7.3 Campo 3 — NCF: determinar tipo comprobante DGII

```
1. ncf = FacturaHeaders.NCF.Trim().ToUpper()
2. Si comienza con "B" → tradicional (11 posiciones)
3. Si comienza con "E" → e-CF (13 posiciones)
4. Si FacturaHeaders.CodigoTipoComprobanteDgii != null → usar para casillas 1-8 Anexo A
5. Sino, inferir de prefijo NCF:
   B01/E31 → "01", B02/E32 → "02", B04/E34 → "04", etc.
```

### 7.4 Campos 17-23 — Medios de pago (con impuestos)

**Regla DGII:** Los montos de medios de pago incluyen impuestos. La suma debe igualar el total bruto.

```
totalBruto = MontoFacturado + ItbisFacturado + ISC + OtrosImpuestos + Propina

// Calcular montos brutos por medio
ratio = totalBruto / Total  (si Total > 0, sino 1)

col17_efectivo     = FacturaHeaders.MontoEfectivo * ratio
col18_chequeTransf = (MontoTransferencia + MontoCheques) * ratio
col19_tarjeta      = (MontoTarjetaVisa + MontoTarjetaMasterCard) * ratio
col20_credito      = esCreditoPuro ? totalBruto : Pendiente * ratio
col21_bonos        = 0  // o MontoNotaCredito * ratio
col22_permuta      = 0
col23_otras        = totalBruto - sum(col17..col22)  // residuo de cuadre
```

**Nota:** Los montos en `FacturaHeaders` (Efectivo, Tarjeta, etc.) ya incluyen impuestos en la práctica operativa de Alahia. Si la factura divide `MontoEfectivo` como porción del Total (con ITBIS), el ratio no es necesario. Validar con datos reales.

---

## 8. Qué está listo para Sprint C (heredado de Sprint A/B)

| Componente | Estado | Usado por motor 607 |
|------------|--------|:--------------------:|
| `FiscalFeatureService` + `FiscalFeatureFlags` | Sprint B | Guard `Generar607` |
| `FiscalDocumentSnapshotService.ApplyVentaAsync` | Sprint B.1 | Genera la foto que 607 lee |
| `FiscalDocumentSnapshotService.ApplyNotaCreditoAsync` | Sprint B.1 | Genera la foto que 607 lee |
| `EstadoFiscalDocumento` en FacturaHeaders/NotasCredito | Sprint B | Filtro: solo `GENERADA` o `PENDIENTE_VALIDAR` |
| `MontoGravado`, `MontoExento` en FacturaHeaders | Sprint A | Col 8 (monto facturado) |
| `TotalItbis` en FacturaHeaders/NotasCredito | Pre-existente | Col 9 |
| `TipoIngresoDgii` en FacturaHeaders/NotasCredito | Sprint A | Col 5 |
| `MontoPropinaLegal` en FacturaHeaders | Sprint A | Col 16 |
| `CodigoTipoComprobanteDgii` en FacturaHeaders/NotasCredito | Sprint A | Clasificación Anexo A |
| `NCFModificado` en NotasCredito | Pre-existente | Col 4 |
| `Clientes.TipoIdentificacionDgii` | Sprint A | Col 2 |
| `Clientes.CedulaRNC` | Pre-existente | Col 1 (fallback) |
| `MontoEfectivo`, `MontoTarjeta*`, `MontoTransferencia`, `MontoCheques` | Pre-existente | Cols 17-19 |
| `FechaFacturaOrigen` en NotasCredito | Sprint A | Casilla 43 Anexo A |
| `TasaItbisPrincipal` en FacturaHeaders/NotasCredito | Sprint A | Desglose por tasa (IT-1 futuro) |
| Motor 606 completo (`GenerarTxt606`, `MapearLinea606`) | Pre-existente | Patrón de referencia |
| Outbox + worker asíncrono | Sprint B.1 | No usado por 607 (batch) |
| `DgiiConfiguracionAuditoria` + auth | Sprint B.1 | Protección de config |

## 9. Qué falta implementar para Sprint C

### 9.1 Cambios DDL (nuevos campos en FacturaHeaders)

| Campo | Tipo SQL | Default | Propósito |
|-------|----------|---------|-----------|
| `ItbisRetenidoPorTercero` | `DECIMAL(18,2)` | `0` | Col 10 — ITBIS retenido por cliente |
| `IsrRetenidoPorTercero` | `DECIMAL(18,2)` | `0` | Col 12 — ISR retenido por cliente |
| `FechaRetencionTercero` | `DATETIME` | `NULL` | Col 7 — Fecha retención |
| `ImpuestoSelectivoConsumo` | `DECIMAL(18,2)` | `0` | Col 14 |
| `OtrosImpuestosTasas` | `DECIMAL(18,2)` | `0` | Col 15 |
| `MontoPermuta` | `DECIMAL(18,2)` | `0` | Col 22 |

**Nota:** Todos con default 0 o NULL. No alteran operación existente. Backfill histórico = 0.

### 9.2 Nuevos archivos de código

| Archivo | Proyecto | Responsabilidad |
|---------|----------|-----------------|
| `Reporte607Dto.cs` (reemplazo) | Entities/Dto | DTO completo 23 campos + alertas |
| `Reporte607Service.cs` | DataAccess/Servicios/Dgii | Consulta foto fiscal, mapeo, validación, generación TXT |
| `IReporte607Service.cs` | Entities/Interfaces | Interfaz del servicio |

### 9.3 Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `FacturaHeaders.cs` | Agregar 6 campos nuevos (§9.1) |
| `Reporte607Dto.cs` (existente) | Reemplazar 6 campos por DTO completo |
| `FacturaHeaderController.cs` | Reemplazar endpoint `Reporte607` para usar nuevo servicio |
| `IFacturaHeaderServices.cs` | Eliminar `GetReporte607Async` (migra a servicio dedicado) |
| `Program.cs` | Registrar `IReporte607Service` |
| `AlahiaPosContext.cs` | Sin cambios (campos se agregan a entidad existente) |

### 9.4 Componente frontend

El componente `Reporte607Component` existente se actualizará para consumir el nuevo DTO con 23 columnas, grilla de alertas y botón de descarga TXT. Esto es cosmético y no altera operación comercial.

---

## 10. Flujo de datos: de la venta al TXT

```
         OPERACIÓN COMERCIAL (ya implementado)
         ─────────────────────────────────────
POS/API ──► FacturaHeader guardado (commit)
         ──► FiscalWorkEnqueueService.EnqueueFotografiaSiActivoAsync()
         ──► EventosOutbox: FiscalFotografiaPendiente

         WORKER ASÍNCRONO (ya implementado)
         ─────────────────────────────────────
FiscalOutboxProcessor ──► DgiiFiscalService.ProcesarDocumentoPosteriorAsync()
                      ──► FiscalDocumentSnapshotService.ApplyVentaAsync()
                      ──► FacturaHeaders actualizado con foto fiscal:
                           MontoGravado, MontoExento, TipoIngresoDgii,
                           TasaItbisPrincipal, CodigoTipoComprobanteDgii,
                           EstadoFiscalDocumento = GENERADA

         MOTOR 607 (Sprint C — nuevo)
         ─────────────────────────────────────
Usuario solicita reporte ──► GET /api/Reporte607/{idEmpresa}?desde=&hasta=&periodo=
                         ──► Reporte607Service:
                              1. FiscalFeatureFlags.Generar607? → si no, retornar vacío
                              2. SELECT FacturaHeaders WHERE foto GENERADA, periodo, empresa
                              3. SELECT NotasCredito WHERE foto GENERADA, periodo, empresa
                              4. Para cada doc → MapearLinea607(doc, cliente)
                              5. Separar B02 < 250K → Resumen FC
                              6. Validar (§5)
                              7. GenerarTxt607(dto)
                         ──► Retornar Reporte607Dto con TXT + líneas + alertas + resumen FC
```

---

## 11. Relación 607 → Anexo A → IT-1

El 607 generado con este motor será la **fuente oficial** para las casillas del Anexo A:

| Casillas Anexo A | Derivación desde 607 |
|------------------|----------------------|
| 1-8 (por tipo NCF) | Agrupar `MontoFacturado` por `CodigoTipoComprobanteDgii` |
| 12-18 (medios de pago) | Sumar cols 17-23 por tipo |
| 20-25 (tipo ingreso) | Agrupar `MontoFacturado` por `TipoIngreso` (1-6) |
| 43 (NC > 30 días) | NC donde `FechaInseccion - FechaFacturaOrigen > 30` |

Para IT-1, las casillas de ingresos (1-15) se derivarán del Anexo A, que a su vez se alimenta del 607. **Cadena de datos:** Foto fiscal → 607 → Anexo A → IT-1.

---

## 12. Riesgos y mitigaciones

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|--------|:------------:|:-------:|------------|
| R1 | Montos medios de pago no cuadran con total bruto | Alta | Error DGII | Columna 23 como residuo de cuadre. Validación V10 pre-exportación |
| R2 | RNC de clientes inconsistente (guiones, espacios, vacío) | Alta | Alerta DGII | Función `LimpiarDocumento` reutilizada del 606. Alertas en grilla |
| R3 | NCF duplicados en periodo | Media | Rechazo DGII | Validación V2 + deduplicación |
| R4 | Facturas sin foto fiscal (PENDIENTE_GENERAR / ERROR_FISCAL) | Media | 607 incompleto | Filtrar solo `GENERADA`/`PENDIENTE_VALIDAR`. Mostrar contador de excluidas |
| R5 | NC sin NCFModificado | Media | Alerta DGII | Validación V11. Bloquear línea en TXT |
| R6 | B02 < 250K mezcladas en detalle | Baja | Rechazo formato | Separar en Resumen FC automáticamente |
| R7 | Retenciones sin fecha | Media | Error DGII | Validación V8. No exportar retención si falta fecha |
| R8 | Campos nuevos (col 10, 12, 14, 15, 22) siempre en 0 | Baja | Datos incompletos largo plazo | Aceptable para Sprint C. UI de captura en sprint futuro |

---

## 13. Criterios de aceptación Sprint C

| # | Criterio | Verificación |
|---|----------|-------------|
| CA1 | Motor genera TXT 607 válido para upload en OFV DGII | Subir archivo de prueba a pre-validador DGII |
| CA2 | Encabezado: `607\|RNC\|AAAAMM\|N` correcto | Inspección manual |
| CA3 | 23 columnas por línea, separadas por pipe | Parse automático |
| CA4 | Montos con punto decimal, formato `0.00` | Validación regex |
| CA5 | Fechas en AAAAMMDD | Validación formato |
| CA6 | Cuadre medios de pago por línea (tolerancia ±0.02) | Validación V10 |
| CA7 | NC incluidas con NCF Modificado | Revisión líneas B04 |
| CA8 | B02 < 250K excluidas del detalle, calculadas en resumen | Comparar conteo |
| CA9 | Facturas anuladas / sin NCF excluidas | Filtro verificado |
| CA10 | Si `Generar607 = false` → no-op, retorna vacío | Test con flag apagado |
| CA11 | Hash del TXT 607 estable (mismos datos = mismo output) | Doble ejecución |
| CA12 | No modifica ningún dato comercial (POS, CxC, inventario) | Solo SELECT, nunca UPDATE |
| CA13 | Reporte 606 existente sigue generando idéntico | Comparar hash antes/después |

---

## 14. Orden de implementación sugerido

| Paso | Descripción | Dependencia |
|------|-------------|-------------|
| 1 | DDL: agregar 6 campos nuevos a `FacturaHeaders` en `AlahiaPos_Dev` | Ninguna |
| 2 | Entidad: actualizar `FacturaHeaders.cs` con nuevas propiedades | Paso 1 |
| 3 | DTO: crear `Reporte607LineaDto` completo + `Reporte607Dto` nuevo | Paso 2 |
| 4 | Interfaz: crear `IReporte607Service` | Paso 3 |
| 5 | Servicio: implementar `Reporte607Service` (consulta + mapeo + validación + TXT) | Paso 3, 4 |
| 6 | Controlador: reemplazar endpoint `Reporte607` en `FacturaHeaderController` o crear controlador dedicado | Paso 5 |
| 7 | Registro DI: agregar en `Program.cs` | Paso 5, 6 |
| 8 | Build + pruebas | Paso 7 |
| 9 | Frontend: actualizar `Reporte607Component` para consumir nuevo DTO | Paso 6 |
| 10 | Validación cruzada: pre-validador DGII con datos Dev | Paso 8 |

---

## 15. Fuera de alcance Sprint C

| Item | Sprint futuro |
|------|---------------|
| Motor Anexo A (casillas 1-56) | Sprint D |
| Motor IT-1 (liquidación) | Sprint E |
| UI para captura de retenciones terceros (cols 7, 10, 12) | Sprint D |
| Conciliación 607 ↔ 606 cruzada | Sprint D |
| Facturación Electrónica e-CF automática | Sprint F |
| Importaciones DGA | Sprint F |
| Rectificativas 607 | Sprint D |
| Facturas de consumo < 250K en detalle (opcional DGII) | No requerido |

---

## 16. Conclusión

La infraestructura de Sprint A (modelo fiscal + fotografía) y Sprint B/B.1 (desacoplamiento + outbox + idempotencia) proporciona **todo lo necesario** para construir el motor 607 como un servicio de solo lectura que consume datos congelados.

Las brechas reales son menores: 6 campos nuevos en `FacturaHeaders` (todos con default 0/null, sin impacto operativo) y un servicio nuevo (`Reporte607Service`) que sigue el patrón exacto del 606 ya probado.

El 607 generado será la **fuente canónica** que en sprints posteriores alimentará:
- **Anexo A** casillas 1-8 (por tipo NCF), 12-18 (medios de pago), 20-25 (tipo ingreso), 43 (NC > 30 días)
- **IT-1** casillas de ingresos (vía Anexo A)

No se requieren cambios en: POS, compras, inventario, CxC, CxP, bancos, conduces, cierre de caja, contabilidad ni 606.
