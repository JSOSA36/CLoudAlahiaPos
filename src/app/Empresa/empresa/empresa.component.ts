import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EmpresaDto } from 'src/app/models/empresadto.models';
import { EmpresaService } from 'src/app/servicios/empresa.services';
import { ParametrosService } from 'src/app/servicios/parametros.service';
import { ToastController, LoadingController, ModalController } from '@ionic/angular';
import { ColorThemeService } from 'src/app/servicios/color-theme.service';
import { CredencialesModalComponent } from 'src/app/crear-usuario/credencialesmodalcomponent';

@Component({
  selector: 'app-empresa',
  templateUrl: './empresa.component.html',
  styleUrls: ['./empresa.component.scss'],
})
export class EmpresaComponent implements OnInit {
  @Input() esRegistroInicial: boolean = false;

  form!: FormGroup;
  empresa!: EmpresaDto;
  selectedFile!: File | null;

  latitud: number | null = null;
  longitud: number | null = null;

  constructor(
    private fb: FormBuilder,
    private empresaSrv: EmpresaService,
    private parametroSrv: ParametrosService,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private colorTheme: ColorThemeService,
    private modalCtrl: ModalController
  ) {}

  async ngOnInit() {
    this.form = this.fb.group({
      nombreComercial: ['', Validators.required],
      direccion: ['', Validators.required],
      telefono: [''],
      correElectronico: ['', [Validators.email]],
      logo: [''],
      nota: [''],
      urlCatalogo: [''],
      guidPublico: [''],

      // 🎨 Colores
      titleColor: ['#000000', Validators.required],
      primaryColor: ['#1976D2'],
      secondaryColor: ['#388E3C'],
      tertiaryColor: ['#F57C00'],
      correoSMTP: [''],                 // 👈 lo escribe el usuario
  passwordSMTP: [''],               // 👈 lo escribe el usuario
  servidorSMTP: ['smtp.gmail.com'], // ✅ fijo
  puertoSMTP: [587],                // ✅ fijo
  usaSSL: [true],                   // ✅ fijo
  nombreRemitente: ['']             // 👈 se auto-llenará
    });

    this.cargarEmpresa();
  }

  cargarEmpresa() {
  if (this.esRegistroInicial) {
    this.empresa = {} as EmpresaDto;

    // Defaults visuales
    this.form.patchValue({
      logo: 'assets/img/default-logo.png',
      servidorSMTP: 'smtp.gmail.com',
      puertoSMTP: 587,
      usaSSL: true
    });

    return;
  }

  const idEmpresa = this.parametroSrv.IdEmpresa;

  if (!idEmpresa || idEmpresa === 0) {
    this.empresa = {} as EmpresaDto;

    this.form.patchValue({
      logo: 'assets/img/default-logo.png',
      servidorSMTP: 'smtp.gmail.com',
      puertoSMTP: 587,
      usaSSL: true
    });

    return;
  }

  this.empresaSrv.getEmpresa(idEmpresa).subscribe({
    next: (data) => {
      this.empresa = data;

      // 🔹 Patch general
      this.form.patchValue({
        ...data,

        // 🔥 SMTP con fallback seguro
        servidorSMTP: data.servidorSMTP || 'smtp.gmail.com',
        puertoSMTP: data.puertoSMTP || 587,
        usaSSL: data.usaSSL !== null && data.usaSSL !== undefined ? data.usaSSL : true,
        correoSMTP: data.correoSMTP || '',
        passwordSMTP: data.passwordSMTP || '',
        nombreRemitente: data.nombreRemitente || data.nombreComercial
      });

      // 📍 GPS
      if (data.latitude) this.latitud = Number(data.latitude);
      if (data.longitude) this.longitud = Number(data.longitude);

      // 🎨 Colores
      if (data.titleColor) this.form.patchValue({ titleColor: data.titleColor });
      if (data.primaryColor) this.form.patchValue({ primaryColor: data.primaryColor });
      if (data.secondaryColor) this.form.patchValue({ secondaryColor: data.secondaryColor });
      if (data.tertiaryColor) this.form.patchValue({ tertiaryColor: data.tertiaryColor });
    },
    error: () => this.toast('Error cargando datos de la empresa ❌')
  });
}


  async guardar() {

    // 🔥 Si no escribió remitente, usar nombre comercial
if (!this.form.value.nombreRemitente) {
  this.form.patchValue({
    nombreRemitente: this.form.value.nombreComercial
  });
}

    if (this.form.invalid) {
      this.toast('Complete los campos obligatorios');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando cambios...',
      spinner: 'crescent'
    });
    await loading.present();

    const formData = new FormData();
    formData.append('IdEmpresa', this.empresa?.idEmpresa?.toString() || '0');
    formData.append('NombreComercial', this.form.value.nombreComercial);
    formData.append('Direccion', this.form.value.direccion);
    formData.append('Telefono', this.form.value.telefono || '');
    formData.append('CorreElectronico', this.form.value.correElectronico || '');
    formData.append('Nota', this.form.value.nota || '');
    formData.append('TitleColor', this.form.value.titleColor);


    // ===============================
// 📧 SMTP
// ===============================
  formData.append('CorreoSMTP', this.form.value.correoSMTP || '');
formData.append('PasswordSMTP', this.form.value.passwordSMTP || '');
formData.append('ServidorSMTP', this.form.value.servidorSMTP);
formData.append('PuertoSMTP', this.form.value.puertoSMTP.toString());
formData.append('UsaSSL', this.form.value.usaSSL ? 'true' : 'false');
formData.append('NombreRemitente', this.form.value.nombreRemitente);



    // colores
    formData.append('PrimaryColor', this.form.value.primaryColor);
    formData.append('SecondaryColor', this.form.value.secondaryColor);
    formData.append('TertiaryColor', this.form.value.tertiaryColor);

    if (this.form.value.guidPublico) {
      formData.append('GuidPublico', this.form.value.guidPublico);
    }

    if (this.latitud) formData.append('Latitude', this.latitud.toString());
    if (this.longitud) formData.append('Longitude', this.longitud.toString());

    if (this.selectedFile) {
      formData.append('Imagen', this.selectedFile, this.selectedFile.name);
    } else {
      formData.append('Imagen', new Blob(), '');
    }

    // 🚫 Ya NO enviamos token FCM aquí
    // formData.append("TokenNotificacion", ... )   → Eliminado

    this.empresaSrv.updateEmpresa(formData).subscribe({
      next: async (resp: any) => {
        await loading.dismiss();

        if (resp && resp.user && resp.password && resp.idempresa) {
          this.parametroSrv.IdUsuario = 0;
          this.parametroSrv.UserName = resp.user;
          this.parametroSrv.Rol = "Administrador";
          this.parametroSrv.IdEmpresa = resp.idempresa;

          this.parametroSrv.setLoginData(
            resp.user,
            resp.password,
            resp.idempresa,
            'ok',
            "Administrador",
            0,
            null
          );

          if (resp.guidPublico) {
            this.form.patchValue({ guidPublico: resp.guidPublico });
          }

          this.mostrarCredenciales(resp.user, resp.password);
        } else {
          this.toast('Empresa actualizada correctamente ✅');
        }
      },
      error: async () => {
        await loading.dismiss();
        this.toast('Error al guardar empresa ❌');
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      const reader = new FileReader();
      reader.onload = async () => {
        const logoBase64 = reader.result as string;

        this.form.patchValue({ logo: logoBase64 });

        const colors = await this.colorTheme.getColorsFromLogo(logoBase64);
        this.form.patchValue({
          primaryColor: colors.primary,
          secondaryColor: colors.secondary,
          tertiaryColor: colors.tertiary
        });
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  async obtenerUbicacion() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          this.latitud = position.coords.latitude;
          this.longitud = position.coords.longitude;
          this.toast('Ubicación obtenida correctamente ✅');
        },
        async () => {
          this.toast('No se pudo obtener la ubicación ❌');
        }
      );
    } else {
      this.toast('Geolocalización no soportada en este navegador');
    }
  }

  async copiarUrl() {
    if (this.empresa?.urlCitas) {
      await navigator.clipboard.writeText(this.empresa.urlCitas);
      this.toast('URL de citas copiada ✅');
    }
  }

  compartirWhatsapp() {
    if (this.empresa?.urlCitas) {
      const texto = encodeURIComponent(`Reserva tu cita aquí 👉 ${this.empresa.urlCitas}`);
      window.open(`https://wa.me/?text=${texto}`, '_blank');
    }
  }

  async copiarCatalogo() {
    if (this.empresa?.urlCatalogo) {
      await navigator.clipboard.writeText(this.empresa.urlCatalogo);
      this.toast('URL del catálogo copiada ✅');
    }
  }

  compartirCatalogoWhatsapp() {
    if (this.empresa?.urlCatalogo) {
      const texto = encodeURIComponent(`Mira nuestro catálogo aquí 👉 ${this.empresa.urlCatalogo}`);
      window.open(`https://wa.me/?text=${texto}`, '_blank');
    }
  }

  private async toast(msg: string) {
    const t = await this.toastCtrl.create({
      message: msg,
      duration: 2500,
      position: 'bottom'
    });
    await t.present();
  }

  async mostrarCredenciales(user: string, password: string) {
    const modal = await this.modalCtrl.create({
      component: CredencialesModalComponent,
      componentProps: { user, password }
    });
    return await modal.present();
  }
}
