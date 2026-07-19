# Centro de Producción — Cierre Etapa 1

**Fecha:** 2026-07-17  
**Ambiente:** solo `AlahiaPos_Dev`  
**Arquitectura:** v2.1 (congelada)

---

## Resumen

Etapa 1 del Centro de Producción quedó implementada y validada en Dev: motor + API/SignalR + adapter POS + tablero Angular. Smoke de dominio: **11/11 PASS**.

---

## Bloques

| Bloque | Estado | Evidencia |
|--------|--------|-----------|
| 1 Docs / plan | Hecho | `docs/Centro-Produccion-Arquitectura-v2.1.md`, `docs/Centro-Produccion-Etapa1-Plan-Bloque1.md` |
| 2 DDL + seed Dev | Hecho | `Scripts/Create_CentroProduccion_Etapa1_Dev.sql` ejecutado en Dev |
| 3 Dominio / servicios | Hecho | `AlahiaPos.Entities` + `DataAccess/Servicios/Produccion/*` |
| 4 API + Hub | Hecho | `api/produccion`, `/hubs/produccion` |
| 5 Adapter POS | Hecho | `ProduccionPosAdapter` post-commit en `FacturaHeaderController` |
| 6 Frontend | Hecho | `/centro-produccion`, menú Ventas |
| 7 Pruebas / cierre | Hecho | Smoke + checklist (este doc) |

---

## Validación Dev (schema / seed)

Consulta `sqlcmd` contra `AlahiaPos_Dev`:

| Check | Resultado |
|-------|-----------|
| Tablas `Produccion*` | 10 |
| Tipo `POS_ORDEN` | 1 |
| Flujo activo | 1 |
| Estados | 5 |
| Transiciones | 6 |
| Módulos CP | 5 |
| Config activas | 27 |
| Estaciones `GENERAL` | 27 |

---

## Smoke motor (`Tools/ProduccionSmoke`)

```text
RESULTADO  pass=11  fail=0
```

| Caso | Resultado |
|------|----------|
| Config activa | PASS |
| CrearDesdeEvento → PENDIENTE | PASS |
| Idempotencia misma key | PASS |
| ListarActivos | PASS |
| Transición → EN_PREPARACION | PASS |
| RowVersion vieja rechazada | PASS |
| Transición → LISTA | PASS |
| Cancelar → CANCELADA / fuera tablero | PASS |
| Historial ≥ 3 | PASS |
| Config inactiva → no crea | PASS |
| Restaurar config | PASS |

Comando:

```bash
dotnet run --project Tools/ProduccionSmoke/ProduccionSmoke.csproj
```

(Aborta si la connection string no contiene `AlahiaPos_Dev`.)

---

## Criterios de done Etapa 1

| Criterio | Estado | Notas |
|----------|--------|-------|
| Orden POS + módulo activo → trabajo en tablero | Código listo | Adapter + handler + FE hydrate/SignalR. Requiere **reinicio API** con build nuevo para E2E HTTP en vivo (proceso previo devolvía 404 en `/api/produccion`). |
| Módulo/config inactivo → orden OK, sin trabajo | PASS (smoke) | `CrearDesdeEvento` retorna null; adapter no-op / try-catch |
| Transición concurrente → 409 + refresh | PASS (lógica) | Servicio lanza; controller → Conflict; FE hydrate en 409 |
| Reconexión SignalR → GET activos | Código listo | `onreconnected` → hydrate |
| UI sin mesa/cocina/chef/comanda/KDS | PASS | Grep en `centro-produccion/` sin matches |
| Solo Dev tocado | PASS | Sin scripts/consultas a Prod |

---

## Pendiente operativo (no bloquea cierre de código)

1. **Reiniciar `AlahiaPosApi`** para cargar controller/hub/adapter.
2. Login con perfil que tenga `CENTRO_PRODUCCION` → menú Ventas.
3. Crear una orden POS y abrir `/centro-produccion` (hydrate o push &lt; ~2s).
4. Probar mute de sonido y un avance de estado en UI.

---

## Fuera de Etapa 1 (recordatorio)

Plantillas motor, alertas→Notificaciones, multi-estación UI, 2º adapter, estados por ítem enriquecidos, cancelación/actualización por origen al editar orden.

---

**Fin cierre Etapa 1.**
