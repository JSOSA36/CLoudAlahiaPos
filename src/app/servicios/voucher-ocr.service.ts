import { Injectable } from '@angular/core';
import Tesseract from 'tesseract.js';

export interface VoucherInfo {
  banco: string | null;
  monto: number | null;
  textoCompleto: string;
}

@Injectable({
  providedIn: 'root'
})
export class VoucherOcrService {

  // 🔒 Lista controlada de bancos (RD)
  private readonly bancos = [
    'BANCO POPULAR',
    'BANRESERVAS',
    'BHD',
    'SCOTIABANK',
    'ALAVER',
    'PROMERICA',
    'CIBAO',
    'VIMENCA',
    'APAP'
  ];

  constructor() {}

  // ===============================
  // FUNCIÓN PRINCIPAL
  // ===============================
  async procesarVoucher(file: File): Promise<VoucherInfo> {
    const texto = await this.leerTextoOCR(file);

    return {
      banco: this.detectarBanco(texto),
      monto: this.detectarMonto(texto),
      textoCompleto: texto
    };
  }

  // ===============================
  // OCR
  // ===============================
  private async leerTextoOCR(file: File): Promise<string> {
    const result = await Tesseract.recognize(
      file,
      'spa',
      {
        logger: m => console.log('[OCR]', m)
      }
    );

    return result.data.text || '';
  }

  // ===============================
  // DETECTAR BANCO
  // ===============================
  private detectarBanco(texto: string): string | null {
    const upper = texto.toUpperCase();

    for (const banco of this.bancos) {
      if (upper.includes(banco)) {
        return banco;
      }
    }

    return null;
  }

  // ===============================
  // DETECTAR MONTO
  // ===============================
  private detectarMonto(texto: string): number | null {
    if (!texto) return null;

    // RD$ 1,500.00 | $1500 | 1500.00
    const regex = /(RD\$|\$)\s?([\d,.]+)/i;
    const match = texto.match(regex);

    if (!match) return null;

    const monto = match[2]
      .replace(/,/g, '')
      .trim();

    const valor = Number(monto);

    return isNaN(valor) ? null : valor;
  }
}
