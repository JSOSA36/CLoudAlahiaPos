import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { MetodosPagoCuentaComponent } from './Components/metodos-pago-cuenta/metodos-pago-cuenta.component';

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
    path: 'cuentaxcobrar',
    loadChildren: () => import('./facturasporcobrar/facturasporcobrar.module').then(m => m.FacturasporcobrarModule),
    
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
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
