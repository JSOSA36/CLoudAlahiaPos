# Plano Técnico — Módulo de Facturación Electrónica

**Tipo:** Diseño técnico (sin implementación hasta aprobación)  
**Estado:** Pendiente de aprobación  
**Prerrequisitos:**  
- `docs/Arquitectura-Motor-Fiscal-Central.md` (PRINCIPIO #1)  
- `docs/Arquitectura-Fiscal-Gateway.md` (Gateway Fiscal)  
- Sprint A + Sprint B + Sprint B.1 completados  
**Decisión adoptada:** El módulo se llama "Facturación Electrónica", no "Comprobantes Fiscales"

---

## 0. PRINCIPIO TRANSVERSAL

**El módulo de Facturación Electrónica es un servicio transversal del ERP.**

No pertenece al POS. No pertenece a Compras. No pertenece a Notas de Crédito. Pertenece a Alahia ERP como infraestructura compartida.

Cualquier módulo que genere un documento fiscal electrónico utiliza exactamente el mismo pipeline:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    MÓDULOS COMERCIALES (consumidores)                │
│                                                                     │
│   POS    Facturación    NC    ND    Compras    Gastos    Exportación │
│    │          │          │     │       │         │           │       │
│    └──────────┴──────────┴─────┴───────┴─────────┴───────────┘       │
│                              │                                       │
│                    IFacturacionElectronicaService                     │
│                     .EmitirDocumentoAsync(request)                    │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
                 ┌─────────────▼──────────────┐
                 │  FACTURACIÓN ELECTRÓNICA    │
                 │   (servicio transversal)    │
                 │                             │
                 │  1. Reservar e-NCF          │
                 │  2. Congelar fotografía     │
                 │  3. Crear ECFEncabezado     │
                 │  4. Encolar al outbox       │
                 │                             │
                 │  (asíncrono)                │
                 │  5. Motor Fiscal            │
                 │  6. Gateway Fiscal          │
                 │  7. Proveedor → DGII       │
                 │  8. Actualizar estados      │
                 └─────────────────────────────┘
```

### Reglas vinculantes

| # | Regla |
|---|-------|
| T1 | Todos los módulos que emiten documentos fiscales llaman a **una única interfaz**: `IFacturacionElectronicaService` |
| T2 | Ningún módulo conoce: API del proveedor, tokens, XML, JSON, firma digital, DGII, Gateway, estados del documento electrónico |
| T3 | Los módulos solo saben que la operación comercial fue exitosa. La comunicación con DGII **nunca** afecta la operación comercial |
| T4 | FACT = venta sin comprobante fiscal. No pasa por el pipeline. No reserva e-NCF. No crea documento electrónico |
| T5 | Cualquier tipo e-CF (31, 32, 33, 34, 41, 43, 44, 45, 46, 47, ...) utiliza el pipeline completo |
| T6 | Toda la lógica de estados (BORRADOR → PENDIENTE_ENVIO → ENVIADO → ACEPTADO/RECHAZADO/ERROR/CONTINGENCIA/ANULADO) vive **exclusivamente** dentro del módulo de Facturación Electrónica |
| T7 | El módulo soporta múltiples proveedores via el Gateway Fiscal. Cambiar proveedor no afecta a ningún módulo consumidor |
| T8 | El Motor Fiscal es **genérico respecto al origen del documento**. No depende de `FacturaHeaders`, `NotasCredito` ni ninguna tabla específica. Usa una referencia genérica `OrigenDocumento` + `IdOrigen` para localizar cualquier documento del ERP |

### Principio de origen genérico

El Motor Fiscal y `ECFEncabezado` **nunca** tienen un FK directo a una tabla comercial. En su lugar, identifican el documento de origen con dos campos:

```
OrigenDocumento : enum (int en DB)  →  Pos, Facturacion, NotaCredito, Compra, etc.
IdOrigen        : int               →  PK del documento en su tabla de origen
```

| OrigenDocumento | Valor DB | Tabla de origen | Campo PK | Ejemplo |
|----------------|:--------:|----------------|----------|---------|
| `Pos` | 1 | `FacturaHeaders` | `IdFacturaHeader` | `IdOrigen = 15487` |
| `Facturacion` | 2 | `FacturaHeaders` | `IdFacturaHeader` | `IdOrigen = 15490` |
| `NotaCredito` | 3 | `NotasCredito` | `IdNotaCredito` | `IdOrigen = 25` |
| `NotaDebito` | 4 | `NotasDebito` | `IdNotaDebito` | `IdOrigen = 8` |
| `Compra` | 5 | `OrdenCompraHeader` | `IdOrdenCompra` | `IdOrigen = 380` |
| `Gasto` | 6 | `Gastos` | `IdGasto` | `IdOrigen = 142` |
| `Exportacion` | 7 | (futura) | — | `IdOrigen = 5` |
| `Nomina` | 8 | (futura) | — | `IdOrigen = 1` |

### Principio Open/Closed — Resolvers de origen

**`FacturacionElectronicaService` nunca conoce `FacturaHeaders`, `NotasCredito`, `Gastos` ni ninguna entidad comercial.**

No tiene un `switch` con casos por módulo. No importa cuántos módulos tenga el ERP. El servicio transversal permanece **cerrado a modificaciones y abierto a extensiones**.

Para lograr esto se aplica el patrón **Strategy + Factory**:

```
FacturacionElectronicaService
        │
        │  _resolverFactory.Get(request.OrigenDocumento)
        ▼
┌─────────────────────────────────────────────────────┐
│            IDocumentoOrigenResolverFactory           │
│                                                     │
│  Resuelve el resolver correcto según OrigenDocumento│
│  (registrado via DI, sin switch)                    │
└───────────────────────┬─────────────────────────────┘
                        │
        ┌───────────────┼───────────────────┐
        │               │                   │
        ▼               ▼                   ▼
┌──────────────┐ ┌──────────────┐  ┌──────────────────┐
│ PosResolver  │ │ CompraResolver│  │ NotaCreditoResolver│
│              │ │              │  │                    │
│ Lee Factura  │ │ Lee Compra   │  │ Lee NC + factura   │
│ Headers +    │ │ Headers +    │  │ origen + detalles  │
│ detalles     │ │ detalles     │  │                    │
│              │ │              │  │                    │
│ Crea foto    │ │ Crea foto    │  │ Crea foto fiscal   │
│ fiscal       │ │ fiscal       │  │                    │
└──────────────┘ └──────────────┘  └──────────────────┘
                                         ...
                                   ┌──────────────────┐
                                   │ FuturoResolver    │
                                   │ (solo agregar DI) │
                                   └──────────────────┘
```

#### Interfaz `IDocumentoOrigenResolver`

```csharp
public interface IDocumentoOrigenResolver
{
    OrigenDocumento Origen { get; }

    Task<DocumentoOrigenInfo> ObtenerDocumentoAsync(int idOrigen, int idEmpresa);

    Task<FotografiaFiscalResultado> CrearFotografiaAsync(DocumentoOrigenInfo documento);
}
```

Cada resolver implementa esta interfaz para su módulo específico. El resolver **es dueño** de saber cómo leer su entidad comercial y cómo producir la fotografía fiscal correspondiente.

#### Interfaz `IDocumentoOrigenResolverFactory`

```csharp
public interface IDocumentoOrigenResolverFactory
{
    IDocumentoOrigenResolver Get(OrigenDocumento origen);
}
```

La factory resuelve el resolver correcto **sin switch**: usa un diccionario construido desde DI en el startup.

#### Implementación de la Factory (auto-descubrimiento via DI)

```csharp
public class DocumentoOrigenResolverFactory : IDocumentoOrigenResolverFactory
{
    private readonly IReadOnlyDictionary<OrigenDocumento, IDocumentoOrigenResolver> _resolvers;

    public DocumentoOrigenResolverFactory(IEnumerable<IDocumentoOrigenResolver> resolvers)
    {
        _resolvers = resolvers.ToDictionary(r => r.Origen);
    }

    public IDocumentoOrigenResolver Get(OrigenDocumento origen)
    {
        if (!_resolvers.TryGetValue(origen, out var resolver))
            throw new InvalidOperationException(
                $"No hay resolver registrado para OrigenDocumento.{origen}. " +
                $"Registre una implementación de IDocumentoOrigenResolver en DI.");
        return resolver;
    }
}
```

#### Registro en DI (Program.cs)

```csharp
// Resolvers — cada uno se registra individualmente
builder.Services.AddScoped<IDocumentoOrigenResolver, PosDocumentoResolver>();
builder.Services.AddScoped<IDocumentoOrigenResolver, CompraDocumentoResolver>();
builder.Services.AddScoped<IDocumentoOrigenResolver, NotaCreditoDocumentoResolver>();
builder.Services.AddScoped<IDocumentoOrigenResolver, GastoDocumentoResolver>();
// Agregar un nuevo módulo = agregar UNA línea aquí

// Factory — auto-descubre todos los resolvers registrados
builder.Services.AddScoped<IDocumentoOrigenResolverFactory, DocumentoOrigenResolverFactory>();
```

#### Agregar un nuevo módulo fiscal (ejemplo: Exportaciones)

| Paso | Acción | Modifica `FacturacionElectronicaService`? | Modifica Motor Fiscal? | Modifica Gateway? |
|------|--------|:----------------------------------------:|:----------------------:|:-----------------:|
| 1 | Agregar `Exportacion = 7` al enum `OrigenDocumento` | NO | NO | NO |
| 2 | Crear `ExportacionDocumentoResolver : IDocumentoOrigenResolver` | NO | NO | NO |
| 3 | Registrar en DI: `AddScoped<IDocumentoOrigenResolver, ExportacionDocumentoResolver>()` | NO | NO | NO |
| 4 | En el controller de exportaciones, llamar `_fe.EmitirDocumentoAsync(...)` con `OrigenDocumento.Exportacion` | NO | NO | NO |

**Cero modificaciones en el Motor Fiscal. Cero modificaciones en el Gateway. Cero modificaciones en `FacturacionElectronicaService`.** Solo código nuevo.

#### Modelo intermedio: `DocumentoOrigenInfo`

```csharp
public class DocumentoOrigenInfo
{
    public OrigenDocumento Origen { get; set; }
    public int IdOrigen { get; set; }
    public int IdEmpresa { get; set; }

    // Datos del documento comercial (genéricos, no acoplados a tabla)
    public DateTime FechaDocumento { get; set; }
    public string? RncCliente { get; set; }
    public string? NombreCliente { get; set; }
    public string? DireccionCliente { get; set; }
    public string? CorreoCliente { get; set; }
    public string? NumeroDocumentoInterno { get; set; }

    // Totales
    public decimal SubTotal { get; set; }
    public decimal TotalItbis { get; set; }
    public decimal TotalDescuento { get; set; }
    public decimal Total { get; set; }

    // Líneas (genéricas)
    public List<DocumentoOrigenLinea> Lineas { get; set; } = new();

    // Formas de pago
    public List<DocumentoOrigenPago> FormasPago { get; set; } = new();

    // Para NC/ND: referencia al documento modificado
    public string? NcfModificado { get; set; }
    public DateTime? FechaDocumentoModificado { get; set; }
    public int? CodigoModificacion { get; set; }
    public string? RazonModificacion { get; set; }
}

public class DocumentoOrigenLinea
{
    public int NumeroLinea { get; set; }
    public string Descripcion { get; set; } = "";
    public decimal Cantidad { get; set; }
    public decimal PrecioUnitario { get; set; }
    public decimal MontoItem { get; set; }
    public decimal? TasaItbis { get; set; }
    public decimal MontoItbis { get; set; }
    public bool EsBien { get; set; }
}

public class DocumentoOrigenPago
{
    public int FormaPagoDgii { get; set; }    // 1=Efectivo, 2=Cheque, 3=Tarjeta, etc.
    public decimal Monto { get; set; }
}
```

`DocumentoOrigenInfo` es el **modelo genérico** que todos los resolvers producen. El Motor Fiscal solo trabaja con este modelo. Nunca ve `FacturaHeaders`, `NotasCredito`, `OrdenCompraHeader` ni ninguna entidad comercial directamente.

#### Flujo interno completo (sin switch, sin acoplamiento)

```
FacturacionElectronicaService.EmitirDocumentoAsync(request):

    1. Validar FacturacionElectronicaActiva
    2. Reservar e-NCF
    3. var resolver = _resolverFactory.Get(request.OrigenDocumento)
    4. var docInfo = await resolver.ObtenerDocumentoAsync(request.IdOrigen, request.IdEmpresa)
    5. Crear ECFEncabezado (OrigenDocumento, IdOrigen, EstadoDocumento=BORRADOR)
    6. Encolar al outbox
    7. Retornar EmisionEcfResultado

    (asíncrono, via outbox worker)
    8. var resolver = _resolverFactory.Get(origenDocumento)
    9. var docInfo = await resolver.ObtenerDocumentoAsync(idOrigen, idEmpresa)
   10. var foto = await resolver.CrearFotografiaAsync(docInfo)
   11. Construir FiscalDocumentoElectronico desde docInfo + foto
   12. IFiscalGateway.EnviarDocumentoAsync(documento)
   13. Actualizar estados
```

**`FacturacionElectronicaService` no importa ningún namespace de entidades comerciales.** Solo conoce `IDocumentoOrigenResolver`, `DocumentoOrigenInfo` y `IFiscalGateway`.

### Módulos consumidores (actuales y futuros)

| Módulo | Tipo e-CF | Ejemplo |
|--------|----------|---------|
| POS | e31, e32, e45 | Ventas al mostrador |
| Facturación (crédito) | e31 | Facturas a crédito |
| Notas de Crédito | e34 | Anulación/corrección de e-CF emitido |
| Notas de Débito | e33 | Cargos adicionales |
| Compras electrónicas | e41 | e-CF recibidos de proveedores |
| Gastos menores | e43 | Comprobantes de gastos menores |
| Regímenes especiales | e44 | Facturación a zonas francas, diplomáticos, etc. |
| Gubernamental | e45 | Facturación al gobierno |
| Exportaciones | e46 | Facturación de exportación |
| Pagos al exterior | e47 | Servicios pagados al exterior |
| Futuros módulos | Cualquier e-CF | Mismo pipeline, sin cambios |

---

## 0.1 PRINCIPIO DE PROPIEDAD EXCLUSIVA

**El módulo de Facturación Electrónica es el ÚNICO dueño del ciclo de vida del documento electrónico.**

### Lo que ningún módulo comercial puede hacer

Ningún módulo del ERP (POS, Facturación, Compras, Gastos, NC, ND, ni ningún módulo futuro) podrá:

| Operación prohibida fuera de FE | Dueño exclusivo |
|--------------------------------|:---------------:|
| Reservar secuencias e-CF | Facturación Electrónica |
| Generar e-NCF | Facturación Electrónica |
| Consultar estados DGII | Facturación Electrónica |
| Reprocesar documentos | Facturación Electrónica |
| Cancelar / anular documentos electrónicos | Facturación Electrónica |
| Reenviar documentos | Facturación Electrónica |
| Consultar TrackId | Facturación Electrónica |
| Consultar QR | Facturación Electrónica |
| Consultar SecurityCode | Facturación Electrónica |
| Consultar XML / JSON | Facturación Electrónica |
| Consultar respuestas del proveedor | Facturación Electrónica |
| Escribir en `ECFEncabezado` | Facturación Electrónica |
| Escribir en `ECFHistorialEstado` | Facturación Electrónica |
| Escribir en `ECFXml` | Facturación Electrónica |
| Leer `EstadoDocumento` del e-CF | Facturación Electrónica |

### Lo que los módulos comerciales sí pueden hacer

Una única operación:

```csharp
await _facturacionElectronica.EmitirDocumentoAsync(request);
```

Ahí termina completamente su responsabilidad.

### Principio de independencia comercial

Si en el futuro cambia cualquiera de estos elementos, **NO se modifica absolutamente ningún módulo comercial**:

- Proveedor de Facturación Electrónica
- API del proveedor
- Formato XML / JSON
- Gateway Fiscal
- Reglas de la DGII
- Proceso de contingencia
- Proceso de firma digital
- Canal de comunicación (REST, SOAP, directo)
- Reglas de reenvío o retry
- Estructura de `ECFEncabezado` o tablas e-CF

**Solo cambia el módulo de Facturación Electrónica.**

### Facturación Electrónica como microdominio

Toda funcionalidad relacionada con un documento electrónico vive exclusivamente dentro de este módulo:

| Funcionalidad | Ubicación |
|--------------|:---------:|
| Emisión de e-CF | Facturación Electrónica |
| Consulta de estado DGII | Facturación Electrónica |
| Reenvío | Facturación Electrónica |
| Reproceso | Facturación Electrónica |
| Anulación | Facturación Electrónica |
| Contingencia | Facturación Electrónica |
| Descarga XML | Facturación Electrónica |
| Descarga PDF | Facturación Electrónica |
| Consulta QR | Facturación Electrónica |
| Historial de estados | Facturación Electrónica |
| Auditoría | Facturación Electrónica |
| Eventos y logs | Facturación Electrónica |
| Métricas y dashboard | Facturación Electrónica |
| Monitoreo de respuestas | Facturación Electrónica |
| Alertas (secuencias, vencimientos, rechazos) | Facturación Electrónica |
| Sincronización con DGII | Facturación Electrónica |
| Futura funcionalidad e-CF | Facturación Electrónica |

**Nunca repartidas por el ERP.** Cualquier desarrollador que entre al proyecto entiende inmediatamente que TODO lo relacionado con documentos electrónicos vive en un solo lugar.

### Contrato definitivo

```
┌─────────────────────────────────────────────────────────────────┐
│                     MÓDULOS COMERCIALES                         │
│                                                                 │
│   Solo crean documentos comerciales.                            │
│   Solo llaman EmitirDocumentoAsync().                            │
│   No conocen nada del mundo electrónico.                        │
│                                                                 │
│   POS · Facturación · NC · ND · Compras · Gastos · Exportación │
│                           │                                     │
│                           │  EmitirDocumentoAsync(request)      │
│                           ▼                                     │
│   ════════════════════════════════════════════════════           │
│   ║  FRONTERA  ║  Única puerta de entrada                ║      │
│   ════════════════════════════════════════════════════           │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│              FACTURACIÓN ELECTRÓNICA (microdominio)              │
│                                                                 │
│   Dueño exclusivo de:                                           │
│   · Secuencias e-CF                                             │
│   · Reserva de e-NCF                                            │
│   · Fotografía fiscal (via resolvers)                           │
│   · ECFEncabezado + ECFDetalle + ECFXml + ECFHistorialEstado    │
│   · Estados del documento electrónico                           │
│   · Motor Fiscal                                                │
│   · Gateway Fiscal                                              │
│   · Comunicación con proveedor                                  │
│   · Comunicación con DGII                                       │
│   · Contingencia                                                │
│   · Reproceso                                                   │
│   · Historial, auditoría, métricas, alertas                     │
│   · Toda funcionalidad e-CF presente y futura                   │
│                                                                 │
│   Internamente organizado en:                                   │
│   · IFacturacionElectronicaService (orquestador)                │
│   · ISecuenciaEcfService (secuencias)                           │
│   · IDocumentoOrigenResolverFactory + resolvers (fotografía)    │
│   · IFiscalGateway + adaptadores (transmisión)                  │
│   · Background workers (outbox, monitoreo)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Inventario del módulo actual

### 1.1 Backend — Lo que existe hoy

| # | Componente | Archivo | Función actual | Estado |
|---|-----------|---------|----------------|--------|
| 1 | `SecuenciaECF` (entidad) | `Entities/Domain/SecuenciaECF.cs` | Almacena secuencias NCF por empresa. Campos: `TipoNCF`, `Serie`, `SecuenciaActual`, `SecuenciaFinal`, `fechaVencimiento`, `stockMinimo`, `Activo` | Reutilizable con extensión |
| 2 | `SecuenciaDocumentos` (entidad) | `Entities/Domain/SecuenciaDocumentos.cs` | Numeración interna de documentos (no fiscal). Campos: `Prefijo`, `SecuenciaActual`, `IdTipoDocumento` | Se mantiene sin cambios |
| 3 | `NCF_SecuenciasServices` | `DataAccess/Servicios/NCF_SecuenciasServices.cs` | CRUD + `GenerarNCF()`: busca secuencia activa, incrementa, formatea `Serie + 8 dígitos` (longitud 11 = NCF tradicional) | **Reemplazar** |
| 4 | `ENCFSequenceServices` | `DataAccess/Servicios/SecuenciaECFServices.cs` | `GetNextENCFAsync()`: formatea `E{tipo} + 13 dígitos` (formato e-NCF correcto). Tiene `PeekNextENCFAsync` y `ResetAsync` | **Reutilizar como base** |
| 5 | `SecuenciaDocumentoService` | `DataAccess/Servicios/SecuenciaDocumentoService.cs` | Genera `NumeroDocumento` interno (no fiscal) | Se mantiene sin cambios |
| 6 | `INCF_Secuencias` (interfaz) | `Entities/Interfaces/INCF_Secuencias.cs` | CRUD + `GenerarNCF(idEmpresa, tipoNCF)` | **Reemplazar** |
| 7 | `IENCFSequence` (interfaz) | `Entities/Interfaces/IENCFSequence.cs` | `GetNextENCFAsync`, `PeekNextENCFAsync`, `ResetAsync` | **Reutilizar y extender** |
| 8 | `NCF_SecuenciasController` | `Controllers/NCF_SecuenciasController.cs` | REST CRUD para `SecuenciaECF` + `POST Generar` | **Reemplazar** |
| 9 | `ECFEncabezado` (entidad) | `Entities/Domain/ECFEncabezado.cs` | Almacena e-CF enviados: `TipoECF`, `ENCF`, `TrackId`, `EstadoDGII`, montos, respuesta DGII | Reutilizable con extensión |
| 10 | `ECFDetalle` (entidad) | `Entities/Domain/ECFDetalle.cs` | Líneas del e-CF | Se mantiene |
| 11 | `ECFXml` (entidad) | `Entities/Domain/ECFXml.cs` | XML/JSON enviado y respuesta | Se mantiene |
| 12 | `ECFHistorialEstado` (entidad) | `Entities/Domain/ECFHistorialEstado.cs` | Historial de estados del e-CF | Se mantiene |
| 13 | `CertificadoDigital` (entidad) | `Entities/Domain/CertificadoDigital.cs` | Certificados P12 por empresa | Se mantiene |
| 14 | `DgiiConfiguracionEmpresa` | `Entities/Domain/DgiiConfiguracionEmpresa.cs` | Flags fiscales por empresa | Extender |
| 15 | DI en `Program.cs` | `INCF_Secuencias → NCF_SecuenciasServices` registrado. `IENCFSequence` **NO registrado** (código muerto) | Reorganizar |

### 1.2 Frontend — Lo que existe hoy

| # | Componente | Archivo | Función actual | Estado |
|---|-----------|---------|----------------|--------|
| 1 | `NcfSecuenciasComponent` | `src/app/ncf-secuencias/` | CRUD de secuencias NCF. Tipos hardcodeados: B01, B02, B03, B04, B14, B15, FACT | **Reemplazar** |
| 2 | `NcfSecuenciasService` | `src/app/servicios/ncf-secuencias.service.ts` | Consume `api/NCF_Secuencias` | **Reemplazar** |
| 3 | `NCF_Secuencia` (modelo) | `src/app/models/NCF_Secuencia.models.ts` | Mirror de `SecuenciaECF` | **Reemplazar** |
| 4 | POS — selector comprobante | `src/app/Pos/pos/pos.component.html` líneas 540-584 | `ion-select` hardcodeado: FACT, Consumidor Final, Crédito Fiscal, Gubernamental | **Rediseñar** |
| 5 | POS — `tipoComprobante` | `src/app/Pos/pos/pos.component.ts` | Union type `"FACT" \| "Crédito Fiscal" \| ...`. Enviado como string al API | **Rediseñar** |
| 6 | POS — `onTipoComprobanteChange()` | `pos.component.ts` líneas 1030-1065 | Controla ITBIS y campos RNC según tipo seleccionado | **Extender** |
| 7 | `DgiiConfigService` | `src/app/servicios/dgii-config.service.ts` | Consume `api/DgiiConfig` | Reutilizable |
| 8 | Menú — `NCF_SECUENCIAS` | `src/app/config/menu-grupos.config.ts` | Dentro del grupo "Configuración" | **Renombrar y mover** |
| 9 | Menú — `CONFIGURACION_DGII` | `menu-grupos.config.ts` | Código de menú existe, pero **no tiene componente ni ruta** | **Implementar** |
| 10 | Ruta `/ncfsecuencias` | `app-routing.module.ts` | Lazy load de `NcfSecuenciasModule` | **Renombrar** |

---

## 2. Decisiones: Reutilizar / Eliminar / Extender

### 2.1 REUTILIZAR (conservar tal cual)

| Componente | Razón |
|-----------|-------|
| `SecuenciaDocumentos` + `SecuenciaDocumentoService` | Numeración interna, independiente de lo fiscal |
| `ECFEncabezado` + `ECFDetalle` + `ECFXml` + `ECFHistorialEstado` | Persistencia de e-CF ya bien diseñada |
| `CertificadoDigital` | Para canal directo DGII (futuro) |
| `DgiiConfiguracionEmpresa` + `DgiiConfiguracionAuditoria` | Flags y auditoría fiscal |
| `FiscalFeatureService` + caché | Evaluador centralizado de flags |
| `DgiiConfigService` + `DgiiFiscalAuthService` | CRUD config + autorización |
| Outbox completo (entidad + processor + worker) | Pipeline asíncrono probado |
| `FiscalDocumentSnapshotService` | Motor de fotografía fiscal |
| `DgiiConfigService` (frontend) | Consume API de config |
| `ParametrosService` (fiscal features) | Almacén de flags en frontend |

### 2.2 EXTENDER (agregar campos/métodos)

| Componente | Extensión necesaria |
|-----------|-------------------|
| `SecuenciaECF` (entidad) | Agregar campos: `Ambiente`, `SecuenciaInicial`, `Descripcion`, `TipoEcfDgii` (int). Renombrar `TipoNCF` → mantener por compatibilidad DB pero agregar `TipoEcfDgii` |
| `ECFEncabezado` (entidad) | Agregar: `SecurityCode`, `UrlQR`, `FechaFirma`, `IdNotaCreditoInterna`, `NumeroFacturaInterna` |
| `DgiiConfiguracionEmpresa` | Agregar: `ProveedorFiscalActivo`, `AmbienteECF` |
| `IENCFSequence` (interfaz) | Agregar: `GetAllAsync`, `GetByIdAsync`, CRUD, validaciones de concurrencia |
| `ENCFSequenceServices` | Agregar CRUD completo, reserva atómica con SQL directo, validación de vencimiento y stock |
| POS `onTipoComprobanteChange()` | Cargar tipos dinámicamente desde secuencias activas de la empresa |

### 2.3 ELIMINAR / DEPRECAR

| Componente | Razón | Acción |
|-----------|-------|--------|
| `NCF_SecuenciasServices` | Genera NCF tradicional (11 chars, formato B01XXXXXXXX). Incompatible con e-CF | Deprecar: marcar `[Obsolete]`, no eliminar hasta migración completa |
| `INCF_Secuencias` (interfaz) | Acoplada a NCF tradicional | Deprecar |
| `NCF_SecuenciasController` | Expone CRUD legacy | Reemplazar por `FacturacionElectronicaController` |
| `NcfSecuenciasComponent` (frontend) | UI legacy con tipos hardcodeados | Reemplazar por nueva pantalla de Facturación Electrónica |
| `NcfSecuenciasService` (frontend) | Consume API legacy | Reemplazar |
| `NCF_Secuencia` (modelo frontend) | Modelo legacy | Reemplazar por `SecuenciaEcf` con nuevos campos |
| DTOs en `Dto/Invoice/` | Acoplados al formato del proveedor original (ver Gateway) | Deprecar cuando `Dto/Fiscal/` esté listo |

---

## 3. Nuevos servicios necesarios

### 3.1 Servicio transversal: `IFacturacionElectronicaService`

Este es el **único punto de contacto** entre cualquier módulo comercial y el pipeline de facturación electrónica. Ningún módulo llama directamente a secuencias, Gateway, Motor Fiscal ni estados.

```csharp
public interface IFacturacionElectronicaService
{
    /// <summary>
    /// Punto de entrada único para todos los módulos del ERP.
    /// Reserva e-NCF, congela fotografía fiscal, crea ECFEncabezado,
    /// y encola el envío asíncrono al Gateway.
    /// Retorna inmediatamente sin esperar respuesta de DGII.
    /// </summary>
    Task<EmisionEcfResultado> EmitirDocumentoAsync(EmisionEcfRequest request);

    /// <summary>
    /// Consulta el estado DGII de un documento previamente emitido.
    /// Solo para pantallas de monitoreo, nunca para flujo comercial.
    /// </summary>
    Task<EstadoEcfDto?> ConsultarEstadoAsync(int idEcf);

    /// <summary>
    /// Retorna las secuencias e-CF disponibles para un empresa.
    /// Para poblar selectores en POS, Facturación, NC, etc.
    /// </summary>
    Task<IReadOnlyList<SecuenciaEcfDisponibleDto>> ObtenerSecuenciasDisponiblesAsync(int idEmpresa);
}
```

### 3.2 Request y resultado de emisión

```csharp
public class EmisionEcfRequest
{
    public int IdEmpresa { get; set; }
    public int TipoEcfDgii { get; set; }             // 31, 32, 33, 34, 41, 43, 44, 45, 46, 47
    public OrigenDocumento OrigenDocumento { get; set; } // Enum: Pos, NotaCredito, Compra, etc.
    public int IdOrigen { get; set; }                 // PK del documento en su tabla de origen
    public int IdUsuario { get; set; }
}

public class EmisionEcfResultado
{
    public bool Exitoso { get; set; }
    public string? Encf { get; set; }                // "E310000000000101"
    public int? IdEcf { get; set; }                  // PK del ECFEncabezado creado
    public string? MensajeError { get; set; }
    public int SecuenciasRestantes { get; set; }     // Para alertas de stock
}
```

### Enum de origen

```csharp
public enum OrigenDocumento
{
    Pos = 1,
    Facturacion = 2,
    NotaCredito = 3,
    NotaDebito = 4,
    Compra = 5,
    Gasto = 6,
    Exportacion = 7,
    Nomina = 8
    // Agregar nuevos valores sin modificar código existente
}
```

Se persiste como `int` en la base de datos. El código interno siempre trabaja con el enum, eliminando errores por strings.

### 3.3 Cómo lo usan los módulos (todos igual)

```csharp
// POS
var resultado = await _facturacionElectronica.EmitirDocumentoAsync(new EmisionEcfRequest
{
    IdEmpresa = header.IdEmpresa,
    TipoEcfDgii = dto.TipoEcfDgii!.Value,
    OrigenDocumento = OrigenDocumento.Pos,
    IdOrigen = header.IdFacturaHeader,
    IdUsuario = dto.IdUsuario ?? 0
});
header.NCF = resultado.Encf;

// Notas de Crédito — exactamente igual
var resultado = await _facturacionElectronica.EmitirDocumentoAsync(new EmisionEcfRequest
{
    IdEmpresa = nc.IdEmpresa,
    TipoEcfDgii = 34,
    OrigenDocumento = OrigenDocumento.NotaCredito,
    IdOrigen = nc.IdNotaCredito,
    IdUsuario = idUsuario
});
nc.NCF = resultado.Encf;

// Compras electrónicas — exactamente igual
var resultado = await _facturacionElectronica.EmitirDocumentoAsync(new EmisionEcfRequest
{
    IdEmpresa = compra.IdEmpresa,
    TipoEcfDgii = 41,
    OrigenDocumento = OrigenDocumento.Compra,
    IdOrigen = compra.IdOrdenCompra,
    IdUsuario = idUsuario
});
compra.NCF = resultado.Encf;

// Gastos — exactamente igual
var resultado = await _facturacionElectronica.EmitirDocumentoAsync(new EmisionEcfRequest
{
    IdEmpresa = gasto.IdEmpresa,
    TipoEcfDgii = 43,
    OrigenDocumento = OrigenDocumento.Gasto,
    IdOrigen = gasto.IdGasto,
    IdUsuario = idUsuario
});
gasto.NCF = resultado.Encf;

// Futuro módulo (Exportaciones) — solo agregar valor al enum + resolver
var resultado = await _facturacionElectronica.EmitirDocumentoAsync(new EmisionEcfRequest
{
    IdEmpresa = exp.IdEmpresa,
    TipoEcfDgii = 46,
    OrigenDocumento = OrigenDocumento.Exportacion,
    IdOrigen = exp.IdExportacion,
    IdUsuario = idUsuario
});
```

**Todos los módulos ejecutan la misma línea.** Solo cambian `OrigenDocumento` (enum) y `IdOrigen`. No saben qué pasa después. No conocen resolvers, fotografía, secuencias, Gateway, proveedor, DGII ni estados.

### 3.4 Qué hace internamente `EmitirDocumentoAsync`

```
EmitirDocumentoAsync(request):
    1. Validar que la empresa tenga FacturacionElectronicaActiva
    2. SecuenciaEcfService.ReservarSiguienteAsync(idEmpresa, tipoEcfDgii)
       → Reserva atómica SQL, retorna e-NCF
    3. Crear ECFEncabezado:
       → OrigenDocumento = request.OrigenDocumento  ("POS", "NOTA_CREDITO", etc.)
       → IdOrigen = request.IdOrigen                (PK del documento comercial)
       → EstadoDocumento = BORRADOR
    4. FiscalWorkEnqueueService.EnqueueFotografiaSiActivoAsync(...)
       → Encola fotografía fiscal + envío al Gateway
    5. Retornar EmisionEcfResultado { Exitoso = true, Encf = "E31..." }

    (asíncrono, via outbox worker — el módulo que llamó ya recibió respuesta)
    6. FiscalDocumentSnapshotService → congelar fotografía
       → Usa OrigenDocumento para saber qué tabla leer (FacturaHeaders, NotasCredito, etc.)
    7. Transicionar EstadoDocumento → PENDIENTE_ENVIO
    8. Construir FiscalDocumentoElectronico
    9. IFiscalGateway.EnviarDocumentoAsync(documento)
   10. Gateway traduce → proveedor → DGII
   11. Actualizar ECFEncabezado.EstadoDocumento (ENVIADO / ACEPTADO / RECHAZADO / ERROR)
   12. Persistir ECFHistorialEstado
```

**En el paso 6, el servicio NO usa switch. Delega al resolver correcto via la factory:**

```csharp
var resolver = _resolverFactory.Get(origenDocumento);
var docInfo = await resolver.ObtenerDocumentoAsync(idOrigen, idEmpresa);
var foto = await resolver.CrearFotografiaAsync(docInfo);
```

Agregar un nuevo origen en el futuro = crear un nuevo resolver + registrarlo en DI. `FacturacionElectronicaService` **no se modifica**.

### 3.5 Lista completa de servicios nuevos

| # | Servicio | Proyecto | Responsabilidad |
|---|---------|----------|-----------------|
| 1 | `IFacturacionElectronicaService` | `Entities/Interfaces/` | Punto de entrada transversal para todos los módulos del ERP |
| 2 | `FacturacionElectronicaService` | `DataAccess/Servicios/` | Implementación del orquestador transversal |
| 3 | `ISecuenciaEcfService` | `Entities/Interfaces/` | CRUD de secuencias e-CF + reserva atómica + validaciones |
| 4 | `SecuenciaEcfService` | `DataAccess/Servicios/` | Implementación con SQL directo para reserva concurrente segura |
| 5 | `FacturacionElectronicaController` | `Controllers/` | REST API del módulo (secuencias, config, historial, monitoreo) |

### 3.2 Frontend — Nuevos componentes

| # | Componente | Ruta | Función |
|---|-----------|------|---------|
| 1 | `FacturacionElectronicaModule` | `/facturacion-electronica` | Módulo lazy-loaded con sub-rutas |
| 2 | `ConfiguracionFEComponent` | `/facturacion-electronica/configuracion` | Configuración integral: ambiente, credenciales, empresa, RNC, tipo contribuyente |
| 3 | `SecuenciasEcfComponent` | `/facturacion-electronica/secuencias` | CRUD de secuencias e-CF con tipos DGII dinámicos |
| 4 | `CertificadoDigitalComponent` | `/facturacion-electronica/certificado` | Gestión de certificados P12 |
| 5 | `EstadoDgiiComponent` | `/facturacion-electronica/estado` | Dashboard de conexión DGII y salud del Gateway |
| 6 | `HistorialEnviosComponent` | `/facturacion-electronica/historial` | Tabla de `ECFEncabezado` con filtros por estado/fecha/tipo |
| 7 | `ReprocesarComponent` | `/facturacion-electronica/reprocesar` | Documentos en error fiscal, reproceso individual/masivo |
| 8 | `MonitoreoRespuestasComponent` | `/facturacion-electronica/monitoreo` | e-CF pendientes de respuesta DGII, polling de estado |

---

## 4. Cambios en la Base de Datos

### 4.1 Extensión de `SecuenciasECF`

```sql
ALTER TABLE SecuenciasECF ADD
    Descripcion         NVARCHAR(100)   NULL,
    TipoEcfDgii         INT             NULL,
    SecuenciaInicial     INT             NOT NULL DEFAULT 1,
    Ambiente             VARCHAR(20)     NOT NULL DEFAULT 'PRUEBAS',
    FechaAutorizacion    DATETIME        NULL,
    NumeroResolucion     NVARCHAR(50)    NULL;
```

**Mapeo de `TipoEcfDgii` a `TipoNCF` (serie):**

| TipoEcfDgii | TipoNCF (legacy) | Serie e-CF | Descripción |
|:---:|:---:|:---:|---|
| 31 | B01 → e31 | E31 | Factura de Crédito Fiscal Electrónica |
| 32 | B02 → e32 | E32 | Factura de Consumo Electrónica |
| 33 | e33 | E33 | Nota de Débito Electrónica |
| 34 | B04 → e34 | E34 | Nota de Crédito Electrónica |
| 41 | e41 | E41 | Compras Electrónica |
| 43 | e43 | E43 | Gastos Menores Electrónica |
| 44 | e44 | E44 | Regímenes Especiales Electrónica |
| 45 | B15 → e45 | E45 | Gubernamental Electrónica |
| 46 | e46 | E46 | Comprobante de Exportación Electrónico |
| 47 | e47 | E47 | Comprobante para Pagos al Exterior Electrónico |

### 4.2 Extensión de `ECFEncabezado`

```sql
ALTER TABLE ECFEncabezado ADD
    -- Origen genérico (reemplaza IdFacturaInterna)
    OrigenDocumento         INT             NOT NULL DEFAULT 1,   -- enum: 1=Pos, 2=Facturacion, ...
    IdOrigen                INT             NOT NULL DEFAULT 0,

    -- Respuesta DGII
    SecurityCode            NVARCHAR(20)    NULL,
    UrlQR                   NVARCHAR(500)   NULL,
    FechaFirma              DATETIME        NULL,

    -- Referencia interna
    NumeroFacturaInterna    NVARCHAR(50)    NULL,

    -- Estado del documento electrónico
    EstadoDocumento         VARCHAR(30)     NOT NULL DEFAULT 'BORRADOR';

-- Índice para localizar el e-CF desde cualquier módulo
CREATE INDEX IX_ECFEncabezado_Origen
    ON ECFEncabezado (OrigenDocumento, IdOrigen);

-- Migrar datos existentes: IdFacturaInterna → IdOrigen
UPDATE ECFEncabezado
SET OrigenDocumento = 1,   -- OrigenDocumento.Pos
    IdOrigen = ISNULL(IdFacturaInterna, 0)
WHERE IdOrigen = 0;
```

**`IdFacturaInterna` se depreca.** No se elimina inmediatamente (compatibilidad), pero todo código nuevo usa `OrigenDocumento` (int/enum) + `IdOrigen`.

### 4.3 Extensión de `DgiiConfiguracionEmpresa`

```sql
ALTER TABLE DgiiConfiguracionEmpresa ADD
    ProveedorFiscalActivo   VARCHAR(50)     NULL DEFAULT 'PgEInvoicing',
    AmbienteECF             VARCHAR(20)     NULL DEFAULT 'PRUEBAS';
```

### 4.4 Nuevo: Índice de concurrencia para reserva de secuencias

```sql
CREATE INDEX IX_SecuenciasECF_Reserva
    ON SecuenciasECF (IdEmpresa, TipoNCF, Activo)
    INCLUDE (SecuenciaActual, SecuenciaFinal);
```

---

## 5. Diseño del servicio de reserva de secuencias (concurrencia segura)

### 5.1 Problema

Dos cajas (POS A y POS B) facturan simultáneamente con tipo e31. Ambas leen `SecuenciaActual = 100`. Ambas generan `E310000000000100`. Duplicado.

### 5.2 Solución: Reserva atómica con SQL directo

```csharp
public interface ISecuenciaEcfService
{
    // CRUD
    Task<IEnumerable<SecuenciaEcfDto>> GetAllAsync(int idEmpresa);
    Task<SecuenciaEcfDto> GetByIdAsync(int id);
    Task<SecuenciaEcfDto> CreateAsync(SecuenciaEcfCreateDto dto);
    Task UpdateAsync(int id, SecuenciaEcfUpdateDto dto);
    Task DesactivarAsync(int id);

    // Reserva atómica (para el Motor Fiscal / POS)
    Task<ReservaEcfResultado> ReservarSiguienteAsync(int idEmpresa, int tipoEcfDgii);

    // Consulta sin reservar (para preview en UI)
    Task<string?> PeekSiguienteAsync(int idEmpresa, int tipoEcfDgii);

    // Validaciones
    Task<SecuenciaAlertaDto> ValidarDisponibilidadAsync(int idEmpresa, int tipoEcfDgii);
}
```

### 5.3 SQL de reserva atómica

```sql
UPDATE TOP(1) SecuenciasECF
SET SecuenciaActual = SecuenciaActual + 1
OUTPUT
    INSERTED.Serie,
    INSERTED.SecuenciaActual AS NumeroReservado,
    INSERTED.SecuenciaFinal
WHERE
    IdEmpresa = @IdEmpresa
    AND TipoNCF = @TipoEcf
    AND Activo = 1
    AND SecuenciaActual < SecuenciaFinal
    AND (fechaVencimiento IS NULL OR fechaVencimiento > GETDATE());
```

Esta operación es **atómica a nivel de SQL Server**. No importa cuántas cajas ejecuten simultáneamente: cada una obtiene un número diferente sin necesidad de transacciones explícitas ni locks aplicativos.

### 5.4 Resultado de la reserva

```csharp
public class ReservaEcfResultado
{
    public bool Exitoso { get; set; }
    public string? Encf { get; set; }          // "E310000000000101"
    public int? NumeroReservado { get; set; }   // 101
    public int? SecuenciaFinal { get; set; }    // Para alertar disponibilidad
    public string? MensajeError { get; set; }   // Si no hay secuencia disponible
    public int SecuenciasRestantes => (SecuenciaFinal ?? 0) - (NumeroReservado ?? 0);
}
```

---

## 6. Flujo completo del POS (nuevo diseño)

### 6.1 Regla fundamental: FACT vs e-CF

| Selección | Significado | Secuencia e-CF | Fotografía fiscal | Gateway Fiscal | Proveedor / DGII |
|-----------|------------|:--------------:|:-----------------:|:--------------:|:----------------:|
| **FACT** | Venta comercial sin comprobante fiscal | NO | Solo si `FiscalActivo` (para reportes internos) | NO | NO |
| **e31** | Factura de Crédito Fiscal Electrónica | SI | SI | SI | SI |
| **e32** | Factura de Consumo Electrónica | SI | SI | SI | SI |
| **e45** | Gubernamental Electrónica | SI | SI | SI | SI |
| **Cualquier e-CF** | Documento fiscal electrónico | SI | SI | SI | SI |

**FACT no es un tipo e-CF.** FACT es la ausencia de comprobante fiscal. El cliente no solicitó comprobante. La venta comercial se procesa exactamente como hoy.

**Toda la lógica de secuencias, Gateway y comunicación con DGII solo aplica cuando `tipoEcfDgii != null`.**

### 6.2 Selector del POS

```
┌──────────────────────────────────────┐
│  Tipo de documento                   │
│                                      │
│  ○ FACT (Sin comprobante fiscal)     │  ← Default
│  ─────────────────────────────────── │
│  ○ e31 — Crédito Fiscal             │  ← Requiere RNC
│  ○ e32 — Factura de Consumo         │
│  ○ e45 — Gubernamental              │  ← Requiere RNC
│  ○ e44 — Regímenes Especiales       │  ← Requiere RNC
│  ○ ...demás tipos activos           │
└──────────────────────────────────────┘
```

FACT siempre aparece primero y es el default. Debajo, separados visualmente, aparecen los tipos e-CF cargados dinámicamente desde las secuencias activas de la empresa.

### 6.3 Flujo A — FACT (sin comprobante fiscal)

```
CAJERO                           FRONTEND (POS)                    API
  │                                   │                              │
  │  1. Selecciona FACT (default)     │                              │
  │──────────────────────────────────>│                              │
  │                                   │                              │
  │  2. Completa venta                │                              │
  │──────────────────────────────────>│                              │
  │                                   │                              │
  │  3. Presiona "Facturar"           │                              │
  │──────────────────────────────────>│                              │
  │                                   │  4. POST /api/FacturaHeader  │
  │                                   │  {tipoEcfDgii: null, ...}   │
  │                                   │─────────────────────────────>│
  │                                   │                              │
  │                                   │                              │  5. NO reserva secuencia
  │                                   │                              │  6. Guardar factura (NCF = "")
  │                                   │                              │  7. Generar NumeroDocumento interno
  │                                   │                              │  8. NO encola al Gateway
  │                                   │                              │
  │                                   │  RESPUESTA INMEDIATA         │
  │                                   │<─────────────────────────────│
  │  FACTURA IMPRESA / TICKET         │
  │<──────────────────────────────────│
```

**Sin secuencia. Sin Gateway. Sin proveedor. Sin DGII. Venta comercial pura.**

### 6.4 Flujo B — Tipo e-CF (comprobante electrónico)

```
CAJERO                           FRONTEND (POS)                    API                              MOTOR FISCAL                     GATEWAY FISCAL                  PROVEEDOR
  │                                   │                              │                                  │                                │                              │
  │  1. Selecciona e31                │                              │                                  │                                │                              │
  │──────────────────────────────────>│                              │                                  │                                │                              │
  │                                   │                              │                                  │                                │                              │
  │  2. Ingresa RNC + datos fiscales  │                              │                                  │                                │                              │
  │──────────────────────────────────>│                              │                                  │                                │                              │
  │                                   │                              │                                  │                                │                              │
  │  3. Presiona "Facturar"           │                              │                                  │                                │                              │
  │──────────────────────────────────>│                              │                                  │                                │                              │
  │                                   │  4. POST /api/FacturaHeader  │                                  │                                │                              │
  │                                   │  {tipoEcfDgii: 31, ...}     │                                  │                                │                              │
  │                                   │─────────────────────────────>│                                  │                                │                              │
  │                                   │                              │  5. ReservarSiguienteAsync(      │                                │                              │
  │                                   │                              │     idEmpresa, 31)               │                                │                              │
  │                                   │                              │  → "E310000000000101"            │                                │                              │
  │                                   │                              │                                  │                                │                              │
  │                                   │                              │  6. Guardar factura con          │                                │                              │
  │                                   │                              │     NCF = "E310000000000101"     │                                │                              │
  │                                   │                              │                                  │                                │                              │
  │                                   │                              │  7. Encolar fotografía + envío   │                                │                              │
  │                                   │                              │─────────────────────────────────>│                                │                              │
  │                                   │                              │                                  │  8. Congelar foto fiscal        │                              │
  │                                   │  RESPUESTA INMEDIATA         │                                  │                                │                              │
  │                                   │<─────────────────────────────│                                  │                                │                              │
  │  FACTURA IMPRESA / TICKET         │                              │                                  │                                │                              │
  │<──────────────────────────────────│                              │                                  │                                │                              │
  │                                   │                              │                                  │                                │                              │
  │                                   │                              │                                  │  9. Construir                  │                              │
  │                                   │                              │                                  │  FiscalDocumentoElectronico    │                              │
  │                                   │                              │                                  │                                │                              │
  │                                   │                              │                                  │  10. EnviarDocumentoAsync()    │                              │
  │                                   │                              │                                  │───────────────────────────────>│                              │
  │                                   │                              │                                  │                                │  11. Mapear + POST al         │
  │                                   │                              │                                  │                                │  proveedor                    │
  │                                   │                              │                                  │                                │─────────────────────────────>│
  │                                   │                              │                                  │                                │                              │  12. → DGII
  │                                   │                              │                                  │                                │  13. Respuesta                │
  │                                   │                              │                                  │                                │<─────────────────────────────│
  │                                   │                              │                                  │  14. FiscalEnvioResultado      │                              │
  │                                   │                              │                                  │<───────────────────────────────│                              │
  │                                   │                              │                                  │                                │                              │
  │                                   │                              │                                  │  15. Actualizar                │                              │
  │                                   │                              │                                  │  ECFEncabezado.EstadoDGII      │                              │
  │                                   │                              │                                  │  + HistorialEstado             │                              │
```

**Puntos clave del Flujo B (e-CF):**
- El POS recibe respuesta **inmediatamente** después de paso 6 (guardar factura + encolar).
- Los pasos 8-15 ocurren **asincrónicamente** via el outbox worker.
- El POS **nunca** espera la respuesta de DGII.
- El POS **nunca** conoce al proveedor.

### 6.5 Lógica del Controller (cualquier módulo)

```
SI tipoEcfDgii == null (FACT):
    → NCF = ""
    → NumeroDocumento = SecuenciaDocumentoService.GenerarDocumentoAsync()
    → Guardar documento comercial
    → FIN (sin pipeline fiscal-electrónico)

SI tipoEcfDgii != null (e31, e32, e33, e34, e41, e43, e44, e45, e46, e47, ...):
    → NumeroDocumento = SecuenciaDocumentoService.GenerarDocumentoAsync()
    → Guardar documento comercial
    → var resultado = await _facturacionElectronica.EmitirDocumentoAsync(new EmisionEcfRequest {
          IdEmpresa, TipoEcfDgii,
          OrigenDocumento = OrigenDocumento.Pos | .NotaCredito | .Compra | ...,
          IdOrigen = documento.PK,
          IdUsuario
      })
    → documento.NCF = resultado.Encf
    → FIN (el módulo ya terminó, el resto es asíncrono)
```

**Esta lógica es idéntica en POS, Facturación, Notas de Crédito, Compras, Gastos y cualquier módulo futuro.** Solo cambia `OrigenDocumento` y `IdOrigen`.

El módulo comercial no conoce secuencias, fotografía fiscal, Gateway, proveedor ni DGII. Solo conoce `IFacturacionElectronicaService.EmitirDocumentoAsync()`.

---

## 7. Estados del documento electrónico

```
BORRADOR ──────> PENDIENTE_ENVIO ──────> ENVIADO ──────> ACEPTADO
                       │                    │                │
                       │                    │                └──> (fin exitoso)
                       │                    │
                       │                    └──────> RECHAZADO
                       │                                │
                       │                                └──> (requiere corrección)
                       │
                       └──────> ERROR
                                  │
                                  └──> (retry automático o manual)

                                        ANULADO (desde cualquier estado post-envío)

                                        CONTINGENCIA (cuando el proveedor no responde)
```

| Estado | Significado | Quién lo asigna |
|--------|------------|-----------------|
| `BORRADOR` | e-NCF reservado, factura guardada, fotografía aún no completa | POS / Controller |
| `PENDIENTE_ENVIO` | Fotografía congelada, documento listo para enviar al Gateway | Motor Fiscal |
| `ENVIADO` | El Gateway envió al proveedor, esperando respuesta DGII | Gateway |
| `ACEPTADO` | DGII aceptó el e-CF | Gateway (consulta estado) |
| `RECHAZADO` | DGII rechazó el e-CF (con código y motivo) | Gateway (consulta estado) |
| `ERROR` | Error técnico (red, timeout, credenciales) | Gateway / Motor |
| `ANULADO` | e-CF anulado via NC electrónica | Motor Fiscal |
| `CONTINGENCIA` | Emitido en modo contingencia (sin conexión) | Motor Fiscal |

Estos estados se guardan en `ECFEncabezado.EstadoDocumento` (nuevo campo) y en `ECFHistorialEstado` (cada transición).

**No afectan el flujo comercial.** La factura comercial ya fue emitida y es válida. Estos estados solo controlan el ciclo de vida del documento electrónico.

---

## 8. Cambios en la API

### 8.1 Nuevo controller: `FacturacionElectronicaController`

```
api/FacturacionElectronica/

  SECUENCIAS
  ──────────
  GET    /{idEmpresa}/secuencias                     → Lista todas las secuencias e-CF
  GET    /{idEmpresa}/secuencias/{id}                → Detalle de una secuencia
  POST   /{idEmpresa}/secuencias                     → Crear nueva secuencia e-CF
  PUT    /{idEmpresa}/secuencias/{id}                → Actualizar secuencia
  DELETE /{idEmpresa}/secuencias/{id}                → Desactivar secuencia
  GET    /{idEmpresa}/secuencias/disponibilidad      → Alertas de stock/vencimiento
  GET    /{idEmpresa}/secuencias/tipos               → Tipos e-CF disponibles (catálogo DGII)

  HISTORIAL DE ENVÍOS
  ───────────────────
  GET    /{idEmpresa}/historial                      → Historial de e-CF enviados (paginado)
  GET    /{idEmpresa}/historial/{idEcf}              → Detalle de un e-CF con historial de estados

  MONITOREO
  ─────────
  GET    /{idEmpresa}/monitoreo/pendientes           → e-CF pendientes de respuesta
  POST   /{idEmpresa}/monitoreo/consultar/{idEcf}    → Forzar consulta de estado al Gateway
  GET    /{idEmpresa}/monitoreo/resumen              → Dashboard: aceptados/rechazados/pendientes hoy

  REPROCESO
  ─────────
  GET    /{idEmpresa}/reprocesar/errores             → Documentos con error fiscal
  POST   /{idEmpresa}/reprocesar/{idEcf}             → Reprocesar un e-CF específico
  POST   /{idEmpresa}/reprocesar/masivo              → Reprocesar todos los errores

  CONFIGURACIÓN (complementa DgiiConfigController existente)
  ──────────────
  GET    /{idEmpresa}/estado-conexion                → Health check del Gateway Fiscal
```

### 8.2 Cambios en módulos que emiten documentos fiscales

Todos los controllers siguen el mismo patrón: guardar documento comercial → si es e-CF, llamar `IFacturacionElectronicaService.EmitirDocumentoAsync()`.

| Controller | Cambio | Detalle |
|-----------|--------|---------|
| `FacturaHeaderController` | Inyectar `IFacturacionElectronicaService` | Reemplazar `_INCF_Secuencias.GenerarNCF()` por `_fe.EmitirDocumentoAsync()` |
| `FacturaHeaderController` | `dto.Header.TipoComprobante` → `TipoEcfDgii` | `string` ("B01") → `int?` (`31` = e-CF, `null` = FACT) |
| `NotasCreditoServices` | Inyectar `IFacturacionElectronicaService` | Reemplazar `GenerarNcfNotaCreditoAsync()` por `_fe.EmitirDocumentoAsync()` con tipo 34 |
| `ComprasService` | Inyectar `IFacturacionElectronicaService` | Para compras electrónicas (e41) cuando se implemente |
| `BizcochoEncargoServices` | Inyectar `IFacturacionElectronicaService` | Reemplazar `_ncfSecuencias.GenerarNCF()` por `_fe.EmitirDocumentoAsync()` |
| Futuros módulos | Inyectar `IFacturacionElectronicaService` | Mismo patrón, sin conocer nada del pipeline |

**Patrón universal en cualquier controller/service:**

```csharp
// 1. Guardar documento comercial (la operación comercial SIEMPRE se completa primero)
await _repository.Save(documento);

// 2. Si el usuario seleccionó un tipo e-CF → emitir documento electrónico
if (dto.TipoEcfDgii.HasValue)
{
    var resultado = await _facturacionElectronica.EmitirDocumentoAsync(new EmisionEcfRequest
    {
        IdEmpresa = documento.IdEmpresa,
        TipoEcfDgii = dto.TipoEcfDgii.Value,
        OrigenDocumento = OrigenDocumento.Pos,  // cada módulo indica su origen (enum)
        IdOrigen = documento.Id,                // PK del documento recién guardado
        IdUsuario = idUsuario
    });
    documento.NCF = resultado.Encf;
}
// Si FACT (null) → no hace nada. Venta comercial pura.
```

### 8.3 Controller legacy `NCF_SecuenciasController`

Mantener temporalmente para compatibilidad. Marcar como `[Obsolete]`. Redirigir gradualmente al nuevo controller.

---

## 9. Cambios en el Frontend

### 9.1 Nuevo módulo: `FacturacionElectronicaModule`

```
src/app/facturacion-electronica/
    facturacion-electronica.module.ts          ← Módulo con sub-rutas
    facturacion-electronica-routing.module.ts
    configuracion/
        configuracion-fe.component.ts
        configuracion-fe.component.html
        configuracion-fe.component.scss
    secuencias/
        secuencias-ecf.component.ts
        secuencias-ecf.component.html
        secuencias-ecf.component.scss
    certificado/
        certificado-digital.component.ts
        certificado-digital.component.html
        certificado-digital.component.scss
    estado-dgii/
        estado-dgii.component.ts
        estado-dgii.component.html
        estado-dgii.component.scss
    historial/
        historial-envios.component.ts
        historial-envios.component.html
        historial-envios.component.scss
    reprocesar/
        reprocesar-documentos.component.ts
        reprocesar-documentos.component.html
        reprocesar-documentos.component.scss
    monitoreo/
        monitoreo-respuestas.component.ts
        monitoreo-respuestas.component.html
        monitoreo-respuestas.component.scss
```

### 9.2 Nuevo servicio: `FacturacionElectronicaService`

```typescript
// src/app/servicios/facturacion-electronica.service.ts
// Consume: api/FacturacionElectronica/{idEmpresa}/...
// Métodos: getSecuencias, createSecuencia, getHistorial, getPendientes, reprocesar, etc.
```

### 9.3 Cambios en el POS

#### Selector de tipo de documento (FACT + e-CF dinámicos)

**Antes:**
```html
<ion-select [(ngModel)]="tipoComprobante">
  <ion-select-option value="FACT">FACT</ion-select-option>
  <ion-select-option value="Consumidor Final">Consumidor Final</ion-select-option>
  <ion-select-option value="Crédito Fiscal">Crédito Fiscal</ion-select-option>
  <ion-select-option value="Gubernamental">Gubernamental</ion-select-option>
</ion-select>
```

**Después:**
```html
<ion-select [(ngModel)]="tipoEcfSeleccionado" (ionChange)="onTipoEcfChange()">

  <!-- FACT: siempre presente, siempre primero, es el default -->
  <ion-select-option [value]="null">
    FACT (Sin comprobante fiscal)
  </ion-select-option>

  <!-- Separador visual -->
  <ion-select-option disabled>───────────────────</ion-select-option>

  <!-- Tipos e-CF: cargados dinámicamente desde secuencias activas -->
  <ion-select-option
    *ngFor="let seq of secuenciasDisponibles"
    [value]="seq.tipoEcfDgii"
    [disabled]="seq.agotada || seq.vencida">
    e{{ seq.tipoEcfDgii }} — {{ seq.descripcion }}
    <span *ngIf="seq.restantes < seq.stockMinimo"> ({{ seq.restantes }} restantes)</span>
  </ion-select-option>

</ion-select>
```

**Comportamiento nuevo:**
- **FACT siempre aparece primero** y es el valor default (`tipoEcfSeleccionado = null`)
- FACT no pertenece al módulo de secuencias. Es una opción fija del POS
- Debajo de FACT, separados visualmente, aparecen los tipos e-CF activos
- Los tipos e-CF se cargan desde `api/FacturacionElectronica/{idEmpresa}/secuencias` al abrir el POS
- Solo se muestran secuencias activas, no vencidas, con stock disponible
- Se indica visualmente cuando quedan pocas secuencias
- Se deshabilitan secuencias agotadas o vencidas

#### Modelo del DTO

**Antes:** `tipoComprobante: string` ("B01", "Crédito Fiscal", "FACT")  
**Después:** `tipoEcfDgii: number | null` (31, 32, 45 = comprobante electrónico; `null` = FACT sin comprobante)

#### Lógica condicional en el POS

```typescript
// FACT → null, no requiere nada fiscal
// e-CF → número, activa todo el pipeline fiscal-electrónico

get esFact(): boolean {
  return this.tipoEcfSeleccionado === null;
}

get esEcf(): boolean {
  return this.tipoEcfSeleccionado !== null;
}

requiereDatosFiscales(): boolean {
  if (this.esFact) return false;
  const tiposConRnc = [31, 44, 45, 46, 47];
  return tiposConRnc.includes(this.tipoEcfSeleccionado!);
}

onTipoEcfChange() {
  if (this.esFact) {
    this.aplicarITBIS = false;
    this.rncFiscal = '';
    this.nombreFiscal = '';
  } else {
    this.aplicarITBIS = true;
  }
  this.recalcularTotales();
}
```

#### Campos RNC

Solo se solicitan RNC y datos fiscales cuando `requiereDatosFiscales()` es `true` (e31, e44, e45, e46, e47). Para FACT y e32 (consumo) no se requieren.

### 9.4 Cambios en el menú

**Antes:**
```typescript
// Grupo: Configuración
modulos: ['EMPRESA', 'PARAMETROS', 'NCF_SECUENCIAS', 'EMPLEADOS', 'USUARIOS', 'PERFILES', 'CONFIGURACION_DGII']
```

**Después:**
```typescript
// Nuevo grupo independiente
{
  id: 'facturacion-electronica',
  titulo: 'Facturación Electrónica',
  icono: 'document-text',
  orden: 5,
  modulos: [
    'FE_CONFIGURACION',
    'FE_SECUENCIAS',
    'FE_CERTIFICADO',
    'FE_ESTADO_DGII',
    'FE_HISTORIAL',
    'FE_REPROCESAR',
    'FE_MONITOREO'
  ]
}
```

### 9.5 Cambios en routing

```typescript
// Nuevo
{ path: 'facturacion-electronica', loadChildren: () => import('./facturacion-electronica/facturacion-electronica.module') }

// Legacy (mantener temporalmente, redirigir)
{ path: 'ncfsecuencias', redirectTo: 'facturacion-electronica/secuencias' }
```

---

## 10. Compatibilidad con la arquitectura aprobada

### 10.1 Capas de responsabilidad

| Capa | Responsabilidad | Conoce al Gateway | Conoce al proveedor | Conoce estados e-CF |
|------|-----------------|:-----------------:|:-------------------:|:-------------------:|
| **Módulos comerciales** (POS, NC, Compras...) | Crear documento, llamar `EmitirDocumentoAsync` | NO | NO | NO |
| **Facturación Electrónica** (servicio transversal) | Reservar e-NCF, crear ECFEncabezado, encolar | NO (delega al Motor) | NO | SI (los gestiona) |
| **Motor Fiscal** | Congelar fotografía, construir `FiscalDocumentoElectronico`, llamar Gateway | SI (via `IFiscalGateway`) | NO | SI |
| **Gateway Fiscal** | Traducir modelos, transmitir, persistir respuesta | - | SI | SI |
| **Proveedor** | Firmar, enviar a DGII, devolver resultado | - | - | - |

### 10.2 Flujo completo

```
Cualquier módulo comercial (POS / NC / Compras / Gastos / ...)
        │
        │  EmitirDocumentoAsync(request)
        ▼
  IFacturacionElectronicaService (servicio transversal)
        │
        ├── Reserva e-NCF (SecuenciaEcfService)
        ├── Crea ECFEncabezado (BORRADOR)
        └── Encola al outbox
                │
                ▼  (asíncrono, via outbox worker)
          Motor Fiscal Central
                │
                ├── Fotografía Fiscal (FiscalDocumentSnapshotService)
                ├── FiscalDocumentoElectronico
                └── IFiscalGateway.EnviarDocumentoAsync()
                        │
                        ▼
                  Gateway Fiscal (PgEInvoicingGateway)
                        │
                        ├── Traducir modelos Alahia → proveedor
                        ├── HTTP POST al proveedor
                        └── Persistir respuesta en ECFEncabezado
                                │
                                ▼
                          Proveedor (PG.eInvoicing)
                                │
                                ▼
                              DGII
```

### 10.3 Aislamiento total

- Los módulos comerciales **nunca** hablan con el Gateway.
- Los módulos comerciales **nunca** conocen estados del documento electrónico.
- El Motor Fiscal **nunca** conoce al proveedor.
- Solo el Gateway traduce y transmite.
- Cambiar de proveedor = cambiar un adaptador dentro del Gateway. **Cero** cambios en módulos comerciales. **Cero** cambios en el Motor Fiscal.

---

## 11. Migración de datos

### 11.1 Secuencias existentes

Las secuencias NCF tradicionales existentes en `SecuenciasECF` deben migrarse:

```sql
UPDATE SecuenciasECF SET
    TipoEcfDgii = CASE TipoNCF
        WHEN 'B01' THEN 31
        WHEN 'B02' THEN 32
        WHEN 'B03' THEN 33
        WHEN 'B04' THEN 34
        WHEN 'B14' THEN 44
        WHEN 'B15' THEN 45
        ELSE NULL
    END,
    Descripcion = CASE TipoNCF
        WHEN 'B01' THEN 'Factura de Crédito Fiscal Electrónica'
        WHEN 'B02' THEN 'Factura de Consumo Electrónica'
        WHEN 'B03' THEN 'Nota de Débito Electrónica'
        WHEN 'B04' THEN 'Nota de Crédito Electrónica'
        WHEN 'B14' THEN 'Regímenes Especiales Electrónica'
        WHEN 'B15' THEN 'Gubernamental Electrónica'
        ELSE TipoNCF
    END,
    Ambiente = 'PRUEBAS',
    SecuenciaInicial = 1
WHERE TipoEcfDgii IS NULL;
```

Las secuencias legacy quedarán con sus `Serie` originales (B01, B02...). Las nuevas secuencias e-CF usarán `Serie` con prefijo E (E31, E32...).

### 11.2 Facturas existentes

No requieren migración. El campo `FacturaHeaders.NCF` mantiene el NCF original (B01... o E31...). El campo `CodigoTipoComprobanteDgii` ya almacena el código DGII correspondiente.

---

## 12. Pruebas requeridas

| # | Prueba | Tipo | Cobertura |
|---|--------|------|-----------|
| 1 | Reserva concurrente: 10 requests simultáneos para mismo tipo e-CF | Integración | Cero duplicados |
| 2 | Secuencia agotada: intentar reservar cuando `SecuenciaActual >= SecuenciaFinal` | Unitaria | Error claro, no crash |
| 3 | Secuencia vencida: intentar reservar con `fechaVencimiento` pasada | Unitaria | Error claro |
| 4 | Secuencia inexistente: tipo e-CF sin secuencia activa | Unitaria | Error claro |
| 5 | Flujo POS completo: seleccionar tipo → facturar → verificar e-NCF en factura | E2E | NCF correcto en FacturaHeaders |
| 6 | Flujo asíncrono: factura creada → outbox → fotografía → Gateway | Integración | ECFEncabezado creado con estado correcto |
| 7 | POS sin afectación: facturar con `FiscalActivo = false` | Integración | No se encola nada, factura normal |
| 7b | POS FACT: facturar con `tipoEcfDgii = null` | Integración | No reserva secuencia, NCF vacío, no crea ECFEncabezado, no encola Gateway |
| 7c | POS FACT→e31: cambiar selector de FACT a e31 | UI | Aparecen campos RNC, ITBIS se activa |
| 7d | POS e31→FACT: cambiar selector de e31 a FACT | UI | Desaparecen campos RNC, se limpian datos fiscales |
| 8 | Alerta de stock: secuencia con menos de `stockMinimo` restantes | Unitaria | Alerta en DTO |
| 9 | Frontend dinámico: solo muestra secuencias activas con stock | UI | ion-select se puebla correctamente |
| 10 | Reproceso: documento en ERROR → reprocesar → cambia a PENDIENTE_ENVIO | Integración | Estado correcto en ECFEncabezado |
| 11 | Transversalidad: NC emite e34 via EmitirDocumentoAsync | Integración | Mismo pipeline que POS, e-NCF correcto |
| 12 | Transversalidad: Compras con e41 via EmitirDocumentoAsync | Integración | Mismo pipeline, ECFEncabezado creado |
| 13 | Aislamiento: módulo comercial NO accede a ECFEncabezado.EstadoDocumento | Arquitectura | Ningún módulo lee estados e-CF |
| 14 | Multi-módulo concurrente: POS + NC emitiendo simultáneamente | Integración | Cero duplicados, cada uno obtiene su e-NCF |
| 15 | Open/Closed: resolver inexistente lanza error claro | Unitaria | Factory lanza `InvalidOperationException` con mensaje descriptivo |
| 16 | Open/Closed: agregar resolver sin modificar FacturacionElectronicaService | Arquitectura | Nuevo resolver se auto-descubre via DI |
| 17 | Resolver POS: produce DocumentoOrigenInfo correcto desde FacturaHeaders | Unitaria | Todos los campos mapeados correctamente |
| 18 | Resolver NC: incluye referencia al documento modificado (NcfModificado) | Unitaria | DocumentoOrigenInfo.NcfModificado != null |

---

## 13. Archivos que serán modificados/creados

### Backend — Archivos nuevos

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `Entities/Interfaces/ISecuenciaEcfService.cs` | Crear |
| 2 | `Entities/Interfaces/IFacturacionElectronicaService.cs` | Crear |
| 3 | `Entities/Dto/SecuenciaEcfDto.cs` | Crear (DTOs CRUD + Reserva + Alerta) |
| 3b | `Entities/Domain/OrigenDocumento.cs` | Crear (enum: Pos, Facturacion, NotaCredito, Compra, Gasto, etc.) |
| 3c | `Entities/Interfaces/IDocumentoOrigenResolver.cs` | Crear (interfaz del resolver + factory + DocumentoOrigenInfo) |
| 3d | `DataAccess/Servicios/DocumentoOrigenResolverFactory.cs` | Crear (factory que auto-descubre resolvers via DI) |
| 3e | `DataAccess/Servicios/Resolvers/PosDocumentoResolver.cs` | Crear (lee FacturaHeaders + detalles → DocumentoOrigenInfo) |
| 3f | `DataAccess/Servicios/Resolvers/NotaCreditoDocumentoResolver.cs` | Crear (lee NotasCredito + factura origen → DocumentoOrigenInfo) |
| 3g | `DataAccess/Servicios/Resolvers/CompraDocumentoResolver.cs` | Crear (lee OrdenCompraHeader + detalles → DocumentoOrigenInfo) |
| 3h | `DataAccess/Servicios/Resolvers/GastoDocumentoResolver.cs` | Crear (lee Gastos → DocumentoOrigenInfo) |
| 4 | `DataAccess/Servicios/SecuenciaEcfService.cs` | Crear (reemplaza NCF_SecuenciasServices) |
| 5 | `DataAccess/Servicios/FacturacionElectronicaService.cs` | Crear (orquestador) |
| 6 | `Controllers/FacturacionElectronicaController.cs` | Crear |
| 7 | Script SQL de migración | Crear |

### Backend — Archivos modificados

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `Entities/Domain/SecuenciaECF.cs` | Agregar campos: `Descripcion`, `TipoEcfDgii`, `SecuenciaInicial`, `Ambiente`, etc. |
| 2 | `Entities/Domain/ECFEncabezado.cs` | Agregar: `OrigenDocumento`, `IdOrigen`, `SecurityCode`, `UrlQR`, `FechaFirma`, `EstadoDocumento`, `NumeroFacturaInterna`. Deprecar `IdFacturaInterna` |
| 3 | `Entities/Domain/DgiiConfiguracionEmpresa.cs` | Agregar: `ProveedorFiscalActivo`, `AmbienteECF` |
| 4 | `Entities/Dto/FacturaHeaderDto.cs` | Cambiar `TipoComprobante` (string) a `TipoEcfDgii` (int?) |
| 5 | `Controllers/FacturaHeaderController.cs` | Inyectar `IFacturacionElectronicaService`, reemplazar `GenerarNCF` por `EmitirDocumentoAsync` |
| 6 | `DataAccess/Servicios/NotasCreditoServices.cs` | Inyectar `IFacturacionElectronicaService`, reemplazar `GenerarNcfNotaCreditoAsync` |
| 7 | `DataAccess/Servicios/ComprasService.cs` | Inyectar `IFacturacionElectronicaService` (para e41 futuro) |
| 8 | `DataAccess/Servicios/BizcochoEncargoServices.cs` | Inyectar `IFacturacionElectronicaService`, reemplazar `GenerarNCF` |
| 9 | `DataAccess/Data/AlahiaPosContext.cs` | Agregar configuración de nuevos campos |
| 10 | `Program.cs` | Registrar `IFacturacionElectronicaService` + `ISecuenciaEcfService`, deprecar `INCF_Secuencias` |

### Backend — Archivos deprecados

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `DataAccess/Servicios/NCF_SecuenciasServices.cs` | Marcar `[Obsolete]` |
| 2 | `Entities/Interfaces/INCF_Secuencias.cs` | Marcar `[Obsolete]` |
| 3 | `Controllers/NCF_SecuenciasController.cs` | Marcar `[Obsolete]`, mantener temporalmente |

### Frontend — Archivos nuevos

| # | Archivo | Acción |
|---|---------|--------|
| 1-8 | `src/app/facturacion-electronica/` (módulo completo: 7 componentes + routing) | Crear |
| 9 | `src/app/servicios/facturacion-electronica.service.ts` | Crear |
| 10 | `src/app/models/secuencia-ecf.models.ts` | Crear |
| 11 | `src/app/models/facturacion-electronica.models.ts` | Crear |

### Frontend — Archivos modificados

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `src/app/Pos/pos/pos.component.ts` | Cargar secuencias dinámicamente, cambiar `tipoComprobante` a `tipoEcfDgii` |
| 2 | `src/app/Pos/pos/pos.component.html` | Selector dinámico de tipos e-CF |
| 3 | `src/app/config/menu-grupos.config.ts` | Nuevo grupo "Facturación Electrónica" |
| 4 | `src/app/app-routing.module.ts` | Nueva ruta `/facturacion-electronica` |
| 5 | `src/app/app.component.ts` | Agregar rutas e iconos del nuevo módulo |

### Frontend — Archivos deprecados

| # | Archivo | Acción |
|---|---------|--------|
| 1 | `src/app/ncf-secuencias/` (componente completo) | Deprecar, redirigir ruta |
| 2 | `src/app/servicios/ncf-secuencias.service.ts` | Deprecar |
| 3 | `src/app/models/NCF_Secuencia.models.ts` | Deprecar |

---

## 14. Orden de implementación sugerido

| Fase | Contenido | Dependencias |
|------|-----------|-------------|
| **Fase 1** | DDL: extender `SecuenciasECF` + `ECFEncabezado` + migración de datos | Ninguna |
| **Fase 2** | Backend: `ISecuenciaEcfService` + `SecuenciaEcfService` + DTOs | Fase 1 |
| **Fase 3** | Backend: `FacturacionElectronicaController` (endpoints de secuencias) | Fase 2 |
| **Fase 4** | Backend: Modificar `FacturaHeaderController` para usar nuevo servicio | Fase 2 |
| **Fase 5** | Frontend: Servicio + modelos nuevos | Fase 3 |
| **Fase 6** | Frontend: Pantalla de secuencias e-CF | Fase 5 |
| **Fase 7** | Frontend: POS — selector dinámico de tipos e-CF | Fase 5 |
| **Fase 8** | Frontend: Pantalla de configuración FE | Fase 5 |
| **Fase 9** | Frontend: Historial + Monitoreo + Reproceso | Fase 5 |
| **Fase 10** | Integración: Flujo completo POS → Motor → Gateway (cuando Gateway esté implementado) | Fase 4 + Gateway |
