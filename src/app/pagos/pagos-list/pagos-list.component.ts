import { Component, OnInit } from '@angular/core';
import { PagoEmpresaService } from 'src/app/servicios/PagoEmpresaService';
import { PagoEmpresa } from 'src/app/models/PagoEmpresa.models';
import { DomSanitizer } from '@angular/platform-browser';
import { PrintService } from 'src/app/servicios/print.services';
@Component({
  selector: 'app-pagos-list',
  templateUrl: './pagos-list.component.html',
  styleUrls: ['./pagos-list.component.scss']
})
export class PagosListComponent implements OnInit {

  pagos: PagoEmpresa[] = [];
  cargando = false;
  /* =====================================
🔥 VARIABLES
===================================== */

metodosPago:any[] = [];

  // 🔥 MODAL
  modalAbierto = false;
  urlSeleccionado: string = '';

  constructor(
    private pagoService: PagoEmpresaService,
    private sanitizer: DomSanitizer,
    private printService: PrintService
  ) {}

  ngOnInit() {
    this.cargarPagos();
  }

  cargarPagos() {
    this.cargando = true;

    this.pagoService.obtenerPagos().subscribe({
      next: (res) => {
        this.pagos = res;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
      }
    });
  }

  // 🔥 ABRIR MODAL
  abrirModal(url: string) {
    if (!url) return;
    this.urlSeleccionado = url;
    this.modalAbierto = true;
  }

  // 🔥 CERRAR MODAL
  cerrarModal() {
    this.modalAbierto = false;
    this.urlSeleccionado = '';
  }

  // 🔥 PARA PDF
  getSafeUrl(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  aprobar(pago: PagoEmpresa) {
    console.log('Aprobando pago:', pago);
    this.pagoService.validarPago({
  idPago: pago.id,
  estado: 'APROBADO',
  observacion: '',
  usuarioValida: 'Admin'
}).subscribe(() => {
  this.cargarPagos();
});
  }

  rechazar(pago: PagoEmpresa) {
    this.pagoService.validarPago({
      idPago: pago.id,
      estado: 'RECHAZADO',
      observacion: 'Comprobante no válido',
      usuarioValida: 'Admin'
    }).subscribe(() => {
      this.cargarPagos();
    });
  }
}