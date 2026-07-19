# Sprint B — Impacto y desacoplamiento fiscal (versión oficial)

**Estado:** ✅ Implementado en `AlahiaPos_Dev` (DDL + capa API + hooks post-comercial + FE flags)  
**Base:** Sprint A en `AlahiaPos_Dev`  
**Alcance B autorizado:** ver §9 (solo Dev; sin Anexo A / IT-1 / TXT 606 / Prod)

Este documento es la **única** fuente oficial del Sprint B. Sustituye borradores previos del mismo archivo.

> **Motor Fiscal Central (vinculante):** ver `docs/Arquitectura-Motor-Fiscal-Central.md`. Sprint B implementa la infraestructura de desacoplamiento y fotografía fiscal que alimenta el Motor Fiscal Central definido como principio de arquitectura.

---

## 0. Correcciones vinculantes (resumen)

| # | Corrección |
|---|------------|
| 1 | Una sola estructura numerada; sin matrices duplicadas |
| 2 | Falta de `DestinoItbis` **nunca** bloquea FACTC, CxP, recepción, inventario ni pago |
| 3 | TXT 606 intacto; destino/clasificación son datos adicionales IT-1/Anexo A |
| 4 | `EstadoFiscalDocumento`: `NO_APLICA` \| `PENDIENTE_GENERAR` \| `GENERADA` \| `PENDIENTE_VALIDAR` \| `ERROR_FISCAL` |
| 5 | Primero commit comercial; luego foto; fallo → `ERROR_FISCAL` + log + reproceso |
| 6 | Operativos solo llaman `_dgiiFiscal.ProcesarDocumentoPosteriorAsync(...)` |
| 7 | Sin fila en `DgiiConfiguracionEmpresa` = fiscal apagado; sin activación masiva |
| 8 | Menú IT-1 = módulo `Empresa_Modulos` **y** `GenerarIt1`; 606/607 actuales sin cambio |
| 9 | Pruebas de no regresión ampliadas (§8) |
| 10 | Alcance Dev acotado (§9) |

---

## 1. Principio

Toda funcionalidad DGII (foto fiscal, IT-1, mejoras 606/607 ligadas a flags, FE) es **opcional, desacoplada y activable por empresa**.

El ERP operativo (POS, compras, caja, CxC, CxP, inventario) funciona igual con fiscal apagado o ausente.

```
Operación comercial ──commit──► éxito
                                      │
                                      ▼
                         _dgiiFiscal.ProcesarDocumentoPosteriorAsync
                                      │
                    ok → GENERADA / PENDIENTE_VALIDAR
                    fail → ERROR_FISCAL + log (sin rollback comercial)
```

---

## 2. Activación por empresa

### 2.1 Flags en `DgiiConfiguracionEmpresa`

| Flag | Default migraciones | Uso |
|------|---------------------|-----|
| `FiscalActivo` | `0` | Master de la capa fiscal nueva |
| `Generar606` | `0` | Comportamiento fiscal adicional (no apaga 606 actual) |
| `Generar607` | `0` | Idem ventas |
| `GenerarIt1` | `0` | Foto / clasificación orientada IT-1 |
| `FacturacionElectronicaActiva` | `0` | Sync lectura FE; sin motor FE en B |

### 2.2 Configuración ausente

Si **no hay fila** en `DgiiConfiguracionEmpresa`:

- `FiscalActivo` = false  
- `Generar606` / `Generar607` / `GenerarIt1` / FE = false para la capa nueva  
- Ninguna operación comercial falla por ausencia de config  

No insertar filas que activen funciones fiscales. Seed de Sprint A (fila con `Activo=1`) **no** implica módulo encendido: `FiscalActivo` nace en `0`.

### 2.3 Gate runtime

```
fiscalOn = (cfg != null && cfg.FiscalActivo)
it1On    = fiscalOn && cfg.GenerarIt1
```

Si `!fiscalOn` → la fachada retorna sin escribir (y documentos nuevos quedan `EstadoFiscalDocumento = NO_APLICA` o no se tocan).

### 2.4 Relación con `Empresa_Modulos`

| Concern | Quién manda |
|---------|-------------|
| Acceso comercial / menú visible | `Empresa_Modulos` + permiso usuario |
| Comportamiento fiscal (foto, IT-1) | `DgiiConfiguracionEmpresa` flags |

**IT-1 (futuro):** visible/usable solo si módulo `IT1` o `DGII_FISCAL` habilitado **y** `GenerarIt1 = true`.

**606 / 607 actuales:** `REPORTE_606` / `REPORTE_607` continúan como hoy. Flags nuevos no los ocultan ni alteran el TXT.

---

## 3. Estados documentales

### 3.1 `EstadoFiscalDocumento` (foto / proceso fiscal)

Valores:

| Valor | Cuándo |
|-------|--------|
| `NO_APLICA` | Empresa sin fiscal activo (o documento fuera de alcance) |
| `PENDIENTE_GENERAR` | Fiscal activo; documento operativo ya guardado; foto aún no generada |
| `GENERADA` | Fotografía creada correctamente y completa para el alcance B |
| `PENDIENTE_VALIDAR` | Foto creada pero requiere clasificación humana (p.ej. destino ITBIS) |
| `ERROR_FISCAL` | Excepción al procesar foto; documento comercial intacto |

No depender solo del log: el estado en BD permite conciliación.

### 3.2 Clasificación ITBIS de compras (Sprint A, independiente del 606)

Campos ya existentes en FACTC (`OrdenCompraHeaders`):

- `DestinoItbis` (nullable)  
- `DestinoItbisSugerido`  
- `EstadoClasificacionItbis` (`NO_APLICA` / `PENDIENTE_VALIDAR` / …)  
- `ClasificacionConfirmada`  

**Regla operativa (corrección 2):** con `FiscalActivo && GenerarIt1 && TotalItbis > 0` y sin destino confirmado:

- La compra se **guarda / confirma** normalmente  
- `EstadoClasificacionItbis = 'PENDIENTE_VALIDAR'`  
- `ClasificacionConfirmada = false`  
- `DestinoItbis` puede quedar NULL (o solo sugerido)  

**Nunca bloquea:** registro FACTC, confirmación, CxP, recepción, inventario, pago a suplidor.

**Solo bloqueará (sprints futuros, motor IT-1):** cálculo definitivo IT-1, cierre de periodo fiscal, marcar declaración lista para presentar.

`EstadoFiscalDocumento` y `EstadoClasificacionItbis` son ortogonales: uno describe la foto; el otro la validez de destino para Anexo A/IT-1.

---

## 4. Capa fiscal desacoplada

### 4.1 Servicios (API)

| Servicio | Rol |
|----------|-----|
| `IDgiiEmpresaFiscalService` | Lee flags; config ausente = off |
| `ITaxClassificationService` | Sugerencias / defaults (sin persistir venta) |
| `IFiscalDocumentSnapshotService` | Escribe fotografía en columnas Sprint A |
| `IDgiiFiscalService` | Fachada única para operativos |
| Conciliación (stub B) | Detecta `PENDIENTE_GENERAR`, `ERROR_FISCAL`, fiscal activo sin foto |

Ubicación: `AlahiaPos.DataAccess/Servicios/Dgii/` (+ interfaces).

### 4.2 Contrato obligatorio desde operativos

```csharp
await _dgiiFiscal.ProcesarDocumentoPosteriorAsync(...);
```

- Tras el commit comercial exitoso (venta / NC / compra).  
- Internamente: si `!FiscalActivo` → no-op / `NO_APLICA`.  
- Si activo: puede marcar `PENDIENTE_GENERAR`, generar foto → `GENERADA` o `PENDIENTE_VALIDAR`, o capturar → `ERROR_FISCAL`.  

**Prohibido** dentro de `ProcesarFactura`, cierre de caja, `PagosFacturasClientes`, inventario, conduces, bancos:

- Fórmulas / casillas Anexo A  
- Clasificación IT-1  
- Validaciones que bloqueen por destino  

### 4.3 Estrategia ante error

1. Confirmar operación comercial primero.  
2. Invocar fachada fiscal.  
3. Si falla: **no** revertir venta/compra; **no** afectar caja, CxC, CxP, inventario ni impresión; set `ERROR_FISCAL`; log técnico; permitir reproceso.  

Proceso de conciliación (preparado en B; UI mínima o job/API stub): listar documentos `PENDIENTE_GENERAR` | `ERROR_FISCAL` | fiscal activo sin foto.

---

## 5. Independencia 606

- `ObtenerReporte606Async` / export TXT: **cero cambios** en Sprint B.  
- `DestinoItbis` y `EstadoClasificacionItbis` no alimentan ni alteran el TXT 606.  
- Prueba obligatoria: hash TXT 606 antes vs después en Dev.

---

## 6. POS, compras y demás procesos

| Proceso | Con fiscal off / sin config | Con fiscal on |
|---------|-----------------------------|---------------|
| POS (venta, cobro, crédito, descuento, mixto, print) | Idéntico | + llamada posterior fachada |
| Cierre caja | Sin cambios de código | Sin lógica IT-1 |
| CxC / pagos | Sin reclasificar venta | Idem |
| CxP / pagos proveedor | Sin modificar clasificación compra | Idem |
| Inventario / conduces | Sin cambios | Sin lógica IT-1 |
| FACTC confirmación / recepción | Sin exigir Destino | Sugerencia + `PENDIENTE_VALIDAR`; **no bloquea** |
| 606 TXT | Intacta | Intacta |

Campos fiscales nuevos: nullable / defaults seguros; nunca bloquean venta si módulo off.

---

## 7. DDL Sprint B (solo `AlahiaPos_Dev`)

### `DgiiConfiguracionEmpresa`

Añadir: `FiscalActivo`, `Generar606`, `Generar607`, `GenerarIt1`, `FacturacionElectronicaActiva` — todas `BIT NOT NULL DEFAULT 0`.  
Update existente: forzar flags a `0` (no activar IT-1).

### Documentos

Añadir `EstadoFiscalDocumento NVARCHAR(30) NULL` (o NOT NULL con default `NO_APLICA`) en:

- `FacturaHeaders`  
- `NotasCredito`  
- `OrdenCompraHeaders`  

Backfill seguro: `NO_APLICA` (o NULL interpretado como no aplica).

---

## 8. Pruebas de no regresión (puerta de salida B)

| ID | Escenario | Esperado |
|----|-----------|----------|
| A1 | Empresa **sin fila** `DgiiConfiguracionEmpresa` | Vende, compra, caja, CxC, inventario OK |
| A2 | `FiscalActivo=false` (con o sin fila) | Igual; estados `NO_APLICA`; sin foto |
| B1 | `FiscalActivo=true`, `GenerarIt1=false` | POS/compras OK; sin exigir destino |
| C1 | IT-1 activo + compra con ITBIS sin Destino | FACTC confirma; `PENDIENTE_VALIDAR`; `ClasificacionConfirmada=false` |
| C2 | Confirmación + recepción FACTC sin DestinoItbis | Inventario/CxP OK |
| D1 | Error fiscal **después** de guardar venta | Venta OK; `ERROR_FISCAL`; log |
| D2 | Error fiscal **después** de guardar compra | Compra OK; `ERROR_FISCAL`; log |
| D3 | Reproceso documento `ERROR_FISCAL` | Pasa a `GENERADA` o `PENDIENTE_VALIDAR` |
| E1 | Hash TXT 606 antes/después | Idéntico |
| E2 | Cierre caja sin config fiscal | OK |
| E3 | Pago CxC | No reclasifica venta original |
| E4 | Pago CxP | No modifica clasificación fiscal de la compra |
| E5 | NCF obligatorio preexistente ausente | Sigue bloqueando como hoy |

Build completo API + FE requerido antes de cerrar B.

---

## 9. Alcance autorizado Sprint B

**Permitido (Dev):**

- DDL flags + `EstadoFiscalDocumento`  
- Capa `Servicios/Dgii/*` + DI + GET/PUT config admin  
- Hooks: `ProcesarDocumentoPosteriorAsync` tras venta / NC / FACTC  
- FACTC: sugerir destino / marcar `PENDIENTE_VALIDAR` **sin bloquear**  
- FE: cargar flags; menús IT-1/config gated; campos destino opcionales/visibles solo si it1 on  
- Stub/API conciliación + endpoint reproceso  
- Pruebas §8  

**Prohibido:**

- Producción  
- Motor Anexo A / IT-1  
- Cambios TXT 606  
- Bloqueo operativo por falta de clasificación  
- Modificar caja, inventario, CxC, CxP **salvo** hooks externos desacoplados en venta/NC/compra  

---

## 10. Lista final de archivos a modificar / crear

### 10.1 Nuevos (API — `AlahiaPosApi`)

| Archivo |
|---------|
| `Scripts/SprintB_DesacoplamientoFiscal_Dev.sql` |
| `AlahiaPos.Entities/Domain/` — propiedades nuevas en entities existentes (+ flags config) |
| `AlahiaPos.DataAccess/Servicios/Dgii/DgiiEmpresaFiscalService.cs` |
| `AlahiaPos.DataAccess/Servicios/Dgii/TaxClassificationService.cs` |
| `AlahiaPos.DataAccess/Servicios/Dgii/FiscalDocumentSnapshotService.cs` |
| `AlahiaPos.DataAccess/Servicios/Dgii/DgiiFiscalService.cs` |
| `AlahiaPos.DataAccess/Servicios/Dgii/FiscalReconciliacionService.cs` (stub) |
| `AlahiaPos.Entities/Interfaces/IDgiiEmpresaFiscalService.cs` |
| `AlahiaPos.Entities/Interfaces/ITaxClassificationService.cs` |
| `AlahiaPos.Entities/Interfaces/IFiscalDocumentSnapshotService.cs` |
| `AlahiaPos.Entities/Interfaces/IDgiiFiscalService.cs` |
| `AlahiaPos.Entities/Interfaces/IFiscalReconciliacionService.cs` |
| `AlahiaPosApi/Controllers/DgiiConfigController.cs` |
| `AlahiaPosApi/Controllers/DgiiFiscalReconciliacionController.cs` (opcional mínimo) |

### 10.2 Modificados (API)

| Archivo | Cambio |
|---------|--------|
| `AlahiaPos.Entities/Domain/DgiiConfiguracionEmpresa.cs` | Flags §2.1 |
| `AlahiaPos.Entities/Domain/FacturaHeaders.cs` | `EstadoFiscalDocumento` |
| `AlahiaPos.Entities/Domain/NotasCredito.cs` | `EstadoFiscalDocumento` |
| `AlahiaPos.Entities/Domain/OrdenCompraHeader.cs` | `EstadoFiscalDocumento` (clasificación ya en A) |
| `AlahiaPosApi/Program.cs` (o `Startup`) | DI servicios Dgii |
| `AlahiaPosApi/Controllers/FacturaHeaderController.cs` | Hook `ProcesarDocumentoPosteriorAsync` tras éxito comercial |
| `AlahiaPos.DataAccess/Servicios/NotasCreditoServices.cs` | Idem hook NC |
| `AlahiaPos.DataAccess/Servicios/ComprasService.cs` | Hook post-guardar/confirmar; **sin** tocar `ObtenerReporte606Async` |
| DTOs factura / NC / compra (según uso) | Campos opcionales foto/estado |
| Tests (si hay proyecto de tests) o script/checklist Dev | §8 |

**Explícitamente no tocar:** export 606, caja, pagos, CxC payments core, bancos, conduces (salvo ausencia de lógica fiscal nueva).

### 10.3 Frontend (`CLoudAlahiaPos`)

| Archivo | Cambio |
|---------|--------|
| `src/app/servicios/parametros.service.ts` (o auth/login) | Cargar flags DGII |
| Nuevo: `src/app/servicios/dgii-config.service.ts` | GET/PUT config |
| `src/app/config/menu-grupos.config.ts` | Entrada IT-1/config gated (606/607 sin cambio de reglas actuales) |
| `src/app/app.component.ts` | Visibilidad según módulo + flags |
| `src/app/Compras/factura-compra-form/*` | UI destino opcional; **nunca** required para confirmar |
| `src/app/Pos/pos/pos.component.ts` | Sin lógica IT-1; payload null-safe si aplica |
| `src/app/Modales/devolucion-factura/*` | Payload NC opcional |
| Tipados en `factura-header` / `compras` / `notas-credito` services | Estados fiscales |

### 10.4 Documentación

| Archivo |
|---------|
| `docs/IT1-SprintB-Impacto-Desacoplamiento.md` (este) |
| Referencia cruzada en `docs/IT1-Arquitectura-Funcional-Tecnica.md` |

---

## 11. Orden de implementación

1. DDL Dev (`FiscalActivo=0`, estados).  
2. Entities + servicios Dgii + DI.  
3. GET/PUT config + stub conciliación/reproceso.  
4. Hooks posteriores en factura / NC / FACTC.  
5. FE flags + menú + FACTC no bloqueante.  
6. Build + pruebas §8.  
7. Stop (sin Anexo A / IT-1 / Prod).

---

## 12. Checklist de salida

- [ ] Flags default 0; sin activación masiva  
- [ ] Sin fila config = fiscal off  
- [ ] FACTC sin Destino no bloquea operativa  
- [ ] TXT 606 hash idéntico  
- [ ] Hooks solo vía `_dgiiFiscal.ProcesarDocumentoPosteriorAsync`  
- [ ] Estados `EstadoFiscalDocumento` usados (no solo logs)  
- [ ] Pruebas §8 ejecutadas en Dev  
- [ ] Build completo OK  

---

**Fin — versión oficial Sprint B.**
