import { NgModule, CUSTOM_ELEMENTS_SCHEMA, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { HttpClientModule } from '@angular/common/http';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ReporteserviciosComponent } from './ReporteServicio/reporteservicios/reporteservicios.component';
// 🔹 Formularios
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PoliticasComponent } from './politicas/politicas.component';
// 🔹 Animaciones y QR
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { QRCodeModule } from 'angularx-qrcode';

// 🔹 Componentes propios
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { PosComponent } from './Pos/pos/pos.component';
import { LoginComponent } from './login/login/login.component';
import { CajasComponent } from './cajas/cajas/cajas.component';
import { ProductosAddComponent } from './ProductosAdd/productos-add/productosadd.component';
import { CuentaxPagarComponent } from './CuentaxPagar/cuentax-pagar/cuentaxpagar.component';
import { OrdenesComponent } from './Ordenes/ordenes/ordenes.component';
import { ListadoMesasComponent } from './listado_mesas/listadomesas.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { LoginkdsComponent } from './loginkds/loginkds.component';
import { PrinterComponent } from './printer/printer.component';
import { CotizacionPrintComponent } from './cotizacion-print/cotizacion-print.component';
import { MovimientoInventarioPrintComponent } from './movimiento-inventario-print/movimiento-inventario-print.component';
import { CartComponent } from './cart/cart.component';
import { ClientesAddComponent } from './Modales/clientesadd.component';
import { ClientesComponent } from './Clientes/clientes/clientes.component';
import { TurnosComponent } from './Turnos/turnos/turnos.component';
import { ComisionesComponent } from './Comisiones/cajas/comisiones.component';
import { ListadocategoriasComponent } from './categorias/listadocategorias/listadocategorias.component';
import { CategoriaAddComponent } from './categorias/categoria-add/categoria-add.component';
import { LicenciaModalComponent } from './Contrato/licencia-modal/licencia-modal.component';
import { ProductosComponent } from './productos/productos/productos.component';
import { ClienteshappyComponent } from './Clientes/clienteshappy/clienteshappy.component';
import { CitaAddComponent } from './Citas/citasadd/citasadd.component';
import { CitasComponent } from './Citas/citas/citas.component';
import { GastoFormPage } from './Gastos/gastoadd/gastoadd.component';
import { ListadogastosComponent } from './Gastos/listadogastos/listadogastos.component';
import { ListadoDocumentosClinicosComponent } from './DocumentosClinicos/listado-documentos-clinicos/listado-documentos-clinicos.component';
import { DocumentoClinicoFormComponent } from './DocumentosClinicos/documento-clinico-form/documento-clinico-form.component';
import { AreaComponent } from './Areas/area/area.component';
import { ListadoAlmacenesComponent } from './Almacenes/listado-almacenes/listado-almacenes.component';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './servicios/interceptorauth.services';
import { ModalmesasComponent } from './Modales/modalmesas.component';
import { EmpleadoComisionComponent } from './empleado-comision/empleado-comision.component';
import { HorarioestilistaAddComponent } from './HorarioEstilista/horarioestilista-add/horarioestilista-add.component';
import { HorarioestilistaComponent } from './HorarioEstilista/horarioestilista/horarioestilista.component';
import { EmpresaComponent } from './Empresa/empresa/empresa.component';
// 🔹 Plugins
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
import { CitainicioComponent } from './Citas/citainicio/citainicio.component';
// 🔹 Servicios
import { CitasService } from './servicios/citas.service';
import { VerificaciontelefonoComponent } from './Verificacion/verificaciontelefono/verificaciontelefono.component';
import { CredencialesModalComponent } from './crear-usuario/credencialesmodalcomponent';
import { UsuarioformComponent } from './usuarioform/usuarioform.component';
import { ListadoUsuariosComponent } from './listado-usuarios/listado-usuarios.component';
import { MessageModalComponent } from './message-modal/message-modal.component';
import { CatalogoInicioComponent } from './catalogo-inicio/catalogo-inicio.component';
import { FacturasporcobrarComponent } from './facturasporcobrar/facturasporcobrar.component';
import { PagoFacturaComponent } from './pago-factura/pago-factura.component';
import { IngresosAddComponent } from './ingresos-add/ingresos-add.component';
import { IngresosListComponent } from './ingresos-list/ingresos-list.component';
import { DashboardGerencialComponent } from './dashboard-gerencial/dashboard-gerencial.component';
import { DescuentoFormComponent } from './descuento-form/descuento-form.component';
import { DescuentoListComponent } from './descuento-list/descuento-list.component';
import { ClienteVozComponent } from './modals/cliente-voz/cliente-voz.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { PerfilesComponent } from './perfiles/perfiles.component';
import { EmpleadoFormComponent } from './listado-empleados/empleado-form/empleado-form.component';
import { ListadoempleadosComisionComponent } from './EmpleadoListado/listadoempleados/listadoempleadosComision.component';
import { ListadoEmpleadosComponent } from './listado-empleados/listado-empleados.component';
import { HoraRdPipe } from './pipes/hora-rd.pipe';
import { PagoEncargoComponent } from './bizcocho/pago-encargo/pago-encargo.component';
import { FormEncargosComponent } from './bizcocho/form-encargos/form-encargos.component';
import { WhatsappPlanesComponent } from './whatsapp-planes/whatsapp-planes.component';
import { ParametrosConfigComponent } from './parametros-config/parametros-config.component';
import { LavadorDashboardComponent } from './lavador-dashboard/lavador-dashboard.component';
import { DevolucionFacturaComponent } from 'src/app/Modales/devolucion-factura/devolucion-factura.component';
import { AnularFacturaComponent } from 'src/app/Modales/anular-factura/anular-factura.component';
import { AnularGastoComponent } from 'src/app/Modales/anular-gasto/anular-gasto.component';
import { PagoProveedorModalComponent } from 'src/app/Modales/pago-proveedor/pago-proveedor-modal.component';
import { HistorialPagosProveedorComponent } from 'src/app/Modales/historial-pagos-proveedor/historial-pagos-proveedor.component';
import { NotaCreditoPreviewComponent } from './nota-credito-preview/nota-credito-preview.component';
import { ListadoNotasCreditoComponent } from './listado-notas-credito/listado-notas-credito.component';
import { HistoricofactComponent } from './HisotricoFacturas/CuentaPorCobrar/cuenta-por-cobrar/historicofact.component';
import { NcfSecuenciasComponent } from './ncf-secuencias/ncf-secuencias.component';
import { Reporte607Component } from './Components/reporte607/reporte607.component';
import { ReportePerdidasComponent } from './Components/reporte-perdidas/reporte-perdidas.component';
import { PagosListComponent } from './pagos/pagos-list/pagos-list.component';
import { CierreCajaComponent } from './Components/cierre-caja/cierre-caja.component';
import { ListadoEncargosComponent } from './bizcocho/listado-encargos/listado-encargos.component';
import { AperturaCajaComponent } from './Components/apertura-caja/apertura-caja.component';
import { ListadoCajaComponent } from './Components/listado-caja/listado-caja.component';
import {MovimientosInventarioComponent} from './Components/movimientos-inventario/movimientos-inventario.component';
import { MovimientoCajaComponent } from './Components/movimiento-caja/movimiento-caja.component';
import { MetodosPagoCuentaComponent } from './Components/metodos-pago-cuenta/metodos-pago-cuenta.component';
import { ModalCuentaFinancieraComponent } from './Components/modal-cuenta-financiera/modal-cuenta-financiera.component';
import { CuentasFinancierasComponent } from './Components/cuentas-financieras/cuentas-financieras.component';
import { ModalMetodoPagoCuentaComponent } from './Components/modal-metodo-pago-cuenta/modal-metodo-pago-cuenta.component';
import { ModalTransferenciaFinancieraComponent } from './Components/modal-transferencia-financiera/modal-transferencia-financiera.component';
import { MovimientosFinancierosComponent } from './Components/movimientos-financieros/movimientos-financieros.component';
import { HistoricoMovimientosInventarioComponent } from './Components/historico-movimientos-inventario/historico-movimientos-inventario.component';
import { HistorialServiciosComponent } from './HistorialServicios/historial-servicios/historial-servicios.component';
import { ContabilidadCuentasComponent } from './Components/contabilidad-cuentas/contabilidad-cuentas.component';
import { ContabilidadAsientosComponent } from './Components/contabilidad-asientos/contabilidad-asientos.component';
import { ContabilidadLibroDiarioComponent } from './Components/contabilidad-libro-diario/contabilidad-libro-diario.component';
import { ContabilidadMayorGeneralComponent } from './Components/contabilidad-mayor-general/contabilidad-mayor-general.component';
import { ContabilidadBalanceComprobacionComponent } from './Components/contabilidad-balance-comprobacion/contabilidad-balance-comprobacion.component';
import { ContabilidadEstadoResultadosComponent } from './Components/contabilidad-estado-resultados/contabilidad-estado-resultados.component';
import { ContabilidadBalanceGeneralComponent } from './Components/contabilidad-balance-general/contabilidad-balance-general.component';
import { ContabilidadConsultaAsientosComponent } from './Components/contabilidad-consulta-asientos/contabilidad-consulta-asientos.component';
import { ContabilidadCierreComponent } from './Components/contabilidad-cierre/contabilidad-cierre.component';
import { ContabilidadConfiguracionIntegracionComponent } from './Components/contabilidad-configuracion-integracion/contabilidad-configuracion-integracion.component';
import { ModalCuentaContableComponent } from './Components/modal-cuenta-contable/modal-cuenta-contable.component';
import { ModalAsientoContableComponent } from './Components/modal-asiento-contable/modal-asiento-contable.component';
import { ContabilidadInicioComponent } from './Components/contabilidad-inicio/contabilidad-inicio.component';
import { ProveedoresComponent } from './Proveedores/proveedores/proveedores.component';
import { ProveedorFormComponent } from './Proveedores/proveedor-form/proveedor-form.component';
import { FacturasCompraComponent } from './Compras/facturas-compra/facturas-compra.component';
import { FacturaCompraFormComponent } from './Compras/factura-compra-form/factura-compra-form.component';
import { OrdenesCompraComponent } from './Compras/ordenes-compra/ordenes-compra.component';
import { ProductoLineaBusquedaComponent } from './Compras/shared/producto-linea-busqueda/producto-linea-busqueda.component';
import { CxpProveedoresComponent } from './Compras/cxp-proveedores/cxp-proveedores.component';
import { EstadoCuentaProveedorComponent } from './Compras/estado-cuenta-proveedor/estado-cuenta-proveedor.component';
import { AnalisisProductoProveedorComponent } from './Compras/analisis-producto-proveedor/analisis-producto-proveedor.component';
import { Reporte606Component } from './Compras/reporte-606/reporte-606.component';
import { ActivosFijosListComponent } from './ActivosFijos/activos-fijos-list/activos-fijos-list.component';
import { ActivoFijoDetalleComponent } from './ActivosFijos/activo-fijo-detalle/activo-fijo-detalle.component';
import { ReporteProductosComponent } from './Reportes/reporte-productos/reporte-productos.component';
import { ReporteProveedoresComponent } from './Reportes/reporte-proveedores/reporte-proveedores.component';
import { ReporteClientesComponent } from './Reportes/reporte-clientes/reporte-clientes.component';
import { ReporteEmpleadosComponent } from './Reportes/reporte-empleados/reporte-empleados.component';
import { CuentaContableSelectorComponent } from './Components/cuenta-contable-selector/cuenta-contable-selector.component';
@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    CajasComponent,
    ResetPasswordComponent,
    IngresosListComponent,
    MovimientosInventarioComponent,
    HistoricoMovimientosInventarioComponent,
    EmpleadoFormComponent,
    MovimientoCajaComponent,
    MovimientosFinancierosComponent,
    MetodosPagoCuentaComponent,
    ModalMetodoPagoCuentaComponent,
    ModalCuentaFinancieraComponent,
    ModalTransferenciaFinancieraComponent,
    CuentasFinancierasComponent,
    AperturaCajaComponent,
    CierreCajaComponent,
    FormEncargosComponent,
    ListadoEncargosComponent,
    Reporte607Component,
    ReportePerdidasComponent,
    PagosListComponent,
    ListadoCajaComponent,
    ClienteVozComponent,
    DashboardGerencialComponent,
    ParametrosConfigComponent,
    NcfSecuenciasComponent,
    ForgotPasswordComponent,
    HistoricofactComponent,
    DevolucionFacturaComponent,
    AnularFacturaComponent,
    AnularGastoComponent,
    PagoProveedorModalComponent,
    HistorialPagosProveedorComponent,
    NotaCreditoPreviewComponent,
    ListadoNotasCreditoComponent,
    ListadoEmpleadosComponent,
    LavadorDashboardComponent,
    AreaComponent,
    ListadoAlmacenesComponent,
    WhatsappPlanesComponent,
    PagoEncargoComponent,
    PoliticasComponent,
    ProductosComponent,
    CatalogoInicioComponent,
    DescuentoListComponent,
    PerfilesComponent,
    DescuentoFormComponent,
    ListadoempleadosComisionComponent,
    PagoFacturaComponent,
    CredencialesModalComponent,
    IngresosAddComponent,
    MessageModalComponent,
    VerificaciontelefonoComponent,
    ListadoUsuariosComponent,
    UsuarioformComponent,
    HorarioestilistaComponent,
    CitainicioComponent,
    FacturasporcobrarComponent,
    EmpresaComponent,
    ClientesAddComponent,
    ReporteserviciosComponent,
    HorarioestilistaAddComponent,
    ClienteshappyComponent,
    ModalmesasComponent,
    EmpleadoComisionComponent,   // ✅ declarado aquí
    CitaAddComponent,
    CitasComponent,
    GastoFormPage,
    ListadogastosComponent,
    ListadoDocumentosClinicosComponent,
    DocumentoClinicoFormComponent,
    HistorialServiciosComponent,
    CartComponent,
    ClientesComponent,
    PosComponent,
    LoginkdsComponent,
    ListadoMesasComponent,
    CategoriasComponent,
    
    PrinterComponent,
    CotizacionPrintComponent,
    MovimientoInventarioPrintComponent,
    TurnosComponent,
    ComisionesComponent,
    ListadocategoriasComponent,
    CategoriaAddComponent,
    LicenciaModalComponent,
    ProductosAddComponent,
    CuentaxPagarComponent,
    OrdenesComponent,
    HoraRdPipe,
    ContabilidadCuentasComponent,
    ContabilidadAsientosComponent,
    ContabilidadLibroDiarioComponent,
    ContabilidadMayorGeneralComponent,
    ContabilidadBalanceComprobacionComponent,
    ContabilidadEstadoResultadosComponent,
    ContabilidadBalanceGeneralComponent,
    ContabilidadConsultaAsientosComponent,
    ContabilidadCierreComponent,
    ContabilidadConfiguracionIntegracionComponent,
    ModalCuentaContableComponent,
    ModalAsientoContableComponent,
    ContabilidadInicioComponent,
    CuentaContableSelectorComponent,
    ProveedoresComponent,
    ProveedorFormComponent,
    FacturasCompraComponent,
    FacturaCompraFormComponent,
    OrdenesCompraComponent,
    ProductoLineaBusquedaComponent,
    CxpProveedoresComponent,
    EstadoCuentaProveedorComponent,
    AnalisisProductoProveedorComponent,
    Reporte606Component,
    ActivosFijosListComponent,
    ActivoFijoDetalleComponent,
    ReporteProductosComponent,
    ReporteProveedoresComponent,
    ReporteClientesComponent,
    ReporteEmpleadosComponent
  ],
  imports: [
    BrowserModule,
    
    HttpClientModule,
    IonicModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    FontAwesomeModule,
    BrowserAnimationsModule,
    QRCodeModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    BluetoothSerial,
    
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    CitasService
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIconPacks(fas, fab, far);
  }
}
