import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ClienteEnSala } from '../models/clientesala';

@Injectable({ providedIn: 'root' })
export class ClienteServiceMock {
  private data: ClienteEnSala[] = [
    { idCliente: 1, nombre: 'Ana Pérez',  telefono: '8095551001', celular: '8295551001', email: 'ana@demo.com',  direccion: 'Av. 27 de Febrero', nota: 'VIP', estado: 'Esperando' },
    { idCliente: 2, nombre: 'Marcos Díaz', telefono: '8095551002', celular: '8495551002', email: 'marcos@demo.com', direccion: 'Winston Churchill', nota: '', estado: 'Esperando' },
    { idCliente: 3, nombre: 'Lucía Gómez', telefono: '8095551003', celular: '8295551003', email: 'lucia@demo.com', direccion: 'Núñez de Cáceres', nota: '', estado: 'Esperando' },
  ];

  GetListadoClientes(): Observable<ClienteEnSala[]> {
    return of(this.data).pipe(delay(250)); // simula latencia
  }

  // Si necesitas estos para otras pantallas:
  EnviarItem(body: any) { return of(true).pipe(delay(200)); }
  EditarClientes(body: any) { return of(true).pipe(delay(200)); }
  DeleteIten(idCliente: number) { return of(true).pipe(delay(200)); }
}
