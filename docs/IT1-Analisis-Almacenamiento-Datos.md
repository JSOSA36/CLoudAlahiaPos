# Documento técnico: Información requerida para generar el IT-1 (ITBIS) en Alahia ERP

**Alcance:** Formulario **IT-1** y **Anexo A** (Instructivo Llenado IT-1 2020 + archivo `IT-1-2020.xls`).  
**Objetivo:** Identificar qué debe **almacenar** Alahia ERP para generar el IT-1 automáticamente.  
**Fuera de alcance de este documento:** pantallas, servicios, exportación DGII o código nuevo.

**Fuentes oficiales usadas:**
- `Instructivo LLENADO IT-1 2020.pdf`
- `IT-1-2020.xls` (hojas `Anexo A` e `IT-1`)

**Estado actual Alahia (resumen):** existe pipeline sólido **606 (compras)**; **607 (ventas)** incompleto; **no existe módulo IT-1**.

---

## 1. Visión general del flujo DGII → IT-1

```
Ventas (NCF/e-CF) ──► Formato 607 / Libro ventas ──► Anexo A (casillas 1–26, 43)
Compras (FACTC)   ──► Formato 606                 ──► Anexo A (44, 45–56 / ITBIS)
Importaciones DGA ──────────────────────────────────► Anexo A (columna Importaciones)
Anexo A ────────────────────────────────────────────► IT-1 (casillas 1, 6, 7, 22–24, 30…)
Ajustes manuales + config tributaria ───────────────► resto de casillas
```

Regla crítica del instructivo:
- Casillas **1–8 del Anexo A** se alimentan del **607** (excepto RST, Libro de Ventas SF, o solo e-CF).
- Casillas **44 y 45–56** deben cuadrar con el **606** (ITBIS por adelantar / regímenes especiales).
- El IT-1 **consume** totales del Anexo A; no se declara “aparte” sin anexos coherentes.

---

## 2. Qué información proviene de Ventas

### 2.1 Anexo A — por tipo de NCF (casillas 1–8)

| Casilla | Concepto | Dato a almacenar / derivar |
|--------:|----------|----------------------------|
| 1 | Crédito fiscal (01 y 31) | Cantidad NCF + **monto facturado sin impuesto** |
| 2 | Consumo (02 y 32) | Idem |
| 3 | Nota de débito (03 y 33) | Idem |
| 4 | Nota de crédito (04 y 34) | Idem (**resta**) |
| 5 | Registro único ingresos (12) | Idem |
| 6 | Regímenes especiales (14 y 44) | Idem |
| 7 | Gubernamentales (15 y 45) | Idem |
| 8 | Exportaciones (16 y 46) | Idem |

**Campos operativos necesarios por documento de venta / NC / ND:**
- Tipo comprobante DGII (serie tradicional Bxx o e-CF 3x).
- NCF / e-NCF.
- Fecha de emisión (periodo).
- Monto facturado **sin ITBIS** (base).
- Total con impuestos (para sección III).
- Estado (anulado / activo).
- Empresa emisora.

### 2.2 Anexo A — por tipo de venta / medio de pago (casillas 12–18)

Monto **bruto con impuestos** agrupado por:
- 12 Efectivo  
- 13 Cheque / Transferencia  
- 14 Tarjeta débito/crédito  
- 15 A crédito  
- 16 Bonos / certificado de regalo  
- 17 Permutas  
- 18 Otras formas  

**Requiere** en cada factura la descomposición de cobro (o compromiso) por forma DGII, no solo un string genérico.

### 2.3 Anexo A — por tipo de ingreso (casillas 20–25)

Base **sin impuesto**, clasificada:
- 20 Operaciones no financieras (habitual)  
- 21 Financieros  
- 22 Extraordinarios  
- 23 Arrendamientos  
- 24 Venta de activos depreciables  
- 25 Otros  

### 2.4 Anexo A — casillas especiales de ventas

| Casilla | Origen ventas | Nota |
|--------:|---------------|------|
| 9 | Ajustes positivos (muestras, faltantes no merma, retiro personal, NC > 30 días que afectan periodo) | Suele ser **manual / inventario** |
| 10 | Ajustes negativos (ej. impuestos ajenos en factura) | Manual / clasificador |
| 27 | Retención Norma 08-04 (cobros con tarjeta) | Relación venta + liquidación bancaria/POS |
| 43 | NC emitidas > 30 días desde facturación | NC + factura origen + fechas |

### 2.5 IT-1 — ingresos (casillas 1–15)

| Casilla IT-1 | Fuente principal |
|-------------:|------------------|
| 1 | Anexo A casilla 11 (derivado ventas + ajustes) |
| 2–5, 8 | Clasificación fiscal de ingresos (exportación bienes/servicios, exentos, exentos por destino, exentos Art. 343 III/IV) |
| 6–7 | Anexo A 38 y 42 (constructores / comisionistas) |
| 10 | 1 − 9 (auto) |
| 11–15 | Desglose de base gravada por **tasa** (18 / 16 / 9 / 8) + activos cat. 2–3 |

### 2.6 Tablas actuales Alahia (Ventas)

| Tabla / entidad | Qué aporta hoy | Suficiente para IT-1? |
|-----------------|----------------|------------------------|
| `FacturaHeaders` | NCF, RNC cliente, TotalItbis, SubTotal, Total, montos por forma pago, IdTipoDocumentos, FechaInseccion, EstaCancelada | **Parcial** — falta tipología DGII completa, base por tasa, tipo ingreso, tipo venta DGII |
| `FacturaDetalles` | Itbis, SubTotal por línea | **Parcial** — sin tasa efectiva ni clasificación gravado/exento |
| `NotasCredito` / `NotasCreditoDetalle` | NCF, NCFModificado, TotalItbis, montos | **Parcial** — no entran al 607 hoy; falta vínculo robusto fecha factura origen para casilla 43 |
| `Clientes` | CedulaRNC | Auxiliar 607 |
| `ECFEncabezado` / `ECFDetalle` | TipoECF, ENCF, MontoGravado, TotalITBIS | Útil para e-CF; no cableado a Anexo A |
| `SecuenciaECF` / NCF | TipoNCF | Config emisión |
| Módulo **Reporte 607** | Solo Fecha, RNC, NCF, FormaPago (texto), ITBIS, Total | **Insuficiente** para alimentar casillas 1–8 / 12–18 / 20–25 |

---

## 3. Qué información proviene de Compras

### 3.1 Anexo A — datos del 606

| Casilla | Concepto | Dato |
|--------:|----------|------|
| 44 | Compras a regímenes especiales | Total facturado de NCF tipo régimen especial reportados en 606 |
| 45–47 | ITBIS **no deducible** (exentos / activos cat. I / otros) | ITBIS pagado clasificado por destino + columna (local / servicios / importaciones) |
| 49–51 | ITBIS **deducible** (exportación / bienes gravados / servicios gravados) | Idem |
| 53 | ITBIS sujeto a proporcionalidad (Art. 349) | ITBIS no asignable 100% a gravado/exento |
| — | Validación | Suma “por adelantar” del 606 = distribución en columnas Compras Locales + Servicios |

### 3.2 IT-1 — retenciones / percepción que el contribuyente **practica** (sección A)

| Casillas | Concepto | Origen compras / pagos |
|---------:|----------|------------------------|
| 39–42 | Bases de servicios sujetos a retención (PF, ISFL, sociedades) | Compras/servicios + tipo de proveedor + norma |
| 43–45 | RST | Compras a proveedores RST |
| 47–48 | Comprobante de compras (bienes a no registrados) | Compras con NCF B11/equivalente |
| 50–58 | ITBIS retenido calculado | Bases × tasas / factores norma |
| 59 | ITBIS percibido en venta | Régimen percepción (cuando aplique) |

**Nota instructivo:** estas bases deben coincidir con 606 e idealmente con IR-17.

### 3.3 Tablas actuales Alahia (Compras)

| Tabla / entidad | Qué aporta hoy | Suficiente? |
|-----------------|----------------|-------------|
| `OrdenCompraHeaders` (FACTC) | NCF, NcfModificado, IdTipoBienesServicios, FormaPagoDgii, Montos bienes/servicios, TotalItbis, ItbisRetenido, ItbisProporcionalidad, ItbisLlevadoAlCosto, TipoRetencionIsr, MontoRetencionRenta, FechaPagoFiscal | **Buena base 606**; falta destino ITBIS deducible (45–53), tasa de línea, importaciones DGA, bandera régimen especial proveedor |
| `OrdenCompraDetalles` | Itbis, SubTotal, comportamiento línea | **Parcial** |
| `Proveedores` | RNC | Tipo ID 606 |
| `TipoBienesServices` | Catálogo 1–11 | OK para 606 |
| `Gastos` | Monto, proveedor, forma pago | **No fiscal** (sin NCF/ITBIS) → no alimenta IT-1 salvo se convierta a compra FACTC |
| Reporte **606** + TXT | Campos oficiales casi completos | **Sí para 606**; aún no distribuye automáticamente casillas 45–56 del Anexo A |

**Importaciones:** no hay entidad DGA / DUA / liquidación aduanera de ITBIS. Es un **hueco total** para columna Importaciones del Anexo A / casilla 24 del IT-1.

---

## 4. Qué información proviene de Contabilidad

Contabilidad **no sustituye** 606/607, pero Alahia debe usarla para:

| Uso en IT-1 | Dato contable |
|-------------|---------------|
| Conciliación casilla ingresos / ITBIS cobrado | Cuentas de Ingresos, ITBIS por pagar |
| Conciliación ITBIS crédito fiscal | ITBIS pagado / crédito fiscal |
| Casillas 21–25 tipo ingreso (si se opta por origen GL) | Cuentas de ingresos clasificadas |
| Casilla 24 Anexo A / activos depreciables | Ventas de activos fijos vs ingresos operativos |
| Activos categoría I (casilla 46) | Activación de ITBIS en activo |
| Auditoría periodo | Asientos del mes vs anexos |

### Tablas actuales

| Tabla | Útil para |
|-------|-----------|
| `CuentasContables` (`TipoCuenta`) | Agrupación Activo/Pasivo/Ingresos/Gastos/Costos |
| `AsientosContables` / `AsientosContablesDetalle` | Saldos periodo |
| `ContabilidadCuentaMapeo` (`CodigoConcepto`) | **Potencial** mapeo concepto fiscal → cuenta; hoy sin semilla ITBIS/IT-1 |
| `ActivoFijo` | Ventas de activos depreciables (Anexo A 24 / IT-1 15) si se registra baja/venta |

**Conclusión:** Contabilidad es apoyo de conciliación y, opcionalmente, origen de clasificaciones si se configura el mapeo; **no** es la fuente primaria de casillas 1–8 ni del ITBIS del 606.

---

## 5. Qué información proviene de Bancos / Tesorería

| Uso | Dato |
|-----|------|
| Anexo A 12–14 | Conciliar efectivo / transferencias / tarjetas vs facturas |
| Anexo A 27 (Norma 08-04) | Retención ITBIS en liquidaciones de tarjeta |
| Pagos a proveedores con retención | Fecha pago fiscal (ya parcialmente en compras) |
| IT-1 31 “otros pagos a cuenta” | Transferencias / depósitos identificados como pago ITBIS |
| Prueba de medios de pago 607 | Extractos vs `FormaPago` de ventas |

### Tablas actuales

| Tabla | Estado |
|-------|--------|
| `CuentaFinanciera` | OK operativa |
| `MovimientoFinanciero` | OK operativa; **sin** tipo fiscal (retención 08-04, pago ITBIS, liquidación POS) |
| `PagosFacturasClientes` / `PagosProveedor` | Cobros/pagos; no alimentan casillas IT-1 directamente |

**Conclusión:** Bancos **no generan** el Anexo A solos; sí habilitan **cuadre** y captura de retenciones de tarjeta / pagos a cuenta si se tipifican movimientos.

---

## 6. Qué información requiere configuración manual

| Área | Parámetros a configurar por empresa |
|------|-------------------------------------|
| Identidad | RNC, razón social, nombre comercial, correo, teléfono (Datos generales) |
| Régimen | RST / régimen especial / exento parcial / obligado e-CF / Libro ventas SF |
| Tasas | 18%, 16%, 9%, 8% vigentes y productos/servicios asociados |
| Clasificación ingresos | Default tipo ingreso (20–25) y exención (IT-1 2–5, 8) |
| Proporcionalidad | Si opera mixto gravado/exento (Art. 349) |
| Constructores / comisionistas | Habilitar secciones VI–VII Anexo A |
| Retenciones aplicables | Normas 08-04, 02-05, 07-09, 01-11, 07-07, RST, comprobante compras |
| Cuentas contables | Mapeo ITBIS cobrado, ITBIS crédito, ingresos por tipo |
| Importaciones | Cuenta/concepto ITBIS DGA |
| Saldos | Saldo a favor anterior; compensaciones/reembolsos autorizados |
| Penalidades | % recargo / interés (o fecha vencimiento para cálculo) |
| Declarante | Nombre y calidad (juramento) |

Estas configuraciones **no** deben hardcodearse en lógica de factura; viven en tabla(s) de configuración tributaria por `IdEmpresa`.

---

## 7. Tablas actuales que ya contienen datos útiles

| Módulo | Tablas | Uso IT-1 / Anexo A |
|--------|--------|--------------------|
| Ventas | `FacturaHeaders`, `FacturaDetalles` | Base 607 / casillas 1–8, 12–18 (parcial) |
| NC | `NotasCredito`, `NotasCreditoDetalle` | Casillas 4, 9, 43 (parcial) |
| Compras | `OrdenCompraHeaders`, `OrdenCompraDetalles` | 606 → 44, ITBIS, retenciones (parcial a 45–56 y sección A IT-1) |
| Maestros | `Empresas`, `Clientes`, `Proveedores`, `Productos` | Cabecera, RNC, flag ITBIS producto |
| e-CF | `ECFEncabezado`, `ECFDetalle`, `SecuenciaECF` | Tipos 31–46 |
| Contabilidad | Cuentas, asientos, mapeo | Conciliación |
| Tesorería | Cuentas y movimientos financieros | Conciliación medios de pago / 08-04 |
| Activos | `ActivoFijo` | Potencial casilla 24 / 15 |
| Reportes | Lógica 606 / 607 | Semilla de agregación |

---

## 8. Columnas / entidades que hacen falta agregar

### 8.1 Ventas (`FacturaHeaders` / detalle o tablas satélite)

| Campo propuesto | Propósito |
|-----------------|-----------|
| `CodigoTipoNcfDgii` (01/02/03/04/12/14/15/16 o e-CF) | Casillas 1–8 |
| `MontoFacturadoSinItbis` / `MontoGravado` / `MontoExento` | Base Anexo A e IT-1 |
| `MontoGravado18/16/9/8` | IT-1 11–14 |
| `TipoIngresoDgii` (1–6 ≈ casillas 20–25) | Anexo A IV |
| `TipoVentaMedioPagoDgii` desglosado (ya hay montos; mapear a códigos 12–18) | Anexo A III |
| `EsExportacion` / `EsExento` / `EsExentoPorDestino` / `CodigoExencion` | IT-1 2–5, 8 |
| `ItbisRetenidoTarjeta0804` | Anexo A 27 |
| Indicadores constructor/comisionista + montos | VI–VII |

### 8.2 Notas de crédito

| Campo | Propósito |
|-------|-----------|
| `IdFacturaOrigen` + `FechaFacturaOrigen` | Casilla 43 (>30 días) |
| Inclusión formal en 607 | Casilla 4 |

### 8.3 Compras (`OrdenCompraHeaders` o detalle destino)

| Campo | Propósito |
|-------|-----------|
| `DestinoItbis` (enum: NoDeducibleExento / ActivoCat1 / OtroNoDed / DedExport / DedBienGrav / DedServGrav / Proporcional) | Casillas 45–53 |
| `ItbisComprasLocales` / `ItbisServicios` / `ItbisImportaciones` | Columnas Anexo A IX |
| `ProveedorRegimenEspecial` / tipo NCF 14 | Casilla 44 |
| `TasaItbis` (18/16) | Retenciones RST / comprobante compras |
| `NormaRetencionItbis` (código norma) | Sección A IT-1 39–48 |
| `EsImportacion` + referencias DUA | Columna importaciones |

### 8.4 Nuevas tablas recomendadas (modelo de datos, aún sin UI)

| Tabla | Contenido |
|-------|-----------|
| `DgiiConfiguracionEmpresa` | Régimen, flags constructores/comisionistas, fechas, contactos declaración |
| `DgiiTasaItbis` | Histórico tasas |
| `DgiiClasificacionProducto` o extensión `Productos` | Tasa + exención + tipo ingreso default |
| `DgiiIt1Declaracion` | Cabecera periodo, tipo declaración, estado |
| `DgiiIt1AnexoA` / `DgiiIt1Lineas` | Snapshot de casillas generadas (auditoría) |
| `DgiiImportacionItbis` | ITBIS DGA por periodo/destino |
| `DgiiRetencionItbisVenta` | 08-04 y otras retenciones **sufridas** |
| `DgiiSaldoItbis` | Saldo a favor arrastrado, compensaciones |

### 8.5 Contabilidad / Bancos

| Extensión | Propósito |
|-----------|-----------|
| Semillas `ContabilidadCuentaMapeo` (`ITBIS_COBRADO`, `ITBIS_CREDITO`, `INGRESO_GRAVADO`, …) | Conciliación |
| `MovimientoFinanciero.CategoriaFiscal` | Pago ITBIS, retención tarjeta, etc. |

---

## 9. Casos especiales a contemplar

1. **RST / Libro Ventas SF / solo e-CF:** casillas 1–8 no se “auto-cargan” igual que 607 clásico; hay reglas distintas en instructivo.  
2. **Notas de crédito > 30 días:** casilla 43 informativa + posible impacto casilla 9 / total operaciones.  
3. **NC del periodo vs NC que afectan ventas de periodos previos.**  
4. **Proporcionalidad Art. 349:** obligatorio declarar coeficiente si hay mixto gravado/exento, aunque 53 sea cero.  
5. **Cuadre 606 ↔ Anexo A 56:** Oficina Virtual rechaza si Compras Locales + Servicios > ITBIS por adelantar del 606.  
6. **Importaciones DGA** distintas de compras locales.  
7. **Ventas a regímenes especiales (exento por destino)** vs **compras** a regímenes especiales (casilla 44).  
8. **Medios de pago mixtos** en una misma factura (desglose obligatorio casillas 12–18).  
9. **Retención 08-04** (tarjeta): no es el ITBIS de la factura; es retención del adquirente/liquidación.  
10. **Constructores (Norma 07-07)** y **comisionistas:** bases facturadas ≠ base sujeta a ITBIS.  
11. **Muestras, degustaciones, faltantes, autoconsumo:** casilla 9 (posible vínculo inventario).  
12. **Impuestos ajenos embebidos en factura** (ej. primera placa): casilla 10.  
13. **Activos fijos:** venta cat. 2–3 (IT-1 15/20) vs ITBIS llevado a activo cat. I (Anexo A 46).  
14. **Gastos operativos sin NCF:** no pueden engrosar crédito fiscal; deben quedar fuera o recatalogarse como compra.  
15. **Anulaciones / facturas sin NCF / FACT interno:** excluir del 607/Anexo A.  
16. **Rectificativas IT-1:** tipo declaración, pagos previos a cuenta (casilla 31).  
17. **Saldo a favor anterior** debe cuadrar con cuenta corriente DGII / declaración previa.  
18. **IR-17** previo para retenciones de sección A (alerta OV).  

---

## 10. Casillas: automáticas vs intervención de usuario

### 10.1 Anexo A

| Casillas | Modo | Condición |
|----------|------|-----------|
| 1–8 | **Auto** desde 607 / libro ventas / e-CF | Si régimen permite; datos de ventas íntegros |
| 11, 19, 26, 33, 37, 38, 41, 42, 48, 52, 54*, 55, 56 | **Auto (fórmulas)** | *54 puede auto-calcularse desde IT-1 2+5+10 / 1 |
| 9–10 | **Usuario / reglas inventario** | Ajustes no documentados en NCF estándar |
| 12–18 | **Auto** si medios de pago DGII están en factura; si no, **usuario** | |
| 20–25 | **Auto** si existe `TipoIngreso`; default 20 + excepción usuario | |
| 27–32 | **Mixto** | 27: liquidaciones tarjeta; 28–32: rubros sectoriales / OV; muchos **manuales** al inicio |
| 34–36, 39–40 | **Usuario** (sectores) o módulo vertical | |
| 43 | **Auto** si NC tiene factura origen y fechas | |
| 44 | **Auto** desde 606 filtrado regímenes especiales | |
| 45–47, 49–51, 53 | **Auto** si cada compra trae `DestinoItbis` + columnas; si no, **asistencia usuario por periodo** | |
| Datos generales | **Auto** desde `Empresas` + periodo | |

### 10.2 IT-1

| Casillas | Modo |
|----------|------|
| 1, 6, 7, 9, 10, 16–27, 30, 33–34, 38, 41, 46, 49–58, 60, 62–63, 67–68 | **Auto** (fórmulas o vínculo Anexo A) |
| 2–5, 8, 11–15 | **Auto** si ventas clasificadas por exención/tasa; si no, **usuario** |
| 28–29, 31–32 | **Usuario** (autorizaciones DGII / saldo anterior / pagos a cuenta) |
| 35–37, 64–66 | **Semi-auto** (% + fechas) / sanciones manuales |
| 39–48, 59, 61 | **Auto** desde compras tipificadas; gaps → usuario |
| Juramento / declarante | **Usuario** |

---

## 11. Mapa rápido origen módulo → casilla

| Origen | Casillas clave |
|--------|----------------|
| **Ventas** | Anexo A 1–8, 12–18, 20–25, 43; IT-1 1–15 (vía Anexo A + clasificación) |
| **Compras** | Anexo A 44–56; IT-1 22–24, 39–58 |
| **Contabilidad** | Conciliación; opcional apoyo 20–25 y saldos |
| **Bancos** | Cuadre 12–14; Anexo A 27; IT-1 31 |
| **Config / manual** | Datos generales, régimen, 9–10, 28–32, 34–36, 39–40, 28–29 IT-1, compensaciones, penalidades |
| **Importaciones (nuevo)** | Columna Importaciones Anexo A; IT-1 24 |

---

## 12. Plan de implementación por fases

### Fase 0 — Fundamentos de datos fiscales (sin UI IT-1)
- Completar modelo de **venta fiscal**: tipo NCF DGII, bases gravadas por tasa, exento, tipo ingreso, medios de pago DGII.
- Incluir **NC/ND** en agregación tipo 607; fechas origen para casilla 43.
- Extender **compras**: `DestinoItbis`, split local/servicios/importación, norma de retención ITBIS, tasa.
- Tabla `DgiiConfiguracionEmpresa` + tasas.
- **Criterio de salida:** poder reproducir totales de casillas 1–8, 12–18, 20 (default) y pool ITBIS 606 clasificable.

### Fase 1 — Cerrar 607 oficial (prerrequisito Anexo A)
- Ampliar DTO/reporte 607 a layout DGII (TXT).
- Mapear tipos NCF e-CF y tradicionales.
- Validaciones (NCF, RNC, anuladas).
- **Salida:** TXT 607 listo y reconciliable con ventas.

### Fase 2 — Motor Anexo A (solo almacenamiento + cálculo batch)
- Servicio de periodo que genere snapshot `DgiiIt1AnexoA` desde 607+606+ajustes.
- Fórmulas automáticas (11, 19, 26, 33, 48, 52, 54–56…).
- Captura mínima de ajustes 9–10 y retenciones sufridas (27+).
- Distribución ITBIS compras por destino (asistida).
- **Salida:** Anexo A calculado y auditable, sin declaración completa.

### Fase 3 — Motor IT-1 liquidación
- Generar `DgiiIt1Declaracion` desde Anexo A.
- Casillas ingresos no gravados/gravados, ITBIS cobrado, deducible, impuesto/saldo.
- Arrastre saldo a favor, pagos a cuenta, compensaciones (captura).
- Sección A retenciones practicadas (desde compras tipificadas).
- Penalidades semi-automáticas.
- **Salida:** borrador IT-1 + Anexo A listo para revisión.

### Fase 4 — Importaciones, proporcionalidad avanzada y verticales
- Módulo ITBIS DGA / importaciones.
- Wizard proporcionalidad Art. 349.
- Constructores / comisionistas (si aplica al cliente).
- Conciliación contable automática (mapeo cuentas).
- Norma 08-04 desde liquidaciones bancarias/POS.

### Fase 5 — Experiencia de usuario y cumplimiento
- Pantallas de revisión casilla a casilla, alertas de cuadre 606/607, exportes auxiliares.
- Guardado de declaraciones presentadas / rectificativas.
- *(Esta fase es UI; se menciona solo como cierre del plan; **no se desarrolla ahora**.)*

### Prioridad sugerida para un POS retail/servicios típico Alahia
1. Fase 0 + Fase 1 (datos + 607).  
2. Fase 2 casillas 1–8, 12–18, 44–56.  
3. Fase 3 liquidación básica (sin verticales).  
4. Resto según sector del cliente.

---

## 13. Riesgos si se genera IT-1 con el modelo actual “tal cual”

| Riesgo | Motivo |
|--------|--------|
| Casillas 1–8 incorrectas | 607 incompleto; NC fuera; tipo NCF no tipificado |
| Casillas 12–18 incorrectas | Forma de pago no codificada DGII |
| ITBIS cobrado mal | No hay base por tasa 18/16/9/8 |
| Crédito fiscal rechazado | 45–56 no clasificados; cuadre 606 falla |
| Importaciones en 0 siempre | Sin DGA |
| Retenciones sección A incompletas | Compras no tipifican norma/base sujeta |
| Falsa sensación de automatismo | Muchas casillas siguen siendo de configuración/ajuste humano |

---

## 14. Conclusión

Para que Alahia ERP genere el **IT-1 automáticamente** debe tratarse como un **sistema de liquidación fiscal mensual** alimentado por:

1. **Ventas fiscalmente tipificadas** (607 completo),  
2. **Compras con destino de ITBIS** (606 + clasificación Anexo A IX),  
3. **Configuración tributaria por empresa**,  
4. **Ajustes y autorizaciones** que DGII no puede inferir,  
5. Opcionalmente **importaciones, bancos tipificados y contabilidad mapeada**.

Hoy el mayor activo es el **606 de compras**. El mayor déficit es el **modelo de ventas/607 + destino del ITBIS en compras + ausencia total de IT-1/Anexo A y de importaciones**.

**Siguiente paso recomendado (fuera de este entregable):** validar con el contador del negocio qué verticales aplican (RST, constructores, comisionistas, exportación, mixto exento) para recortar el alcance de la Fase 0.
