import { Injectable } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { PoliticasComponent } from '../politicas/politicas.component';
import { PoliticasEsperaComponent } from '../politicas/politicas-espera.component';
import { ParametrosService } from './parametros.service';
import { PoliticasServicioService } from './politicas-servicio.service';
import { PoliticasEstadoDto, PoliticasVersionDto } from '../models/politicas-servicio.models';

export type PoliticasGateResult =
  | { ok: true }
  | { ok: false; logout: boolean };

/** Normaliza respuesta API (camelCase o PascalCase). Aplica a TODOS los clientes. */
function normalizarEstado(raw: any): PoliticasEstadoDto | null {
  if (!raw) return null;

  const versionRaw = raw.versionActiva ?? raw.VersionActiva ?? null;
  let versionActiva: PoliticasVersionDto | null = null;

  if (versionRaw) {
    versionActiva = {
      idVersion: versionRaw.idVersion ?? versionRaw.IdVersion,
      numeroVersion: versionRaw.numeroVersion ?? versionRaw.NumeroVersion ?? '',
      titulo: versionRaw.titulo ?? versionRaw.Titulo ?? '',
      contenido: versionRaw.contenido ?? versionRaw.Contenido ?? '',
      estado: versionRaw.estado ?? versionRaw.Estado ?? '',
      fechaCreacion: versionRaw.fechaCreacion ?? versionRaw.FechaCreacion,
      idUsuarioCreacion: versionRaw.idUsuarioCreacion ?? versionRaw.IdUsuarioCreacion,
      fechaPublicacion: versionRaw.fechaPublicacion ?? versionRaw.FechaPublicacion,
      idUsuarioPublicacion: versionRaw.idUsuarioPublicacion ?? versionRaw.IdUsuarioPublicacion,
      notas: versionRaw.notas ?? versionRaw.Notas
    };
  }

  return {
    requiereAceptacion: !!(raw.requiereAceptacion ?? raw.RequiereAceptacion),
    esAdministrador: !!(raw.esAdministrador ?? raw.EsAdministrador),
    versionActiva
  };
}

@Injectable({ providedIn: 'root' })
export class PoliticasGateService {
  private gatePromise: Promise<PoliticasGateResult> | null = null;

  constructor(
    private modalCtrl: ModalController,
    private politicasService: PoliticasServicioService,
    private parametros: ParametrosService,
    private toastCtrl: ToastController
  ) {}

  /**
   * Obliga aceptación de la versión publicada vigente.
   * Sin excepciones por empresa: todos los clientes quedan bloqueados
   * hasta que su administrador acepte.
   */
  async validarAcceso(
    idEmpresa?: number,
    idUsuario?: number,
    estadoPrevio?: PoliticasEstadoDto | null
  ): Promise<PoliticasGateResult> {
    if (this.gatePromise) {
      return this.gatePromise;
    }

    this.gatePromise = this.ejecutarGate(idEmpresa, idUsuario, estadoPrevio)
      .finally(() => { this.gatePromise = null; });

    return this.gatePromise;
  }

  private async ejecutarGate(
    idEmpresa?: number,
    idUsuario?: number,
    estadoPrevio?: PoliticasEstadoDto | null
  ): Promise<PoliticasGateResult> {
    const empresaId = idEmpresa ?? this.parametros.IdEmpresa;
    const usuarioId = idUsuario ?? this.parametros.IdUsuario;

    if (!empresaId || !usuarioId) {
      return { ok: false, logout: true };
    }

    let estado = normalizarEstado(estadoPrevio);

    // Siempre reconsultar al servidor: no confiar en cache/localStorage/flags viejos
    try {
      const fresco = await firstValueFrom(
        this.politicasService.obtenerEstado(empresaId, usuarioId)
      );
      estado = normalizarEstado(fresco);
    } catch {
      const toast = await this.toastCtrl.create({
        message: 'No se pudo verificar las Políticas del Servicio. Intente de nuevo.',
        duration: 4000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
      // Fail-closed: sin verificación no se entra
      return { ok: false, logout: true };
    }

    if (!estado) {
      return { ok: false, logout: true };
    }

    this.parametros.PoliticasAceptadas = !estado.requiereAceptacion;

    if (!estado.requiereAceptacion) {
      return { ok: true };
    }

    // Hay versión publicada sin aceptación → bloqueo obligatorio para TODOS los clientes
    if (estado.esAdministrador && estado.versionActiva) {
      const modal = await this.modalCtrl.create({
        component: PoliticasComponent,
        componentProps: { version: estado.versionActiva },
        backdropDismiss: false,
        keyboardClose: false,
        cssClass: 'modal-politicas-full'
      });
      await modal.present();
      const { data } = await modal.onDidDismiss();
      if (data?.aceptado) {
        this.parametros.PoliticasAceptadas = true;
        return { ok: true };
      }
      return { ok: false, logout: true };
    }

    const modal = await this.modalCtrl.create({
      component: PoliticasEsperaComponent,
      backdropDismiss: false,
      keyboardClose: false,
      cssClass: 'modal-politicas-full'
    });
    await modal.present();
    await modal.onDidDismiss();
    return { ok: false, logout: true };
  }
}
