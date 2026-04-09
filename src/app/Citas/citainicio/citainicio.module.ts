import { NgModule } from '@angular/core';
import { Routes, RouterModule, RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { CitainicioComponent } from './citainicio.component';

const routes: Routes = [
  {
    path: '',
    component: CitainicioComponent   // fallback si NO pasan id
  },
  {
    path: ':idEmpresa',
    component: CitainicioComponent   // cuando pasan el id encriptado
  }
];

@NgModule({
  imports: [
    IonicModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }]
})
export class CitainicioModule {}
