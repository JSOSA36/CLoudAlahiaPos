import { Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class EncriptacionService {
  private secretKey = 'clave-secreta-alahia';  // 👈 igual que en C#
  private salt = 'AlahiaSalt123';              // 👈 igual que en C#
  private iterations = 1000;

  // 🔐 Encriptar ID de empresa
  encriptarId(id: number): string {
    const key = CryptoJS.PBKDF2(this.secretKey, CryptoJS.enc.Utf8.parse(this.salt), {
      keySize: 256 / 32,
      iterations: this.iterations
    });

    const iv = CryptoJS.PBKDF2(this.secretKey, CryptoJS.enc.Utf8.parse(this.salt), {
      keySize: 128 / 32,
      iterations: this.iterations
    });

    const encrypted = CryptoJS.AES.encrypt(id.toString(), key, { iv });
    return encrypted.toString(); // en Base64
  }

  // 🔓 Desencriptar ID de empresa
  desencriptarId(codigo: string): number {
    try {
      const key = CryptoJS.PBKDF2(this.secretKey, CryptoJS.enc.Utf8.parse(this.salt), {
        keySize: 256 / 32,
        iterations: this.iterations
      });

      const iv = CryptoJS.PBKDF2(this.secretKey, CryptoJS.enc.Utf8.parse(this.salt), {
        keySize: 128 / 32,
        iterations: this.iterations
      });

      const decrypted = CryptoJS.AES.decrypt(codigo, key, { iv });
      const plainText = decrypted.toString(CryptoJS.enc.Utf8);

      return Number(plainText); // devuelve el idEmpresa
    } catch (e) {
      console.error('Error desencriptando:', e);
      return 0;
    }
  }
}
