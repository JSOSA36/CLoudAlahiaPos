# Deploy Centro de Producción — Dev → Prod

**Estado:** preparado, **no ejecutado** en Prod  
**Fecha:** 2026-07-17  
**Regla:** no tocar `AlahiaPos_Prod` hasta autorización explícita del usuario.

---

## Qué entra en este release (CP + relacionados)

| Capa | Contenido |
|------|-----------|
| **DB** | Tablas `Produccion*`, flujo POS_ORDEN, SLA multi-reloj, módulos CP |
| **API** | `/api/produccion`, hub `/hubs/produccion`, adapter POS, `TipoOrden`, `estados-por-origen` |
| **FE** | `/centro-produccion`, listado órdenes + `ESTATUS_ORDENES`, cart UI, imágenes categoría, fix print POS |

## Qué **no** va a Prod

| Ítem | Motivo |
|------|--------|
| Empresa demo **Sabor Urbano** | Solo Dev (`Seed_Demo_SaborUrbano_Dev.sql`) |
| Imágenes FTP demo-comida | Solo demo |
| Activar motor en **todas** las empresas | Opt-in vía flags del script Prod |

---

## Orden de despliegue

### 1) Backup Prod

```text
BACKUP DATABASE AlahiaPos_Prod ... (según procedimiento operativo)
```

### 2) SQL — Centro de Producción

Archivo: `AlahiaPosApi/Scripts/Deploy_CentroProduccion_Etapa1_Prod.sql`

1. Abrir script.
2. Revisar flags al inicio:
   - `@CONFIRMO_PROD = 1` (obligatorio para ejecutar)
   - `@LicenciarTodasEmpresas` — default `0` (recomendado)
   - `@ActivarMotorTodasEmpresas` — default `0` (recomendado)
3. Si solo una empresa piloto: dejar flags en 0 y luego licenciar/activar a mano (ver § Activación piloto).
4. Ejecutar **solo tras autorización**.

### 3) SQL — Parámetro ESTATUS_ORDENES (opcional)

Archivo: `AlahiaPosApi/Scripts/Deploy_Parametro_EstatusOrdenes_Prod.sql`

- `@CONFIRMO_PROD = 1`
- `@IdEmpresa = <empresa piloto>`
- Valor default en Prod: `'false'` (encender en UI Parámetros si se desea)

### 4) API

1. Publicar `AlahiaPosApi` (Release) con:
   - Servicios `Produccion/*`
   - `ProduccionController`, Hub SignalR
   - Adapter POS + `TipoOrden` en `FacturaHeaderController.Post`
   - Eventos `ProduccionTrabajoSolicitado` / `Actualizado`
2. Confirmar `appsettings` Prod apunta a `AlahiaPos_Prod`.
3. Reiniciar IIS / servicio.

### 5) Frontend

1. Build Ionic/Angular producción.
2. Incluir:
   - `centro-produccion/*`
   - `ordenes` (estatus + SignalR)
   - `produccion.service` / models
   - `cart` estilos + `COMISION_EMPLEADO`
   - `categorias` imágenes full-bleed
   - POS: `tipoOrden` + **print solo si check**
3. Deploy hosting / `www`.

### 6) Activación piloto (recomendado)

Para **una** empresa (ej. Flawless Laundry):

```sql
-- Ejemplo (ajustar IdEmpresa). NO ejecutar sin autorización.
DECLARE @IdEmpresa INT = <ID>;

-- Licencia módulos CP
INSERT INTO dbo.Empresa_Modulos (EmpresaId, ModuloId, Activo, FechaActivacion)
SELECT @IdEmpresa, m.Id, 1, GETDATE()
FROM dbo.Modulos m
WHERE m.Codigo IN (
  N'CENTRO_PRODUCCION', N'PRODUCCION_GESTIONAR', N'PRODUCCION_CANCELAR',
  N'PRODUCCION_PRIORIDAD', N'PRODUCCION_CONFIG'
)
AND NOT EXISTS (
  SELECT 1 FROM dbo.Empresa_Modulos em
  WHERE em.EmpresaId = @IdEmpresa AND em.ModuloId = m.Id
);

-- Perfil Admin
INSERT INTO dbo.PerfilRoles (IdPerfil, IdModulo, Activo, FechaInsercion, IdEmpresa)
SELECT p.IdPerfil, m.Id, 1, GETDATE(), @IdEmpresa
FROM dbo.Perfiles p
CROSS JOIN dbo.Modulos m
WHERE p.IdEmpresa = @IdEmpresa
  AND (p.Nombre LIKE N'%Admin%')
  AND m.Codigo IN (
    N'CENTRO_PRODUCCION', N'PRODUCCION_GESTIONAR', N'PRODUCCION_CANCELAR',
    N'PRODUCCION_PRIORIDAD', N'PRODUCCION_CONFIG'
  )
  AND NOT EXISTS (
    SELECT 1 FROM dbo.PerfilRoles pr
    WHERE pr.IdPerfil = p.IdPerfil AND pr.IdModulo = m.Id AND pr.IdEmpresa = @IdEmpresa
  );

UPDATE dbo.ProduccionConfiguracionEmpresa SET Activo = 1 WHERE IdEmpresa = @IdEmpresa;

-- Órdenes en POS + badge estatus (opcional)
MERGE dbo.Parametros AS t
USING (SELECT @IdEmpresa AS IdEmpresa, N'ESTATUS_ORDENES' AS Clave) AS s
ON t.IdEmpresa = s.IdEmpresa AND t.Clave = s.Clave
WHEN MATCHED THEN UPDATE SET Valor = N'true', Activo = 1
WHEN NOT MATCHED THEN INSERT (IdEmpresa, Tipo, Clave, Valor, Descripcion, FechaCreacion, Activo)
VALUES (@IdEmpresa, N'EMPRESA', N'ESTATUS_ORDENES', N'true',
  N'Muestra estados de producción en listado de órdenes', GETDATE(), 1);

-- USAS_ORDENES si no existe
IF NOT EXISTS (SELECT 1 FROM dbo.Parametros WHERE IdEmpresa = @IdEmpresa AND Clave = N'USAS_ORDENES')
  INSERT INTO dbo.Parametros (IdEmpresa, Tipo, Clave, Valor, Descripcion, FechaCreacion, Activo)
  VALUES (@IdEmpresa, N'EMPRESA', N'USAS_ORDENES', N'true', N'Habilita órdenes en POS', GETDATE(), 1);
```

### 7) Smoke post-deploy

| Check | Esperado |
|-------|----------|
| `GET /api/produccion/config?idEmpresa=X` | 200, `activo: true` (piloto) |
| Hub `/hubs/produccion` | Conecta |
| Crear orden POS | Trabajo en tablero |
| Transición → Lista | Badge en listado si `ESTATUS_ORDENES` |
| Factura sin check imprimir | **No** llama printer |
| Tipo orden (Llevar/Delivery) | Chip en tablero |

---

## Pre-requisitos de código

Antes de publicar, conviene **commitear / PR** en ambos repos lo relacionado a CP (hoy hay mucho WIP mezclado: contabilidad, FE, etc.). Scope mínimo sugerido:

**API**
- `Servicios/Produccion/**`
- `Controllers/ProduccionController.cs`
- `Hubs/ProduccionHub` (+ registro en `Program.cs`)
- Adapter + cambios `FacturaHeaderController` (TipoOrden + publicar orden)
- DTOs/eventos/interfaces producción

**FE**
- `centro-produccion/**`, `produccion.service`, models
- Rutas/menú `CENTRO_PRODUCCION`
- `ordenes` estatus, `cart`, `categorias` CSS, POS print/tipoOrden

---

## Autorización

Para ejecutar scripts o deploy contra **Prod**, responder en el chat con autorización explícita, por ejemplo:

> Autorizo ejecutar `Deploy_CentroProduccion_Etapa1_Prod.sql` en `AlahiaPos_Prod`

Sin eso, **no se ejecuta nada en Prod**.
