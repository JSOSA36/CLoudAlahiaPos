import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { FacturasCompraComponent } from './facturas-compra/facturas-compra.component';
import { FacturaCompraFormComponent } from './factura-compra-form/factura-compra-form.component';
import { CxpProveedoresComponent } from './cxp-proveedores/cxp-proveedores.component';
import { OrdenesCompraComponent } from './ordenes-compra/ordenes-compra.component';
import { EstadoCuentaProveedorComponent } from './estado-cuenta-proveedor/estado-cuenta-proveedor.component';
import { AnalisisProductoProveedorComponent } from './analisis-producto-proveedor/analisis-producto-proveedor.component';
import { Reporte606Component } from './reporte-606/reporte-606.component';
import { AntiguedadSaldosComponent } from '../Reportes/antiguedad-saldos/antiguedad-saldos.component';

const routes: Routes = [
  { path: '', redirectTo: 'facturas', pathMatch: 'full' },
  { path: 'facturas', component: FacturasCompraComponent },
  { path: 'ordenes', component: OrdenesCompraComponent },
  { path: 'ordenes/nueva', component: FacturaCompraFormComponent },
  { path: 'ordenes/:id', component: FacturaCompraFormComponent },
  { path: 'nueva', component: FacturaCompraFormComponent },
  { path: 'cxp', component: CxpProveedoresComponent },
  { path: 'cxp/estado-cuenta', component: EstadoCuentaProveedorComponent },
  { path: 'analisis-producto', component: AnalisisProductoProveedorComponent },
  { path: 'reporte-606', component: Reporte606Component },
  {
    path: 'antiguedad-cxp',
    component: AntiguedadSaldosComponent,
    data: { modo: 'cxp' }
  },
  { path: ':id', component: FacturaCompraFormComponent },
];

@NgModule({
  declarations: [],
  imports: [IonicModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
})
export class ComprasModule {}
