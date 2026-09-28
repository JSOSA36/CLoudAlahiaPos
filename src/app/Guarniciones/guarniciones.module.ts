import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { GuarnicionesComponent } from './guarniciones.component';

const routes: Routes = [
  { path: '', component: GuarnicionesComponent }
];

@NgModule({
  declarations: [GuarnicionesComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes)
  ]
})
export class GuarnicionesModule {}
