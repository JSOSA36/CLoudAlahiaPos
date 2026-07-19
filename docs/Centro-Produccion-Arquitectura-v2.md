# Centro de Producción — Arquitectura vigente (v2)

> **SUPERSEDED.** Documento vigente: [`Centro-Produccion-Arquitectura-v2.1.md`](./Centro-Produccion-Arquitectura-v2.1.md)

**Tipo:** Plano maestro (histórico)  
**Versión:** 2.0  
**Histórico:**  
- `KDS-Arquitectura-Funcional-Tecnica.md` (superseded)  
- `Centro-Produccion-Revision-Arquitectura.md` v1 (base de esta v2)  
**Estado:** superseded por v2.1 (aprobada)  
**Entorno de implementación futura:** solo `AlahiaPos_Dev`

---

## 0. Principios fundamentales (innegociables)

1. **Motor multisectorial.** Un solo núcleo para restaurante, cafetería, repostería, car wash, lavandería, ferretería (conduces), almacén y futuros verticales.
2. **Núcleo sin conocimiento de módulos origen.** El Centro de Producción **nunca** importa, referencia ni llama a POS, Conduces, Car Wash, Lavandería, Bizcocho, etc. Solo consume un **contrato de evento estándar**.
3. **Los módulos origen solo publican.** Tras su commit comercial/operativo, emiten el evento vía outbox. No conocen pantallas ni tablas internas del motor más allá del contrato.
4. **Sin vocabulario de cocina en el núcleo.** `Cocina`, `Kitchen`, `Chef`, `Comanda`, `Mesa`, `KDS` como dominio: **prohibidos** en código, APIs, tablas y hub. Solo pueden existir como **datos configurables** (nombre de una estación de una empresa).
5. **No duplicar dominio comercial.** El trabajo apunta a un origen (`OrigenTipo` + `OrigenId`); no copia totales, pagos ni inventario.
6. **Fallo del motor / tablero no bloquea** la operación del módulo origen.
7. **BD = fuente de verdad;** SignalR = proyección en tiempo real; hydrate al reconectar.
8. **Estados y estaciones configurables** (datos), no hardcodeados.

---

## 1. Visión

```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   POS    │ │ Conduces │ │ Car Wash │ │Lavandería│ │ Bizcocho │  …futuros
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │            │            │
     │   publica contrato estándar (outbox) │            │
     └────────────┴────────────┴────────────┴────────────┘
                              ▼
              ┌───────────────────────────────────┐
              │     MOTOR CENTRO DE PRODUCCIÓN    │
              │  (desconoce quién publicó)        │
              │  Trabajo · Flujo · SLA · Estación │
              │  Estado · Responsable · Historial │
              └─────────────────┬─────────────────┘
                                ▼
              ┌───────────────────────────────────┐
              │ Tablero + Dashboard operativo     │
              │ SignalR /hubs/produccion          │
              └───────────────────────────────────┘
```

---

## 2. Desacoplamiento reforzado

### 2.1 Capas

| Capa | Responsabilidad | Dependencias |
|------|-----------------|--------------|
| Módulos origen | Lógica comercial/operativa propia | Pueden depender de `IDomainEventPublisher` + DTO del **contrato** (carpeta Contracts/Events compartida) |
| Contrato | Payload estable `ProduccionTrabajoSolicitado` / Actualizado / CanceladoPorOrigen | Sin EF, sin UI, sin servicios de módulos |
| Motor | Persistir trabajo, aplicar flujo/SLA, emitir SignalR | Solo contrato + sus tablas |
| Tablero UI | Visualizar / avanzar estados | Solo APIs del motor |

### 2.2 Reglas de código (a exigir en implementación)

- Prohibido: `using` / imports desde `FacturaHeader*`, `Conduces*`, `Lavador*`, etc. **dentro** del ensamblado/servicio del motor.
- Prohibido: el motor leer tablas comerciales para “completar” datos; el **evento debe traer el snapshot** necesario (número, nombre, ítems, observación).
- Permitido: el tablero mostrar un enlace “abrir origen” con `OrigenTipo`+`OrigenId` resuelto por el **front** o por un deep-link genérico, sin que el motor cargue el documento.
- Nuevo módulo futuro: implementar publisher del contrato → **cero cambios en el núcleo** si el tipo de trabajo y flujo ya existen (o se configuran por datos).

### 2.3 Contrato estándar (conceptual)

```
ProduccionTrabajoSolicitado {
  IdEmpresa
  TipoTrabajo              // código catálogo
  OrigenModulo             // string libre del publisher
  OrigenTipo               // string estable: FacturaHeader, ConduceHeader, …
  OrigenId
  IdempotencyKey           // único global por empresa
  NumeroVisible
  NombreVisible
  Referencia?
  EtiquetaContexto?        // LOCAL, LLEVAR, PLACA, …
  Observacion?
  IdUsuarioSolicita?
  Prioridad?
  Items[] {
    OrigenDetalleId?
    CodigoItem / NombreItem
    Cantidad
    Observacion?
    VariacionesTexto?
    EstacionCodigo?        // opcional; si falta → estación default del flujo
  }
}
```

El motor resuelve: flujo activo → estado inicial → SLA del flujo → estaciones → persistencia → SignalR.

---

## 3. Naming del núcleo — análisis (sin cambio hasta decisión)

Se evaluaron tres familias. **Recomendación: mantener prefijo `Produccion*`** para el alcance actual de Alahia ERP, con el producto UI llamado **Centro de Producción**.

### Alternativa A — `Produccion*` (recomendada)

Ejemplos: `ProduccionTrabajo`, `ProduccionFlujo`, `ProduccionEstacion`, `ProduccionHistorial`.

| Ventajas | Desventajas |
|----------|-------------|
| Alineado al nombre de producto “Centro de Producción” | “Producción” en lavandería/car wash es metafórico (aceptable en ERP) |
| Claro en español para el equipo y clientes RD | Algo largo en nombres SQL |
| Distingue del dominio comercial (facturas, órdenes de compra) | Menos “académico” que Workflow |
| Evita colisión con `OrdenCompra*` ya existente | — |
| Consistente con docs ya revisados | — |

### Alternativa B — `Proceso*`

Ejemplos: `Proceso`, `ProcesoTipo`, `ProcesoFlujo`, `ProcesoEstacion`.

| Ventajas | Desventajas |
|----------|-------------|
| Más neutro multisector | “Proceso” es muy genérico en un ERP (procesos contables, de compra, batch jobs…) |
| Corto | Alto riesgo de colisión semántica y confusión en código |
| Natural en español | Menos evocador del módulo de producto |

### Alternativa C — `Workflow*` / `Wf*`

Ejemplos: `Workflow`, `WorkflowTipo`, `WorkflowInstance`.

| Ventajas | Desventajas |
|----------|-------------|
| Estándar de industria (BPM) | Inglés en un código base mayormente en español |
| Muy genérico y extensible | Puede confundirse con motores BPM pesados (Camunda-like) que **no** estamos construyendo |
| — | El producto se llama Centro de Producción, no Workflow Center |

### Decisión propuesta

| Ámbito | Naming |
|--------|--------|
| Producto / menú / UI | **Centro de Producción** |
| Código módulo | `CENTRO_PRODUCCION` |
| Tablas / entidades / APIs / hub | Prefijo **`Produccion*`** / ruta `/api/produccion/*` / hub `/hubs/produccion` |
| Vocabulario de dominio en docs | Trabajo, Flujo, Estación, Estado, SLA, Responsable, Historial |

Si en el futuro el motor se abre a flujos no operativos (aprobaciones, etc.), se podría introducir un bounded context `Workflow` aparte; **hoy no aplica**.

---

## 4. Modelo de datos (v2)

### 4.1 Catálogo y configuración

#### `ProduccionTipoTrabajo`
Códigos estables: `POS_ORDEN`, `CONDUCE_PREPARACION`, `CAR_WASH_SERVICIO`, `LAVANDERIA_PROCESO`, `BIZCOCHO_PRODUCCION`, `ALMACEN_PICKING`, …

#### `ProduccionConfiguracionEmpresa`
Gate global, sonido, modo oscuro, flags `UsarEstaciones`, `UsarEstadosPorItem`, umbrales **default** (fallback si el flujo no define SLA), etc.

#### `ProduccionFlujo`
| Campo | Notas |
|-------|-------|
| IdFlujo, IdEmpresa?, TipoTrabajo, Nombre, Activo, Version | |
| **SlaObjetivoSegundos** | Tiempo objetivo total del flujo (obligatorio para demoras) |
| **SlaAdvertenciaSegundos** | Opcional; si null → % del objetivo (ej. 80%) o config empresa |
| **SlaUnidadDisplay** | opcional (minutos/horas) solo UI |

Ejemplos de seed (datos, no código):

| Flujo | SLA objetivo |
|-------|----------------|
| Restaurante / POS_ORDEN | 15 min (900 s) |
| Car Wash | 45 min |
| Lavandería | 24 h |
| Repostería | 6 h |
| Conduces | 30 min |

#### `ProduccionFlujoEstado` / `ProduccionFlujoTransicion`
Igual que v1: estados y transiciones configurables.

### 4.2 Estaciones y responsables (modelo preparado)

#### `ProduccionEstacion`
`IdEstacion`, `IdEmpresa`, `Codigo`, `Nombre`, `EsDespacho`, `Activa`, `OrdenVisual`.

#### `ProduccionEstacionResponsable` (**Etapa 2+; crear en DDL desde Etapa 1 vacío o con tabla lista**)

| Campo | Notas |
|-------|-------|
| IdEstacionResponsable | PK |
| IdEstacion | |
| IdEmpleado / IdUsuario | responsable |
| EsPrincipal | bit |
| VigenteDesde / VigenteHasta | nullable |
| Activo | |

Uso futuro: métricas por colaborador, filtros “mis estaciones”, asignación automática opcional.

En el **trabajo/ítem** (opcional Etapa 2):

- `ProduccionTrabajoItem.IdResponsableAsignado` nullable — override puntual sin romper el modelo de estación.

Etapa 1: tabla de responsables puede existir **sin UI**; no bloquea MVP.

### 4.3 Instancias

#### `ProduccionTrabajo`
Además de v1:

| Campo | Notas |
|-------|-------|
| SlaObjetivoSegundosSnapshot | copiado del flujo al crear (no cambia si editan el flujo) |
| SlaAdvertenciaSegundosSnapshot | |
| FechaLimiteObjetivo | `FechaCreacion + SlaObjetivo` (o calculada) |
| SemaforoSla | opcional cache: `OK` / `ADVERTENCIA` / `RETRASADO` (también calculable en lectura) |

Clasificación automática (tablero):

| Condición | Semáforo |
|-----------|----------|
| `ahora < FechaAdvertencia` | Dentro del tiempo |
| `FechaAdvertencia ≤ ahora < FechaLimite` | Próximo a vencer |
| `ahora ≥ FechaLimite` y no terminal completado | Retrasado |

Completados a tiempo vs tarde: comparar `FechaCompletado` vs `FechaLimiteObjetivo` (métricas).

#### `ProduccionTrabajoItem` / `ProduccionHistorial` / `ProduccionPantalla`
Como v1, con naming `Produccion*`.

---

## 5. SLA por flujo — comportamiento

1. SLA vive en **`ProduccionFlujo`**, no en código.
2. Al crear el trabajo se **snapshot**-ean los segundos (y se calcula límite).
3. El tablero pinta semáforo + indicador no solo-color (texto “En tiempo” / “Por vencer” / “Retrasado”, icono).
4. Sonido de crítico: al cruzar límite, **una vez** por trabajo (snooze local).
5. Cambio de SLA en el flujo **no recalcula** trabajos abiertos (salvo herramienta admin explícita).

---

## 6. Dashboard operativo (arquitectura prevista)

No es obligatorio construir la UI completa en Etapa 1; sí **dejar el diseño y endpoints**.

### 6.1 Ubicación UX
Franja superior del tablero del Centro de Producción (no un módulo BI aparte en MVP).

### 6.2 Indicadores

| KPI | Definición |
|-----|------------|
| Pendientes | Trabajos en estado inicial (flag `EsInicial`) activos |
| En ejecución | Activos no inicial / no terminal |
| Completados | Terminales “éxito” en el rango (hoy / turno) |
| Retrasados | Activos con semáforo RETRASADO |
| Tiempo promedio | `avg(FechaCompletado - FechaCreacion)` de completados en rango |

Filtros: empresa, tipo de trabajo, estación, rango fechas.

### 6.3 API prevista

`GET /api/produccion/dashboard/resumen?tipoTrabajo=&desde=&hasta=`

Implementación Etapa 1: puede ser agregación SQL simple sobre `ProduccionTrabajo`.  
Etapa 3: materializar si el volumen lo exige.

El motor ya tendrá timestamps + SLA snapshot → **suficiente** para estos KPIs sin tablas extra en MVP.

---

## 7. Tablero en tiempo real

- Columnas dinámicas según estados del flujo filtrado.
- Semáforo SLA en cada tarjeta.
- Filtros: tipo trabajo, estación, prioridad, semáforo.
- SignalR: `/hubs/produccion` — eventos `produccion:trabajoUpsert|Estado|ItemEstado|alerta`.
- Hydrate: `GET /api/produccion/trabajos/activos`.

Sin mesas. Sin términos de cocina en UI base (labels vienen del flujo/estación).

---

## 8. Integración (publishers)

| Módulo | TipoTrabajo seed | Etapa |
|--------|------------------|-------|
| POS Orden | `POS_ORDEN` | 1 |
| Conduces o Bizcocho | según prioridad negocio | 2 |
| Car Wash / Lavandería / Almacén | seeds + adapter | 3 |

Gaps POS (siguen siendo del adapter POS, no del motor): persistir tipo servicio, `ReferenciaOrden`, no pisar `Nota` con el nombre.

---

## 9. Permisos

`CENTRO_PRODUCCION` + `PRODUCCION_VER` | `GESTIONAR` | `CANCELAR` | `PRIORIDAD` | `CONFIG` | `REPORTES` | `REABRIR` | (futuro) `ASIGNAR_RESPONSABLE`.

---

## 10. Plan por etapas (v2)

### Etapa 1 — Motor + POS + tablero + SLA
- DDL `Produccion*` incluyendo **SLA en flujo**, snapshots en trabajo, tabla **Responsables** (sin UI obligatoria).
- Flujo seed `POS_ORDEN` (15 min objetivo, advertencia configurable).
- Adapter POS → contrato evento.
- Tablero + semáforo SLA + sonido + historial + cancelación.
- Endpoint **dashboard resumen** (aunque la franja UI sea mínima o placeholder).
- Cero referencias a módulos origen dentro del motor.

### Etapa 2 — Estaciones, responsables UI, ítems, 2º adapter, config flujos
- Pantallas por estación; asignación de responsables; estados por ítem; Despacho; UI config SLA/flujos; Conduces o Bizcocho.

### Etapa 3 — Resto de industrias + analítica rica
- Car Wash, Lavandería, Almacén; reportes por responsable/estación; notificaciones al completar.

---

## 11. Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Filtrado del motor hacia FacturaHeader “por comodidad” | Code review + principio 2; snapshot en evento |
| SLA en unidades distintas (min vs horas) | Guardar siempre segundos; display por config |
| Trabajos abiertos al editar flujo/SLA | Versionado + snapshot |
| Dashboard pesado | Agregar índices `(IdEmpresa, ActivoEnTablero, CodigoEstado, FechaCreacion)` |
| Confusión naming Proceso vs Produccion | Decisión documentada en §3 |

---

## 12. Decisiones para aprobación

| # | Tema | Propuesta |
|---|------|-----------|
| 1 | Prefijo técnico | **`Produccion*`** |
| 2 | SLA | En flujo + snapshot en trabajo |
| 3 | Responsables | Tabla `ProduccionEstacionResponsable` desde DDL Etapa 1; UI después |
| 4 | Dashboard | Contrato API + franja superior; UI completa puede ser liviana en Etapa 1 |
| 5 | Desacoplamiento | Contrato estándar; motor sin dependencias a módulos |
| 6 | Multisector / anti-cocina | Sin cambios: reforzado |
| 7 | 2º adapter Etapa 2 | Pendiente elegir: Conduces vs Bizcocho |

---

## 13. Conclusión

Esta v2 consolida el Centro de Producción como **motor horizontal** con:

- SLA configurable por flujo y semáforos operativos  
- Responsables preparados en el modelo  
- Dashboard operativo previsto  
- Desacoplamiento estricto por contrato de eventos  
- Naming `Produccion*` justificado frente a `Proceso*` / `Workflow*`  

**No se ha escrito código ni DDL.**  
Tras tu aprobación explícita, la implementación comenzará **solo en `AlahiaPos_Dev`**.
