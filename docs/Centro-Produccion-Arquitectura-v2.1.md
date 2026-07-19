# Centro de Producción — Arquitectura vigente (v2.1)

**Tipo:** Plano maestro consolidado  
**Versión:** 2.1  
**Estado:** **APROBADO** — base para implementación Etapa 1  
**Entorno de implementación:** únicamente **`AlahiaPos_Dev`** (prohibido Prod sin autorización explícita)

### Historial documental

| Versión | Documento | Estado |
|---------|-----------|--------|
| KDS | `KDS-Arquitectura-Funcional-Tecnica.md` | Histórico |
| CP v1 | `Centro-Produccion-Revision-Arquitectura.md` | Histórico |
| CP v2 | `Centro-Produccion-Arquitectura-v2.md` | Histórico |
| Plantillas/Alertas | `Centro-Produccion-Plantillas-y-Alertas.md` | Incorporado aquí |
| **CP v2.1** | **Este archivo** | **Vigente** |

---

## 0. Principios innegociables

1. Motor **multisectorial** (un núcleo para todos los verticales).
2. El núcleo **no conoce** POS, Conduces, Car Wash, Lavandería, Bizcocho ni ningún módulo origen.
3. Los módulos origen **solo publican** el contrato de evento **después del commit**.
4. Prohibido en el núcleo: `Cocina`, `Kitchen`, `Chef`, `Comanda`, `Mesa`, `KDS` (como dominio). Solo como **dato** configurable (nombre de estación).
5. **No duplicar** lógica comercial; el trabajo referencia origen por snapshot del evento.
6. El motor **no lee** `FacturaHeaders`, Conduces ni tablas de origen.
7. Una falla del Centro de Producción **nunca bloquea** venta u operación.
8. BD = fuente de verdad; SignalR = tiempo real; hydrate al reconectar.
9. Estados, estaciones y SLA = **datos**, no hardcode de vertical.
10. Implementación solo en **`AlahiaPos_Dev`**.

---

## 1. Naming aprobado

| Ámbito | Valor |
|--------|--------|
| Producto / UI | **Centro de Producción** |
| Código módulo | `CENTRO_PRODUCCION` |
| Tablas / entidades / servicios | Prefijo **`Produccion*`** |
| API | `/api/produccion/*` |
| SignalR | `/hubs/produccion` |

---

## 2. Visión

```
Módulos origen ──outbox contrato──► MOTOR Produccion* ──► Tablero + Dashboard
   (POS, …)        (desacoplado)      Flujo·SLA·Trabajo         /hubs/produccion
                                      Estación·Historial
                                      [Plantilla Etapa 2]
                                      [Alertas Etapa 2]
```

---

## 3. Conceptos del dominio

| Concepto | Rol | Etapa |
|----------|-----|-------|
| **TipoTrabajo** | Familia (`POS_ORDEN`, …) | 1 |
| **Flujo** | Estados, transiciones, **SLA** | 1 |
| **Estado / Transición** | Configurables | 1 |
| **Estación** | Lugar operativo configurable | 1 (mín. GENERAL); UI multi-estación 2 |
| **Responsable** | Por estación (modelo) | DDL 1 / UI 2 |
| **Trabajo** | Instancia + snapshot SLA | 1 |
| **Ítem** | Línea/paso del trabajo | 1 (desde evento) |
| **Historial** | Auditoría de estados | 1 |
| **Plantilla** | Pasos auto según servicio | **Diseño + `PlantillaCodigo?` en contrato Etapa 1; motor Etapa 2** |
| **Alerta** | Hecho de dominio (retraso, etc.) | **Diseño Etapa 1; motor Etapa 2; Notificaciones 2/3** |
| **Dashboard** | KPIs operativos | 1 (básico) |

### Flujo vs Plantilla

- **Flujo:** *cómo* avanza (estados + SLA + reglas).
- **Plantilla:** *qué pasos* se materializan (Premium vs Básico).  
  Etapa 1: ítems vienen del evento. Etapa 2: plantilla puede generarlos.

### Relojes de tiempo (Etapa 1 — ajuste operativo)

Tres métricas independientes (no un solo reloj):

| Métrica | Desde | Hasta | Pregunta que responde |
|---------|-------|-------|------------------------|
| **Cola** | `FechaCreacion` | `FechaInicio` (o ahora) | ¿Cuánto esperó antes de empezar? |
| **Preparación** | `FechaInicio` | `FechaCompletado` (o ahora) | ¿Cuánto duró la ejecución? |
| **Total** | `FechaCreacion` | `FechaCompletado` (o ahora) | ¿Qué percibe el cliente? |

**SLA configurable por flujo** (`SlaModoInicio`):

- `CREACION` — el semáforo usa el reloj desde creación.
- `INICIO_PREPARACION` — el semáforo solo arranca al iniciar preparación; antes muestra `EN_COLA`.

Snapshot en el trabajo: `SlaModoInicioSnapshot`, `Sla*SegundosSnapshot`, `FechaLimiteObjetivo` (nullable hasta que el reloj SLA arranca).

Seed `POS_ORDEN`: modo `INICIO_PREPARACION` (15 min / adv. 10 min de preparación real).

---

## 4. Contrato estándar de eventos

### 4.1 `ProduccionTrabajoSolicitado` (Etapa 1)

```
IdEmpresa
TipoTrabajo
OrigenModulo
OrigenTipo
OrigenId
IdempotencyKey
NumeroVisible
NombreVisible
Referencia?
EtiquetaContexto?
Observacion?
IdUsuarioSolicita?
Prioridad?
PlantillaCodigo?          // ← Etapa 1: nullable; ignorado hasta Etapa 2
Items[] {
  OrigenDetalleId?
  CodigoItem?
  NombreItem
  Cantidad
  Observacion?
  VariacionesTexto?
  EstacionCodigo?
}
```

### 4.2 Otros (Etapa 1 parcial / 2)

- `ProduccionTrabajoActualizado` — cambios de líneas en origen (Etapa 2 o mínimo en 1 si hace falta).
- `ProduccionTrabajoCanceladoPorOrigen` — anulación en origen.
- `ProduccionAlertaGenerada` — Etapa 2.

### 4.3 Tipo outbox

`DomainEventTypes.ProduccionTrabajoSolicitado = "ProduccionTrabajoSolicitado"`

---

## 5. Modelo de datos (Etapa 1 + huecos Etapa 2)

### 5.1 Tablas Etapa 1 (implementar)

| Tabla | Propósito |
|-------|-----------|
| `ProduccionTipoTrabajo` | Catálogo |
| `ProduccionConfiguracionEmpresa` | Gate + defaults UI/SLA fallback |
| `ProduccionFlujo` | Incluye `SlaObjetivoSegundos`, `SlaAdvertenciaSegundos` |
| `ProduccionFlujoEstado` | Estados del flujo |
| `ProduccionFlujoTransicion` | Opcional Etapa 1: si se omite, avance lineal por `Orden` + cancelación |
| `ProduccionEstacion` | Al menos `GENERAL` por empresa al activar |
| `ProduccionEstacionResponsable` | Tabla lista; sin UI obligatoria |
| `ProduccionTrabajo` | Instancia + snapshots SLA + origen + idempotencia + RowVersion |
| `ProduccionTrabajoItem` | Ítems + RowVersion |
| `ProduccionHistorial` | Auditoría |

### 5.2 Tablas Etapa 2 (no crear en Etapa 1 salvo decisión explícita)

- `ProduccionPlantilla`, `ProduccionPlantillaPaso`
- `ProduccionAlerta`, `ProduccionTipoAlerta`
- `ProduccionPantalla` (+ estaciones)

**Decisión Etapa 1:** no crear tablas vacías de Plantilla/Alerta; solo el campo `PlantillaCodigo` en el contrato/evento payload.

### 5.3 Constraints clave

- `UQ_ProduccionTrabajo_Idempotency` (`IdEmpresa`, `IdempotencyKey`)
- Alternativa/adicional: `UQ` (`IdEmpresa`, `OrigenTipo`, `OrigenId`)
- `RowVersion` en Trabajo e Ítem
- FK flujo/estado/estación coherentes
- Índices: `(IdEmpresa, ActivoEnTablero, CodigoEstadoActual, FechaCreacion)`, `(IdEmpresa, TipoTrabajo)`

### 5.4 Semáforo SLA

Snapshot al crear: `SlaObjetivoSegundosSnapshot`, `SlaAdvertenciaSegundosSnapshot`, `FechaLimiteObjetivo`.

| Condición | Semáforo |
|-----------|----------|
| ahora &lt; advertencia | OK / En tiempo |
| advertencia ≤ ahora &lt; límite | ADVERTENCIA / Por vencer |
| ahora ≥ límite y no completado | RETRASADO |

---

## 6. Etapa 1 — alcance aprobado

### Incluye

- Motor Centro de Producción (`Produccion*`)
- Adapter POS (publica tras commit de Orden)
- Flujo y estados configurables (seed `POS_ORDEN`)
- SLA por flujo + snapshot + semáforo
- Tablero tiempo real + SignalR + hydrate
- Historial + cancelación con motivo
- Sonido local (nueva orden / crítico una vez)
- Dashboard operativo básico
- Contrato con `PlantillaCodigo?`
- Desacoplamiento total
- Módulo `CENTRO_PRODUCCION` + permisos base
- Gate: si módulo/config inactivo → no-op

### No incluye

- CRUD / motor / matching de Plantillas
- Motor completo de Alertas
- Integración Centro de Notificaciones
- Multi-estación avanzada / Despacho / UI responsables
- Adapters Conduces, Car Wash, etc.

### Etapa 2 (planificado)

Plantillas, Alertas (+ bridge Notificaciones), estaciones/pantallas/responsables UI, 2º adapter, estados por ítem enriquecidos.

### Etapa 3

Más verticales, reportes ricos, priorización avanzada.

---

## 7. Desacoplamiento técnico

| Capa | Puede depender de |
|------|-------------------|
| Publisher POS | `IDomainEventPublisher` + DTO contrato Produccion |
| Handler motor | Contrato + tablas `Produccion*` + hub produccion |
| Handler motor | **NO** FacturaHeader, Conduces, Lavador, … |
| Front tablero | Solo `/api/produccion` y hub |

Errores del handler/outbox: log + reintento; **no** excepción hacia el HTTP de guardar orden.

---

## 8. API y hub (Etapa 1)

### REST (borrador)

| Método | Ruta |
|--------|------|
| GET | `/api/produccion/config` |
| PUT | `/api/produccion/config` (admin) |
| GET | `/api/produccion/trabajos/activos` |
| GET | `/api/produccion/trabajos/{id}` |
| POST | `/api/produccion/trabajos/{id}/transicion` |
| POST | `/api/produccion/trabajos/{id}/cancelar` |
| POST | `/api/produccion/trabajos/{id}/prioridad` |
| GET | `/api/produccion/trabajos/{id}/historial` |
| GET | `/api/produccion/flujos` (lectura seed/config) |
| GET | `/api/produccion/dashboard/resumen` |

Body transición: `{ codigoEstadoEsperado, codigoEstadoNuevo, rowVersion, motivo? }`.

### SignalR `/hubs/produccion`

Grupos: `produccion:empresa:{id}`  
Eventos: `produccion:trabajoUpsert`, `produccion:trabajoEstado`, `produccion:alerta` (stub futuro)

---

## 9. UI Etapa 1

- Ruta: `/centro-produccion`
- Título: Centro de Producción
- Board por estados del flujo (dinámico)
- Tarjetas: número, nombre/referencia, etiqueta contexto, tiempo, semáforo SLA, ítems, acciones
- Filtros básicos + dashboard superior
- Sin mesa / cocina / chef / comanda / KDS en copy base
- Sonido local configurable en dispositivo

---

## 10. Permisos Etapa 1

| Código | Uso |
|--------|-----|
| `CENTRO_PRODUCCION` | Módulo / licencia empresa |
| `PRODUCCION_VER` | Abrir tablero |
| `PRODUCCION_GESTIONAR` | Transiciones |
| `PRODUCCION_CANCELAR` | Cancelar |
| `PRODUCCION_PRIORIDAD` | Prioridad |
| `PRODUCCION_CONFIG` | Config empresa / lectura flujos |

(Reportes / reabrir / asignar responsable → etapas posteriores.)

---

## 11. Seed Etapa 1

**TipoTrabajo:** `POS_ORDEN`  
**Flujo:** “Órdenes POS” — SLA objetivo 15 min; advertencia 10 min (o 80%)  
**Estados:** `PENDIENTE` → `EN_PREPARACION` → `LISTA` → `ENTREGADA` + `CANCELADA` (terminal, no cuenta para completar)  
**Estación:** `GENERAL`  
**Módulo:** `CENTRO_PRODUCCION`

---

## 12. Adapter POS (Etapa 1)

- Tras `InsertFacturaHeader` exitoso de Orden (`IdTipoDocumentos = 10`), si empresa tiene módulo/config activa:
  - Publicar `ProduccionTrabajoSolicitado` con snapshot (número, nombre, nota, tipo servicio si existe, líneas, `PlantillaCodigo = null`).
- `try/catch` + outbox: fallo aislado.
- Gaps comerciales útiles (mínimos, en publisher): mapear tipo servicio y referencia si ya existen campos; no bloquear si faltan.

---

## 13. Decisiones aprobadas (checklist)

- [x] Plantillas en arquitectura; `PlantillaCodigo?` en contrato Etapa 1  
- [x] Motor plantillas / alertas / notificaciones → Etapa 2+  
- [x] Naming `Produccion*` / `CENTRO_PRODUCCION` / rutas aprobadas  
- [x] SLA + semáforo + dashboard básico Etapa 1  
- [x] Solo `AlahiaPos_Dev`  
- [x] Luz verde implementación por bloques con aprobación entre bloques  

---

**Fin del documento vigente v2.1.**
