import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  NIVEL_SOPORTE_DETALLES,
  NIVEL_SOPORTE_ETIQUETA,
  NIVEL_SOPORTE_ICONO,
  NivelSoporte,
  normalizarNivelSoporte
} from '../nivel-soporte';

@Component({
  selector: 'app-nivel-soporte-modal',
  templateUrl: './nivel-soporte-modal.component.html',
  styleUrls: ['./nivel-soporte-modal.component.scss']
})
export class NivelSoporteModalComponent {
  @Input() set nivel(value: string | null | undefined) {
    this.nivelNormalizado = normalizarNivelSoporte(value);
  }
  @Output() cerrar = new EventEmitter<void>();

  nivelNormalizado: NivelSoporte = 'STANDARD';

  get etiqueta(): string {
    return NIVEL_SOPORTE_ETIQUETA[this.nivelNormalizado];
  }

  get icono(): string {
    return NIVEL_SOPORTE_ICONO[this.nivelNormalizado];
  }

  get items(): string[] {
    return NIVEL_SOPORTE_DETALLES[this.nivelNormalizado];
  }
}
