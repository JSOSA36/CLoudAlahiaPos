import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CitasConfigComponent } from './citas-config.component';

const routes: Routes = [
  { path: '', component: CitasConfigComponent }
];

@NgModule({
  declarations: [CitasConfigComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class CitasConfigModule {}
