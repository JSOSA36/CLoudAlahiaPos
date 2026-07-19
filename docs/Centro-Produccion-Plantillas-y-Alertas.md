# Centro de Producción — Revisión conceptual: Plantillas y Alertas

> Incorporado y aprobado en [`Centro-Produccion-Arquitectura-v2.1.md`](./Centro-Produccion-Arquitectura-v2.1.md).  
> Decisiones: `PlantillaCodigo?` en contrato Etapa 1; motor Plantillas/Alertas en Etapa 2.

---

## 1. Contexto: qué ya resolvía la v2

| Concepto v2 | Responde a |
|-------------|------------|
| **Flujo** | *Cómo* avanza un trabajo: estados, transiciones, SLA, reglas |
| **Estación** | *Dónde* se ejecuta un paso |
| **Trabajo + Ítems** | *Qué instancia* está en curso y sus líneas |
| **Evento origen** | *Quién disparó* el trabajo (sin acoplar el motor) |
| **SLA / semáforo** | *Si va a tiempo* respecto al objetivo del flujo |

Lo que el usuario describe como **Plantilla** responde a otra pregunta:

> **¿Qué pasos (ítems de trabajo) deben crearse automáticamente** cuando llega un trabajo de cierto “producto/servicio/configuración”?

Eso **no** lo cubre el Flujo. El Flujo dice “Pendiente → Lavando → Listo”. La Plantilla dice “para Lavado Premium crea 4 ítems/pasos; para Básico solo 2”.

---

## 2. Plantillas de Producción

### 2.1 Definición propuesta

| Concepto | Pregunta que responde | Ejemplo |
|----------|----------------------|---------|
| **Tipo de trabajo** | ¿De qué familia es? | `CAR_WASH_SERVICIO`, `BIZCOCHO_PRODUCCION` |
| **Flujo** | ¿Qué estados puede recorrer el trabajo (y con qué SLA)? | Car Wash: Pendiente → … → Listo, SLA 45 min |
| **Plantilla** | ¿Qué estructura de pasos/ítems se materializa al crear el trabajo? | Premium → Lavado+Aspirado+Encerado+Revisión |
| **Trabajo** | Instancia real | Servicio #882 de hoy |
| **Ítem** | Paso o línea concreta | “Encerado” en estación Encerado |

Relación recomendada:

```
TipoTrabajo 1──* Flujo (versión activa)
TipoTrabajo 1──* Plantilla
Plantilla  *──1 Flujo          (opcional pero útil: plantilla “elige” flujo)
Plantilla  1──* PlantillaPaso  (pasos ordenados → se copian a Ítems)
Evento origen ──► resuelve Plantilla ──► crea Trabajo + Ítems
```

### 2.2 ¿Aporta valor real?

**Sí.** Mejora el diseño en tres frentes:

1. **Separación de responsabilidades**  
   Mezclar “máquina de estados” con “lista de pasos del servicio” en el Flujo hincha el flujo y lo vuelve específico por producto (Lavado Premium vs Básico), rompiendo reutilización.

2. **Multisectorialidad**  
   El mismo patrón sirve a car wash, repostería, ferretería y almacén sin hardcodear verticales en el núcleo: la plantilla es **dato**.

3. **Automatización**  
   El operador no arma el desglose a mano; el publisher (o el motor vía clave de plantilla) materializa el trabajo completo.

4. **Métricas futuras**  
   “Tiempo promedio del paso Encerado en plantilla Premium” requiere pasos estables nacidos de plantilla, no ítems ad hoc.

### 2.3 Cómo se integra sin romper v2

El motor sigue desacoplado. El contrato de evento solo necesita **una clave de resolución**:

```
ProduccionTrabajoSolicitado {
  …
  PlantillaCodigo?     // preferido si el origen lo conoce
  // o
  CriteriosPlantilla?  // ej. CodigoServicio, IdProducto, IdPlan
  Items[]?             // si vienen, pueden complementar o sustituir (política)
}
```

Algoritmo del motor (conceptual):

1. Recibe evento (no sabe si fue POS o Car Wash).  
2. Resuelve `TipoTrabajo` + `Plantilla` (por código explícito o reglas de matching).  
3. Toma el **Flujo** ligado a la plantilla (o al tipo).  
4. Crea `Trabajo` (SLA snapshot del flujo).  
5. Materializa `Ítems` desde `PlantillaPaso` (estación, orden, nombre, responsable default opcional).  
6. Si el evento trae `Items[]` (caso POS con líneas de productos):  
   - **Política A (recomendada Etapa 1 POS):** ítems del evento = líneas comerciales; plantilla opcional/ausente.  
   - **Política B (Car Wash / Bizcocho):** plantilla manda; el evento trae poco más que cabecera + `PlantillaCodigo`.  
   - **Política C (híbrida):** plantilla genera pasos + ítems del evento se agregan como líneas adicionales.

Ninguna política obliga al motor a conocer el módulo origen.

### 2.4 Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Sobre-ingeniería antes del primer vertical que la necesite | POS Orden Etapa 1 vive bien **sin** plantilla (ítems = detalles de factura) |
| Confundir Plantilla con Flujo | Documentar y modelar como entidades distintas |
| Matching complejo (reglas por producto) | Empezar con `PlantillaCodigo` explícito en el evento; reglas después |
| Cambiar plantilla con trabajos abiertos | Snapshot de pasos al crear (como SLA) |

### 2.5 ¿Etapa 1 o después?

| Opción | Veredicto |
|--------|-----------|
| Implementar plantillas completas en Etapa 1 | **No recomendado.** El primer adapter (POS) ya trae ítems; retrasaría el MVP. |
| Ignorar el concepto hasta “más adelante” sin dejar hueco | **No recomendado.** Luego cuesta encajar Car Wash/Bizcocho. |
| **Dejar el concepto en arquitectura + hueco en el contrato/modelo** | **Sí (recomendado).** |

**Recomendación:**

- **Etapa 1:**  
  - Documentar Plantilla como concepto oficial.  
  - Contrato de evento: campo opcional `PlantillaCodigo`.  
  - Modelo mental: `Items[]` del evento materializan ítems si no hay plantilla.  
  - **No** construir UI de plantillas ni motor de matching.  
  - Opcional en DDL mínimo: tablas `ProduccionPlantilla` / `ProduccionPlantillaPaso` **vacías o sin uso**, *solo si* se quiere evitar migración dolorosa; si se prefiere cero tablas extras en Etapa 1, bastan el campo opcional en el contrato y un spike de diseño (preferible **no crear tablas vacías** hasta Etapa 2).

- **Etapa 2:**  
  - DDL + CRUD plantillas.  
  - Materialización automática.  
  - Primer uso real con **Car Wash o Bizcocho o Conduces** (donde el valor es obvio).

- **Etapa 3:**  
  - Reglas de matching avanzadas, versiones de plantilla, métricas por paso de plantilla.

**Conclusión plantillas:** aportan valor alto al diseño multisectorial; **no son necesarias para el MVP POS**; **sí deben quedar planificadas desde ahora** en el documento y en el contrato de evento (`PlantillaCodigo?`), implementación de motor/UI en **Etapa 2**.

---

## 3. Sistema de Alertas

### 3.1 Qué hay hoy (v2)

- SLA → semáforo visual + posible sonido local en el tablero.  
- Eso es **señal en UI**, no un **hecho de dominio** reutilizable.

### 3.2 Qué aportaría un motor de alertas

Una alerta es un hecho:

> “El trabajo X entró en condición Y en el instante T”

Tipos ejemplo (códigos de catálogo, no hardcode de vertical):

| CodigoAlerta | Disparador conceptual |
|--------------|----------------------|
| `TRABAJO_PROXIMO_VENCER` | Cruce de umbral de advertencia SLA |
| `TRABAJO_RETRASADO` | Cruce de límite SLA |
| `ITEM_DETENIDO_ESTACION` | Tiempo en mismo estado/estación > umbral (config) |
| `SIN_RESPONSABLE` | Ítem/estación sin responsable y flag activo |
| `PRIORIDAD_ALTA` | Creación o cambio a Alta/Urgente (opcional, una vez) |
| `TRABAJO_CANCELADO` | Cancelación |

Beneficio clave para Alahia ERP:

- El **Centro de Notificaciones** ya existe como destino genérico.  
- Si las alertas nacen como eventos de dominio del motor (`ProduccionAlertaGenerada`), un handler fino puede mapear a `INotificacionCentro` **sin** que el núcleo de producción conozca SignalR de notificaciones ni plantillas de email.  
- Evita volver a tocar el motor cada vez que se agregue un canal (InApp, Email, futuro WhatsApp).

### 3.3 Cómo se integra sin romper el desacoplamiento

```
Motor Producción
  └─ detecta condición (evaluación al cambiar estado / job periódico liviano)
  └─ emite / persiste ProduccionAlerta (idempotente por Trabajo+Codigo+Ventana)
           │
           ├─► Tablero (SignalR produccion:alerta)     [inmediato]
           │
           └─► Outbox ProduccionAlertaGenerada
                    └─► Handler Notificaciones (fuera del núcleo)
                         └─► Centro de Notificaciones
```

Principios:

1. El motor **define y detecta** alertas de producción.  
2. El motor **no** llama al servicio de notificaciones directamente (mismo patrón que POS → motor).  
3. Idempotencia: no spamear “retrasado” cada minuto; una alerta activa por clave hasta que se resuelva o se reconozca (snooze/ack).  
4. Catálogo de tipos de alerta = datos (`ProduccionTipoAlerta`), no `if (restaurante)`.

### 3.4 Relación con SLA

| SLA | Alertas |
|-----|---------|
| Configura tiempos objetivo | Puede **disparar** alertas de tiempo |
| Semáforo en tarjeta | UX inmediata |
| No reemplaza historial de alertas | Alertas son auditable y alimentan otros módulos |

SLA ⊆ entrada del motor de alertas; alertas ⊇ más condiciones (responsable, prioridad, detenido en estación).

### 3.5 Riesgos

| Riesgo | Mitigación |
|--------|------------|
| Segundo “centro de notificaciones” dentro de producción | Alertas = dominio producción; notificación = proyección |
| Ruido / fatiga de alertas | Idempotencia, ack, snooze, config por tipo |
| Evaluación continua costosa | Evaluar en transiciones de estado + timer liviano cada N minutos solo para “detenido” / SLA |
| Etapa 1 sobrecargada | No construir motor completo aún |

### 3.6 ¿Etapa 1 o después?

| Opción | Veredicto |
|--------|-----------|
| Motor de alertas completo + bridge a notificaciones en Etapa 1 | **No.** El MVP ya tiene semáforo SLA y sonido. |
| No mencionar alertas | **No.** Se perdería el puente limpio al Centro de Notificaciones. |
| **Arquitectura preparada + semáforo SLA en Etapa 1; motor de alertas Etapa 2; bridge notificaciones Etapa 2/3** | **Sí.** |

**Recomendación detallada:**

- **Etapa 1 (tablero):**  
  - Solo semáforo SLA + sonido local (como v2).  
  - En el documento: catálogo conceptual de tipos de alerta.  
  - *Opcional mínimo:* al detectar retraso, además del color, dejar un hook interno `IProduccionAlertaEmitter` no-op o log — **solo si no complica**; preferible ni siquiera la interfaz hasta Etapa 2.

- **Etapa 2:**  
  - Persistencia `ProduccionAlerta` + emisión SignalR al tablero.  
  - Ack / silenciar.  
  - Umbral “detenido en estación”.  
  - Outbox `ProduccionAlertaGenerada`.

- **Etapa 2 o 3:**  
  - Handler → Centro de Notificaciones (reutiliza infraestructura actual).

**Conclusión alertas:** sí valen la pena; **no retrasan Etapa 1** si se quedan en diseño + SLA visual; **implementación del motor de alertas en Etapa 2**, con puente a notificaciones en cuanto el outbox de alertas exista.

---

## 4. Encaje conjunto en la arquitectura v2

```
Evento origen
    ▼
[Resolver Plantilla?] ──(Etapa 2)──► pasos → Ítems
    ▼
[Flujo + SLA] ─────────────────────► Trabajo (snapshot)
    ▼
Cambios de estado / tiempo
    ▼
[Evaluador de Alertas] ──(Etapa 2)──► ProduccionAlerta
    ▼                                      │
Tablero (SLA semáforo Etapa 1)             ├─► SignalR tablero
Dashboard KPIs                             └─► Outbox → Notificaciones (2/3)
```

Nada de esto introduce dependencia a POS/Conduces/cocina.

---

## 5. Resumen ejecutivo para aprobación

| Concepto | ¿Mejora el diseño? | ¿Rompe v2? | ¿Cuándo? |
|----------|--------------------|------------|----------|
| **Plantilla de Producción** | Sí — separa “pasos del servicio” del “flujo de estados”; clave multisector | No — se engancha por código opcional en el evento | **Planificar ahora; implementar Etapa 2** (POS Etapa 1 sin plantilla) |
| **Motor de Alertas** | Sí — hechos de dominio + futuro Centro de Notificaciones | No — outbox paralelo al patrón actual | **Planificar ahora; Etapa 1 solo SLA visual; motor Etapa 2; notificaciones 2/3** |

### Ajustes mínimos a la v2 (solo documento, ya reflejados aquí)

1. Añadir **Plantilla** al mapa conceptual (distinta de Flujo).  
2. Añadir `PlantillaCodigo?` al contrato de evento.  
3. Añadir capa **Alertas** como proyección auditable + outbox futuro.  
4. Mantener Etapa 1: POS + Flujo + SLA snapshot + tablero + dashboard API liviano.  
5. Etapa 2: Plantillas + Alertas (+ estaciones/responsables UI).  

---

## 6. Conclusión

Ambos conceptos **sí mejoran** el diseño empresarial y **encajan** en el motor desacoplado:

- **Plantillas** evitan que el Flujo se convierta en un catálogo de productos.  
- **Alertas** evitan que el SLA quede atrapado en colores de UI y abren el Centro de Notificaciones sin reescribir el núcleo.

La disciplina correcta es la misma que con el resto del ERP:

> Diseñar el concepto ahora, implementar cuando el primer caso de uso real lo exija, sin contaminar el MVP.

**No hay código, DDL ni APIs en esta entrega.**  
Si apruebas este análisis, el siguiente paso es actualizar la v2 como **v2.1** (documento consolidado) y solo entonces iniciar Etapa 1 en `AlahiaPos_Dev`.
