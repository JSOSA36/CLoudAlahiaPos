# Principio de Arquitectura: Motor Fiscal Central de Alahia ERP

**Tipo:** Decisión de arquitectura vinculante  
**Estado:** Aprobado  
**Aplica desde:** Sprint C en adelante  
**Alcance:** Todo desarrollo presente y futuro del módulo fiscal DGII  
**Prevalencia:** Este documento prevalece sobre cualquier decisión de diseño anterior que lo contradiga.

---

## PRINCIPIO #1

Alahia ERP se diseñará pensando primero en la Facturación Electrónica.

Los reportes fiscales (606, 607, IT-1, Anexo A y cualquier formulario futuro) son representaciones de la información almacenada por el Motor Fiscal. Nunca serán la fuente principal de los datos.

La DGII recibe la información durante el ciclo operativo mediante la Facturación Electrónica. El Motor Fiscal existe para:

- Validar esa información.
- Organizarla.
- Auditarla.
- Conciliarla.
- Ayudar al contador.
- Generar cualquier declaración requerida.

Por esa razón **ningún formulario define la arquitectura**. **La arquitectura define los formularios.**

---

## 1. Declaración de visión

Alahia ERP es un sistema orientado al ecosistema de **Facturación Electrónica** de la DGII.

La fuente oficial de toda la información fiscal del sistema **no** es el 606, ni el 607, ni el IT-1. La fuente oficial son:

- Facturas electrónicas emitidas (e-CF).
- Facturas de compra registradas (FACTC con NCF/e-CF).
- Notas de crédito.
- Notas de débito.
- La **fotografía fiscal congelada** de cada documento.

Estos datos alimentan un único **Motor Fiscal Central** que es el responsable de generar, derivar o calcular todo lo demás.

---

## 2. Cambio de filosofía

| Enfoque anterior | Enfoque Alahia |
|------------------|----------------|
| Construir un ERP que genera un TXT 607 | Construir un ERP que **administra correctamente toda la información fiscal** de la empresa |
| El 606/607 son el centro de la arquitectura | El 606/607 son **reportes derivados** del Motor Fiscal |
| Cada reporte lee directamente la base comercial | Cada reporte **consume el Motor Fiscal** |
| Un cambio de formulario DGII requiere rediseñar el ERP | Un cambio de formulario solo requiere un **nuevo generador** sobre el mismo Motor |

---

## 3. Razón fundamental

Con la Facturación Electrónica:

- Cada e-CF emitido llega directamente a la DGII en tiempo real.
- Cada factura de compra con e-CF también es conocida por la DGII.
- La información fiscal ya existe durante todo el mes.

El verdadero valor del ERP **no** es producir un archivo de texto. El verdadero valor es:

1. **Organizar** la información fiscal.
2. **Validar** que los datos sean correctos y completos.
3. **Conciliar** internamente y contra lo reportado/recibido por la DGII.
4. **Auditar** diferencias, estados y cambios.
5. **Ayudar al contador** con herramientas de revisión y preparación.
6. **Preparar automáticamente** las declaraciones.

---

## 4. Arquitectura objetivo

```
Operación Comercial (POS, Compras, NC, ND, CxC, CxP)
        │
        ▼
Facturación Electrónica (e-CF emitido / e-CF recibido)
        │
        ▼
Fotografía Fiscal (congelada al confirmar documento)
        │
        ▼
┌─────────────────────────────────────┐
│       MOTOR FISCAL CENTRAL          │
│                                     │
│  Fuentes:                           │
│   • Fotografía fiscal de ventas     │
│   • Fotografía fiscal de compras    │
│   • Fotografía fiscal de NC/ND      │
│   • e-CF emitidos (ECFEncabezado)   │
│   • e-CF recibidos                  │
│   • Configuración fiscal empresa    │
│                                     │
│  Capacidades:                       │
│   • Conciliaciones                  │
│   • Validaciones                    │
│   • Alertas fiscales                │
│   • Agregados por periodo           │
│   • Clasificaciones                 │
│                                     │
└───────────┬─────────────────────────┘
            │
    ┌───────┼───────┬──────────┬──────────┐
    ▼       ▼       ▼          ▼          ▼
  606     607    Anexo A     IT-1     Futuros
 (TXT)   (TXT)  (cálculo) (liquidac.) reportes
    │       │       │          │
    ▼       ▼       ▼          ▼
 Reportes para el contador
 Dashboard fiscal gerencial
 Respaldo documental
 Conciliación OFV
```

---

## 5. Papel de los reportes fiscales (606, 607, IT-1, Anexo A)

Estos documentos **siguen existiendo** y son necesarios para el contador y para la presentación ante la DGII. Sin embargo, su naturaleza cambia:

| Documento | Rol anterior | Rol en Alahia |
|-----------|-------------|---------------|
| 606 | Fuente primaria de compras fiscales | Reporte derivado del Motor Fiscal |
| 607 | Fuente primaria de ventas fiscales | Reporte derivado del Motor Fiscal |
| IT-1 | Formulario que el contador llena | Declaración pre-calculada por el Motor Fiscal |
| Anexo A | Hoja de cálculo manual | Snapshot generado por el Motor Fiscal |

Sus funciones principales son:

- **Herramientas de revisión** para el contador.
- **Respaldo documental** ante fiscalizaciones.
- **Conciliación** entre lo calculado por Alahia y lo presentado en la OFV.
- **Apoyo para la presentación** de declaraciones.

**No** son la fuente primaria de los datos fiscales.

---

## 6. Papel del contador

El contador utiliza 606, 607, IT-1 y Anexo A como herramientas de trabajo, pero Alahia ERP le ofrece valor superior:

- Vista de periodo fiscal con estados por documento.
- Alertas de documentos pendientes de fotografía, con errores, o sin clasificar.
- Conciliación automática e-CF emitidos vs. 607 generado.
- Conciliación automática e-CF recibidos vs. 606 registrado.
- Pre-cálculo de IT-1 con indicación de casillas que requieren intervención manual.
- Drill-down desde cualquier casilla hasta el documento fuente.

---

## 7. Reglas de diseño vinculantes

Toda persona que desarrolle funcionalidad fiscal en Alahia ERP debe cumplir estas reglas:

### R1 — Nunca leer directamente la base comercial

Antes de diseñar un reporte o cálculo fiscal, preguntarse:

> *¿Este reporte debería leer directamente `FacturaHeaders` o `OrdenCompraHeaders`?*

La respuesta debe ser **NO**. Debe consumir la fotografía fiscal o el Motor Fiscal.

**Excepción única:** la propia fotografía fiscal, que sí lee la entidad comercial una vez (al momento de congelar), pero nunca más después.

### R2 — Los reportes son generadores, no fuentes

Si mañana la DGII cambia un formulario, crea uno nuevo o elimina uno existente, **solo se construye o modifica un generador** que consume el Motor Fiscal. No se rediseña el ERP.

### R3 — La fotografía fiscal es inmutable

Una vez generada con `EstadoFiscalDocumento = GENERADA`, la fotografía fiscal de un documento no se altera salvo por reproceso explícito (con auditoría). Los reportes leen datos congelados.

### R4 — El Motor Fiscal es desacoplado

El Motor Fiscal no depende del POS, ni de la UI, ni de la API de facturación. Es un servicio de dominio que:
- Recibe consultas de periodo/empresa.
- Lee fotografías fiscales + e-CF + configuración.
- Retorna datos agregados, líneas validadas y alertas.

### R5 — Toda funcionalidad fiscal es opcional por empresa

Heredado de Sprint B: si `FiscalActivo = false` o no existe configuración, el Motor Fiscal retorna vacío. El ERP operativo funciona sin cambios.

### R6 — Cadena de datos unidireccional

```
Operación comercial → Fotografía fiscal → Motor Fiscal → Reportes/Declaraciones
```

Nunca al revés. Un reporte 607 nunca modifica una factura. Un cálculo de IT-1 nunca altera un monto de compra.

### R7 — Facturación Electrónica como centro

Cuando una empresa es emisor electrónico, el e-CF es la fuente más confiable. El Motor Fiscal debe preferir datos del e-CF (`ECFEncabezado`) cuando existan, y caer a la fotografía fiscal de la entidad comercial cuando no haya e-CF.

### R8 — Trazabilidad completa

Todo dato fiscal debe poder rastrearse hasta su documento fuente:
- Cada línea del 607 → `IdFacturaHeader` o `IdNotaCredito`.
- Cada línea del 606 → `IdOrdenCompraHeader`.
- Cada casilla del Anexo A → conjunto de líneas 607/606 que la componen.
- Cada casilla del IT-1 → casillas del Anexo A de origen.

---

## 8. Impacto en el Sprint C (Motor 607)

El Sprint C (plano maestro en `docs/SprintC-PlanoMaestro-Motor607.md`) ya está alineado con esta visión:

| Principio | Cumplimiento en Sprint C |
|-----------|--------------------------|
| R1 — No leer base comercial | `Reporte607Service` lee `MontoGravado`, `MontoExento`, `TipoIngresoDgii` de la fotografía fiscal, no recalcula desde POS |
| R2 — Reporte como generador | El 607 es un generador TXT que consume datos congelados |
| R3 — Foto inmutable | El motor 607 solo ejecuta `SELECT`, nunca `UPDATE` |
| R4 — Desacoplado | Servicio dedicado en `DataAccess/Servicios/Dgii/` |
| R5 — Opcional por empresa | Guard `FiscalFeatureFlags.Generar607` |
| R6 — Cadena unidireccional | Venta → Foto → 607 (solo lectura) |
| R7 — e-CF preferido | Pendiente: en Sprint C se usa fotografía; Sprint futuro integrará `ECFEncabezado` como fuente preferida cuando exista `IdFacturaInterna` |
| R8 — Trazabilidad | Cada `Reporte607LineaDto` incluye `IdDocumento` y `TipoDocumentoAlahia` |

---

## 9. Evolución del Motor Fiscal (roadmap conceptual)

| Fase | Entregable | Fuentes que consume |
|------|-----------|---------------------|
| **Sprint C** | Generador 607 (TXT + grilla + alertas) | Fotografía fiscal ventas/NC |
| **Sprint D** | Motor Anexo A (casillas 1-56 calculadas) | 607 generado + 606 generado + ajustes |
| **Sprint E** | Motor IT-1 (liquidación pre-calculada) | Anexo A + saldos + configuración |
| **Sprint F** | Conciliación e-CF ↔ Motor Fiscal | `ECFEncabezado` + fotografía fiscal |
| **Sprint G** | Dashboard fiscal + alertas proactivas | Motor Fiscal completo |
| **Futuro** | Nuevos formularios DGII | Solo nuevo generador sobre Motor existente |

En cada fase, el Motor Fiscal crece en capacidades pero mantiene la misma arquitectura: **fotografía fiscal + e-CF → Motor → generadores de reportes**.

---

## 10. Glosario

| Término | Definición en Alahia |
|---------|----------------------|
| **Fotografía fiscal** | Snapshot inmutable de los datos fiscales de un documento comercial, capturado al momento de confirmar/emitir. Incluye montos gravados, exentos, tasas, tipo ingreso, tipo comprobante, propina. Almacenado en la propia entidad (`FacturaHeaders`, `NotasCredito`, `OrdenCompraHeaders`) |
| **Motor Fiscal Central** | Capa de servicio que lee fotografías fiscales + e-CF + configuración y produce agregados, validaciones, alertas y datos listos para generar cualquier reporte DGII |
| **Generador** | Servicio que toma la salida del Motor Fiscal y produce un formato específico (TXT 606, TXT 607, casillas Anexo A, formulario IT-1) |
| **e-CF** | Comprobante Fiscal Electrónico emitido/recibido, registrado en `ECFEncabezado` con respuesta DGII |
| **Operación comercial** | Cualquier transacción del ERP operativo (venta, compra, NC, ND, pago, recepción) que existe independientemente de si lo fiscal está activo |

---

## 11. Declaración final

No estamos construyendo un generador de reportes DGII.

Estamos construyendo un **Motor Fiscal moderno** para Alahia ERP, donde la Facturación Electrónica es el centro del ecosistema y todos los reportes fiscales son simplemente **diferentes representaciones de la misma información**.

Este principio de arquitectura es vinculante para todos los desarrollos futuros del módulo fiscal.
