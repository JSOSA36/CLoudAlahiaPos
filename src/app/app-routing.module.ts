import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'folder',
    redirectTo: 'folder/Inbox',
    pathMatch: 'full'
  },
  {
    path: 'folder/:id',
    loadChildren: () => import('./folder/folder.module').then(m => m.FolderPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'productos',
    loadChildren: () => import('./folder/folder.module').then(m => m.FolderPageModule),
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
    path: 'Ordenes',
    loadChildren: () => import('./CuentaPorCobrar/cuenta-por-cobrar/cuentaxcobrar.module').then(m => m.CuentaPorCobrarModule),
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
    path: 'cart',
    loadChildren: () => import('./cart/cart.module').then(m => m.CartModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'loginkds',
    loadChildren: () => import('./loginkds/loginkds.module').then(m => m.LoginkdsModule),
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
