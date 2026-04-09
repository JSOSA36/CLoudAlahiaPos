import { Component, OnInit } from '@angular/core';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial/ngx';
@Component({
  selector: 'app-printer',
  templateUrl: './printer.component.html',
  styleUrls: ['./printer.component.scss'],
})
export class PrinterComponent  implements OnInit {

   devices: any[] = [];
  connectedDevice: string | null = null;
 ngOnInit(): void
  {
   setTimeout(() => {
      window.print();
    }, 300);

    window.onafterprint = () => {
      window.history.back();
    };
 }
  constructor(private bluetoothSerial: BluetoothSerial) {}

  

  // Buscar dispositivos Bluetooth visibles
  scanDevices() {
    this.bluetoothSerial.list().then(devices => {
      this.devices = devices;
      console.log('Dispositivos encontrados:', devices);
    }).catch(err => {
      console.error('Error al listar dispositivos:', err);
    });
  }

  // Conectarse a dispositivo y enviar texto
  connectAndPrint(address: string) {
    this.bluetoothSerial.connect(address).subscribe(() => {
      this.connectedDevice = address;
      this.bluetoothSerial.write('Hola desde Ionic Bluetooth!\n').then(() => {
        alert('Texto enviado a la impresora.');
      }).catch(err => {
        console.error('Error enviando texto:', err);
      });
    }, err => {
      console.error('Error al conectar:', err);
      alert('No se pudo conectar al dispositivo.');
    });
  }

  // Desconectar si quieres
  disconnect() {
    if(this.connectedDevice) {
      this.bluetoothSerial.disconnect();
      this.connectedDevice = null;
      alert('Desconectado');
    }
  }
}
