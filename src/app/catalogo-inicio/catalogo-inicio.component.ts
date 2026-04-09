import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ServiciosClientesService } from '../servicios/serivicioscliente.services';
import { EmpresaService } from 'src/app/servicios/empresa.services';

import { CatalogoDto } from '../models/CatalogoDto .models';
import { EmpresaDto } from '../models/empresadto.models';

@Component({
  selector: 'app-catalogo-inicio',
  templateUrl: './catalogo-inicio.component.html',
  styleUrls: ['./catalogo-inicio.component.scss'],
})
export class CatalogoInicioComponent implements OnInit {

  @Input() guid: string = '';           
  @Input() sinHeader: boolean = false;  
  @Input() empresa!: EmpresaDto | null; 

  catalogo: CatalogoDto | null = null;
  cargando = true;  // 🔹 mientras sea true se muestra el loader

  busqueda: string = '';
  serviciosFiltrados: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private catalogoSrv: ServiciosClientesService,
    private empresaSrv: EmpresaService,
    private modalCtrl: ModalController
  ) {}

  ngOnInit() {
    if (!this.guid) {
      this.guid = this.route.snapshot.paramMap.get('guid') || '';
    }

    if (this.guid) {
      if (this.empresa?.idEmpresa) {
        this.aplicarColores();
        this.cargarCatalogoPorGuid(this.guid);
      } else {
        this.cargarEmpresaYCatalogoPorGuid(this.guid);
      }
    } else {
      if (this.empresa) this.aplicarColores();
      this.cargando = false;
      console.warn('⚠️ No se recibió un guid válido');
    }
  }

  // ---------- Cargas ----------
  private cargarCatalogoPorGuid(guid: string) {
    this.cargando = true;
    this.catalogoSrv.getServiciosByGuid(guid).pipe(
      catchError(err => {
        console.error('Error cargando catálogo:', err);
        return of(null);
      })
    ).subscribe((data) => {
      this.catalogo = data;
      console.log('Catálogo cargado:', this.catalogo);
      this.serviciosFiltrados = []; 
      requestAnimationFrame(() => { this.cargando = false; });
    });
  }

  private cargarEmpresaYCatalogoPorGuid(guid: string) {
    this.cargando = true;

    forkJoin({
      empresa: this.empresaSrv.getEmpresaByGuid(guid).pipe(
        catchError(err => {
          console.error('Error cargando empresa por guid:', err);
          return of(null as unknown as EmpresaDto);
        })
      ),
      catalogo: this.catalogoSrv.getServiciosByGuid(guid).pipe(
        catchError(err => {
          console.error('Error cargando catálogo por guid:', err);
          return of(null as unknown as CatalogoDto);
        })
      )
    }).subscribe(({ empresa, catalogo }) => {
      if (empresa) {
        this.empresa = empresa;
        this.aplicarColores();
      }
      this.catalogo = catalogo;
      this.serviciosFiltrados = [];

      requestAnimationFrame(() => { this.cargando = false; });
    });
  }

  // ---------- UI helpers ----------
  cerrarModal() {
    this.modalCtrl.dismiss();
  }

  private aplicarColores() {
    if (!this.empresa) return;

    if (this.empresa.primaryColor) {
      document.documentElement.style.setProperty('--ion-color-primary', this.empresa.primaryColor);
    }
    if (this.empresa.secondaryColor) {
      document.documentElement.style.setProperty('--ion-color-secondary', this.empresa.secondaryColor);
    }
    if (this.empresa.tertiaryColor) {
      document.documentElement.style.setProperty('--ion-color-tertiary', this.empresa.tertiaryColor);
    }
    if (this.empresa.titleColor) {
      document.documentElement.style.setProperty('--ion-title-color', this.empresa.titleColor);
    }
  }

  // ---------- Mapa ----------
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

  // ---------- Filtro ----------
  filtrarServicios() {
    const term = this.busqueda.toLowerCase();

    if (!term.trim()) {
      this.serviciosFiltrados = [];
      return;
    }

    this.serviciosFiltrados = (this.catalogo?.areas || [])
      .reduce((acc: any[], area) => acc.concat(area.servicios || []), [])
      .filter((s: any) => {
        const nombre = s.nombre?.toLowerCase() || '';
        const precio = s.precio?.toString() || '';
        return nombre.includes(term) || precio.includes(term);
      });
  }
}
