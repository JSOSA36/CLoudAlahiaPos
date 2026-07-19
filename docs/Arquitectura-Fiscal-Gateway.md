# Arquitectura del Fiscal Gateway — Alahia ERP

**Tipo:** Decisión de arquitectura vinculante  
**Estado:** Documento de diseño (sin implementación)  
**Prerrequisito:** `docs/Arquitectura-Motor-Fiscal-Central.md` (PRINCIPIO #1)  
**Proveedor actual:** PG.eInvoicing (einvoicing.com.do) — Sandbox  
**Objetivo:** Desacoplar completamente el proveedor de facturación electrónica del Motor Fiscal mediante una capa adaptadora que permita cambiar de proveedor sin modificar lógica fiscal.

---

## 1. Principio rector

El Motor Fiscal **no conoce** al proveedor de facturación electrónica.

No sabe si el proveedor se llama PG.eInvoicing, DGII directo, Indexa, FacturaSimple o cualquier otro. No sabe si la comunicación es via REST, SOAP, XML firmado o carrier pigeon.

El Motor Fiscal solo conoce un **puerto** (interfaz) que habla en términos de Alahia:

```
ERP (Operación Comercial)
        │
        ▼
Motor Fiscal Central
        │  solo ve: IFiscalGateway
        ▼
┌─────────────────────────────────────┐
│         FISCAL GATEWAY              │
│  (Adapter Pattern / Anti-Corruption │
│   Layer / Puerto + Adaptador)       │
│                                     │
│  Traduce modelos Alahia ↔ Proveedor │
│  Oculta autenticación               │
│  Oculta protocolo HTTP/XML/JSON     │
│  Oculta reintentos y contingencia   │
│  Persiste resultado DGII            │
└──────────────┬──────────────────────┘
               │  HTTP + API Key / XML firmado
               ▼
    Proveedor Facturación Electrónica
    (PG.eInvoicing actual)
               │
               ▼
             DGII
```

---

## 2. Capas y responsabilidades

### 2.1 Capa de Puerto (Interfaces — vive en Entities)

Interfaces agnósticas al proveedor. Son el contrato que el Motor Fiscal consume.

```
AlahiaPos.Entities/Interfaces/
    IFiscalGateway.cs          ← Contrato principal
    IFiscalGatewayFactory.cs   ← Resuelve el gateway según empresa/ambiente
```

### 2.2 Capa de Modelos Internos (DTOs — vive en Entities)

Modelos de Alahia que representan documentos fiscales electrónicos. **No son los modelos del proveedor.** Son la representación interna que el Motor Fiscal entiende.

```
AlahiaPos.Entities/Dto/Fiscal/
    FiscalDocumentoElectronico.cs     ← Documento completo (encabezado + líneas)
    FiscalDocumentoEncabezado.cs      ← Identificación + emisor + comprador + totales
    FiscalDocumentoLinea.cs           ← Línea de detalle
    FiscalDocumentoDescuento.cs       ← Descuento o recargo global
    FiscalDocumentoReferencia.cs      ← Para NC/ND: documento modificado
    FiscalDocumentoFormaPago.cs       ← Desglose de formas de pago
    FiscalEnvioResultado.cs           ← Resultado del envío (trackId, estado)
    FiscalConsultaResultado.cs        ← Estado consultado (aceptado/rechazado/pendiente)
    FiscalAprobacionComercial.cs      ← Aprobación/rechazo de e-CF recibido
```

### 2.3 Capa de Adaptador (Implementación — vive en DataAccess o proyecto dedicado)

Traduce entre modelos Alahia y modelos del proveedor específico. Cada proveedor tiene su propio adaptador.

```
AlahiaPos.DataAccess/Servicios/FiscalGateway/
    PgEInvoicing/
        PgEInvoicingGateway.cs           ← Implementa IFiscalGateway
        PgEInvoicingMapper.cs            ← Traduce Alahia ↔ PG.eInvoicing DTOs
        PgEInvoicingHttpClient.cs        ← HTTP puro contra la API del proveedor
        PgEInvoicingSettings.cs          ← Config: baseUrl, apiKey (appsettings)
        PgEInvoicingModels/              ← DTOs del proveedor (generados del OpenAPI)
            PgDgiiDocumentDto.cs
            PgEncabezadoDto.cs
            PgItemDto.cs
            PgTrackIdResponseDto.cs
            PgAprobacionFacturaCommand.cs
            ...
```

### 2.4 Capa de Persistencia (ECF — ya existe parcialmente)

El resultado de cada operación del Gateway se persiste en entidades Alahia que ya existen:

```
AlahiaPos.Entities/Domain/
    ECFEncabezado.cs          ← Ya existe. Almacena e-CF enviados + respuesta DGII
    ECFDetalle.cs             ← Ya existe. Líneas del e-CF
    ECFXml.cs                 ← Ya existe. XML sin firmar / firmado / enviado / respuesta
    ECFHistorialEstado.cs     ← Ya existe. Trazabilidad de estados
    CertificadoDigital.cs     ← Ya existe. Certificados P12 por empresa
```

---

## 3. Interfaz principal: `IFiscalGateway`

```csharp
public interface IFiscalGateway
{
    // ─── EMISIÓN ───
    Task<FiscalEnvioResultado> EnviarDocumentoAsync(
        FiscalDocumentoElectronico documento,
        CancellationToken ct = default);

    // ─── CONSULTA DE ESTADO ───
    Task<FiscalConsultaResultado> ConsultarEstadoAsync(
        string trackId,
        CancellationToken ct = default);

    // ─── FACTURAS DE CONSUMO (RFCE) ───
    Task<FiscalEnvioResultado> EnviarResumenConsumoAsync(
        FiscalDocumentoElectronico resumen,
        CancellationToken ct = default);

    // ─── APROBACIÓN COMERCIAL (e-CF recibidos) ───
    Task<IReadOnlyList<FiscalDocumentoElectronico>> ObtenerPendientesAprobacionAsync(
        CancellationToken ct = default);

    Task AprobarDocumentoAsync(
        FiscalAprobacionComercial aprobacion,
        CancellationToken ct = default);

    // ─── SALUD ───
    Task<bool> VerificarConexionAsync(CancellationToken ct = default);
}
```

El Motor Fiscal **solo** conoce esta interfaz y los modelos de `AlahiaPos.Entities/Dto/Fiscal/`. Nunca ve `PgDgiiDocumentDto`, nunca ve `X-Api-Key`, nunca ve `trackId` del proveedor (solo el abstracción `FiscalEnvioResultado.TrackId`).

---

## 4. Modelos internos de Alahia (Puerto)

### 4.1 `FiscalDocumentoElectronico` — Documento completo

| Propiedad | Tipo | Origen Alahia | Nota |
|-----------|------|---------------|------|
| `IdDocumentoInterno` | `int` | `FacturaHeaders.IdFacturaHeader` o `NotasCredito.IdNotaCredito` | Para trazabilidad |
| `TipoDocumentoAlahia` | `string` | "Venta" / "NotaCredito" / "NotaDebito" | Discriminador |
| `Encabezado` | `FiscalDocumentoEncabezado` | Ver §4.2 | |
| `Lineas` | `List<FiscalDocumentoLinea>` | Ver §4.3 | |
| `Descuentos` | `List<FiscalDocumentoDescuento>` | Ver §4.4 | Descuentos/recargos globales |
| `FormasPago` | `List<FiscalDocumentoFormaPago>` | Ver §4.5 | Desglose medios de pago |
| `Referencia` | `FiscalDocumentoReferencia?` | Ver §4.6 | Solo para NC/ND |

### 4.2 `FiscalDocumentoEncabezado`

| Propiedad | Tipo | Mapeo a e-CF |
|-----------|------|-------------|
| `TipoEcf` | `int` | `IdDoc.TipoeCF` (31/32/33/34/44/45/46) |
| `Encf` | `string` | `IdDoc.eNCF` |
| `TipoIngreso` | `int` | `IdDoc.TipoIngresos` (1-6) |
| `TipoPago` | `int` | `IdDoc.TipoPago` (1=Contado/2=Crédito/3=Gratuito) |
| `IndicadorMontoGravado` | `int?` | `IdDoc.IndicadorMontoGravado` |
| `FechaVencimientoSecuencia` | `DateTime?` | `IdDoc.FechaVencimientoSecuencia` |
| `FechaEmision` | `DateTime` | `Emisor.FechaEmision` |
| `RncEmisor` | `string` | `Emisor.RNCEmisor` |
| `RazonSocialEmisor` | `string` | `Emisor.RazonSocialEmisor` |
| `NombreComercialEmisor` | `string?` | `Emisor.NombreComercial` |
| `DireccionEmisor` | `string` | `Emisor.DireccionEmisor` |
| `MunicipioEmisor` | `string?` | `Emisor.Municipio` |
| `ProvinciaEmisor` | `string?` | `Emisor.Provincia` |
| `TelefonoEmisor` | `string?` | `Emisor.TablaTelefonoEmisor[0]` |
| `CorreoEmisor` | `string?` | `Emisor.CorreoEmisor` |
| `NumeroFacturaInterna` | `string?` | `Emisor.NumeroFacturaInterna` |
| `RncComprador` | `string?` | `Comprador.RNCComprador` |
| `RazonSocialComprador` | `string` | `Comprador.RazonSocialComprador` |
| `DireccionComprador` | `string?` | `Comprador.DireccionComprador` |
| `CorreoComprador` | `string?` | `Comprador.CorreoComprador` |
| `MontoGravadoTotal` | `decimal` | `Totales → SubTotales.MontoGravadoTotal` |
| `MontoGravadoI1` | `decimal` | `SubTotales.MontoGravadoI1` (18%) |
| `MontoGravadoI2` | `decimal` | `SubTotales.MontoGravadoI2` (16%) |
| `MontoGravadoI3` | `decimal` | `SubTotales.MontoGravadoI3` (9%) |
| `MontoExento` | `decimal` | `SubTotales.SubTotalExento` |
| `TotalItbis` | `decimal` | `Totales.TotalITBIS` o `SubTotales.SubTotaITBIS` |
| `TotalItbis1` | `decimal` | `SubTotales.SubTotaITBIS1` (18%) |
| `TotalItbis2` | `decimal` | `SubTotales.SubTotaITBIS2` (16%) |
| `TotalItbis3` | `decimal` | `SubTotales.SubTotaITBIS3` (9%) |
| `MontoTotal` | `decimal` | `Totales.MontoTotal` |
| `TotalItbisRetenido` | `decimal` | `Totales.TotalITBISRetenido` |
| `TotalIsrRetencion` | `decimal` | `Totales.TotalISRRetencion` |
| `MontoPropinaLegal` | `decimal` | De `FacturaHeaders.MontoPropinaLegal` |

### 4.3 `FiscalDocumentoLinea`

| Propiedad | Tipo | Mapeo a e-CF |
|-----------|------|-------------|
| `NumeroLinea` | `int` | `Detalle.NumeroLinea` |
| `IndicadorFacturacion` | `int` | 1=ITBIS18%, 2=ITBIS16%, 3=ITBIS0%, 4=Exento |
| `NombreItem` | `string` | `Detalle.NombreItem` |
| `EsBien` | `bool` | `IndicadorBienoServicio` (1=Bien, 2=Servicio) |
| `Cantidad` | `decimal` | `Detalle.CantidadItem` |
| `PrecioUnitario` | `decimal` | `Detalle.PrecioUnitarioItem` |
| `MontoItem` | `decimal` | `Detalle.MontoItem` |
| `DescuentoMonto` | `decimal?` | `Detalle.DescuentoMonto` |
| `RecargoMonto` | `decimal?` | `Detalle.RecargoMonto` |
| `UnidadMedida` | `int?` | `Detalle.UnidadMedida` |

### 4.4 `FiscalDocumentoDescuento`

| Propiedad | Tipo | Mapeo a e-CF |
|-----------|------|-------------|
| `NumeroLinea` | `int` | `DescuentosORecargos.NumeroLinea` |
| `EsDescuento` | `bool` | `TipoAjuste` "D" = true, "R" = false |
| `Descripcion` | `string?` | `DescripcionDescuentooRecargo` |
| `EsMontoFijo` | `bool` | `TipoValor` "$" = true, "%" = false |
| `Monto` | `decimal` | `MontoDescuentooRecargo` |
| `IndicadorFacturacion` | `int?` | 1=ITBIS18%, 2=16%, 3=0%, 4=Exento |

### 4.5 `FiscalDocumentoFormaPago`

| Propiedad | Tipo | Valores |
|-----------|------|---------|
| `FormaPago` | `int` | 1=Efectivo, 2=Cheque/Transfer, 3=Tarjeta, 4=Crédito, 5=Bonos, 6=Permuta, 7=NC, 8=Otras |
| `Monto` | `decimal` | Monto pagado por este medio (con impuestos) |

### 4.6 `FiscalDocumentoReferencia` (solo NC/ND)

| Propiedad | Tipo | Mapeo a e-CF |
|-----------|------|-------------|
| `NcfModificado` | `string` | `Referencia.NcfModificado` |
| `RncOtroContribuyente` | `string?` | `Referencia.RncOtroContribuyente` |
| `FechaNcfModificado` | `DateTime?` | `Referencia.FechaNCFModificado` |
| `CodigoModificacion` | `int` | 1=Anular, 2=Corrección texto, 3=Corrección montos, 4=Reemplazo contingencia, 5=Referencia e-CF |
| `RazonModificacion` | `string?` | `Referencia.RazonModificacion` |

### 4.7 `FiscalEnvioResultado`

| Propiedad | Tipo | Nota |
|-----------|------|------|
| `Exitoso` | `bool` | Si el proveedor aceptó el envío (no si DGII aceptó) |
| `TrackId` | `string?` | Identificador para consulta posterior |
| `Estado` | `string` | "Recibido" / "Error" / etc. |
| `Encf` | `string?` | e-NCF confirmado |
| `FechaRecepcion` | `DateTime?` | Timestamp del proveedor |
| `CodigoError` | `string?` | Código de error si falló |
| `Mensajes` | `List<string>` | Mensajes de detalle |
| `SecurityCode` | `string?` | Código de seguridad DGII |
| `UrlQR` | `string?` | URL del QR para la representación impresa |
| `FechaFirma` | `DateTime?` | Timestamp de la firma digital |

### 4.8 `FiscalConsultaResultado`

| Propiedad | Tipo | Nota |
|-----------|------|------|
| `TrackId` | `string` | Mismo que se envió |
| `Estado` | `string` | "Aceptado" / "Rechazado" / "EnProceso" / "Recibido" |
| `Encf` | `string?` | e-NCF |
| `Rnc` | `string?` | RNC del emisor |
| `CodigoError` | `string?` | Si rechazado |
| `Mensajes` | `List<string>` | Detalle |
| `SecurityCode` | `string?` | Código seguridad |
| `UrlQR` | `string?` | QR |
| `FechaFirma` | `DateTime?` | Fecha firma |
| `EsAceptado` | `bool` | `Estado == "Aceptado"` |
| `EsRechazado` | `bool` | `Estado == "Rechazado"` |
| `EstaPendiente` | `bool` | Ni aceptado ni rechazado |

---

## 5. Mapeo del adaptador: Alahia ↔ PG.eInvoicing

### 5.1 Lo que traduce `PgEInvoicingMapper`

| Dirección | Modelo Alahia | Modelo PG.eInvoicing | Responsabilidad |
|-----------|---------------|---------------------|-----------------|
| Alahia → Proveedor | `FiscalDocumentoElectronico` | `PgDgiiDocumentDto` | Mapear encabezado, líneas, descuentos, formas de pago, referencia NC |
| Proveedor → Alahia | `PgTrackIdResponseDto` | `FiscalEnvioResultado` / `FiscalConsultaResultado` | Traducir trackId, estado, mensajes, QR, security code |
| Proveedor → Alahia | Lista de pendientes | `List<FiscalDocumentoElectronico>` | Traducir e-CF recibidos pendientes |

### 5.2 Mapeo de enums

| Concepto | Alahia (interno) | PG.eInvoicing (proveedor) |
|----------|-------------------|---------------------------|
| Tipo e-CF | `int` (31/32/33/34/44/45/46) | `int TipoeCF` (mismo valor) |
| Tipo Ingreso | `int` (1-6) | `enum TipoIngresos` (1-6) |
| Tipo Pago | `int` (1-3) | `enum TipoPago` (1=Contado/2=Crédito/3=Gratuito) |
| Forma Pago | `int` (1-8) | `enum FormaPago` (1-8) |
| Indicador Facturación | `int` (0-4) | `enum IndicadorFacturacion` (0=NoFacturable/1=ITBIS18/2=ITBIS16/3=ITBIS0/4=Exento) |
| Bien/Servicio | `bool EsBien` | `enum BienoServicio` (1=Bien/2=Servicio) |
| Código Modificación NC | `int` (1-5) | `enum CodigoTipoModificacion` (1-5) |
| Agente Retención | `int` (1-2) | `enum AgenteRetencionoPercepcion` (1=Retención/2=Percepción) |

**Los valores numéricos coinciden** porque ambos siguen el estándar DGII. El adaptador valida la equivalencia pero no asume que siempre será así. Si un proveedor futuro usa otros códigos, solo cambia el mapper de ese adaptador.

---

## 6. Qué datos NUNCA salen del Gateway

| Dato | Razón |
|------|-------|
| `X-Api-Key` del proveedor | Credencial de acceso. Se lee de configuración cifrada y se usa internamente |
| URL base del proveedor | Detalle de implementación. El Motor Fiscal no sabe si es `sbx-ecf.einvoicing.com.do` o `api.otro.com` |
| Headers HTTP, códigos HTTP, retry logic | Protocolo de transporte. El Motor solo ve `FiscalEnvioResultado` |
| Formato JSON exacto del proveedor (nombres de propiedades, casing) | Contrato del proveedor. El adaptador traduce `tipoeCF` ↔ `TipoEcf` |
| Errores HTTP raw (401, 402, 500) | El Gateway los traduce a `FiscalEnvioResultado.Exitoso = false` con mensajes legibles |
| Certificado P12 / password / firma digital | El Gateway firma internamente si es necesario. El Motor no firma nada |
| Token de sesión DGII directo (si se usa autenticación directa en futuro) | Sesión del proveedor, no del ERP |

---

## 7. Qué datos SÍ se persisten

| Dato | Dónde se guarda | Quién lo guarda | Cuándo |
|------|-----------------|-----------------|--------|
| `TrackId` devuelto por DGII | `ECFEncabezado.TrackId` | Gateway (después de envío exitoso) | POST exitoso |
| `EstadoDGII` (Aceptado/Rechazado) | `ECFEncabezado.EstadoDGII` | Gateway (después de consulta) | GET status |
| `SecurityCode` | `ECFEncabezado.SecurityCode` (nuevo campo) | Gateway | Cuando DGII lo devuelve |
| `QR` | `ECFEncabezado.QR` (nuevo campo) | Gateway | Cuando DGII lo devuelve |
| `CodigoError` + `MensajeRespuesta` | `ECFEncabezado.CodigoError`, `.MensajeRespuesta` | Gateway | Si rechazado |
| `FechaEnvio` / `FechaRespuesta` | `ECFEncabezado.FechaEnvio`, `.FechaRespuesta` | Gateway | Timestamps |
| Historial completo de estados | `ECFHistorialEstado` (nueva fila por cambio) | Gateway | Cada transición |
| JSON enviado (payload Alahia, no del proveedor) | `ECFXml.XmlSinFirmar` (renombrar conceptualmente) | Gateway | Antes de enviar |
| JSON respuesta crudo del proveedor | `ECFXml.XmlRespuestaDGII` | Gateway | Después de respuesta |

**Nota:** Los nombres actuales usan "Xml" por herencia. En la implementación se mantienen los nombres de columna SQL pero los comentarios aclaran que el contenido puede ser JSON.

---

## 8. Desacoplamiento: cambiar de proveedor

### 8.1 Escenario: Migrar de PG.eInvoicing a otro proveedor

| Paso | Acción | Impacto en Motor Fiscal |
|------|--------|:-----------------------:|
| 1 | Crear carpeta `NuevoProveedor/` junto a `PgEInvoicing/` | Ninguno |
| 2 | Implementar `NuevoProveedorGateway : IFiscalGateway` | Ninguno |
| 3 | Crear `NuevoProveedorMapper` con traducción a DTOs del nuevo proveedor | Ninguno |
| 4 | Crear `NuevoProveedorHttpClient` con el protocolo HTTP del nuevo proveedor | Ninguno |
| 5 | Agregar configuración en `appsettings.json` | Ninguno |
| 6 | Cambiar registro DI en `Program.cs`: `services.AddScoped<IFiscalGateway, NuevoProveedorGateway>()` | **Una línea** |
| 7 | (Opcional) Hacer la selección por empresa si se quieren ambos proveedores | `IFiscalGatewayFactory` |

**Cero** cambios en el Motor Fiscal. **Cero** cambios en generadores 606/607/IT-1. **Cero** cambios en fotografía fiscal. **Cero** cambios en el frontend.

### 8.2 Selección de proveedor por empresa (futuro)

```csharp
public interface IFiscalGatewayFactory
{
    IFiscalGateway ResolverGateway(int idEmpresa);
}
```

Esto permite que la empresa A use PG.eInvoicing y la empresa B use otro proveedor, sin cambiar ninguna línea del Motor Fiscal.

### 8.3 Soporte dual: proveedor API vs DGII directo

La interfaz `IDgiiClientService` que ya existe (semilla + firma + envío XML directo a DGII) puede coexistir como otro adaptador:

```
FiscalGateway/
    PgEInvoicing/          ← Proveedor API REST (JSON, API Key)
    DgiiDirecto/           ← Conexión directa DGII (XML firmado, P12, semilla)
```

Ambos implementan `IFiscalGateway`. El factory decide cuál usar según la configuración de la empresa.

---

## 9. Estructura de carpetas propuesta

```
AlahiaPos.Entities/
    Interfaces/
        IFiscalGateway.cs              ← NUEVO (puerto principal)
        IFiscalGatewayFactory.cs       ← NUEVO (factory por empresa)
        IDgiiClient.cs                 ← YA EXISTE (mover a DgiiDirecto en futuro)
        IDgiiClientService.cs          ← YA EXISTE (mover a DgiiDirecto en futuro)
    Dto/
        Fiscal/                        ← NUEVO (modelos internos)
            FiscalDocumentoElectronico.cs
            FiscalDocumentoEncabezado.cs
            FiscalDocumentoLinea.cs
            FiscalDocumentoDescuento.cs
            FiscalDocumentoReferencia.cs
            FiscalDocumentoFormaPago.cs
            FiscalEnvioResultado.cs
            FiscalConsultaResultado.cs
            FiscalAprobacionComercial.cs
        Invoice/                       ← YA EXISTE (DTOs legacy, migrar a Fiscal/)
    Domain/
        ECFEncabezado.cs               ← YA EXISTE (agregar SecurityCode, QR)
        ECFDetalle.cs                  ← YA EXISTE
        ECFXml.cs                      ← YA EXISTE
        ECFHistorialEstado.cs          ← YA EXISTE
        CertificadoDigital.cs          ← YA EXISTE

AlahiaPos.DataAccess/
    Servicios/
        FiscalGateway/                 ← NUEVO
            PgEInvoicing/
                PgEInvoicingGateway.cs       ← Implementa IFiscalGateway
                PgEInvoicingMapper.cs        ← Traduce modelos
                PgEInvoicingHttpClient.cs    ← HTTP contra API
                PgEInvoicingSettings.cs      ← Config del proveedor
                Models/                      ← DTOs del proveedor (privados)
                    PgDgiiDocumentDto.cs
                    PgEncabezadoDto.cs
                    PgItemDto.cs
                    PgTrackIdResponseDto.cs
                    ...
```

---

## 10. Flujo de envío de un e-CF

```
Motor Fiscal:
    1. Construye FiscalDocumentoElectronico desde la fotografía fiscal
    2. Llama gateway.EnviarDocumentoAsync(documento)

Gateway (PgEInvoicingGateway):
    3. PgEInvoicingMapper.ToProveedorDto(documento) → PgDgiiDocumentDto
    4. PgEInvoicingHttpClient.PostReceiptAsync(pgDto, apiKey) → PgTrackIdResponseDto
    5. PgEInvoicingMapper.ToResultado(pgResponse) → FiscalEnvioResultado
    6. Persistir en ECFEncabezado: TrackId, EstadoDGII, FechaEnvio
    7. Persistir en ECFXml: JSON enviado, JSON respuesta
    8. Persistir en ECFHistorialEstado: nuevo estado "Enviado"
    9. Retornar FiscalEnvioResultado al Motor Fiscal

Motor Fiscal:
    10. Actualizar EstadoFiscalDocumento según resultado
    11. Si pendiente → encolar consulta posterior vía outbox
```

---

## 11. Flujo de consulta de estado

```
Worker/Motor Fiscal:
    1. Llama gateway.ConsultarEstadoAsync(trackId)

Gateway (PgEInvoicingGateway):
    2. PgEInvoicingHttpClient.GetReceiptStatusAsync(trackId, apiKey)
    3. PgEInvoicingMapper.ToConsultaResultado(pgResponse)
    4. Actualizar ECFEncabezado.EstadoDGII
    5. Persistir ECFHistorialEstado (si cambió de estado)
    6. Retornar FiscalConsultaResultado

Motor Fiscal:
    7. Si Aceptado → confirmar fotografía fiscal como definitiva
    8. Si Rechazado → marcar ERROR_FISCAL + razón
    9. Si Pendiente → re-encolar consulta
```

---

## 12. Manejo de errores y contingencia

| Escenario | Responsabilidad | Comportamiento |
|-----------|-----------------|----------------|
| Proveedor no responde (timeout) | Gateway | Retry con backoff exponencial (3 intentos). Si falla → `FiscalEnvioResultado.Exitoso = false` con mensaje "Proveedor no disponible" |
| API Key inválida (401) | Gateway | `Exitoso = false`, mensaje "Credenciales inválidas". **No** retry |
| Cuota excedida (402) | Gateway | `Exitoso = false`, mensaje "Cuota del proveedor excedida" |
| Documento rechazado por DGII | Gateway (consulta) | `FiscalConsultaResultado.EsRechazado = true` con códigos de error DGII |
| Proveedor cambia su API (breaking change) | Solo el adaptador de ese proveedor | Actualizar `PgEInvoicingMapper` y `PgEInvoicingHttpClient`. Motor Fiscal intacto |
| Red no disponible | Gateway | Cola local (outbox existente). Re-intentar cuando la red vuelva |

---

## 13. Configuración (`appsettings.json`)

```json
{
  "FiscalGateway": {
    "ProveedorActivo": "PgEInvoicing",
    "PgEInvoicing": {
      "BaseUrl": "https://sbx-ecf.einvoicing.com.do",
      "ApiKey": "*** (cifrado o variable de entorno) ***",
      "TimeoutSeconds": 30,
      "MaxReintentos": 3
    }
  }
}
```

El `ApiKey` **nunca** se guarda en texto plano en el repositorio. Se usa `User Secrets`, variables de entorno o un vault.

---

## 14. Relación con la infraestructura existente

| Componente existente | Relación con el Gateway | Acción |
|---------------------|------------------------|--------|
| `IDgiiClient` / `IDgiiClientService` | Interfaces legacy para conexión directa DGII (XML/semilla) | Mantener como adaptador alternativo `DgiiDirecto/` |
| `DgiiSettings` | Configuración del canal directo DGII | Coexiste con `PgEInvoicingSettings` |
| `EcfRequestDto` / `EncabezadoDto` / `DetalleDto` (en `Dto/Invoice/`) | DTOs legacy acoplados al proveedor original | Reemplazar por modelos internos de `Dto/Fiscal/`. Los DTOs legacy se deprecan |
| `ECFEncabezado` + `ECFDetalle` + `ECFXml` + `ECFHistorialEstado` | Persistencia del resultado del Gateway | Se mantienen. Agregar `SecurityCode` y `QR` a `ECFEncabezado` |
| `CertificadoDigital` | Para el canal directo DGII (firma XML) | Se mantiene. PG.eInvoicing no lo necesita (firma el proveedor) |
| `FiscalWorkEnqueueService` / Outbox | Encola el trabajo fiscal asíncrono | El Motor Fiscal encola; el worker procesa y puede llamar al Gateway |
| `FiscalDocumentSnapshotService` | Fotografía fiscal | La fotografía alimenta los datos que el Motor Fiscal pasa al Gateway |

---

## 15. Reglas de diseño del Gateway

| # | Regla |
|---|-------|
| G1 | El Gateway **nunca** contiene lógica fiscal. No decide si un documento debe enviarse, no calcula montos, no valida reglas DGII. Solo traduce y transmite |
| G2 | El Gateway **nunca** modifica entidades comerciales (`FacturaHeaders`, `NotasCredito`, etc.). Solo escribe en entidades e-CF (`ECFEncabezado`, `ECFXml`, etc.) |
| G3 | Los modelos del proveedor (`PgEInvoicing/Models/`) son **privados** del adaptador. Ningún otro componente del sistema los referencia |
| G4 | El mapper del proveedor es **puro** (sin efectos secundarios). Recibe un modelo Alahia, retorna un modelo proveedor, sin consultar DB ni llamar APIs |
| G5 | Si el proveedor cambia, solo cambian archivos dentro de la carpeta del adaptador. Ningún otro archivo del proyecto se modifica |
| G6 | La persistencia del resultado se hace **dentro** del Gateway, no fuera. El Motor Fiscal recibe un `FiscalEnvioResultado` y no necesita saber qué se guardó en `ECFEncabezado` |
| G7 | Las credenciales del proveedor son **específicas del adaptador** y se leen de configuración inyectada. Nunca hardcoded, nunca en Git |
| G8 | El Gateway es **stateless** entre llamadas. No cachea tokens ni sesiones del proveedor como estado interno (puede cachear si es necesario, pero es transparente) |

---

## 16. Relación con el PRINCIPIO #1

```
La arquitectura define los formularios.
La arquitectura define los proveedores.
```

El Motor Fiscal no sabe ni le importa quién transmite el e-CF a la DGII. Si mañana la DGII cambia el canal, si el proveedor sube precios, si aparece un nuevo competidor: **solo cambia un adaptador**.

El Motor Fiscal sigue construyendo `FiscalDocumentoElectronico` desde la fotografía fiscal, y el Gateway se encarga del resto.
