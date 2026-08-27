import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { RepartoComponent } from './reparto.component';

const routes: Routes = [{ path: '', component: RepartoComponent }];

@NgModule({
  declarations: [RepartoComponent],
  imports: [CommonModule, FormsModule, RouterModule.forChild(routes)]
})
export class RepartoModule {}
