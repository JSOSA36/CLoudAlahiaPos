import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Router } from '@angular/router';
import { ParametrosService } from 'src/app/servicios/parametros.service';

@Component({
  selector: 'app-credencialesmodal',
  templateUrl: './credencialesmodal.component.html',
  styleUrls: ['./credencialesmodal.component.scss']
})
export class CredencialesModalComponent {
  @Input() user!: string;
  @Input() password!: string;
  @Input() idEmpresa!: number;
  @Input() idUsuario!: number;
  @Input() rol!: string;

  constructor(
    private modalCtrl: ModalController,
    private router: Router,
    private parametrosSrv: ParametrosService
  ) {}

  cerrar() {
    this.modalCtrl.dismiss();
  }

  irAlLogin() {
    // 🔹 Guardamos temporalmente en localStorage (por si refresca)
    

    // 🔹 También los inyectamos en ParametrosService para entrar directo
    
    

    this.modalCtrl.dismiss();
    this.router.navigateByUrl('/login'); // 👈 directo al home
  }
}
