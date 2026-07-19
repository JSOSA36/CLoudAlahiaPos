# Centro de Producción — Etapa 1 — Plan técnico e inventario (BLOQUE 1)

**Arquitectura:** `Centro-Produccion-Arquitectura-v2.1.md` (aprobada)  
**Entorno BD:** **`AlahiaPos_Dev` exclusivamente**  
**Servidor (referencia Dev):** connection string API local apunta a `AlahiaPos_Dev` — no usar `AlahiaPos_Prod`

---

## 1. Confirmación de entorno

| Ítem | Valor |
|------|--------|
| Base de datos | **AlahiaPos_Dev** |
| Prod | **Prohibido** en esta iniciativa |
| Scripts | `AlahiaPosApi/Scripts/Create_Produccion_*.sql` (y seeds) con `USE AlahiaPos_Dev` |
| Validación | Todo `sqlcmd` / prueba contra Dev |

---

## 2. Plan técnico por bloques (recordatorio)

| Bloque | Contenido | Estado |
|--------|-----------|--------|
| **1** | Doc v2.1 + plan + inventario + confirmación Dev | **ENTREGADO — espera OK** |
| **2** | DDL Produccion*, índices, RowVersion, seeds | Pendiente aprobación B1 |
| **3** | Entidades, DbContext, contratos, servicios, handler outbox | Tras B2 |
| **4** | REST + Hub + hydrate + dashboard | Tras B3 |
| **5** | Adapter POS (post-commit aislado) | Tras B4 |
| **6** | Frontend tablero | Tras B5 |
| **7** | Pruebas + informe final | Tras B6 |

---

## 3. Plan técnico detallado Etapa 1

### 3.1 Backend — dominio y persistencia

1. Script SQL idempotente `Create_CentroProduccion_Etapa1_Dev.sql`:
   - Todas las tablas §5.1 de v2.1
   - `rowversion` en Trabajo e Ítem
   - Unique idempotencia
   - Índices de tablero/dashboard
2. Seed en mismo script o `Seed_CentroProduccion_Etapa1_Dev.sql`:
   - `Modulos.Codigo = CENTRO_PRODUCCION`
   - Tipo `POS_ORDEN`, flujo, estados, estación GENERAL
   - No asignar módulo a todas las empresas automáticamente (o sí solo Dev de prueba — decidir en B2: **recomendación: insertar módulo; activación por empresa manual/script opcional Dev**)

### 3.2 Backend — aplicación

1. Entidades en `AlahiaPos.Entities/Domain/Produccion/`
2. DTOs + contrato evento en `AlahiaPos.Entities/Events/` + `Dto/Produccion/`
3. `DbSet<>` en `AlahiaPosContext`
4. `IProduccion*Service` + implementaciones en `AlahiaPos.DataAccess/Servicios/Produccion/`
5. `ProduccionEventHandler : IDomainEventHandler` registrado en DI (composite dispatcher ya soporta múltiples handlers — verificar patrón actual Contabilidad/DGII)
6. Gate: si `!Config.Activo` o empresa sin módulo → return
7. Concurrencia: comparar `RowVersion` + `CodigoEstadoEsperado`

### 3.3 Backend — API / realtime

1. `ProduccionController` bajo ruta `api/produccion`
2. `ProduccionHub` → `/hubs/produccion`
3. Auth JWT + filtro empresa
4. Tras mutación: push SignalR grupo empresa

### 3.4 Adapter POS

1. Punto: `FacturaHeaderController.Post` (y/o servicio post-`InsertFacturaHeader`) **después** de SaveChanges exitoso
2. Construir payload snapshot desde el DTO/entidad **ya en memoria** (no re-query compleja; no meter lógica en el motor)
3. `PublishAsync` outbox dentro de try/catch; log si falla
4. No cambiar respuesta HTTP de éxito de la orden

### 3.5 Frontend

1. Módulo/ruta `/centro-produccion`
2. Servicio HTTP + SignalR (patrón `notificaciones.service.ts`)
3. Board dinámico por estados del flujo
4. Timer cliente + semáforo según timestamps/SLA del DTO
5. Sonido (asset local / Web Audio) + mute
6. Menú: `CENTRO_PRODUCCION` → ruta
7. Reutilizar/limpiar stubs `kds`/`loginkds` solo si aporta; preferir rutas nuevas limpias

### 3.6 Criterios de done Etapa 1

- Orden POS con módulo activo → aparece en tablero &lt; ~2s (o tras hydrate)
- Módulo inactivo → orden OK, cero error, cero fila trabajo
- Transición concurrente → 409 + refresh
- Reconexión SignalR → GET activos reconcilia
- UI sin mesa/cocina/KDS en textos base
- Solo Dev tocado

---

## 4. Inventario de archivos

### 4.1 Crear (Backend — AlahiaPosApi)

| Archivo / carpeta | Bloque |
|-------------------|--------|
| `Scripts/Create_CentroProduccion_Etapa1_Dev.sql` | 2 |
| `Scripts/Seed_CentroProduccion_Etapa1_Dev.sql` | 2 |
| `AlahiaPos.Entities/Domain/Produccion/*.cs` (entidades) | 3 |
| `AlahiaPos.Entities/Dto/Produccion/*.cs` | 3 |
| `AlahiaPos.Entities/Events/ProduccionTrabajoSolicitadoEvent.cs` | 3 |
| `AlahiaPos.Entities/Interfaces/IProduccion*.cs` | 3 |
| `AlahiaPos.DataAccess/Servicios/Produccion/*.cs` | 3 |
| `AlahiaPos.DataAccess/Servicios/Produccion/ProduccionEventHandler.cs` | 3 |
| `AlahiaPosApi/Controllers/ProduccionController.cs` | 4 |
| `AlahiaPosApi/Hubs/ProduccionHub.cs` | 4 |

### 4.2 Modificar (Backend)

| Archivo | Cambio | Bloque |
|---------|--------|--------|
| `AlahiaPos.Entities/Events/DomainEventBase.cs` | + `ProduccionTrabajoSolicitado` en `DomainEventTypes` | 3 |
| `AlahiaPos.DataAccess/Data/AlahiaPosContext.cs` | DbSets Produccion* | 3 |
| `AlahiaPosApi/Program.cs` | DI servicios, handler, MapHub | 3–4 |
| `AlahiaPosApi/Controllers/FacturaHeaderController.cs` (o servicio) | Publicar evento post-commit Orden | 5 |
| `DomainEventDispatcher` (si hace falta multi-handler) | Asegurar N handlers | 3 |

### 4.3 Crear (Frontend — CLoudAlahiaPos)

| Archivo / carpeta | Bloque |
|-------------------|--------|
| `src/app/centro-produccion/` (module, board, card, dashboard strip) | 6 |
| `src/app/models/produccion.models.ts` | 6 |
| `src/app/servicios/produccion.service.ts` | 6 |
| `src/app/servicios/produccion-realtime.service.ts` | 6 |
| Assets sonido (opcional) | 6 |

### 4.4 Modificar (Frontend)

| Archivo | Cambio | Bloque |
|---------|--------|--------|
| `app-routing.module.ts` | Ruta `/centro-produccion` | 6 |
| `app.module.ts` | Declaraciones / imports | 6 |
| `app.component.ts` | `MODULO_RUTAS.CENTRO_PRODUCCION` | 6 |
| `config/menu-grupos.config.ts` | Grupo operativo / ventas | 6 |
| Pos / factura publisher gaps (tipo servicio, referencia) | Solo si necesarios para snapshot | 5–6 |

### 4.5 Documentación

| Archivo | Bloque |
|---------|--------|
| `docs/Centro-Produccion-Arquitectura-v2.1.md` | 1 (hecho) |
| `docs/Centro-Produccion-Etapa1-Plan-Bloque1.md` | 1 (este) |
| Actualizar punteros en docs v2 / revision | 1 |

### 4.6 No tocar

- `AlahiaPos_Prod`
- Lógica fiscal/contable existente (salvo DI paralelo)
- Renombrar masivo `Cocinas` legacy (fuera de alcance Etapa 1)
- Stubs KDS: no expandir concepto cocina; opcional redirect futuro

---

## 5. Riesgos controlados Etapa 1

| Riesgo | Mitigación |
|--------|------------|
| Dispatcher solo un handler | Revisar registro DI; pattern multi-handler |
| Publicar antes de commit | Publicar **después** de SaveChanges |
| Payload incompleto | Snapshot desde objetos en memoria del Post |
| Empresas sin seed flujo | Handler no-op + log si no hay flujo activo |
| FE sin módulo | Ocultar menú; deep-link protegido |

---

## 6. Evidencia BLOQUE 1

- [x] Documento consolidado **v2.1** generado  
- [x] Plan técnico detallado Etapa 1  
- [x] Inventario de archivos crear/modificar  
- [x] Confirmación explícita: **solo AlahiaPos_Dev**  
- [ ] Aprobación usuario para iniciar **BLOQUE 2** (DDL)

---

**Fin BLOQUE 1 — esperando aprobación para continuar al BLOQUE 2.**
