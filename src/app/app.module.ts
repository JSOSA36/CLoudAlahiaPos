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
import { CuentaPorCobrarComponent } from './CuentaPorCobrar/cuenta-por-cobrar/cuentaxcobrar.component';
import { ListadoMesasComponent } from './listado_mesas/listadomesas.component';
import { CategoriasComponent } from './categorias/categorias.component';
import { LoginkdsComponent } from './loginkds/loginkds.component';
import { PrinterComponent } from './printer/printer.component';
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
import { AreaComponent } from './Areas/area/area.component';
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
import { DashboardComponent } from './folder/folder.page';
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
import { HistoricofactComponent } from './HisotricoFacturas/CuentaPorCobrar/cuenta-por-cobrar/historicofact.component';
import { NcfSecuenciasComponent } from './ncf-secuencias/ncf-secuencias.component';
import { Reporte607Component } from './Components/reporte607/reporte607.component';
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
    PagosListComponent,
    ListadoCajaComponent,
    ClienteVozComponent,
    DashboardComponent,
    ParametrosConfigComponent,
    NcfSecuenciasComponent,
    ForgotPasswordComponent,
    HistoricofactComponent,
    ListadoEmpleadosComponent,
    LavadorDashboardComponent,
    AreaComponent,
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
    CartComponent,
    ClientesComponent,
    PosComponent,
    LoginkdsComponent,
    ListadoMesasComponent,
    CategoriasComponent,
    
    PrinterComponent,
    TurnosComponent,
    ComisionesComponent,
    ListadocategoriasComponent,
    CategoriaAddComponent,
    LicenciaModalComponent,
    ProductosAddComponent,
    CuentaxPagarComponent,
    CuentaPorCobrarComponent,
    HoraRdPipe
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
