import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { PedidosDeliveryComponent } from './pedidos-delivery.component';

const routes: Routes = [{ path: '', component: PedidosDeliveryComponent }];

@NgModule({
  declarations: [PedidosDeliveryComponent],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)]
})
export class PedidosDeliveryModule {}
