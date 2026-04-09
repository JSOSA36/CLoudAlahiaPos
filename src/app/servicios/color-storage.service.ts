import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ColorStorageService {

  private readonly PRIMARY = 'primaryColor';
  private readonly SECONDARY = 'secondaryColor';
  private readonly TERTIARY = 'tertiaryColor';

  // ✅ Guardar colores
  saveColors(primary?: string, secondary?: string, tertiary?: string) {
    if (primary) localStorage.setItem(this.PRIMARY, primary);
    if (secondary) localStorage.setItem(this.SECONDARY, secondary);
    if (tertiary) localStorage.setItem(this.TERTIARY, tertiary);
  }

  // ✅ Cargar colores
  loadColors(): { primary?: string; secondary?: string; tertiary?: string } {
    return {
      primary: localStorage.getItem(this.PRIMARY) || undefined,
      secondary: localStorage.getItem(this.SECONDARY) || undefined,
      tertiary: localStorage.getItem(this.TERTIARY) || undefined
    };
  }

  // ✅ Aplicar a CSS variables
  applyColors() {
    const { primary, secondary, tertiary } = this.loadColors();
    const root = document.documentElement;

    if (primary) root.style.setProperty('--ion-color-primary', primary);
    if (secondary) root.style.setProperty('--ion-color-secondary', secondary);
    if (tertiary) root.style.setProperty('--ion-color-tertiary', tertiary);
  }

  // ✅ Limpiar colores (ej: logout, reset app)
  clear() {
    localStorage.removeItem(this.PRIMARY);
    localStorage.removeItem(this.SECONDARY);
    localStorage.removeItem(this.TERTIARY);
  }
}
