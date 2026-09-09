# Arquitectura multisucursal — Alahia ERP

Estado: **v1 en curso** (DB + entidades + sesión/selector; inventario/caja/POS/reportes pendientes)  
Fecha: 2026-09-02  
Alcance: repos `CLoudAlahiaPos` (frontend) y `AlahiaPosApi` (API / DataAccess / Entities)  
Base de datos de referencia: `AlahiaPos_Dev`

Este documento no autoriza cambios de código. La implementación espera aprobación explícita.

---

## 1. Cómo está el sistema hoy

Alahia es **multi-tenant por empresa**, no por sucursal.

El tenant es `IdEmpresa`. Casi toda entidad operativa hereda `BaseEntity.IdEmpresa` o lo declara. El usuario (`Usuarios`) tiene **un solo** `IdEmpresa`. El login guarda esa empresa en `ParametrosService` y `localStorage`. La sesión del API (`SesionActual`) solo conoce `IdUsuario`, `IdEmpresa` e `IdPerfil`.

No existe tabla ni entidad `Sucursal`. La palabra “sucursal” aparece en el cotizador comercial (cantidad de sucursales del plan) y en comentarios de cobro SaaS, no en el modelo operativo.

Cuando un cliente abre un segundo local, hoy se crea **otra empresa**. Eso explica los problemas que describes: usuarios duplicados, catálogo duplicado, clientes duplicados, sin consolidado real y sin transferencia entre locales.

### Seguridad actual (hay que conservarla y extenderla)

- `SesionAuthFilter` resuelve el Bearer contra `Usuarios.Token`.
- `TenantIdEmpresaGuard` recorre el body/ruta: si llega un `IdEmpresa` distinto al de la sesión → 403 (salvo MacroBits con `[PermitirEmpresaObjetivo]`). Si llega 0/null, se sustituye por la empresa autenticada.
- `TenantRecurso` bloquea Get-by-id de un registro de otra empresa (404).
- `RequiereTerminalPosFilter` amarra el POS a un equipo (`PosTerminal`) de esa empresa.

**No hay equivalente para sucursal.** Un `IdSucursal` enviado por el frontend no se validaría.

### Inventario actual (aprovechable)

Ya existe un modelo de **almacén**, no de sucursal:

| Pieza | Rol hoy |
|---|---|
| `Almacenes` | Ubicación de stock por empresa (`EsPrincipal`) |
| `AlmacenExistencias` | Cantidad por (`IdAlmacen`, `IdProducto`, `IdEmpresa`) |
| `Productos.Stock` / `Cantidad` | Stock “plano” a nivel empresa (segunda fuente; riesgo) |
| `MovimientosInventario` | ENTRADA / SALIDA / AJUSTE / PERDIDA y **TRANSFERENCIA** con `IdAlmacen` + `IdAlmacenDestino` |
| UI `movimientosinventario` | Ya permite tipo TRANSFERENCIA entre almacenes de la **misma** empresa |

La transferencia entre sucursales no debe reinventarse: debe ser transferencia entre el almacén de origen y el de destino, auditada en `MovimientosInventario`.

La venta descuenta inventario de la empresa, no de un local. Caja (`CajaApertura` / `CajaCierre` / `CajaMovimiento`) es por empresa + usuario, no por local. `Empresas.ApiPrint` es una URL de impresora **por empresa**. `LimiteTerminalesPos` es cupo de PCs **por empresa**.

### Fiscal (DGII / e-CF)

RNC, certificado digital, `SecuenciaECF`, `DgiiConfiguracionEmpresa` y `AmbienteFE` viven en **Empresa**. En República Dominicana, sucursales de la misma persona jurídica comparten RNC. Si dos “sucursales” actuales son empresas distintas con **RNC distinto**, no se pueden fusionar en una sola empresa sin decisión legal. La migración automática solo crea “Sucursal Principal” **dentro de cada empresa existente**; no une empresas.

---

## 2. Qué debe quedar a nivel Empresa vs Sucursal

### Empresa (una sola fuente de verdad)

- Identidad legal: RNC, razón social, plan SaaS, módulos (`Empresa_Modulos`), límites de facturación, cobro de suscripción.
- Catálogo: productos, categorías, recetas, tipos de comportamiento.
- Maestros compartidos: clientes, proveedores, descuentos de catálogo (salvo override futuro).
- Usuario y perfil de módulos (el usuario pertenece a la empresa).
- Contabilidad de la persona jurídica (plan de cuentas, periodos), con dimensión sucursal en los asientos cuando aplique.
- e-CF / certificado / secuencias DGII **mientras el RNC sea único** (por defecto a nivel empresa).
- Configuración fiscal 606/607/IT-1.

### Sucursal (unidad operativa)

- Nombre, dirección, teléfono, GPS, horario, `ApiPrint`, parámetros POS.
- Almacén(es). En v1: un almacén principal por sucursal (los extras quedan para después).
- Existencia: `AlmacenExistencias` del almacén de esa sucursal.
- Ventas, órdenes, cotizaciones, notas de crédito operativas, condices.
- Caja: aperturas, cierres, movimientos, arqueos.
- Compras/recepciones que entran a stock de ese local.
- Gastos e ingresos de caja del local.
- Mesas / salón / KDS / estaciones de producción de ese local.
- Terminales POS (el cupo puede seguir siendo de empresa, asignado a sucursales).
- Empleados de piso (opcional: sucursal de trabajo; el maestro RRHH puede seguir siendo de empresa).
- Pedidos online / canal delivery (un canal puede apuntar a una sucursal).

### Empresa, con filtro opcional de sucursal (consulta)

- Dashboard gerencial, reporte de ventas, CxC, bancos (cuentas pueden ser de empresa o de sucursal).
- Nómina (empleado puede tener sucursal de costeo).
- Historial de facturas: por sucursal o consolidado.

---

## 3. Módulos, APIs y pantallas afectados

Casi todos los controladores filtran por `IdEmpresa`. Los más críticos para v1:

**Operar:** POS, órdenes, facturas, caja, inventario/movimientos, almacenes, compras, gastos, ingresos, salón/mesas, producción, pedidos online, impresión.

**Controlar:** CxC, CxP, notas de crédito, reportes 606/607/IT-1/IR, dashboard.

**Configurar:** usuarios, perfiles, empresa, secuencias internas, e-CF, agente de impresión, parámetros POS.

Frontend: `ParametrosService.IdEmpresa` se usa en decenas de pantallas (`pos`, `ordenes`, `historicofact`, `cierre-caja`, `productos`, `almacenes`, `dashboard-gerencial`, etc.). Habrá que añadir `IdSucursal` de sesión y un selector en el shell (`app.component`), no un `IdSucursal` suelto en cada formulario.

---

## 4. Riesgos

1. **RNC distintos.** Dos empresas actuales con RNC diferente no son “sucursales” de un mismo contribuyente. Fusionarlas rompería e-CF. La fusión es un proyecto aparte, manual y con validación de RNC.
2. **Doble stock.** `Productos.Stock` vs `AlmacenExistencias`. En multisucursal la verdad es la existencia por almacén. Hay que dejar de vender contra `Productos.Stock`.
3. **Caja abierta.** Hoy una apertura es de empresa+usuario. Con sucursales, dos locales no pueden compartir la misma apertura. Hay que amarrar apertura a sucursal (y opcionalmente a terminal).
4. **Secuencias internas (`Fact-0007`).** Hoy son por empresa. Si dos sucursales facturan a la vez, el correlativo único de empresa sigue siendo válido y es lo más simple. Numeración por sucursal es fase posterior y opcional.
5. **e-CF por sucursal.** DGII autoriza secuencias al RNC, no al local. No partir secuencias e-CF por sucursal en v1 salvo requisito normativo explícito.
6. **POS offline.** IndexedDB está keyed por `IdEmpresa`. Hay que incluir `IdSucursal` para no mezclar colas ni existencias.
7. **Cambiar sucursal con documentos abiertos.** Orden en mesa, caja abierta, carrito POS: hay que bloquear el cambio o forzar cierre/guardar.
8. **Reportes históricos.** Datos actuales no tienen `IdSucursal`. Tras migrar, todo lo viejo queda en Sucursal Principal. Los consolidados de “empresas hermanas” (dos IdEmpresa) no aparecen hasta una fusión opcional.
9. **Licencia POS.** `LimiteTerminalesPos` es de empresa. Con tres sucursales, el cupo debe ser de empresa (repartido) o sublímites por sucursal. Decisión de producto en implementación.
10. **Contabilidad.** Asientos de venta/inventario hoy no tienen dimensión sucursal. Consolidar caja/banco de empresa con stock por local exige `IdSucursal` en movimientos operativos; el plan de cuentas sigue único.

---

## 5. Diseño de datos (v1)

Principio: **no sustituir Empresa por Sucursal**. Empresa sigue siendo el tenant. Sucursal es hija. El almacén sigue siendo el lugar del stock.

### 5.1 Tablas nuevas

**`Sucursal`**

- `IdSucursal` PK  
- `IdEmpresa` FK NOT NULL  
- `Codigo` NVARCHAR(20) NOT NULL (ej. PRINC, PIANT, HERR)  
- `Nombre` NVARCHAR(150) NOT NULL  
- `EsPrincipal` BIT NOT NULL  
- `Activa` BIT NOT NULL  
- Dirección, teléfono, municipio, provincia, lat/long (nullable; pueden copiarse de Empresa en la migración)  
- `ApiPrint` NVARCHAR(300) NULL  
- `IdAlmacenPrincipal` INT NULL FK → Almacenes  
- Auditoría: `FechaCreacion`, `IdUsuarioCreacion`  
- Unique `(IdEmpresa, Codigo)`  
- Unique filtered: una sola `EsPrincipal = 1` por empresa  
- Check: sucursal.IdEmpresa = almacén.IdEmpresa

**`UsuarioSucursal`**

- `IdUsuarioSucursal` PK  
- `IdUsuario` FK  
- `IdSucursal` FK  
- `EsDefault` BIT  
- `Activo` BIT  
- Unique `(IdUsuario, IdSucursal)`  
- Check: usuario.IdEmpresa = sucursal.IdEmpresa  
- Una default por usuario (índice filtrado)

**`SucursalCambioLog`** (auditoría de switch)

- Usuario, sucursal origen/destino, fecha, IP/dispositivo

No crear tablas espejo de productos ni de clientes.

### 5.2 Columnas nuevas (operación)

Añadir `IdSucursal INT NULL` (luego NOT NULL tras backfill) en:

- `FacturaHeaders`
- `CajaApertura`, `CajaCierre`, `CajaMovimiento`
- `MovimientosInventario`
- `OrdenCompraHeader` (recepción al local)
- `Gastos`, `Ingresos` (si son de caja/local)
- `PosTerminal`
- `Mesas`, `Cocinas` / estaciones de producción
- `PedidoOnline` (destino de preparación)
- `Parametros` cuando `Tipo = POS`
- `ConduceHeader`

`Almacenes.IdSucursal` NOT NULL tras backfill. Existencia **no** lleva `IdSucursal` redundante: se deriva del almacén.

Opcional v1.1: `Empleados.IdSucursalTrabajo`, `CuentaFinanciera.IdSucursal` (caja chica vs banco corporativo).

No añadir `IdSucursal` a: `Productos`, `Categorias`, `Clientes`, `Proveedores`, `Empresas`, `SecuenciaECF`, `CertificadoDigital`, `Empresa_Modulos`, `Usuarios` (el acceso va por `UsuarioSucursal`), `PlanesCloud`.

### 5.3 Índices

- `FacturaHeaders (IdEmpresa, IdSucursal, FechaInseccion)`  
- `CajaApertura (IdEmpresa, IdSucursal, Estado)`  
- `Almacenes (IdEmpresa, IdSucursal)`  
- `UsuarioSucursal (IdUsuario) INCLUDE (IdSucursal, EsDefault)`

### 5.4 Sesión y API

Extender `SesionActual`:

- `IdSucursal` (sucursal activa; nunca del body sin validar)
- `SucursalesPermitidas` (ids) o se resuelve en cada request

Contrato propuesto:

- Login: igual que hoy + lista de sucursales + `idSucursalDefault`.
- Header `X-IdSucursal` **opcional**. Si falta, usar default. El filtro compara: sucursal existe, `IdEmpresa` de la sucursal = sesión, y hay fila activa en `UsuarioSucursal`.
- `POST /api/Sesion/sucursal` { idSucursal }: cambia sucursal activa (nuevo token o claim actualizado) y escribe log.
- `GET /api/Sucursales` solo las permitidas.
- Consultas consolidadas: `?alcance=empresa` **solo** si el perfil tiene permiso `SUCURSAL_CONSOLIDADO` (nuevo rol, no un flag del cliente).

Regla: el body puede traer `IdSucursal` para documentos; el servidor **lo pisa** con la sucursal de sesión en operaciones de escritura (POS, caja, inventario), igual que hoy se pisa `IdEmpresa`. Los reportes consolidados no usan el body para saltar el tenant.

Nuevo filtro `TenantSucursalGuard` junto a `TenantIdEmpresaGuard`, no en lugar de él.

### 5.5 Inventario y transferencias

```
Empresa
  Sucursal Principal     → Almacén Principal (EsPrincipal)
  Sucursal Piantini      → Almacén Piantini
  Sucursal Herrera       → Almacén Herrera
```

Transferencia Principal → Piantini = `MovimientosInventario` tipo `TRANSFERENCIA`, origen = almacén de Principal, destino = almacén de Piantini, `IdSucursal` = origen, `IdSucursalDestino` opcional para reportes. Reutilizar el servicio que ya descuenta origen y suma destino. Añadir validación: ambos almacenes de la misma empresa; el usuario debe tener acceso a origen (y, si se exige, a destino).

Ajustes, entradas, pérdidas: igual que hoy, filtrados al almacén de la sucursal activa.

POS: al vender, descontar `AlmacenExistencias` del `IdAlmacenPrincipal` de la sucursal de sesión. Dejar de usar `Productos.Stock` como existencia de venta.

### 5.6 Ventas y caja

`FacturaHeaders.IdSucursal` + `IdUsuario` + `IdCajaApertura` (ya hay vínculo a cierre). Reportes:

- Por sucursal: `WHERE IdEmpresa = @e AND IdSucursal = @s`
- Consolidado: `WHERE IdEmpresa = @e` agrupado por sucursal

Caja: una apertura abierta por (`IdSucursal`, `IdUsuario`) o por (`IdSucursal`, `IdPosTerminal`). No permitir cobrar en sucursal B con caja abierta en A.

### 5.7 Usuarios

El administrador de empresa recibe `UsuarioSucursal` a todas las sucursales. Un vendedor, solo las asignadas. El perfil de módulos (`PerfilRoles`) se mantiene; se suma el permiso de sucursal. Un usuario sin ninguna sucursal no opera (tras migración, todos quedan en Principal).

Cambio de sucursal **sin logout**: el `IdEmpresa` no cambia; solo `IdSucursal` de sesión. Recargar catálogo de existencias, caja, mesas, ApiPrint. No recargar el catálogo de productos (es de empresa).

### 5.8 Compatibilidad una sucursal

Tras migrar, cada empresa tiene exactamente una sucursal principal. El selector se oculta si `COUNT(sucursales activas permitidas) = 1`. Todas las APIs siguen aceptando requests sin `X-IdSucursal` (usan la default). El comportamiento para el 99% de clientes actuales no cambia.

---

## 6. Migración de datos (Dev primero; Prod solo con autorización)

Script idempotente, con `USE` + guard `DB_NAME()`:

1. Crear tablas `Sucursal`, `UsuarioSucursal`, `SucursalCambioLog`.
2. Por cada `Empresas` activa: si no tiene sucursal, insertar `Codigo = 'PRINC'`, `Nombre = 'Sucursal Principal'`, `EsPrincipal = 1`, copiar dirección/teléfono/ApiPrint de la empresa.
3. `Almacenes`: `IdSucursal` = principal de su empresa. Si no hay almacén, crear “Almacén Principal” y engancharlo a `Sucursal.IdAlmacenPrincipal`.
4. Backfill `IdSucursal` en tablas operativas = principal de `IdEmpresa`.
5. `UsuarioSucursal`: cada usuario → sucursal principal, `EsDefault = 1`.
6. `PosTerminal.IdSucursal` = principal.
7. No borrar ni fusionar empresas. No tocar `AlahiaPos_Prod` en este diseño hasta un pase explícito.

Empresas que hoy son “la sucursal 2” de un mismo dueño **siguen siendo empresas distintas** hasta un proyecto de fusión (mismo RNC, mapeo de productos/clientes, reescritura de FKs). Fuera de v1.

---

## 7. Estrategia de implementación (cuando se apruebe)

Orden estricto para no romper el ERP de una sucursal:

1. SQL Dev: tablas + backfill + índices.  
2. Entidades y DbContext.  
3. Sesión + guards de sucursal (escrituras pisan `IdSucursal` de sesión).  
4. Login/API sucursales + FE selector (oculto si hay una).  
5. Inventario: filtrar existencia por almacén de sucursal; transferencias entre almacenes de distintas sucursales.  
6. POS / ventas / caja.  
7. Compras, gastos, reportes y dashboard (filtro + consolidado con permiso).  
8. Offline POS keyed por empresa+sucursal.  
9. ApiPrint por sucursal (fallback a empresa).  
10. Pruebas en `AlahiaPos_Dev` con e-CF, una empresa de una sucursal (regresión) y una empresa de prueba con 2 sucursales.

No hacer un “search-replace IdEmpresa → IdSucursal”. Empresa sigue siendo el tenant.

---

## 8. Decisiones que pido aprobar

1. **v1 no fusiona empresas existentes.** Solo introduce Sucursal Principal dentro de cada una.  
2. **Stock de venta = `AlmacenExistencias` del almacén principal de la sucursal**, no `Productos.Stock`.  
3. **Transferencia entre sucursales = movimiento de inventario ya existente** entre almacenes.  
4. **e-CF y secuencias DGII siguen en Empresa** (mismo RNC).  
5. **Numeración interna `Fact-` sigue por empresa** en v1.  
6. **Un usuario, una empresa, N sucursales**; cambio de sucursal sin logout.  
7. **Consolidado de ventas/caja** solo con permiso de perfil, validado en backend.  
8. **Selector oculto** cuando hay una sola sucursal permitida.

Si esto se aprueba, el primer código sería el script SQL de Dev y las entidades, sin tocar aún el POS.
