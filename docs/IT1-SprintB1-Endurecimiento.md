# Sprint B.1 — Endurecimiento fiscal (AlahiaPos_Dev)

**Estado:** implementado  
**Alcance:** no-op fiscal, outbox async + worker, auth config, idempotencia. Sin motor 607 / Anexo A / Prod.

---

## Nuevo flujo outbox fiscal

```
Operación comercial (POS / NC / Confirmar FACTC)
        │
        ▼ commit OK
IFiscalWorkEnqueueService.EnqueueFotografiaSiActivoAsync
        │
        ├─ FiscalActivo=false / sin config → NO-OP (cero outbox, cero UPDATE)
        │
        └─ FiscalActivo=true (y foto relevante)
               │
               ├─ IdempotencyKey = FiscalFoto:{IdEmpresa}:{Tipo}:{ReferenciaId}
               ├─ Si ya hay Pendiente/Procesando con misma key → no duplica
               ├─ Si foto válida (GENERADA/PENDIENTE_VALIDAR) y !Force → no encola
               ├─ INSERT EventosOutbox Estado=Pendiente (SIN dispatch síncrono)
               └─ marca documento PENDIENTE_GENERAR (una sola vez)
                        │
                        ▼
FiscalOutboxBackgroundService (cada ~3s)
        │ claim atómico UPDLOCK/READPAST → Estado=Procesando
        ▼
IDgiiFiscalService → snapshot (un SaveChanges → GENERADA | PENDIENTE_VALIDAR | ERROR_FISCAL)
        │
        └─ Outbox → Procesado | Error (reintento hasta MaxIntentos=5)
```

**El POS responde después del enqueue (INSERT liviano), no espera la fotografía.**

### Clave de idempotencia
`FiscalFoto:{IdEmpresa}:{Venta|NotaCredito|Compra}:{ReferenciaId}`  
Índice único filtrado mientras `Estado IN (Pendiente, Procesando)`.

---

## Matriz de rutas de creación

| Ruta | Documento definitivo? | Encola fiscal? | Notas |
|------|----------------------|----------------|-------|
| `ProcesarFactura` | Sí (POS) | **Sí** | Única ruta venta definitiva cubierta |
| `NotasCreditoServices.CrearNotaCredito` | Sí | **Sí** | |
| `ComprasService.ConfirmarAsync` | Sí (FACTC) | **Sí** | |
| `ComprasService.GuardarBorradorAsync` | No (borrador) | No | Correcto |
| `InsertFactura` / mesa / cita | Orden/parcial | No | No son emisión fiscal definitiva |
| `AnularFactura` / `AnularAsync` compra | Anulación | No | Sin reverse fiscal (riesgo conocido) |

---

## Archivos modificados / nuevos

### Nuevos
- `Scripts/SprintB1_EndurecimientoFiscal_Dev.sql`
- `Servicios/Dgii/FiscalWorkEnqueueService.cs`
- `Servicios/Dgii/FiscalOutboxProcessor.cs`
- `Servicios/Dgii/FiscalOutboxBackgroundService.cs`
- `Servicios/Dgii/DgiiFiscalAuthService.cs`
- `Domain/DgiiConfiguracionAuditoria.cs`
- `docs/IT1-SprintB1-Endurecimiento.md` (este)

### Modificados (API)
- `EventoOutbox.cs`, `ContabilidadModuloConstantes.cs`, `DomainEventBase.cs`
- `FiscalFeatureDto.cs`, `IFiscalFeatureService.cs`
- `FiscalDocumentSnapshotService.cs`, `DgiiFiscalService.cs`, `DgiiConfigService.cs`
- `ContabilidadEventHandler.cs` (early return silencioso)
- `FacturaHeaderController.cs`, `NotasCreditoServices.cs`, `ComprasService.cs`
- `DgiiConfigController.cs`, `DgiiFiscalReconciliacionController.cs`
- `AlahiaPosContext.cs`, `Program.cs`

### Frontend
- `interceptorauth.services.ts` (Bearer + X-IdUsuario)

---

## Evidencia de pruebas (Dev)

Ver checklist en sección inferior. Ejecutar script DDL primero.

### SQL smoke (fiscal off)
```sql
-- Debe devolver 0 trabajos FiscalFotografiaPendiente recientes tras ventas normales con FiscalActivo=0
SELECT COUNT(*) FROM EventosOutbox WHERE TipoEvento = N'FiscalFotografiaPendiente' AND FechaCreacion > DATEADD(hour,-1,GETDATE());
```

### Confirmaciones de diseño B.1
- [x] Fiscal off → no-op (código Enqueue)
- [x] POS no espera worker
- [x] Un SaveChanges en snapshot activo
- [x] Auth PUT config + reproceso
- [x] Contabilidad silent skip fiscal events
- [x] IdempotencyKey documentada
- [x] Build API requerido

---

## Riesgos pendientes
- Anulaciones sin reverse fiscal.
- Otras rutas InsertFactura sin foto (intencional: no definitivas).
- Auth basada en token opaco (sin JWT claims); depende de Bearer + X-IdUsuario.
- Claim SQL asume SQL Server; reinicio deja Procesando stale recuperable por LockedUntil.

---

**Confirmación:** el POS **ya no espera** el procesamiento fiscal pesado; solo el encolado (si FiscalActivo).
