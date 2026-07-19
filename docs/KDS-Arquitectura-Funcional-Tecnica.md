# KDS — Documento funcional y técnico (Alahia ERP)

> **SUPERSEDED (2026-07-17).**  
> La visión evolucionó a un **Centro de Producción** multisectorial.  
> Documento vigente: [`Centro-Produccion-Revision-Arquitectura.md`](./Centro-Produccion-Revision-Arquitectura.md).  
> Este archivo se conserva solo como histórico del diseño KDS inicial.

**Tipo:** Plano maestro (revisión previa a implementación)  
**Alcance:** Kitchen Display System / pantalla de producción (histórico)  
**Entorno de trabajo:** únicamente `AlahiaPos_Dev` (sin tocar Prod)  
**Restricción explícita:** no mesas físicas (sin campos, textos, filtros ni dependencias de mesa)

---

## 0. Resumen ejecutivo

El KDS será una **vista operativa de producción** sobre las órdenes comerciales ya existentes (`FacturaHeaders` / `FacturaDetalles` con `IdTipoDocumentos = 10`), no una segunda fuente de verdad comercial.

| Principio | Decisión |
|-----------|----------|
| Fuente comercial | Sigue siendo `FacturaHeaders` + `FacturaDetalles` |
| Fuente de producción | Tablas KDS nuevas (ticket, items, auditoría, config) |
| Acoplamiento POS | Cero hacia UI KDS; solo evento interno post-confirmación |
| Fallo KDS | Nunca bloquea venta/orden |
| Mesas | Fuera de alcance; no se usan en UI ni modelo KDS |
| Identificador visible | Nº orden + nombre/referencia + tipo de servicio |

---

## 1. Análisis del estado actual

### 1.1 Qué existe hoy

| Pieza | Realidad | Ubicación |
|-------|----------|-----------|
| “Orden” POS | `FacturaHeaders` (`IdTipoDocumentos = 10`) | `AlahiaPos.Entities/Domain/FacturaHeaders.cs` |
| Líneas | `FacturaDetalles` | `FacturaDetalles.cs` |
| Confirmación orden (sin cobro) | `POST api/FacturaHeader` vía `Enviarorden` | `FacturaHeaderController.Post` + `pos.component.ts` |
| Cobro / conversión a factura | `ProcesarFactura` / `GenerateFacts` | Mismo controlador / Órdenes UI |
| Estado cocina (débil) | `Estado_Orden` (string libre), `StatuItem`, `EnviadoCocina` | Header/detalle |
| Tipo servicio | `TipoOrden` en BD; **UI POS no lo persiste al guardar Orden** | Gap crítico |
| Nombre visible | `NombreCuenta` (+ cliente `IDCliente`) | Header |
| Nota | `Nota` (hoy a menudo se reusa como nombre) | Header |
| Comentario línea | `FacturaDetalles.Comentario` | Casi no usado en path Orden del POS |
| Estaciones legacy | Tabla `Cocinas` + `Productos.IdCocina` | Catalogo básico |
| SignalR | Solo `/hubs/notificaciones` | Patrón reutilizable |
| Domain events / outbox | `EventosOutbox` + handlers contabilidad/fiscal | Patrón reutilizable |
| Stubs FE | `kds/`, `loginkds/` vacíos | Sin flujo real |
| Módulo menú | No existe código `KDS` | Copiar patrón `EmpresaModulo` |

### 1.2 Qué no existe (y se necesita)

- Máquina de estados de producción formal (orden e ítem).
- Referencia libre de orden (texto del cajero distinto del cliente).
- Variaciones / extras / “sin X” estructurados (hoy solo texto libre en comentario).
- Hub SignalR de producción.
- Auditoría de cambios de estado de cocina.
- Configuración KDS por empresa.
- Prioridad / umbrales de tiempo / sonidos.

### 1.3 Flujo comercial actual (a no romper)

```
POS (tipoDocumento = Orden)
  → openModalCobro / Guardar
  → FacturaHeaderService.Enviarorden
  → POST /api/FacturaHeader
  → InsertFacturaHeader (IdTipoDocumentos=10, Estado_Orden="Pendiente")
  → [HOY] fin
  → [PROPUESTO] publicar evento producción (async, best-effort)
```

Cobro posterior (`GenerateFacts` / `ProcesarFactura`) convierte a factura (`IdTipoDocumentos=1`). El KDS puede seguir mostrando la orden hasta **Entregada** aunque el documento comercial cambie; la llave estable será `IdFacturaHeader` (origen comercial).

---

## 2. Principio de no duplicidad

### 2.1 Qué se reutiliza (no se copia)

Del documento comercial:

- Identidad: `IdFacturaHeader`, `NumeroDocumento`
- Cliente: `IDCliente`, `NombreCuenta`
- Nota general: `Nota` (se separará de “referencia” — ver gaps)
- Tipo servicio: `TipoOrden` (se corregirá persistencia)
- Usuario: `IdUsuario` / `IdMoso`
- Líneas: `IdFacturaDetalle`, `IdProducto`, `Cantidad`, `Comentario`
- Producto → estación: `Productos.IdCocina` (migrar/mapear a estaciones KDS)

### 2.2 Qué es exclusivo del KDS

Todo lo operativo de producción:

- Estado de producción de la orden y de cada ítem
- Prioridad
- Timestamps de ciclo (inicio / lista / entrega)
- Cancelación de producción (motivo, usuario) — distinta de anulación comercial si aplica
- Asociación a estación de producción en el ticket
- Historial / auditoría
- Configuración de pantallas y umbrales

**Regla:** el POS nunca escribe estados KDS. El KDS nunca recalcula totales, NCF, pagos ni inventario.

---

## 3. Gaps a cerrar en el flujo comercial (mínimos, no paralelos)

Antes o en Etapa 1, ajustes cambios **pequeños** en el path de Orden (sin rediseñar POS):

| Gap | Propuesta |
|-----|-----------|
| `TipoOrden` no se envía al guardar Orden | Persistir `LOCAL` / `LLEVAR` / `DELIVERY` (mapear a `TipoOrden` existente: `ComerAqui` / `Llevar` / `Delivery`) |
| Referencia libre ausente | Nuevo campo opcional `ReferenciaOrden` en `FacturaHeaders` **o** separar: `NombreCuenta` = cliente, `Nota` = observación, y agregar `ReferenciaOrden` |
| Observación general vs nombre | Dejar de pisar `Nota` con el nombre del cliente; usar `NombreCuenta` para nombre y `Nota` para observación |
| Comentario por línea | Permitir captura simple en carrito (texto) → `FacturaDetalles.Comentario` (Etapa 1). Variaciones estructuradas = Etapa 2+ |

**Mesas:** hoy el backend fuerza `IdMesa = 1`. Se deja como está por compatibilidad, pero **el KDS ignora `IdMesa` por completo** (ni UI ni API KDS lo exponen).

---

## 4. Modelo de datos propuesto (solo Dev)

### 4.1 Reutilizar

- `FacturaHeaders`, `FacturaDetalles`, `Productos`, `Cocinas` (como semilla de estaciones), `EmpresaModulo`, `Modulo`, `EventosOutbox`, `Usuarios`

### 4.2 Tablas nuevas (estrictamente necesarias)

#### A) `KdsConfiguracionEmpresa`

Config por empresa / licencia.

| Columna | Tipo | Notas |
|---------|------|-------|
| IdEmpresa | PK | |
| Activo | bit | Gate principal |
| UsarEstaciones | bit | Default 0 (pantalla única) |
| UsarEstadosPorProducto | bit | Default 0 en Etapa 1 |
| SonidoActivo | bit | |
| TiempoAdvertenciaSeg | int | ej. 600 |
| TiempoCriticoSeg | int | ej. 1200 |
| PermitirEntregarDesdeCocina | bit | |
| IdEstacionPredeterminada | int? | |
| ModoOscuroDefault | bit | |
| MostrarNombreCliente | bit | |
| MostrarUsuarioTomaOrden | bit | |
| FechaActualizacion | datetime | |

#### B) `KdsEstacion`

Estaciones configurables (Cocina, Bebidas, Despacho…). Puede nacer migrando `Cocinas`.

| Columna | Tipo |
|---------|------|
| IdEstacion | PK |
| IdEmpresa | |
| Codigo | nvarchar(40) |
| Nombre | nvarchar(100) |
| EsDespacho | bit |
| Activa | bit |
| OrdenVisual | int |

Mapeo producto: preferir `Productos.IdEstacionProduccion` (nuevo) con fallback a `IdCocina` durante transición. Si `UsarEstaciones=0`, todos los ítems van a estación “GENERAL”.

#### C) `KdsTicket` (ticket de producción)

1:1 con origen comercial (orden). **No** duplica montos ni cliente: guarda FK + snapshot mínimo para lectura rápida en pantalla.

| Columna | Tipo | Notas |
|---------|------|-------|
| IdTicket | PK | |
| IdEmpresa | | |
| IdFacturaHeader | unique | Origen comercial |
| NumeroOrden | nvarchar | Snapshot de `NumeroDocumento` / Id |
| NombreVisible | nvarchar | Cliente o referencia |
| Referencia | nvarchar? | Texto libre cajero |
| TipoServicio | nvarchar(20) | LOCAL / LLEVAR / DELIVERY / OTRO |
| ObservacionGeneral | nvarchar? | Snapshot de nota |
| IdUsuarioToma | int? | |
| Estado | nvarchar(20) | Pendiente / EnPreparacion / Lista / Entregada / Cancelada |
| Prioridad | nvarchar(20) | Normal / Alta / Urgente |
| FechaCreacion | datetime | Confirmación comercial |
| FechaInicioPreparacion | datetime? | |
| FechaLista | datetime? | |
| FechaEntrega | datetime? | |
| FechaCancelacion | datetime? | |
| IdUsuarioCancelacion | int? | |
| MotivoCancelacion | nvarchar? | |
| RowVersion | rowversion | Concurrencia |
| ActivoEnKds | bit | false al archivar/entregada antigua |

#### D) `KdsTicketItem`

1:1 con `FacturaDetalles` (o N:1 si en el futuro se parte por estación).

| Columna | Tipo |
|---------|------|
| IdTicketItem | PK |
| IdTicket | FK |
| IdFacturaDetalle | |
| IdProducto | |
| IdEstacion | |
| NombreProducto | snapshot |
| Cantidad | decimal |
| Observacion | nvarchar? |
| VariacionesTexto | nvarchar? | Etapa 1: texto libre; Etapa 2: JSON |
| Estado | nvarchar(20) | Pendiente / EnPreparacion / Listo / Cancelado |
| FechaInicio | datetime? |
| FechaListo | datetime? |
| IdUsuarioUltimoCambio | int? |
| RowVersion | rowversion |

#### E) `KdsEstadoHistorial`

Auditoría inmutable.

| Columna | Tipo |
|---------|------|
| IdHistorial | PK |
| IdTicket | |
| IdTicketItem | nullable |
| EstadoAnterior | |
| EstadoNuevo | |
| IdUsuario | |
| IdEstacion | nullable |
| Fecha | datetime |
| Motivo | nvarchar? |
| Origen | nvarchar | UI / Sistema / Evento |

#### F) `KdsPantalla` (opcional Etapa 2)

Config de qué estaciones ve cada pantalla (token/dispositivo).

| Columna | Tipo |
|---------|------|
| IdPantalla | PK |
| IdEmpresa | |
| Nombre | |
| EstacionesCsv o tabla hija | |
| TokenAcceso | |

### 4.3 Campos mínimos en tablas existentes (Dev)

| Tabla | Campo | Motivo |
|-------|-------|--------|
| `FacturaHeaders` | `ReferenciaOrden` (nvarchar, nullable) | Identificador visible libre |
| `FacturaHeaders` | persistir bien `TipoOrden` | Tipo de servicio |
| `Productos` | `IdEstacionProduccion` (nullable) | Etapa 2; Etapa 1 puede usar `IdCocina` |
| `Modulo` | código `KDS` | Licencia / menú |

**No** se proponen tablas de mesas nuevas ni uso de `Mesas` en KDS.

---

## 5. Estados

### 5.1 Orden (ticket)

```
Pendiente → EnPreparacion → Lista → Entregada
                ↘ Cancelada (con confirmación + motivo)
```

### 5.2 Ítem (Etapa 2; Etapa 1 puede espejar el estado del ticket)

```
Pendiente → EnPreparacion → Listo
                ↘ Cancelado
```

### 5.3 Agregación orden ← ítems (cuando `UsarEstadosPorProducto=1`)

Sea `A` = ítems no cancelados:

| Condición | Estado orden |
|-----------|--------------|
| Todos `A` Pendiente | Pendiente |
| Algún `A` EnPreparacion (y ninguno Listo pendiente de regla abajo) o mixto | EnPreparacion |
| Todos `A` Listo | Lista |
| Orden marcada Entregada explícitamente | Entregada |
| Orden cancelada | Cancelada |
| Ítems cancelados | Ignorados para “completar” |

**Despacho:** solo puede marcar orden **Lista** (completa) si todos los `A` están Listo. **Entregada** es acción de despacho/caja según config `PermitirEntregarDesdeCocina`.

### 5.4 Transiciones prohibidas (concurrencia)

- Entregada / Cancelada son terminales (salvo rol admin + acción explícita “reabrir”, fuera de Etapa 1).
- No permitir `Lista → EnPreparacion` sin permiso `KDS_REABRIR`.
- Toda transición envía `estadoEsperado` (optimistic concurrency + `RowVersion`).

---

## 6. Eventos y SignalR

### 6.1 Eventos de dominio (outbox)

Nuevos tipos (nombres sugeridos):

| Evento | Cuándo |
|--------|--------|
| `OrdenProduccionCreada` | Tras `InsertFacturaHeader` exitoso de Orden **y** `KdsConfig.Activo` |
| `OrdenProduccionActualizada` | Cambio de líneas relevantes (qty/add/remove) mientras ticket activo |
| `OrdenProduccionCancelada` | Anulación comercial o cancelación KDS |

Publicación **después** del commit comercial, vía `IDomainEventPublisher` / outbox (mismo patrón fiscal/contabilidad).

Handler `KdsEventHandler`:

1. Si módulo/config inactivo → no-op.
2. Crea/actualiza `KdsTicket` + items (idempotente por `IdFacturaHeader`).
3. Emite SignalR a grupos de empresa/estación.

**El POS no conoce el handler.** Si el handler falla, se reintenta por outbox; la orden comercial ya está guardada.

### 6.2 Hub SignalR

Nuevo hub: `/hubs/kds`

Grupos:

- `kds:empresa:{idEmpresa}`
- `kds:estacion:{idEmpresa}:{idEstacion}`
- `kds:despacho:{idEmpresa}`

Eventos cliente:

| Método | Payload |
|--------|---------|
| `kds:ticketUpsert` | Ticket + items filtrables |
| `kds:ticketEstado` | Id + estado + timestamps + rowVersion |
| `kds:itemEstado` | IdTicketItem + estado |
| `kds:ticketCancelado` | Id + motivo |
| `kds:alerta` | tipo (nueva / crítica) |

Auth: JWT + empresa; pantallas KDS pueden usar login dedicado (`loginkds`) con perfil restringido.

### 6.3 Recuperación post-desconexión

1. Al conectar / reconectar: `GET /api/kds/tickets/activos?estaciones=&desde=`
2. Reemplazar snapshot local (source of truth = BD).
3. Luego suscribir SignalR.
4. Eventos con `idTicket` + `rowVersion` / `secuencia`: si llega evento viejo, se ignora (idempotencia).
5. Polling de respaldo opcional cada N minutos **solo** si SignalR caído (no como mecanismo principal).

---

## 7. Integración con POS (bajo acoplamiento)

```
[POS UI] --HTTP--> [FacturaHeader.Post]
                         |
                         +--> Commit comercial
                         |
                         +--> Outbox OrdenProduccionCreada  (si KDS activo)
                                   |
                                   v
                            [KdsEventHandler]
                                   |
                    +--------------+--------------+
                    v                             v
              Persist KdsTicket              SignalR /hubs/kds
```

Prohibido:

- Importar componentes KDS desde `pos.component.ts`
- Llamar APIs KDS desde el carrito
- Fallar `Enviarorden` si SignalR está abajo

---

## 8. API KDS (borrador)

| Método | Ruta | Permiso |
|--------|------|---------|
| GET | `/api/kds/config` | Ver KDS |
| PUT | `/api/kds/config` | Configurar |
| GET | `/api/kds/tickets/activos` | Ver KDS |
| GET | `/api/kds/tickets/{id}` | Ver KDS |
| POST | `/api/kds/tickets/{id}/iniciar` | Cambiar estado |
| POST | `/api/kds/tickets/{id}/listo` | Cambiar estado |
| POST | `/api/kds/tickets/{id}/entregar` | Cambiar estado |
| POST | `/api/kds/tickets/{id}/cancelar` | Cancelar |
| POST | `/api/kds/tickets/{id}/prioridad` | Prioridad |
| POST | `/api/kds/items/{id}/estado` | Cambiar estado (Etapa 2) |
| GET | `/api/kds/estaciones` | Ver / config |
| CRUD | `/api/kds/estaciones` | Configurar estaciones |
| GET | `/api/kds/tickets/{id}/historial` | Ver / reportes |

Body de cambio de estado: `{ estadoEsperado, rowVersion, motivo? }`.

---

## 9. Pantalla KDS (UI)

### 9.1 Características

- Ruta sugerida: `/kds` (+ `/loginkds` para acceso dedicado)
- Fullscreen, modo oscuro, tarjetas grandes, touch
- Columnas o board por estado (Pendiente | En preparación | Lista) en Etapa 1
- Sin tablas administrativas densas
- **Sin mesa** en ningún label

### 9.2 Contenido de tarjeta

Destacado:

- `ORDEN #{NumeroOrden}`
- `NombreVisible` / referencia
- Tipo servicio (chip)
- Tiempo relativo (“Hace X minutos”) + indicador normal/advertencia/crítico
- Usuario que tomó la orden (si config)
- Observación general

Detalle:

- Cantidad × producto
- Observación / variaciones texto
- Estado ítem (Etapa 2)

Acciones: Iniciar | Listo | Entregar | Cancelar | Detalle | Prioridad

### 9.3 Ordenamiento

1. Prioridad (Urgente > Alta > Normal)  
2. Tiempo de espera desc  
3. `FechaCreacion` asc  

### 9.4 Sonidos

- Nueva orden (una vez por ticketId)
- Entrada a crítico (una vez; silenciable / snooze)
- Estación completa (Etapa 2)
- Config: activar/volumen/mute temporal en localStorage del dispositivo

---

## 10. Permisos y licencia

### 10.1 Módulo

- `Modulo.Codigo = 'KDS'`
- `EmpresaModulo.Activo` gatea handler y rutas
- Si inactivo: POS intacto; cero lógica KDS

### 10.2 Permisos (PerfilRoles / códigos)

| Código | Uso |
|--------|-----|
| `KDS_VER` | Abrir pantalla |
| `KDS_GESTIONAR` | Cambiar estados |
| `KDS_CANCELAR` | Cancelar con motivo |
| `KDS_PRIORIDAD` | Cambiar prioridad |
| `KDS_CONFIG` | Estaciones / umbrales |
| `KDS_REPORTES` | Métricas (Etapa 3) |
| `KDS_REABRIR` | Reabrir terminales (opcional) |

---

## 11. Concurrencia y rendimiento

| Riesgo | Mitigación |
|--------|------------|
| Dos pantallas mismo ticket | `RowVersion` + `estadoEsperado`; 409 Conflict con estado actual |
| Eventos SignalR duplicados | Upsert por Id + comparar versión |
| Handler KDS lento | Outbox async; no en request POS |
| Muchas órdenes históricas | Solo tickets `ActivoEnKds` + ventana (ej. no entregadas de hoy / no canceladas viejas) |
| Fan-out multi-estación | Filtrar items por estación en servidor antes de push |
| Texto de variaciones | Evitar joins pesados; snapshot en `KdsTicketItem` |

---

## 12. Compatibilidad

| Tema | Enfoque |
|------|---------|
| Negocios sin KDS | Gate por módulo/config |
| Una sola pantalla | `UsarEstaciones=0`, estación GENERAL |
| Órdenes ya abiertas al activar KDS | Job opcional “seed tickets pendientes del día” o solo nuevas |
| `IdMesa=1` legacy | Ignorado en KDS |
| Lavador / encargos | Fuera de alcance KDS salvo que `IdTipoDocumentos=10` y config lo incluya |

---

## 13. Plan por etapas

### Etapa 1 — MVP operable (objetivo inmediato)

- Activación por empresa (`KDS`)
- `KdsTicket` / `KdsTicketItem` / `KdsEstadoHistorial` / `KdsConfiguracionEmpresa`
- Evento `OrdenProduccionCreada` post-`Enviarorden`
- Hub SignalR + hydrate al abrir
- Pantalla general (todas las estaciones)
- Estados de orden (sin estados por ítem independientes, o ítems espejo del ticket)
- Temporizador + umbrales visuales
- Sonido nueva orden
- Cancelación con motivo
- Gaps comerciales: persistir `TipoOrden`, `ReferenciaOrden`, no pisar `Nota`
- **Sin mesas, sin reportes, sin despacho avanzado**

### Etapa 2 — Estaciones y granularidad

- `KdsEstacion` + filtro por pantalla
- Estados por producto + agregación
- Vista Despacho
- Alertas críticas con snooze
- Config UI completa
- Comentarios/variaciones enriquecidos (aunque sea JSON texto)

### Etapa 3 — Analítica

- Reportes de tiempos (ya hay timestamps/historial)
- Priorización avanzada
- Integración centro de notificaciones (“orden lista”)
- Métricas por estación/producto/usuario

---

## 14. Riesgos y decisiones abiertas (para revisión)

1. **¿El KDS se alimenta solo de Orden (`IdTipoDocumentos=10`) o también de Factura directa (`ProcesarFactura` sin orden previa)?**  
   Recomendación: ambos si `KDS` activo y el negocio cocina al vender; flag `IncluirFacturasDirectas`.

2. **¿Cancelar en KDS anula la orden comercial?**  
   Recomendación Etapa 1: cancelación KDS = estado producción Cancelada + auditoría; anulación comercial sigue siendo flujo aparte (`AnularFactura` / borrar orden) que también emite `OrdenProduccionCancelada`.

3. **Referencia vs cliente:** confirmar UI en POS (campo “Referencia / nombre para cocina”).

4. **Reutilizar `Cocinas` vs nueva `KdsEstacion`:** recomendación nueva tabla + migración de nombres desde `Cocinas` para no mezclar semántica vieja.

5. **¿Estados actuales `Estado_Orden` / `StatuItem` se siguen escribiendo?**  
   Recomendación: en Etapa 1 el KDS es dueño del estado de producción; opcionalmente sincronizar `Estado_Orden` como espejo de solo lectura para pantallas viejas, sin que Órdenes UI sea el tablero.

---

## 15. Criterios de aceptación Etapa 1

- [ ] Guardar orden en POS crea ticket KDS si módulo activo; si inactivo, cero error.
- [ ] Pantalla KDS recibe orden en < 2s con SignalR (o al reconectar vía GET).
- [ ] Tarjeta muestra nº, nombre/referencia, tipo servicio, hora, tiempo, observación, líneas.
- [ ] Flujo Pendiente → En preparación → Lista → Entregada.
- [ ] Cancelar pide motivo y deja historial.
- [ ] No aparece “mesa” en UI ni contratos KDS.
- [ ] Dos pantallas: conflicto de estado devuelve error claro y refresca.
- [ ] Solo `AlahiaPos_Dev` en scripts DDL.

---

## 16. Entregables de implementación (cuando se apruebe)

1. Script SQL Dev (`Create_Kds_*.sql`)  
2. Entidades + DbContext + servicios + controller + hub  
3. Handler outbox + enganche post-`Post` FacturaHeader  
4. FE: pantalla KDS + login KDS + servicio SignalR  
5. Módulo `KDS` + permisos + menú  
6. Ajustes mínimos POS (tipo servicio, referencia, nota)

---

**Estado del documento:** listo para revisión.  
**No se ha modificado código ni base de datos en esta entrega.**
