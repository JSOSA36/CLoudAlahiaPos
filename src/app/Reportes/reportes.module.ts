import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { ReporteProductosComponent } from './reporte-productos/reporte-productos.component';
import { ReporteProveedoresComponent } from './reporte-proveedores/reporte-proveedores.component';
import { ReporteClientesComponent } from './reporte-clientes/reporte-clientes.component';
import { ReporteEmpleadosComponent } from './reporte-empleados/reporte-empleados.component';

const routes: Routes = [
  { path: '', redirectTo: 'productos', pathMatch: 'full' },
  { path: 'productos', component: ReporteProductosComponent },
  { path: 'proveedores', component: ReporteProveedoresComponent },
  { path: 'clientes', component: ReporteClientesComponent },
  { path: 'empleados', component: ReporteEmpleadosComponent },
];

@NgModule({
  declarations: [],
  imports: [IonicModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
})
export class ReportesModule {}
