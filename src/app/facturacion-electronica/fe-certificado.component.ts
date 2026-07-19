import { Component } from '@angular/core';

@Component({
  selector: 'app-fe-certificado',
  templateUrl: './fe-certificado.component.html',
  styleUrls: ['./fe-certificado.component.scss'],
})
export class FeCertificadoComponent {
  certificadoInfo = {
    estado: 'No requerido',
    mensaje: 'El proveedor de facturación electrónica configurado se encarga de la firma digital. No es necesario configurar un certificado local en el ERP.'
  };
}
