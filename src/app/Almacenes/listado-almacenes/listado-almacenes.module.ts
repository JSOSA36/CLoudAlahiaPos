import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ListadoAlmacenesComponent } from './listado-almacenes.component';

const routes: Routes = [
  {
    path: '',
    component: ListadoAlmacenesComponent,
  },
];

@NgModule({
  declarations: [],
  imports: [IonicModule, RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListadoAlmacenesModule {}
