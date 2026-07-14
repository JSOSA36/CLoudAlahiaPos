import { Component, OnInit } from '@angular/core';

import { AlertController, ModalController } from '@ionic/angular';

import { CuentaContableService } from 'src/app/servicios/cuenta-contable.service';

import { ParametrosService } from 'src/app/servicios/parametros.service';

import { CuentaContable } from 'src/app/models/CuentaContable.models';

import { ModalCuentaContableComponent } from '../modal-cuenta-contable/modal-cuenta-contable.component';

import {

  CuentaContableNodoVista,

  aplanarArbolVisible,

  construirArbolCuentas,

  inicializarExpandidos,

  obtenerIdsVisiblesPorBusqueda,

  paddingNodoCuenta

} from 'src/app/utils/cuenta-contable.util';



@Component({

  selector: 'app-contabilidad-cuentas',

  templateUrl: './contabilidad-cuentas.component.html',

  styleUrls: ['./contabilidad-cuentas.component.scss'],

})

export class ContabilidadCuentasComponent implements OnInit {

  cargando = false;

  cuentas: CuentaContable[] = [];

  arbol: CuentaContable[] = [];

  nodosVisibles: CuentaContableNodoVista[] = [];

  expandidos = new Set<number>();

  search = '';



  constructor(

    private cuentaService: CuentaContableService,

    private parametros: ParametrosService,

    private modalCtrl: ModalController,

    private alertCtrl: AlertController

  ) {}



  ngOnInit(): void {

    this.cargar();

  }



  cargar(): void {

    this.cargando = true;

    const idEmpresa = this.parametros.GetIdEmpresa();



    this.cuentaService.getByEmpresa(idEmpresa).subscribe({

      next: (resp) => {

        this.cuentas = resp;

        this.arbol = construirArbolCuentas(this.cuentas);

        this.expandidos = inicializarExpandidos(this.cuentas);

        this.aplicarFiltro();

        this.cargando = false;

      },

      error: () => {

        this.cargando = false;

      }

    });

  }



  aplicarFiltro(): void {

    const idsVisibles = obtenerIdsVisiblesPorBusqueda(this.cuentas, this.search);



    if (idsVisibles) {

      idsVisibles.forEach(id => this.expandidos.add(id));

    } else if (!this.search.trim()) {

      this.expandidos = inicializarExpandidos(this.cuentas);

    }



    this.nodosVisibles = aplanarArbolVisible(

      this.arbol,

      1,

      this.expandidos,

      idsVisibles,

      this.search

    );

  }



  padding(nodo: CuentaContableNodoVista): number {

    return paddingNodoCuenta(nodo.nivel, !nodo.cuenta.permiteMovimiento);

  }



  toggleExpandir(nodo: CuentaContableNodoVista, event: Event): void {

    event.stopPropagation();

    if (!nodo.tieneHijos) return;



    if (this.expandidos.has(nodo.cuenta.idCuentaContable)) {

      this.expandidos.delete(nodo.cuenta.idCuentaContable);

    } else {

      this.expandidos.add(nodo.cuenta.idCuentaContable);

    }



    this.aplicarFiltro();

  }



  async nuevaCuenta(): Promise<void> {

    const modal = await this.modalCtrl.create({

      component: ModalCuentaContableComponent,

      componentProps: {

        cuenta: null,

        cuentas: this.cuentas

      }

    });



    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.guardado) this.cargar();

  }



  async editarCuenta(cuenta: CuentaContable): Promise<void> {

    const modal = await this.modalCtrl.create({

      component: ModalCuentaContableComponent,

      componentProps: {

        cuenta,

        cuentas: this.cuentas

      }

    });



    await modal.present();

    const { data } = await modal.onDidDismiss();

    if (data?.guardado) this.cargar();

  }



  async cargarCatalogoDefault(): Promise<void> {

    const alert = await this.alertCtrl.create({

      header: 'Catálogo estándar',

      message: '¿Desea cargar el plan de cuentas estándar? Solo aplica si no tiene cuentas registradas.',

      buttons: [

        { text: 'Cancelar', role: 'cancel' },

        {

          text: 'Cargar',

          handler: () => {

            this.cuentaService.seed(this.parametros.GetIdEmpresa()).subscribe({

              next: () => this.cargar(),

              error: (err) => console.error(err)

            });

          }

        }

      ]

    });

    await alert.present();

  }



  async eliminarCuenta(cuenta: CuentaContable, event: Event): Promise<void> {

    event.stopPropagation();



    const alert = await this.alertCtrl.create({

      header: 'Eliminar cuenta',

      message: `¿Eliminar ${cuenta.codigo} - ${cuenta.nombre}?`,

      buttons: [

        { text: 'Cancelar', role: 'cancel' },

        {

          text: 'Eliminar',

          role: 'destructive',

          handler: () => {

            this.cuentaService.delete(cuenta.idCuentaContable, cuenta.idEmpresa).subscribe({

              next: () => this.cargar(),

              error: async (err) => {

                const msg = err?.error?.message || 'No se pudo eliminar la cuenta.';

                const a = await this.alertCtrl.create({ header: 'Error', message: msg, buttons: ['OK'] });

                await a.present();

              }

            });

          }

        }

      ]

    });

    await alert.present();

  }

}


