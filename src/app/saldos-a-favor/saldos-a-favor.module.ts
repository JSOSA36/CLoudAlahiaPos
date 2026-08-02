import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { SaldosAFavorComponent } from './saldos-a-favor.component';

const routes: Routes = [
  { path: '', component: SaldosAFavorComponent }
];

@NgModule({
  declarations: [SaldosAFavorComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class SaldosAFavorModule {}
