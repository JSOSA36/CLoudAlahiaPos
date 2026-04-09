import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'horaRD'
})
export class HoraRdPipe implements PipeTransform {

  transform(hora24: string): string {

    if (!hora24) return '';

    const [hh, mm] = hora24.split(':').map(Number);

    const d = new Date();
    d.setHours(hh, mm, 0, 0);

    return d.toLocaleTimeString('es-DO', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

  }

}
