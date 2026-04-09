import { Injectable } from '@angular/core';

declare const OneSignal: any;

@Injectable({
  providedIn: 'root'
})
export class OneSignalService {

  constructor() {}

  // ================================
  // 🎯 OBTENER PLAYER ID (v16+)
  // ================================
  async getPlayerId(): Promise<string | null> {
  try {
    // 1️⃣ Intento directo
    let id = OneSignal?.User?.pushSubscription?.id;

    if (id) {
      console.log("📡 PlayerID inmediato:", id);
      return id;
    }

    // 2️⃣ Espera a que OneSignal genere la suscripción
    return new Promise((resolve) => {

      OneSignal.addListener('subscriptionChange', (event: any) => {
        console.log("🔔 Evento subscriptionChange:", event);

        const newId = OneSignal?.User?.pushSubscription?.id;

        if (newId) {
          console.log("📡 PlayerID listo:", newId);
          resolve(newId);
        }
      });

      // 3️⃣ Time-out por si no cambia
      setTimeout(() => {
        resolve(OneSignal?.User?.pushSubscription?.id ?? null);
      }, 4000);
    });

  } catch (err) {
    console.error("❌ Error obteniendo PlayerID:", err);
    return null;
  }
}


  // ================================
  // 🏷️ ENVIAR TAG EMPRESA (v16+)
  // ================================
  async setEmpresaTag(idEmpresa: number) {
    try {
      await OneSignal.User.addTag("empresa_id", idEmpresa.toString());
      console.log("🏷️ Tag empresa_id enviado:", idEmpresa);
    } catch (err) {
      console.error("❌ Error asignando tag:", err);
    }
  }

  // ================================
  // 🛰 DEBUG (v16+)
  // ================================
  async debug() {
    try {
      const id = OneSignal.User.pushSubscription.id;
      const tags = await OneSignal.User.getTags();

      alert(
        "🛰 DEBUG OneSignal\n\n" +
        "PlayerID:\n" + JSON.stringify(id) + "\n\n" +
        "Tags:\n" + JSON.stringify(tags)
      );
    } catch (err) {
      alert("❌ Error obteniendo debug: " + err);
    }
  }
}
