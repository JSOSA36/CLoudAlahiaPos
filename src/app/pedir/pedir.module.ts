import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { PedirComponent } from './pedir.component';

const routes: Routes = [
  { path: '', component: PedirComponent }
];

@NgModule({
  declarations: [PedirComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class PedirModule {}
