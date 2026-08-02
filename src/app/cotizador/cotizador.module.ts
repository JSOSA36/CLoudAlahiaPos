import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { CotizadorComponent } from './cotizador.component';
import { CotizacionPublicaComponent } from './cotizacion-publica.component';

const routes: Routes = [
  {
    path: '',
    component: CotizadorComponent
  },
  {
    path: 'ver/:folio',
    component: CotizacionPublicaComponent
  }
];

@NgModule({
  declarations: [CotizadorComponent, CotizacionPublicaComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class CotizadorModule {}
