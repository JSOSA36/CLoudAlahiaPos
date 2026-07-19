# IT-1 — Decisiones obligatorias + Diseño final Sprint A (autorización previa)

## Ajustes aprobados post-diseño (vinculantes)

1. **Forma de venta mixta:** no persistir un único `FormaVentaFiscalDgii` cuando hay varios medios. El detalle real queda en `MontoEfectivo`, tarjetas, transferencia, cheques, etc. El motor 607/IT-1 consolidará. `FormaVentaFiscalDgii` solo se usa cuando hay certeza (p. ej. crédito → 15); en contado mixto queda `NULL`.
2. **TipoIngresoDgii histórico:** backfill **no** asigna `1`. Histórico sin certeza = `NULL`. Default `1` solo en documentos **nuevos** (aplicación, Sprint B+).
3. **`Productos.TasaItbis`:** únicamente default de captura para operaciones nuevas. Nunca recalcular histórico ni usarlo como fuente oficial del motor fiscal (la fuente oficial es la foto del documento/detalle).

**Autorización ejecución:** Sprint A solo `AlahiaPos_Dev`. Sin Prod, UI, motores Anexo A/IT-1.

---

# Parte I — Decisiones obligatorias (amendo al plano)

## D1. Destino fiscal 5/6 — sin backfill definitivo

| Regla | Detalle |
|-------|---------|
| Se permite | Sugerencia inicial bienes→5 / servicios→6 |
| Todo histórico sugerido debe quedar | `EstadoClasificacionItbis = 'PENDIENTE_VALIDAR'` |
| Campos de marca | `DestinoItbisSugerido`, `DestinoItbis` (nullable hasta confirmar), `ClasificacionConfirmada = 0` |
| Cierre IT-1 | **Bloqueado** si existe FACTC con `TotalItbis > 0` y `ClasificacionConfirmada = 0` |
| Confirmación | Solo acción explícita de usuario/contabilidad (fuera de Sprint A) |

## D2. Fotografía fiscal por documento

Los maestros (`Productos`, `Clientes`, `Proveedores`, config) solo aportan **defaults al crear**.

En cada **documento y detalle** se persisten los valores usados en la operación.  
**Nunca** se recalcula un documento histórico con la config actual del maestro.

## D3. Forma fiscal de venta congelada al emitir

| Momento | Qué se guarda |
|---------|----------------|
| Emisión factura | `FormaVentaFiscalDgii` (12…18 / códigos internos mapeados a Anexo A) |
| Crédito | Permanece **a crédito** aunque luego se cobre en efectivo/tarjeta |
| `PagosFacturasClientes` | Solo CxC, bancos, conciliación, historial — **no altera** forma fiscal |

### Matriz de manejo (documentación normativa Alahia)

| Caso | Clasificación fiscal (Anexo A III) | Qué hace cobro posterior |
|------|-----------------------------------|---------------------------|
| Contado 100% efectivo | Casilla 12 | N/A |
| Contado mixtas (efectivo+tarjeta+transfer) | Desglose en 12/13/14 según montos **al emitir** | N/A |
| Contado con abono < total (resto otro medio mismo acto) | Desglose al emitir en columnas correspondientes | N/A |
| Crédito puro (`TipoFactura=Credito`, sin cobro al emitir) | Casilla 15 = total con impuestos del documento | Cobros → `PagosFacturasClientes` únicamente |
| Crédito + abono inicial | Casilla 15 = **total documento**; el abono se registra además en pagos/tesorería como cobro CxC, **sin recortar** casilla 15 | Idem |
| Factura crédito luego saldada | Sigue casilla 15 | Historial de cobros; no reclasifica a 12–14 |
| Nota: medio “bono/permuta/otra” | 16–18 si se usó al emitir | No cambia después |

**Campos de fotografía en venta:** ver Sprint A (`FormaVentaFiscalDgii`, montos fiscales por medio **al emitir**, independientes de pagos posteriores).

> Los montos `MontoEfectivo`, tarjetas, etc. existentes en `FacturaHeaders` se **reutilizan como captura al emitir**. Si más adelante un cobro CxC añade efectivo, eso **no** se suma a casilla 12 del periodo de la factura.

## D4. Gastos vs FACTC

- `Gastos` **nunca** alimenta crédito ITBIS / 606 / IT-1.
- Si el usuario registra en Gastos algo con indicios fiscales (NCF/e-NCF, ITBIS, suplidor, posible adelanto): **advertir y orientar a FACTC**.
- Gastos sin comprobante fiscal: permitidos; sin ITBIS adelantable.
- *(UI de advertencia = post Sprint A; en Sprint A solo se deja documentado el contrato.)*

## D5. Auditoría de valores manuales (`DgiiIt1Casilla`)

Campos obligatorios (diseño; tabla se crea en sprint E, **contrato fijado ahora**):

| Campo | Uso |
|-------|-----|
| `ValorCalculado` | Resultado del motor |
| `ValorManual` | Override usuario (nullable) |
| `ValorFinal` | Manual si `EsManual`, else Calculado |
| `EsManual` | bit |
| `MotivoAjuste` | texto |
| `IdUsuarioAjuste` | int? |
| `FechaAjuste` | datetime? |
| `OrigenDato` | AUTO_607 / AUTO_606 / FORMULA / USUARIO / AJUSTE… |
| `FormulaAplicada` | texto/código fórmula |
| `VersionCalculo` | int / semver del motor |

**Nunca** sobrescribir `ValorCalculado` en silencio.

## D6. Versionado fiscal

Catálogos y periodos llevan vigencia DGII (ver tablas Sprint A / E):

`CodigoDGII`, `TipoCatalogo`, `Descripcion`, `FechaInicioVigencia`, `FechaFinVigencia`, `Activo`, `VersionInstructivo`.

Prohibido hardcodear tasas/códigos/nombres/fórmulas en UI.

## D7. Penalidades

Recargos, intereses y sanciones = **estimados / manuales / confirmados por usuario**, separados del impuesto por operaciones.  
Sprint A no crea motor de penalidades; solo se reserva espacio en `DgiiIt1Periodo` (sprint E).

## D8. Política de redondeo (única, obligatoria)

### Norma Alahia (fuente oficial)

| Nivel | Regla |
|-------|-------|
| **Moneda** | DOP, 2 decimales |
| **Modo** | Half-away-from-zero / “redondeo comercial” a 2 decimales (`MidpointRounding.AwayFromZero` en .NET; equivalente JS: round half up vía centavos enteros) |
| **Línea** | `BaseLínea` y `ItbisLínea` se redondean a 2d **por línea** |
| **Documento** | `Base` = Σ bases línea; `ITBIS` = Σ ITBIS línea (no recalcular ITBIS sobre Σ bases) |
| **Descuento** | Se aplica a la base **antes** de ITBIS; el efecto en base queda foto en documento |
| **Propina legal** | Fuera de base e ITBIS; no participa en redondeo de impuesto |
| **NC** | Misma política que factura; totales NC = Σ líneas NC |
| **Acumulado mensual** | Σ de **totales de documento** (o casillas ya redondeadas), no re-redondear el mes con otra escala |
| **Fuente oficial del documento** | Totales persistidos en header (`SubTotal`/`MontoGravado*`/`TotalItbis`/`MontoPropinaLegal`/`Total`) tras el cálculo al grabar |

### Pruebas de centavos a implementar más adelante

1. 3 líneas a 10.005 → verificar Σ vs 3×round.  
2. Precio con ITBIS incluido vs precio + ITBIS.  
3. Descuento % que genera 0.005.  
4. NC parcial de línea.  
5. Periodo: 100 docs con ±0.01 vs recálculo global (debe preferir Σ documentos).

## D9. Propina legal

Almacenar separada de: `SubTotal`, bases gravadas, ITBIS, descuentos, total fiscal imponible.

- Reutilizar/evolucionar `FacturaHeaders.MontoPropina` como **propina legal** fotografiada.
- Agregar `MontoPropinaLegal` explícito (o documentar alias = `MontoPropina`) y `TotalOperacionFiscal` ≠ propina.
- **No** usar `Total` a ciegas como base imponible del Anexo A I–II (Anexo A 1–8 = sin impuesto; III = con impuesto según instructivo).

## D10. Alcance inmediato

Solo **Sprint A — modelo de datos fiscal mínimo** (scripts Dev tras autorización).  
Sin motores, UI IT-1, exports, Prod.

---

# Parte II — Diseño final Sprint A (para autorización)

## A. Tablas nuevas a crear

### A.1 `DgiiCatalogo`

| Columna | Tipo SQL | Null | Default | Notas |
|---------|----------|------|---------|-------|
| `IdDgiiCatalogo` | INT IDENTITY PK | No | — | |
| `TipoCatalogo` | NVARCHAR(40) | No | — | Ej. `TIPO_COMPROBANTE`, `DESTINO_ITBIS`, `TIPO_INGRESO`, `FORMA_VENTA_FISCAL`, `REGIMEN`, `NORMA_RET_ITBIS`, `TASA_ITBIS`, `ESTADO_CLASIFICACION` |
| `CodigoDGII` | NVARCHAR(20) | No | — | Código oficial o interno estable |
| `Descripcion` | NVARCHAR(200) | No | — | |
| `FechaInicioVigencia` | DATE | No | `'2020-01-01'` | |
| `FechaFinVigencia` | DATE | Sí | NULL | |
| `Activo` | BIT | No | 1 | |
| `VersionInstructivo` | NVARCHAR(20) | No | `'IT-1-2020'` | |
| `Orden` | INT | No | 0 | |
| `MetaJson` | NVARCHAR(MAX) | Sí | NULL | Extensiones |

Índice unique: `(TipoCatalogo, CodigoDGII, FechaInicioVigencia)`.

**Seeds mínimos Sprint A:** tipos comprobante, destino ITBIS (1–7), estados clasificación (`PENDIENTE_VALIDAR`, `CONFIRMADO`), tipo ingreso 1–6, forma venta fiscal 12–18, regímenes, normas retención ITBIS, tasas 18/16/9/8/0.

### A.2 `DgiiConfiguracionEmpresa`

| Columna | Tipo | Null | Default |
|---------|------|------|---------|
| `IdEmpresa` | INT PK/FK → Empresas | No | — |
| `RegimenTributarioCodigo` | NVARCHAR(20) | No | `'ORDINARIO'` |
| `EsConstructor` | BIT | No | 0 |
| `EsComisionista` | BIT | No | 0 |
| `ObligadoLibroVentasSF` | BIT | No | 0 |
| `RazonSocial` | NVARCHAR(200) | Sí | NULL |
| `DeclaranteNombre` | NVARCHAR(150) | Sí | NULL |
| `DeclaranteCalidad` | NVARCHAR(80) | Sí | NULL |
| `VersionInstructivoPreferida` | NVARCHAR(20) | No | `'IT-1-2020'` |
| `Activo` | BIT | No | 1 |
| `FechaCreacion` | DATETIME | No | GETDATE() |

---

## B. Columnas existentes que se **reutilizan** (sin renombrar / sin borrar)

### Ventas — `FacturaHeaders`
`NCF`, `RNC`, `SubTotal`, `TotalItbis`, `Total`, `TotalDescuento`, `MontoPropina`, `MontoEfectivo`, `MontoTarjetaVisa`, `MontoTarjetaMasterCard`, `MontoTransferencia`, `MontoCheques`, `MontoNotaCredito`, `TipoFactura`, `FormaPago`, `IdTipoDocumentos`, `EstaCancelada`, `IdEmpresa`, `FechaInseccion`, `IDCliente`

### Detalle venta — `FacturaDetalles`
`Itbis`, `SubTotal`, `Descuento`, `IdProducto`, `Cantidad`

### NC — `NotasCredito`
`IdFacturaHeader`, `NCF`, `NCFModificado`, `RNC`, `SubTotal`, `TotalItbis`, `Total`, `IdEmpresa`, `FechaInseccion`

### Compras — `OrdenCompraHeaders` (606 intacto)
Todos los campos 606 actuales: `NCF`, `NcfModificado`, `FormaPagoDgii`, `MontoFacturadoServicios/Bienes`, `TotalItbis`, `ItbisRetenido`, `ItbisProporcionalidad`, `ItbisLlevadoAlCosto`, `TipoRetencionIsr`, `MontoRetencionRenta`, `FechaPagoFiscal`, `IdTipoBienesServicios`, `Estado`, …

### Maestros / config
`Productos.Itbis`, `ParametrosConfigs` (`ImpuestoItbis`), `Empresas.RNC/NombreComercial/Telefono/CorreElectronico/FE`, `Proveedores.RNC`, `Clientes.CedulaRNC`, `TipoBienesServices`, `ECFEncabezado` montos

### TXT 606
**Sin cambios de columnas ni de semántica de exportación** en Sprint A.

---

## C. Columnas nuevas Sprint A

### C.1 `FacturaHeaders` — fotografía fiscal venta

| Columna | Tipo | Null | Default | Obligatoria al emitir (futuro B) | Justificación |
|---------|------|------|---------|----------------------------------|---------------|
| `CodigoTipoComprobanteDgii` | NVARCHAR(2) | **Sí** | NULL | Sí (tras backfill/derivación) | Anexo A 1–8 |
| `TipoIngresoDgii` | TINYINT | **Sí** | NULL | Default 1 en captura nueva | Anexo A 20–25 |
| `IndicadorFacturacion` | TINYINT | **Sí** | NULL | Sí en captura nueva | Gravado/exento |
| `MontoGravado` | DECIMAL(18,2) | No | 0 | Calculado | Base |
| `MontoExento` | DECIMAL(18,2) | No | 0 | Calculado | |
| `MontoGravadoI1` … `I4` | DECIMAL(18,2) | No | 0 | Calculado | Tasas 18/16/9/8 |
| `DescuentoAfectaBase` | DECIMAL(18,2) | No | 0 | Calculado | Foto descuento fiscal |
| `MontoPropinaLegal` | DECIMAL(18,2) | No | 0 | = MontoPropina al backfill | Propina separada |
| `FormaVentaFiscalDgii` | TINYINT | **Sí** | NULL | Sí si crédito→15; contado según medios | Anexo A III congelada |
| `RegimenFiscalClienteCodigo` | NVARCHAR(20) | **Sí** | NULL | Foto régimen | Exento destino etc. |
| `TasaItbisPrincipal` | DECIMAL(5,2) | **Sí** | NULL | Foto tasa usada | |
| `FotografiaFiscalVersion` | INT | No | 1 | | Versionado cálculo doc |
| `FechaFotografiaFiscal` | DATETIME | **Sí** | NULL | Set al grabar fiscal | |

**Nullable estratégico:** códigos/fotos NULL en histórico = “sin fotografía completa”; nuevos docs las llenarán en Sprint B.

### C.2 `FacturaDetalles` — foto línea

| Columna | Tipo | Null | Default |
|---------|------|------|---------|
| `TasaItbis` | DECIMAL(5,2) | Sí | NULL |
| `IndicadorFacturacion` | TINYINT | Sí | NULL |
| `MontoGravadoLinea` | DECIMAL(18,2) | No | 0 |
| `MontoExentoLinea` | DECIMAL(18,2) | No | 0 |
| `DescuentoAfectaBase` | DECIMAL(18,2) | No | 0 |
| `ItbisCalculado` | DECIMAL(18,2) | No | 0 | (puede = `Itbis` existente; foto explícita) |

### C.3 `NotasCredito`

| Columna | Tipo | Null | Default |
|---------|------|------|---------|
| `CodigoTipoComprobanteDgii` | NVARCHAR(2) | Sí | NULL |
| `FechaFacturaOrigen` | DATETIME | Sí | NULL | (copiar de factura en backfill) |
| `MontoGravado` | DECIMAL(18,2) | No | 0 |
| `MontoExento` | DECIMAL(18,2) | No | 0 |
| `MontoGravadoI1`…`I4` | DECIMAL(18,2) | No | 0 |
| `DescuentoAfectaBase` | DECIMAL(18,2) | No | 0 |
| `TasaItbisPrincipal` | DECIMAL(5,2) | Sí | NULL |
| `TipoIngresoDgii` | TINYINT | Sí | NULL |
| `FotografiaFiscalVersion` | INT | No | 1 |

### C.4 `NotasCreditoDetalle`

| Columna | Tipo | Null | Default |
|---------|------|------|---------|
| `TasaItbis` | DECIMAL(5,2) | Sí | NULL |
| `MontoGravadoLinea` | DECIMAL(18,2) | No | 0 |
| `MontoExentoLinea` | DECIMAL(18,2) | No | 0 |
| `DescuentoAfectaBase` | DECIMAL(18,2) | No | 0 |
| `ItbisCalculado` | DECIMAL(18,2) | No | 0 |

### C.5 `OrdenCompraHeaders` — destino + foto (606 intacto)

| Columna | Tipo | Null | Default | Notas |
|---------|------|------|---------|-------|
| `DestinoItbis` | TINYINT | **Sí** | NULL | Confirmado; NULL + pendiente = no cerrado IT-1 |
| `DestinoItbisSugerido` | TINYINT | Sí | NULL | Solo sugerencia 5/6 |
| `EstadoClasificacionItbis` | NVARCHAR(30) | No | `'NO_APLICA'` | Ver reglas backfill |
| `ClasificacionConfirmada` | BIT | No | 0 | |
| `FechaClasificacion` | DATETIME | Sí | NULL | |
| `IdUsuarioClasificacion` | INT | Sí | NULL | |
| `ItbisComprasLocales` | DECIMAL(18,2) | No | 0 | |
| `ItbisServicios` | DECIMAL(18,2) | No | 0 | |
| `ItbisImportaciones` | DECIMAL(18,2) | No | 0 | |
| `TasaItbis` | DECIMAL(5,2) | Sí | NULL | Foto |
| `CodigoNormaRetencionItbis` | NVARCHAR(20) | Sí | NULL | |
| `BaseRetencionItbis` | DECIMAL(18,2) | No | 0 | |
| `RegimenFiscalProveedorCodigo` | NVARCHAR(20) | Sí | NULL | Foto |
| `EsImportacion` | BIT | No | 0 | |
| `FotografiaFiscalVersion` | INT | No | 1 | |

**Estados `EstadoClasificacionItbis`:**
- `NO_APLICA` — `TotalItbis = 0`
- `PENDIENTE_VALIDAR` — hay ITBIS y no confirmado (incluye histórico sugerido)
- `CONFIRMADO` — usuario confirmó destino

### C.6 `OrdenCompraDetalles`

| Columna | Tipo | Null | Default |
|---------|------|------|---------|
| `TasaItbis` | DECIMAL(5,2) | Sí | NULL |
| `DestinoItbis` | TINYINT | Sí | NULL | hereda/override |
| `ItbisCalculado` | DECIMAL(18,2) | No | 0 |

### C.7 `Productos` — solo defaults futuros

| Columna | Tipo | Null | Default |
|---------|------|------|---------|
| `TasaItbis` | DECIMAL(5,2) | Sí | NULL | null = usar param |
| `TipoIngresoDgiiDefault` | TINYINT | Sí | 1 | |
| `CodigoExencionDgii` | NVARCHAR(20) | Sí | NULL | |

**No** se usa para recalcular docs viejos.

### C.8 `Proveedores` / `Clientes` — defaults futuros

| Tabla | Columna | Tipo | Null | Default |
|-------|---------|------|------|---------|
| Proveedores | `RegimenDgii` | NVARCHAR(20) | Sí | `'ORDINARIO'` |
| Proveedores | `TipoIdentificacionDgii` | TINYINT | Sí | NULL |
| Proveedores | `ClasificacionRetencionItbisDefault` | NVARCHAR(20) | Sí | NULL |
| Clientes | `RegimenDgii` | NVARCHAR(20) | Sí | `'ORDINARIO'` |
| Clientes | `EsRegimenEspecial` | BIT | No | 0 |
| Clientes | `TipoIdentificacionDgii` | TINYINT | Sí | NULL |

### C.9 Fuera de Sprint A (contrato reservado, no crear aún)

- `DgiiIt1Periodo`, `DgiiIt1Casilla` (con auditoría D5), `DgiiAjustePeriodo`, `DgiiImportacionItbis`
- Cambios UI Gastos (advertencia D4)
- Cualquier motor

---

## D. Backfill propuesto (`AlahiaPos_Dev` only)

### D.1 Principios
- Idempotente, reversible (columnas nullable / defaults).
- **No** marca histórico como `CONFIRMADO`.
- **No** altera columnas 606 existentes ni montos operativos ya grabados salvo copias a campos foto nuevos.

### D.2 Ventas (`FacturaHeaders`)
1. `MontoPropinaLegal = MontoPropina`.
2. `DescuentoAfectaBase = TotalDescuento` (aproximación; documentar limitación).
3. Si `Productos`/líneas tienen ITBIS:  
   - `MontoGravado ≈ SubTotal` (o SubTotal − exento si se puede inferir solo con flag línea — limitado).  
   - `MontoGravadoI1 = MontoGravado` si tasa param 18; I2–I4 = 0.  
   - `MontoExento = 0` salvo líneas sin ITBIS (si se puede sumar).  
4. `CodigoTipoComprobanteDgii` derivado de prefijo NCF (`B01`→`01`, `B02`→`02`, `E31`→`31`, …); NULL si no parseable.
5. `TipoIngresoDgii = 1` sugerido (no “confirmado”; es default documental).
6. `FormaVentaFiscalDgii`:  
   - Si `TipoFactura` crédito → `15`.  
   - Else si solo efectivo → `12`; solo transfer/cheque → `13`; solo tarjeta → `14`; mixto contado → **NULL** (requiere revisión) o código `18` “otras” **solo como pendiente** — **preferencia: NULL + no inventar** salvo un solo medio dominante (>99% total).
7. `TasaItbisPrincipal` desde `ParametrosConfigs.ImpuestoItbis` del momento **no es foto real** → dejar NULL en histórico o llenar con param actual **marcado** `FotografiaFiscalVersion = 0` (= backfill estimada, no foto de caja).

**Marca de calidad sugerida:** `FotografiaFiscalVersion = 0` significa *estimada por backfill*; `1+` = generada en emitir.

### D.3 NC
1. `FechaFacturaOrigen` ← `FacturaHeaders.FechaInseccion` de `IdFacturaHeader`.
2. Tipos `04`/`34` según NCF.
3. Bases: misma aproximación que ventas.

### D.4 Compras FACTC
1. Si `TotalItbis = 0` → `EstadoClasificacionItbis='NO_APLICA'`, `ClasificacionConfirmada=0`, destinos NULL.
2. Si `TotalItbis > 0`:  
   - Si `ItbisLlevadoAlCosto == TotalItbis` → sugerir destino **3** (otro no deducible) o mapear a costo **sin confirmar**.  
   - Si `ItbisProporcionalidad > 0` → sugerir **7**.  
   - Else si `MontoFacturadoServicios >= MontoFacturadoBienes` → `DestinoItbisSugerido=6`, else `=5`.  
   - `DestinoItbis = NULL`, `EstadoClasificacionItbis='PENDIENTE_VALIDAR'`, `ClasificacionConfirmada=0`.
3. Split columnas:  
   - Si `EsImportacion=0`: asignar sugerido `ItbisServicios` o `ItbisComprasLocales` = `TotalItbis - ItbisLlevadoAlCosto` (pendiente validar; no es confirmación).  
4. `TasaItbis` NULL o 18 estimado con version 0.
5. `RegimenFiscalProveedorCodigo` NULL (no inventar).

### D.5 Maestros
- `Productos.TasaItbis = NULL` (usa param).
- `TipoIngresoDgiiDefault = 1`.
- Proveedores/Clientes `RegimenDgii='ORDINARIO'` donde NULL.

### D.6 Config empresa
Insert `DgiiConfiguracionEmpresa` por cada `Empresas` activa con defaults.

### D.7 Catálogo
Seed filas vigentes `VersionInstructivo='IT-1-2020'`.

---

## E. Impacto potencial por módulo (sin implementar ahora)

| Módulo | Riesgo Sprint A (solo DDL) | Riesgo Sprint B+ (cuando se use) |
|--------|----------------------------|----------------------------------|
| **POS** | Ninguno si columnas nullable/default | Debe llenar foto al emitir; forma venta congelada; propina legal; tasas por línea |
| **FACTC** | Ninguno DDL | UI destino + confirmación; split ITBIS; no cerrar IT-1 con pendientes |
| **606 TXT** | **Cero** si no se toca `ComprasService` export | Seguir exportando campos actuales; destinos Anexo A son capa aparte |
| **607** | Cero en A | Leer nuevos campos; incluir NC |
| **Notas crédito** | Cero DDL | Persistir foto + fecha origen |
| **e-CF** | Cero DDL | Sincronizar `MontoGravado`/tipo a `FacturaHeaders` al aceptar DGII |
| **Gastos** | Cero en A | Advertencia FACTC (D4) en UI posterior |
| **CxC / PagosFacturasClientes** | Cero | Confirmado: no recalifica forma fiscal |
| **Reportes / dashboard** | Cero | Posibles lecturas futuras |
| **EF / API** | Tras script: actualizar entidades + DbContext | Deploy Dev only |

### Compatibilidad EF
Tras autorización: agregar propiedades a entities + `AlahiaPosContext` mapping; **no** drop columns; **no** alterar TXT 606.

---

## F. Checklist de autorización (responder para continuar)

Antes de ejecutar cualquier script en `AlahiaPos_Dev`, confirmar:

- [ ] Acepta tablas `DgiiCatalogo` + `DgiiConfiguracionEmpresa`
- [ ] Acepta columnas nuevas listadas en C.1–C.8 (todas las NOT NULL con default seguro)
- [ ] Acepta backfill D (histórico destino = **PENDIENTE_VALIDAR**, nunca CONFIRMADO)
- [ ] Acepta `FotografiaFiscalVersion=0` = estimada
- [ ] Acepta que forma venta crédito se documenta como casilla 15 aunque haya abono
- [ ] Acepta política de redondeo D8
- [ ] Autoriza ejecución **solo** en `AlahiaPos_Dev`
- [ ] Confirma: no Prod, no UI, no motores en este paso

---

## G. Entregable siguiente (solo tras “autorizado”)

1. Script SQL `Scripts/SprintA_ModeloFiscal_IT1_Dev.sql` (CREATE + ALTER + SEED + BACKFILL marcado).  
2. Actualización de entities C# alineadas.  
3. Verificación `sqlcmd` en Dev (conteos PENDIENTE_VALIDAR, nullabilidad).  
4. Sin cambios UI / sin motores.

---

**Fin del diseño Sprint A.**  
Esperando autorización explícita del usuario para ejecutar en `AlahiaPos_Dev`.
