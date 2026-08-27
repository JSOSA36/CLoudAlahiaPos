import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { MetodosPagoCuentaComponent } from './Components/metodos-pago-cuenta/metodos-pago-cuenta.component';
import { FeConfiguracionComponent } from './facturacion-electronica/fe-configuracion.component';
import { FeSecuenciasComponent } from './facturacion-electronica/fe-secuencias.component';
import { FeCertificadoComponent } from './facturacion-electronica/fe-certificado.component';
import { FeEstadoDgiiComponent } from './facturacion-electronica/fe-estado-dgii.component';
import { FeHistorialComponent } from './facturacion-electronica/fe-historial.component';
import { FeReprocesarComponent } from './facturacion-electronica/fe-reprocesar.component';
import { FeMonitoreoComponent } from './facturacion-electronica/fe-monitoreo.component';
import { PoliticasAdminComponent } from './politicas/politicas-admin.component';
import { PoliticasAceptacionesComponent } from './politicas/politicas-aceptaciones.component';
import { ServicioSuspendidoComponent } from './suscripciones/servicio-suspendido.component';
import { CobrosAdminComponent } from './suscripciones/cobros-admin.component';
import { EmpresasAdminComponent } from './Empresa/empresas-admin/empresas-admin.component';
import { PagoSuscripcionComponent } from './suscripciones/pago-suscripcion.component';
import { TicketsComponent } from './tickets/tickets.component';
import { TicketsAdminComponent } from './tickets/tickets-admin.component';
import { CentroProduccionComponent } from './centro-produccion/centro-produccion.component';
import { AlahiaAiComponent } from './alahia-ai/alahia-ai.component';
import { AlahiaAiConfigComponent } from './alahia-ai/alahia-ai-config.component';

const routes: Routes = [
  {
    path: 'dashboard-gerencial',
    loadChildren: () => import('./dashboard-gerencial/dashboard-gerencial.module').then(m => m.DashboardGerencialModule),
    canActivate: [AuthGuard]
  },
  // Compatibilidad: rutas legacy del dashboard Ionic "folder"
  {
    path: 'folder',
    redirectTo: 'dashboard-gerencial',
    pathMatch: 'full'
  },
  {
    path: 'folder/:id',
    redirectTo: 'dashboard-gerencial'
  },
  {
    path: 'productos',
    loadChildren: () => import('./dashboard-gerencial/dashboard-gerencial.module').then(m => m.DashboardGerencialModule),
    canActivate: [AuthGuard]
  },
   {
    path: 'movimientosinventario',
    loadChildren: () => import('./Components/historico-movimientos-inventario/historico-movimientos-inventario.module').then(m => m.HistoricoMovimientosInventarioModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'conduces',
    loadChildren: () => import('./Components/conduces/conduces.module').then(m => m.ConducesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'cuentafinanciera',
    loadChildren: () => import('./Components/cuentas-financieras/cuentas-financieras.module').then(m => m.CuentasFinancierasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'transferenciasfinancieras',
    loadChildren: () => import('./Components/transferencias-financieras/transferencias-financieras.module').then(m => m.TransferenciasFinancierasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'movimientosfinancieros',
    loadChildren: () => import('./Components/movimientos-financieros/movimientos-financieros.module').then(m => m.MovimientosFinancierosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'conciliacionbancaria',
    loadChildren: () => import('./Components/conciliacion-bancaria/conciliacion-bancaria.module').then(m => m.ConciliacionBancariaModule),
    canActivate: [AuthGuard]
  },
  {
    // Extracto queda como capacidad interna del Centro de Conciliación (entrada contextual).
    path: 'extractobancario',
    redirectTo: 'conciliacionbancaria',
    pathMatch: 'full'
  },
  {
  path:'metodopagocuentas',

  component:
    MetodosPagoCuentaComponent,

  canActivate:[AuthGuard]
},
   {
    path: 'listadocaja',
    loadChildren: () => import('./Components/listado-caja/listado-caja.module').then(m => m.ListadoCajaModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'movimientocaja',
    loadChildren: () => import('./Components/movimiento-caja/movimiento-caja.module').then(m => m.MovimientoCajaModule),
    canActivate: [AuthGuard]
  },
   {
    path: 'cierrecaja',
    loadChildren: () => import('./Components/cierre-caja/cierre-caja.module').then(m => m.CierreCajaModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'reporte607',
    loadChildren: () => import('./Components/reporte607/reporte607.module').then(m => m.Reporte607Module),
    canActivate: [AuthGuard]
  },
  {
    path: 'reporte-it1',
    loadChildren: () => import('./Components/reporte-it1/reporte-it1.module').then(m => m.ReporteIt1Module),
    canActivate: [AuthGuard]
  },
  {
    path: 'reporte-ir17',
    loadChildren: () => import('./Components/reporte-ir17/reporte-ir17.module').then(m => m.ReporteIr17Module),
    canActivate: [AuthGuard]
  },
  {
    path: 'reporte-ir3',
    loadChildren: () => import('./Components/reporte-ir3/reporte-ir3.module').then(m => m.ReporteIr3Module),
    canActivate: [AuthGuard]
  },
  {
    path: 'reporteperdidas',
    loadChildren: () => import('./Components/reporte-perdidas/reporte-perdidas.module').then(m => m.ReportePerdidasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'bizcocho',
    loadChildren: () => import('./bizcocho/listado-encargos/listado-encargos.module').then(m => m.ListadoEncargosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'listadopago',
    loadChildren: () => import('./pagos/pagos-list/pagos-list.module').then(m => m.PagosListModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'comisiones',
    loadChildren: () => import('./Comisiones/cajas/comisiones.module').then(m => m.ComisionesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'turno',
    loadChildren: () => import('./Turnos/turnos/turnos.module').then(m => m.TurnosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'Descuento',
    loadChildren: () => import('./descuento-list/descuento-list.module').then(m => m.DescuentoListModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'cuentaxpagar',
    loadChildren: () => import('./CuentaxPagar/cuentax-pagar/cuentaxpagar.module').then(m => m.CuentaxPagarModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'empleadocomision',
    loadChildren: () => import('./empleado-comision/empleadocomision.module').then(m => m.EmpleadocomisionModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'listadoempleadocomision',
    loadChildren: () => import('./EmpleadoListado/listadoempleados/listadoempleadosComision.module').then(m => m.ListadoempleadosComisionComponentModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'reporteservicios',
    loadChildren: () => import('./ReporteServicio/reporteservicios/reporteservicios.module').then(m => m.ReporteserviciosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'area',
    loadChildren: () => import('./Areas/area/area.module').then(m => m.AreaModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'almacenes',
    loadChildren: () => import('./Almacenes/listado-almacenes/listado-almacenes.module').then(m => m.ListadoAlmacenesModule),
    canActivate: [AuthGuard]
  },
  
  {
    path: 'Ordenes',
    loadChildren: () => import('./Ordenes/ordenes/ordenes.module').then(m => m.OrdenesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'productosadd',
    loadChildren: () => import('./ProductosAdd/productos-add/productosadd.module').then(m => m.ProductosAddModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'citas',
    loadChildren: () => import('./Citas/citas/citas.module').then(m => m.CitasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'horarioestilista',
    loadChildren: () => import('./HorarioEstilista/horarioestilista/horarioestilista.module').then(m => m.HorarioestilistaModule),
    canActivate: [AuthGuard]
  },
   {
    path: 'reporteventa',
    loadChildren: () => import('./cajas/cajas/cajas.module').then(m => m.CajasModule),
    canActivate: [AuthGuard]
  },
   {
    path: 'ncfsecuencias',
    loadChildren: () => import('./ncf-secuencias/ncf-secuencias.module').then(m => m.NcfSecuenciasModule),
    canActivate: [AuthGuard]
  },
  
  {
    path: 'citadd',
    loadChildren: () => import('./Citas/citasadd/citasadd.module').then(m => m.ClienteaddModule),
    canActivate: [AuthGuard]
  },

  // 👇 ESTA ES LA RUTA PÚBLICA PARA CLIENTES (sin guard)
  {
    path: 'citainicio/:guid',
    loadChildren: () => import('./Citas/citainicio/citainicio.module').then(m => m.CitainicioModule)
  },

  {
    path: 'empresa',
    loadChildren: () => import('./Empresa/empresa/empresa.module').then(m => m.EmpresaModule),
    
  },
  {
    path: 'agente-impresion',
    redirectTo: 'impresion-termica',
    pathMatch: 'full'
  },
  {
    path: 'impresion-termica',
    loadChildren: () =>
      import('./Components/agente-impresion/agente-impresion.module').then(
        (m) => m.AgenteImpresionModule
      ),
    canActivate: [AuthGuard]
  },
   {
    path: 'cuentaxcobrar',
    loadChildren: () => import('./facturasporcobrar/facturasporcobrar.module').then(m => m.FacturasporcobrarModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'printer',
    loadChildren: () => import('./printer/printer/printer.module').then(c => c.PrinterModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'consumolavador',
    loadChildren: () => import('./lavador-dashboard/lavador-dashboard.module').then(c => c.LavadorDashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'historicofact',
    loadChildren: () => import('./HisotricoFacturas/CuentaPorCobrar/cuenta-por-cobrar/historicofact.module').then(c => c.HistoricofactModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'listadodevoluciones',
    loadChildren: () => import('./listado-notas-credito/listado-notas-credito.module').then(m => m.ListadoNotasCreditoModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'notascreditoaplicadas',
    loadChildren: () => import('./notas-credito-aplicadas/notas-credito-aplicadas.module').then(m => m.NotasCreditoAplicadasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'saldosafavor',
    loadChildren: () => import('./saldos-a-favor/saldos-a-favor.module').then(m => m.SaldosAFavorModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'notascredito',
    loadChildren: () => import('./notas-credito-clientes/notas-credito-clientes.module').then(m => m.NotasCreditoClientesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'listadomesa',
    loadChildren: () => import('./listado_mesas/listado-mesa.module').then(c => c.ListadoMesaModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'ParametrosConfig',
    loadChildren: () => import('./parametros-config/parametros-config.module').then(c => c.ParametrosConfigModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'IngresosAdd',
    loadChildren: () => import('./ingresos-add/ingresos-add.module').then(c => c.IngresosAddModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'pos',
    loadChildren: () => import('./Pos/pos/pos.module').then(c => c.PosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'Listadoingresos',
    loadChildren: () => import('./ingresos-list/ingresos-list.module').then(c => c.IngresosListModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'Categoria',
    loadChildren: () => import('./categorias/categorias.module').then(m => m.CategoriasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'Userlistado',
    loadChildren: () => import('./listado-usuarios/listado-usuarios.module').then(m => m.ListadoUsuariosModule),
    canActivate: [AuthGuard]
  },
  {
  path: 'catalogo/:guid',
  loadChildren: () => import('./catalogo-inicio/catalogo-inicio.module').then(m => m.CatalogoInicioModule)
},
{
  path: 'empleados',
  loadChildren: () => import('./listado-empleados/listado-empleados.module')
    .then(m => m.ListadoEmpleadosModule),
  canActivate: [AuthGuard],
  data: { tipo: 'empleado' }
},
{
  path: 'rrhh-departamentos',
  loadComponent: () => import('./rrhh/rrhh-departamentos.component')
    .then(m => m.RrhhDepartamentosComponent),
  canActivate: [AuthGuard]
},
{
  path: 'rrhh-cargos',
  loadComponent: () => import('./rrhh/rrhh-cargos.component')
    .then(m => m.RrhhCargosComponent),
  canActivate: [AuthGuard]
},
{
  path: 'rrhh-beneficios',
  loadComponent: () => import('./rrhh/rrhh-beneficios.component')
    .then(m => m.RrhhBeneficiosComponent),
  canActivate: [AuthGuard]
},
{
  path: 'rrhh-laboral',
  loadComponent: () => import('./rrhh-laboral/rrhh-laboral.component')
    .then(m => m.RrhhLaboralComponent),
  canActivate: [AuthGuard]
},
{
  path: 'rrhh-ponchador',
  loadComponent: () => import('./rrhh/rrhh-ponchador.component')
    .then(m => m.RrhhPonchadorComponent),
  canActivate: [AuthGuard]
},
{
  path: 'rrhh-asistencia',
  loadComponent: () => import('./rrhh/rrhh-asistencia.component')
    .then(m => m.RrhhAsistenciaComponent),
  canActivate: [AuthGuard]
},
{
  path: 'rrhh-permisos',
  loadComponent: () => import('./rrhh/rrhh-permisos.component')
    .then(m => m.RrhhPermisosComponent),
  canActivate: [AuthGuard]
},
{
  path: 'rrhh-nomina',
  loadComponent: () => import('./rrhh/rrhh-nomina.component')
    .then(m => m.RrhhNominaComponent),
  canActivate: [AuthGuard]
},
{
  path: 'produccion-recetas',
  loadComponent: () => import('./manufactura/manufactura-recetas.component')
    .then(m => m.ManufacturaRecetasComponent),
  canActivate: [AuthGuard]
},
{
  path: 'produccion-ordenes',
  loadComponent: () => import('./manufactura/manufactura-ordenes.component')
    .then(m => m.ManufacturaOrdenesComponent),
  canActivate: [AuthGuard]
},

{
  path: 'usuarios',
  loadChildren: () => import('./listado-usuarios/listado-usuarios.module')
    .then(m => m.ListadoUsuariosModule),
  canActivate: [AuthGuard],
  data: { tipo: 'usuario' }
},

  {
    path: '',
    loadChildren: () => import('./login/login/login.module').then(m => m.LoginModule)
  },
 

  {
    path: 'login',
    loadChildren: () => import('./login/login/login.module').then(m => m.LoginModule)
  },
  {
    // Cotizador público (web): sin AuthGuard. Solo consume la API.
    path: 'cotizador',
    loadChildren: () => import('./cotizador/cotizador.module').then(m => m.CotizadorModule)
  },
  {
    path: 'pedir/:slug',
    loadChildren: () => import('./pedir/pedir.module').then(m => m.PedirModule)
  },
  {
    path: 'reparto',
    loadChildren: () => import('./reparto/reparto.module').then(m => m.RepartoModule)
  },
  {
    path: 'pedidos-delivery',
    loadChildren: () => import('./pedidos-delivery/pedidos-delivery.module').then(m => m.PedidosDeliveryModule),
    canActivate: [AuthGuard]
  },
  {
    // Cotización POS pública: clientes de Alahia la envían a sus clientes (WhatsApp/link).
    path: 'cotizacion',
    loadChildren: () =>
      import('./cotizacion-cliente/cotizacion-cliente.module').then(
        (m) => m.CotizacionClienteModule
      ),
  },
  {
  path: 'usuarios',
  loadChildren: () => import('./listado-usuarios/listado-usuarios.module')
                        .then(m => m.ListadoUsuariosModule),
  canActivate: [AuthGuard]
},

  {
    path: 'listadogastos',
    loadChildren: () => import('./Gastos/listadogastos/listadogastos.module').then(m => m.ListadogastosModule),
    canActivate: [AuthGuard]
  },
  
  {
    path: 'perfiles',
    loadChildren: () => import('./perfiles/perfiles.module').then(m => m.PerfilesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'ListadoEmpleados',
    loadChildren: () => import('./listado-empleados/listado-empleados.module').then(m => m.ListadoEmpleadosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'clientemodal',
    loadChildren: () => import('./Clientes/clientes/clientes.module').then(m => m.ClientesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'clientehappy',
    loadChildren: () => import('./Clientes/clienteshappy/clienteshappy.module').then(m => m.ClienteshappyModule),
    canActivate: [AuthGuard]
  },
  
  {
    path: 'Listadocategorias',
    loadChildren: () => import('./categorias/listadocategorias/listadocategorias.module').then(m => m.ListadocategoriasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'categoria_add',
    loadChildren: () => import('./categorias/listadocategorias/listadocategorias.module').then(m => m.ListadocategoriasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'Gastos',
    loadChildren: () => import('./Gastos/listadogastos/listadogastos.module').then(m => m.ListadogastosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'listproducto',
    loadChildren: () => import('./productos/productos/productos.module').then(m => m.ProductosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'planes',
    loadChildren: () => import('./whatsapp-planes/whatsapp-planes.module').then(m => m.WhatsappPlanesModule),
    canActivate: [AuthGuard]
  },
  
  {
    path: 'ficha-clinica',
    loadChildren: () => import('./ficha-clinica/ficha-clinica.module')
      .then(m => m.FichaClinicaModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'documentosclinicos',
    loadChildren: () => import('./DocumentosClinicos/listado-documentos-clinicos/listado-documentos-clinicos.module')
      .then(m => m.ListadoDocumentosClinicosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'historialservicios',
    loadChildren: () => import('./HistorialServicios/historial-servicios/historial-servicios.module')
      .then(m => m.HistorialServiciosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'cart',
    loadChildren: () => import('./cart/cart.module').then(m => m.CartModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'loginkds',
    loadChildren: () => import('./loginkds/loginkds.module').then(m => m.LoginkdsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidad',
    loadChildren: () => import('./Components/contabilidad-inicio/contabilidad-inicio.module').then(m => m.ContabilidadInicioModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidadcuentas',
    loadChildren: () => import('./Components/contabilidad-cuentas/contabilidad-cuentas.module').then(m => m.ContabilidadCuentasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidadasientos',
    loadChildren: () => import('./Components/contabilidad-asientos/contabilidad-asientos.module').then(m => m.ContabilidadAsientosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidadlibrodiario',
    loadChildren: () => import('./Components/contabilidad-libro-diario/contabilidad-libro-diario.module').then(m => m.ContabilidadLibroDiarioModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidadmayorgeneral',
    loadChildren: () => import('./Components/contabilidad-mayor-general/contabilidad-mayor-general.module').then(m => m.ContabilidadMayorGeneralModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidadbalancecomprobacion',
    loadChildren: () => import('./Components/contabilidad-balance-comprobacion/contabilidad-balance-comprobacion.module').then(m => m.ContabilidadBalanceComprobacionModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidadestadoresultados',
    loadChildren: () => import('./Components/contabilidad-estado-resultados/contabilidad-estado-resultados.module').then(m => m.ContabilidadEstadoResultadosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidadbalancegeneral',
    loadChildren: () => import('./Components/contabilidad-balance-general/contabilidad-balance-general.module').then(m => m.ContabilidadBalanceGeneralModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidadconsultaasientos',
    loadChildren: () => import('./Components/contabilidad-consulta-asientos/contabilidad-consulta-asientos.module').then(m => m.ContabilidadConsultaAsientosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidadcierre',
    loadChildren: () => import('./Components/contabilidad-cierre/contabilidad-cierre.module').then(m => m.ContabilidadCierreModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'contabilidadconfiguracionintegracion',
    loadChildren: () => import('./Components/contabilidad-configuracion-integracion/contabilidad-configuracion-integracion.module').then(m => m.ContabilidadConfiguracionIntegracionModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'proveedores',
    loadChildren: () => import('./Proveedores/proveedores.module').then(m => m.ProveedoresModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'compras',
    loadChildren: () => import('./Compras/compras.module').then(m => m.ComprasModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'activos-fijos',
    loadChildren: () => import('./ActivosFijos/activos-fijos.module').then(m => m.ActivosFijosModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'reportes',
    loadChildren: () => import('./Reportes/reportes.module').then(m => m.ReportesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'fe-configuracion',
    component: FeConfiguracionComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'fe-secuencias',
    component: FeSecuenciasComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'fe-certificado',
    component: FeCertificadoComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'fe-estado-dgii',
    component: FeEstadoDgiiComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'fe-historial',
    component: FeHistorialComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'fe-reprocesar',
    component: FeReprocesarComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'fe-monitoreo',
    component: FeMonitoreoComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'politicas-admin',
    component: PoliticasAdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'politicas-aceptaciones',
    component: PoliticasAceptacionesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'servicio-suspendido',
    component: ServicioSuspendidoComponent
  },
  {
    path: 'cobros-admin',
    component: CobrosAdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'empresas-admin',
    component: EmpresasAdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'pago-suscripcion',
    component: PagoSuscripcionComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'tickets',
    component: TicketsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'tickets-admin',
    component: TicketsAdminComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'centro-produccion',
    component: CentroProduccionComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'alahia-ai',
    component: AlahiaAiComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'alahia-ai/config',
    component: AlahiaAiConfigComponent,
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
