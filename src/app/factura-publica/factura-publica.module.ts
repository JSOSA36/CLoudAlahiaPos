import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FacturaPublicaComponent } from './factura-publica.component';

const routes: Routes = [
  { path: 'ver/:token', component: FacturaPublicaComponent }
];

@NgModule({
  declarations: [FacturaPublicaComponent],
  imports: [CommonModule, RouterModule.forChild(routes)]
})
export class FacturaPublicaModule {}
