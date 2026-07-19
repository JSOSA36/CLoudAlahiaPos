# Centro de Producción — Revisión arquitectónica (evolución desde KDS)

> **Actualizado.** La versión vigente para aprobación es:  
> [`Centro-Produccion-Arquitectura-v2.md`](./Centro-Produccion-Arquitectura-v2.md)  
> (SLA por flujo, responsables, dashboard, naming, desacoplamiento reforzado).

**Tipo:** Revisión de arquitectura (pre-implementación) — v1 histórica  
**Documento base:** `docs/KDS-Arquitectura-Funcional-Tecnica.md`  
**Estado:** superseded por v2; no implementar hasta aprobación de v2  
**Entorno:** solo `AlahiaPos_Dev`  
**Restricciones:** sin mesas; sin acoplar el núcleo a cocina/restaurante

---

## 1. Cambio de visión

| Antes (KDS) | Ahora (Centro de Producción) |
|-------------|------------------------------|
| Pantalla de cocina | Tablero operativo multisector |
| Ticket de cocina | **Orden de producción / Trabajo** |
| Estados fijos de restaurante | **Estados configurables por tipo de flujo** |
| Estaciones “Cocina/Bebidas” hardcodeadas en concepto | **Estaciones configurables por empresa** |
| Solo POS → cocina | **Cualquier módulo ERP → mismo motor** |
| Nombres Kitchen / KDS / Cocina en el núcleo | **Nombres genéricos en el núcleo** |

**Objetivo final:** construir **una sola vez** un motor de flujo de trabajo y reutilizarlo en restaurante, cafetería, repostería, car wash, lavandería, ferretería (conduces), almacén, etc.

```
┌─────────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐  ┌──────────┐
│ POS / Orden │  │ Conduces │  │ Car Wash  │  │ Lavandería │  │ Bizcocho │
└──────┬──────┘  └────┬─────┘  └─────┬─────┘  └─────┬──────┘  └────┬─────┘
       │              │              │              │               │
       └──────────────┴──────┬───────┴──────────────┴───────────────┘
                             ▼
              ┌──────────────────────────────┐
              │   MOTOR CENTRO DE PRODUCCIÓN │
              │  Trabajo · Flujo · Estación  │
              │  Estado · Prioridad · Tiempo │
              └──────────────┬───────────────┘
                             ▼
              ┌──────────────────────────────┐
              │  Tablero en tiempo real      │
              │  (SignalR) + hydrate REST    │
              └──────────────────────────────┘
```

---

## 2. Qué del documento KDS se conserva

Estos principios **siguen válidos** y no se descartan:

1. **No duplicar el dominio comercial.** El motor no reemplaza `FacturaHeaders`, Conduces, encargos, etc.
2. **Bajo acoplamiento.** El módulo origen solo publica un evento; el motor consume.
3. **Fallo del tablero no bloquea la operación comercial.**
4. **SignalR para tiempo real + GET al reconectar** (BD = fuente de verdad).
5. **Auditoría de cada cambio de estado.**
6. **Concurrencia optimista** (`RowVersion` + estado esperado).
7. **Licencia / módulo por empresa** (gate).
8. **Sin mesas** en núcleo ni UI del centro.
9. **Etapas de implementación** (MVP → estaciones/ítems → métricas).
10. **Identificador visible** genérico: número + nombre/referencia + etiqueta de servicio/contexto.

---

## 3. Qué debe cambiar (mapa de impacto)

### 3.1 Naming — de cocina a genérico

| Concepto KDS (descartar en núcleo) | Concepto Centro de Producción |
|------------------------------------|-------------------------------|
| KDS / Kitchen Display | **Centro de Producción** |
| Ticket cocina | **Trabajo** (`ProduccionTrabajo`) |
| Ticket item | **Ítem de trabajo** (`ProduccionTrabajoItem`) |
| Cocina / Chef / Comanda | **Prohibidos en núcleo** |
| `Kds*` tablas/APIs/hub | Prefijo **`Produccion*`** o **`Cp*`** (Centro Producción) |
| Módulo `KDS` | Módulo **`CENTRO_PRODUCCION`** (código estable) |
| Hub `/hubs/kds` | Hub **`/hubs/produccion`** |
| Evento `OrdenProduccionCreada` (solo POS) | Evento genérico **`ProduccionTrabajoSolicitado`** (+ payload tipado por origen) |
| “Pantalla de cocina” | **Tablero del Centro de Producción** |

> Nota: en UI de un restaurante concreto se puede **etiquetar** la estación como “Cocina” (dato de configuración). Eso es vocabulario de la empresa, no del motor.

### 3.2 Modelo mental nuevo: Flujo + Tipo de trabajo

El documento KDS asumía una máquina de estados fija. Eso se reemplaza por:

| Entidad | Rol |
|---------|-----|
| **Tipo de trabajo** | Clasifica el origen/negocio: `POS_ORDEN`, `CONDUCE`, `CAR_WASH`, `LAVANDERIA`, `BIZCOCHO`, `ALMACEN_PICKING`, … |
| **Flujo** | Plantilla de estados ordenados + reglas de transición para un tipo (y opcionalmente por empresa) |
| **Estado (definición)** | Nodo del flujo: código, nombre visible, color/icono, terminal, cuenta para “completado” |
| **Estación** | Lugar/rol operativo configurable (Lavado, Empaque, Despacho, Decoración…) |
| **Trabajo** | Instancia en curso, ligada a un documento origen |
| **Ítem** | Línea del trabajo (producto, servicio, paso, SKU) |
| **Historial** | Auditoría inmutable |

El núcleo **nunca** hardcodea `Pendiente / En preparación / Lista`. Solo conoce:

- `CodigoEstado` (string)
- flags: `EsInicial`, `EsTerminal`, `CuentaParaCompletar`, `Orden`
- transiciones permitidas definidas en el flujo

### 3.3 Orígenes múltiples (adapters)

Cada módulo ERP es un **publicador**:

| Módulo origen | Tipo trabajo sugerido | Cuándo publica |
|---------------|----------------------|----------------|
| POS / Órdenes | `POS_ORDEN` | Tras confirmar orden (`Enviarorden`) |
| POS factura directa | `POS_FACTURA` (opcional, flag) | Tras `ProcesarFactura` si aplica |
| Conduces | `CONDUCE_PREPARACION` | Tras crear conduce |
| Car Wash / lavador | `CAR_WASH_SERVICIO` | Al abrir/confirmar servicio |
| Lavandería | `LAVANDERIA_PROCESO` | Al recibir lote/orden |
| Bizcocho / encargos | `BIZCOCHO_PRODUCCION` | Al confirmar encargo |
| Almacén | `ALMACEN_PICKING` | Al liberar pedido a picking |

Contrato único de evento (conceptual):

```
ProduccionTrabajoSolicitado {
  IdEmpresa
  TipoTrabajo          // código
  OrigenModulo         // POS, CONDUCES, …
  OrigenTipoDocumento  // FacturaHeader, ConduceHeader, …
  OrigenId             // PK del documento
  NumeroVisible
  NombreVisible / Referencia
  EtiquetaContexto     // LOCAL | LLEVAR | DELIVERY | PLACA | …
  Observacion
  IdUsuarioSolicita
  Prioridad
  Items[] { OrigenDetalleId, Producto/Servicio, Cantidad, Observacion, EstacionCodigo? }
  IdempotencyKey       // ej. POS_ORDEN:59:12345
}
```

El motor:

1. Resuelve el **flujo** activo para `(IdEmpresa, TipoTrabajo)`.
2. Crea el **trabajo** en estado inicial.
3. Crea ítems (estación por producto/regla o estación default del flujo).
4. Emite SignalR.

Si el Centro de Producción no está activo para esa empresa/tipo → **no-op**.

### 3.4 Integración POS (sin cambios de principio)

Se mantiene exactamente la idea del KDS:

- POS **solo publica el evento** (vía outbox).
- No importa componentes del Centro de Producción.
- No falla la venta si el handler falla (reintento outbox).

Cambia el **nombre del evento** y el **payload genérico**, no el acoplamiento.

---

## 4. Revisión de tablas: ¿bastaba el modelo KDS?

### 4.1 Veredicto

El modelo KDS era **casi suficiente en forma**, pero **insuficiente en abstracción**:

| Tabla KDS | Problema | Acción |
|-----------|----------|--------|
| `KdsConfiguracionEmpresa` | Nombre y flags “cocina” | Renombrar + ampliar (flujos activos por tipo) |
| `KdsEstacion` | OK conceptualmente | Renombrar a `ProduccionEstacion` |
| `KdsTicket` | “Ticket” + estados string fijos implícitos | → `ProduccionTrabajo` + FK a flujo/estado |
| `KdsTicketItem` | OK | → `ProduccionTrabajoItem` |
| `KdsEstadoHistorial` | OK | → `ProduccionHistorial` |
| *(faltaba)* | Estados fijos | **Nuevas:** `ProduccionFlujo`, `ProduccionFlujoEstado`, `ProduccionFlujoTransicion` |
| *(faltaba)* | Multi-origen | Campos `OrigenModulo`, `OrigenTipo`, `OrigenId`, `TipoTrabajo` |
| `Cocinas` legacy | Acoplado a cocina | No usar como núcleo; migrar como datos de estación si la empresa quiere |

### 4.2 Modelo de datos propuesto (núcleo)

#### A) `ProduccionConfiguracionEmpresa`

| Campo | Notas |
|-------|-------|
| IdEmpresa | PK |
| Activo | Gate global |
| SonidoActivo, umbrales tiempo, modo oscuro, etc. | Igual espíritu KDS |
| UsarEstaciones | |
| UsarEstadosPorItem | |
| PermitirCompletarDesdeEstacion | (antes “entregar desde cocina”) |

#### B) `ProduccionTipoTrabajo` (catálogo)

Códigos estables del sistema + nombre. Puede ser seed global.

Ejemplos: `POS_ORDEN`, `CONDUCE_PREPARACION`, `CAR_WASH_SERVICIO`, …

#### C) `ProduccionFlujo`

Plantilla por empresa (o plantilla sistema + override empresa).

| Campo | Notas |
|-------|-------|
| IdFlujo | |
| IdEmpresa | null = plantilla sistema |
| TipoTrabajo | FK/código |
| Nombre | “Flujo restaurante”, “Flujo car wash” |
| Activo | |
| Version | para no romper trabajos abiertos al editar |

#### D) `ProduccionFlujoEstado`

| Campo | Notas |
|-------|-------|
| IdFlujoEstado | |
| IdFlujo | |
| Codigo | `PENDIENTE`, `LAVANDO`, `HORNEANDO`… |
| NombreVisible | lo que ve el tablero |
| Orden | |
| EsInicial | |
| EsTerminal | |
| CuentaParaCompletar | false en cancelado |
| SeveridadDemora | opcional |
| Icono / ColorHint | UI |

#### E) `ProduccionFlujoTransicion` (opcional pero recomendado)

| Campo | Notas |
|-------|-------|
| IdFlujo | |
| CodigoDesde | |
| CodigoHasta | |
| RequiereMotivo | |
| RequierePermiso | código permiso |

Sin esta tabla, Etapa 1 puede permitir “avanzar al siguiente por Orden” y “saltar a terminal Cancelado” con reglas simples.

#### F) `ProduccionEstacion`

Igual que KDS estaciones, sin semántica de cocina.

| Campo | Notas |
|-------|-------|
| IdEstacion, IdEmpresa, Codigo, Nombre, EsDespacho, Activa, OrdenVisual | |

#### G) `ProduccionTrabajo`

| Campo | Notas |
|-------|-------|
| IdTrabajo | PK |
| IdEmpresa | |
| TipoTrabajo | |
| IdFlujo | snapshot del flujo usado |
| CodigoEstadoActual | |
| OrigenModulo | `POS`, `CONDUCES`, … |
| OrigenTipo | `FacturaHeader`, `ConduceHeader`, … |
| OrigenId | |
| IdempotencyKey | unique |
| NumeroVisible, NombreVisible, Referencia, EtiquetaContexto, Observacion | |
| IdUsuarioSolicita | |
| Prioridad | Normal/Alta/Urgente (o configurable después) |
| Timestamps ciclo | creado / iniciado / completado / cancelado |
| RowVersion | |
| ActivoEnTablero | |

**Unique sugerido:** `(IdEmpresa, OrigenTipo, OrigenId)` o `IdempotencyKey`.

#### H) `ProduccionTrabajoItem`

| Campo | Notas |
|-------|-------|
| IdTrabajoItem | |
| IdTrabajo | |
| OrigenDetalleId | |
| IdEstacion | |
| NombreItem, Cantidad, Observacion, VariacionesTexto | |
| CodigoEstado | del mismo flujo o subconjunto |
| Timestamps / usuario / RowVersion | |

#### I) `ProduccionHistorial`

Idem KDS auditoría, con `CodigoEstadoAnterior/Nuevo`, estación, usuario, motivo, origen UI/Sistema.

#### J) `ProduccionPantalla` (Etapa 2)

Qué estaciones / tipos de trabajo muestra cada dispositivo.

### 4.3 Campos en tablas comerciales (mínimos, por adapter)

Siguen siendo del **módulo origen**, no del motor:

- POS: `ReferenciaOrden`, persistir `TipoOrden`, limpiar uso de `Nota` (como en KDS).
- Conduces / Bizcocho / Car Wash: solo publicar evento; no contaminar el núcleo.

`Productos.IdCocina` → evolucionar a **`IdEstacionProduccion`** (nullable) o tabla de mapeo `ProductoEstacion`. El nombre `IdCocina` no debe vivir en APIs nuevas del motor.

---

## 5. Estados configurables — ejemplos de seed

El motor no conoce estos nombres; son **datos**:

### Restaurante / cafetería (`POS_ORDEN`)
`PENDIENTE` → `EN_PREPARACION` → `LISTA` → `ENTREGADA` (+ `CANCELADA`)

### Car Wash
`PENDIENTE` → `LAVANDO` → `ASPIRANDO` → `ENCERANDO` → `LISTO` (+ `CANCELADA`)

### Lavandería
`PENDIENTE` → `LAVANDO` → `SECANDO` → `PLANCHANDO` → `LISTO`

### Repostería
`PENDIENTE` → `PREPARANDO_MEZCLA` → `HORNEANDO` → `DECORANDO` → `LISTO`

### Ferretería / conduce
`PENDIENTE` → `PREPARANDO` → `EMPACADO` → `DESPACHADO`

### Almacén
`PENDIENTE` → `PICKING` → `EMPAQUE` → `DESPACHO`

**Regla de agregación por ítem** (cuando aplique): se expresa en términos del flujo (“todos los ítems activos en estados con `CuentaParaCompletar` y marcados como ‘listos de estación’”), no con literales `Lista`.

---

## 6. Tablero UI — Centro de Producción

| Aspecto | Cambio vs KDS |
|---------|----------------|
| Título / módulo | Centro de Producción |
| Columnas del board | **Dinámicas** según estados no terminales del flujo activo |
| Filtros | Tipo de trabajo, estación, prioridad |
| Vocabulario | Configurable (labels del flujo/estación) |
| Rutas FE | `/centro-produccion`, login dedicado opcional |
| Stubs `kds/` / `loginkds/` | Reutilizar carpeta solo como alias temporal o renombrar |

Una empresa con un solo flujo y una estación ve exactamente el MVP “tipo KDS”, sin conceptos de cocina en código.

---

## 7. SignalR y eventos

| Antes | Ahora |
|-------|-------|
| `/hubs/kds` | `/hubs/produccion` |
| `kds:ticketUpsert` | `produccion:trabajoUpsert` |
| `kds:ticketEstado` | `produccion:trabajoEstado` |
| Grupos estación cocina | `produccion:empresa:{id}`, `produccion:estacion:{emp}:{est}`, `produccion:tipo:{emp}:{tipoTrabajo}` |

Eventos de dominio:

- `ProduccionTrabajoSolicitado`
- `ProduccionTrabajoActualizado` (cambio de líneas en origen)
- `ProduccionTrabajoCanceladoPorOrigen`

El handler del motor es el único que escribe tablas `Produccion*`.

---

## 8. Permisos y módulo

| Antes | Ahora |
|-------|-------|
| `KDS` | `CENTRO_PRODUCCION` |
| `KDS_VER` … | `PRODUCCION_VER`, `PRODUCCION_GESTIONAR`, `PRODUCCION_CANCELAR`, `PRODUCCION_PRIORIDAD`, `PRODUCCION_CONFIG`, `PRODUCCION_REPORTES`, `PRODUCCION_REABRIR` |

---

## 9. Plan por etapas (ajustado)

### Etapa 1 — Motor + un adapter (POS)

- Tablas núcleo (`Produccion*`) con **flujos seed** (al menos `POS_ORDEN` con estados tipo restaurante, editables).
- Adapter POS: publica `ProduccionTrabajoSolicitado` tras `Enviarorden`.
- Tablero genérico (columnas según flujo).
- Timer, sonido, historial, cancelación con motivo.
- Una estación GENERAL si `UsarEstaciones=0`.
- Sin mesas; sin nombres Kitchen en código/API.

### Etapa 2 — Multi-estación + multi-flujo + segundo adapter

- Estaciones y pantallas.
- Estados por ítem.
- Vista “Despacho” (estación con `EsDespacho=1`).
- Segundo origen: **Conduces** o **Bizcocho** (el que prioricen).
- UI de configuración de flujos/estados.

### Etapa 3 — Ecosistema + analítica

- Car Wash, Lavandería, Almacén.
- Reportes de tiempos (ya hay historial).
- Notificaciones al completar.
- Priorización avanzada.

---

## 10. Riesgos específicos de la generalización

| Riesgo | Mitigación |
|--------|------------|
| Sobre-ingeniería de flujos en MVP | Etapa 1: transiciones lineales por `Orden` + cancelación; tabla de transiciones en Etapa 2 |
| Trabajos abiertos al cambiar flujo | Versionar flujo; trabajos guardan `IdFlujo` snapshot |
| Mezclar tipos en un tablero | Filtro por `TipoTrabajo`; pantallas por tipo |
| Reutilizar `Cocinas` en el núcleo | No; solo migración de datos a `ProduccionEstacion` |
| Confusión de naming en FE viejo | Alias de ruta `/kds` → redirect a `/centro-produccion` opcional |
| Adapters incompletos | Contrato de evento + checklist por módulo |

---

## 11. Decisiones abiertas (para aprobación)

1. **Prefijo técnico:** ¿`Produccion*` o `Cp*` (CentroProduccion)? Recomendación: `Produccion*` (claro en SQL/código).
2. **Código de módulo menú:** `CENTRO_PRODUCCION`.
3. **Primer adapter además de POS en Etapa 2:** ¿Conduces o Bizcocho?
4. **¿Prioridad configurable por flujo o catálogo global?** Recomendación Etapa 1: catálogo global Normal/Alta/Urgente.
5. **¿Un tablero mezcla todos los tipos o se separa por tipo?** Recomendación: un tablero con filtro; default = tipos habilitados en config.

---

## 12. Resumen ejecutivo de cambios al documento KDS

| Sección KDS | Veredicto |
|-------------|-----------|
| Objetivo “pantalla cocina” | **Reemplazar** por motor multisector |
| Reutilizar FacturaHeaders | **Conservar** (como un origen más) |
| Tablas `Kds*` | **Renombrar y ampliar** con Flujo/Estados |
| Estados fijos | **Eliminar del núcleo**; pasar a datos |
| Estaciones | **Conservar idea**; generalizar |
| SignalR + outbox + no bloquear POS | **Conservar** |
| Permisos/módulo KDS | **Renombrar** |
| Etapas | **Ajustar** (POS primero, otros orígenes después) |
| Prohibición mesas | **Conservar** |
| Naming Kitchen/Cocina/Chef/Comanda | **Prohibido en núcleo** |

---

## 13. Conclusión

El diseño KDS era un buen MVP **vertical** (restaurante). Para Alahia ERP multisectorial, debe convertirse en un **motor horizontal**:

> **Trabajo + Flujo configurable + Estaciones + Eventos de origen + Tablero en tiempo real.**

Eso permite desarrollar el núcleo una sola vez y conectar POS, Conduces, Car Wash, Lavandería, Repostería y Almacén como publishers.

**No se ha implementado código ni DDL.**  
Documento KDS original: mantenerlo como histórico; esta revisión es la nueva línea base.

**Siguiente paso tras tu OK:** plano Etapa 1 detallado (DDL Dev + contratos API/eventos + wireframes del tablero genérico) y luego implementación solo en `AlahiaPos_Dev`.
