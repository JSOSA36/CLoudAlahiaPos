import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { EmpresaService } from 'src/app/servicios/empresa.services';
import { EmpresaDto } from 'src/app/models/empresadto.models';
import { CitaAddComponent } from '../citasadd/citasadd.component';
import { ModalController } from '@ionic/angular';
import { CatalogoInicioComponent } from 'src/app/catalogo-inicio/catalogo-inicio.component';

@Component({
  selector: 'app-citainicio',
  templateUrl: './citainicio.component.html',
  styleUrls: ['./citainicio.component.scss'],
})
export class CitainicioComponent implements OnInit {

  empresa: EmpresaDto | null = null;
  logoDefault = 'assets/Logo.png';
  guidPublico: string = '';
  cargando = true; // ✅ mientras true → loader visible

  constructor(
    private router: Router,
    private empresaSrv: EmpresaService,
    private modalCtrl: ModalController,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.guidPublico = this.route.snapshot.paramMap.get('guid') || '';
    console.log('🔎 Guid recibido:', this.guidPublico);

    this.empresa = null;
    this.cargando = true;

    if (this.guidPublico) {
      this.empresaSrv.getEmpresaByGuid(this.guidPublico).subscribe({
        next: (empresa: EmpresaDto) => {
          this.empresa = empresa;

          // ✅ aplicar colores al DOM
          this.aplicarColores(this.empresa);

          // esperamos un frame para que los estilos se apliquen antes de mostrar
          requestAnimationFrame(() => {
            this.cargando = false;
          });
        },
        error: (err) => {
          console.error('Error cargando la empresa por guid:', err);
          this.cargando = false;
        }
      });
    } else {
      console.warn('⚠️ No se recibió un guid válido en la URL');
      this.cargando = false;
    }
  }

  // ✅ Aplicar colores
  private aplicarColores(empresa: EmpresaDto) {
    if (empresa.primaryColor) {
      document.documentElement.style.setProperty('--ion-color-primary', empresa.primaryColor);
    }
    if (empresa.secondaryColor) {
      document.documentElement.style.setProperty('--ion-color-secondary', empresa.secondaryColor);
    }
    if (empresa.tertiaryColor) {
      document.documentElement.style.setProperty('--ion-color-tertiary', empresa.tertiaryColor);
    }
    if (empresa.titleColor) {
      document.documentElement.style.setProperty('--ion-title-color', empresa.titleColor);
    }
  }

  abrirMapa(): void {
    if (this.empresa?.latitude && this.empresa?.longitude) {
      const lat = parseFloat(this.empresa.latitude);
      const lng = parseFloat(this.empresa.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
        return;
      }
    }
    if (this.empresa?.direccion) {
      const query = encodeURIComponent(this.empresa.direccion);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  }

  async abrirCitaNueva() {
    const modal = await this.modalCtrl.create({
      component: CitaAddComponent,
      componentProps: {
        cita: null,
        fromInicio: true,
        empresa: this.empresa
      }
    });
    await modal.present();
  }

  async VerCatalogo() {
    const modal = await this.modalCtrl.create({
      component: CatalogoInicioComponent,
      componentProps: {
        guid: this.guidPublico,
        sinHeader: true,
        empresa: this.empresa
      }
    });
    await modal.present();
  }
}
