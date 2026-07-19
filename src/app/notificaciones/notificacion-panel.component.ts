import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionesService } from '../servicios/notificaciones.service';
import { NotificacionItem, cssPrioridad } from '../models/notificaciones.models';

@Component({
  selector: 'app-notificacion-panel',
  templateUrl: './notificacion-panel.component.html',
  styleUrls: ['./notificacion-panel.component.scss']
})
export class NotificacionPanelComponent implements OnInit {
  open$!: Observable<boolean>;
  items$!: Observable<NotificacionItem[]>;
  cssPrioridad = cssPrioridad;

  constructor(private notifs: NotificacionesService) {}

  ngOnInit() {
    this.open$ = this.notifs.panelOpenObs$();
    this.items$ = this.notifs.list$();
  }

  cerrar() {
    this.notifs.togglePanel(false);
  }

  abrir(n: NotificacionItem) {
    this.notifs.abrirNotificacion(n);
  }

  marcarTodas() {
    this.notifs.marcarTodas();
  }

  marcarLeida(n: NotificacionItem, ev: Event) {
    ev.stopPropagation();
    this.notifs.marcarLeida(n);
  }

  marcarNoLeida(n: NotificacionItem, ev: Event) {
    ev.stopPropagation();
    this.notifs.marcarNoLeida(n);
  }
}
