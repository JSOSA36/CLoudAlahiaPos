import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { CotizacionClientePublicaComponent } from './cotizacion-cliente-publica.component';

const routes: Routes = [
  {
    path: 'ver/:token',
    component: CotizacionClientePublicaComponent,
  },
];

@NgModule({
  declarations: [CotizacionClientePublicaComponent],
  imports: [CommonModule, RouterModule.forChild(routes)],
})
export class CotizacionClienteModule {}
