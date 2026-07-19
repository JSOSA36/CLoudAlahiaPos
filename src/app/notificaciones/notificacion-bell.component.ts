import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificacionesService } from '../servicios/notificaciones.service';
import { NotificacionItem, cssPrioridad } from '../models/notificaciones.models';

@Component({
  selector: 'app-notificacion-bell',
  templateUrl: './notificacion-bell.component.html',
  styleUrls: ['./notificacion-bell.component.scss']
})
export class NotificacionBellComponent implements OnInit {
  unread$!: Observable<number>;

  constructor(private notifs: NotificacionesService) {}

  ngOnInit() {
    this.unread$ = this.notifs.unreadCount$();
  }

  toggle(ev?: Event) {
    ev?.stopPropagation();
    this.notifs.togglePanel();
  }
}
