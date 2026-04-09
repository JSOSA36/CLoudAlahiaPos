import { Injectable } from '@angular/core';

type RGB = { r: number; g: number; b: number };
type Cluster = { c: RGB; pts: RGB[]; satAvg: number; pop: number };

@Injectable({ providedIn: 'root' })
export class ColorThemeService {

  async applyThemeFromLogo(imgUrl: string) {
    const { primary, secondary, tertiary } = await this.extractPalette(imgUrl);

    const root = document.documentElement;

    // Primary
    root.style.setProperty('--ion-color-primary', primary);
    root.style.setProperty('--ion-color-primary-rgb', this.hexToRgbStr(primary));
    root.style.setProperty('--ion-color-primary-contrast', this.autoContrast(primary));
    root.style.setProperty('--ion-color-primary-contrast-rgb', this.hexToRgbStr(this.autoContrast(primary)));
    root.style.setProperty('--ion-color-primary-shade', this.shade(primary, -14));
    root.style.setProperty('--ion-color-primary-tint',  this.shade(primary, +14));

    // Secondary / Tertiary
    root.style.setProperty('--ion-color-secondary', secondary);
    root.style.setProperty('--ion-color-secondary-rgb', this.hexToRgbStr(secondary));
    root.style.setProperty('--ion-color-secondary-contrast', this.autoContrast(secondary));

    root.style.setProperty('--ion-color-tertiary', tertiary);
    root.style.setProperty('--ion-color-tertiary-rgb', this.hexToRgbStr(tertiary));
    root.style.setProperty('--ion-color-tertiary-contrast', this.autoContrast(tertiary));
  }

  // 📌 Método que usas desde EmpresaComponent
  async getColorsFromLogo(imgUrl: string): Promise<{ primary: string; secondary: string; tertiary: string }> {
    return this.extractPalette(imgUrl);
  }

  // ---- Paleta precisa desde canvas (k-means + filtros) ----
  private async extractPalette(src: string): Promise<{primary: string; secondary: string; tertiary: string}> {
    const img = await this.loadImage(src);
    const { data } = this.getImageData(img, 96); // reduce tamaño a 96px
    const pixels: RGB[] = [];

    // Filtro: ignora transparentes, casi blancos, casi negros y poco saturados
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i+1], b = data[i+2], a = data[i+3];
      if (a < 220) continue;
      const { s, l } = this.rgbToHsl({ r, g, b });
      if (l > 0.92 || l < 0.08) continue;
      if (s < 0.22) continue;
      pixels.push({ r, g, b });
    }

    // fallback si hay pocos pixeles válidos
    if (pixels.length < 100) {
      for (let i = 0; i < data.length; i += 8) {
        pixels.push({ r: data[i], g: data[i+1], b: data[i+2] });
      }
    }

    const clusters = this.kmeans(pixels, 5, 7);

    // Score por saturación y población
    clusters.forEach(c => {
      const sat = this.rgbToHsl(c.c).s;
      c.satAvg = sat;
      c.pop = c.pts.length;
    });

    const ordered = clusters
      .filter(c => c.pop > 0)
      .sort((a,b) => (b.pop * (0.6 + b.satAvg*0.4)) - (a.pop * (0.6 + a.satAvg*0.4)));

    const uniq: string[] = [];
    for (const cl of ordered) {
      const hex = this.rgbToHex(cl.c);
      if (uniq.every(h => this.colorDistanceHex(h, hex) > 36)) uniq.push(hex);
      if (uniq.length >= 3) break;
    }

    const primary   = uniq[0] ?? '#1976D2';
    const secondary = uniq[1] ?? this.shade(primary, +18);
    const tertiary  = uniq[2] ?? this.shade(primary, -18);

    return { primary, secondary, tertiary };
  }

  // ---- Helpers de canvas ----
  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((res, rej) => {
      const img = new Image();
      if (/^https?:/i.test(src)) img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = (e) => rej(e);
      img.src = src;
    });
  }

  private getImageData(img: HTMLImageElement, targetSize = 96): ImageData {
    const scale = Math.min(targetSize / img.width, targetSize / img.height, 1);
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    return ctx.getImageData(0, 0, w, h);
  }

  private kmeans(pixels: RGB[], K: number, iters: number): Cluster[] {
    if (pixels.length === 0) return Array.from({length: K}, () => ({ c:{r:0,g:0,b:0}, pts:[], satAvg:0, pop:0 }));
    const cents: RGB[] = [];
    cents.push(pixels[Math.floor(Math.random() * pixels.length)]);
    while (cents.length < K) {
      let farIdx = 0, farDist = -1;
      for (let i = 0; i < pixels.length; i++) {
        const d = cents.reduce((min, c) => Math.min(min, this.dist2(pixels[i], c)), Infinity);
        if (d > farDist) { farDist = d; farIdx = i; }
      }
      cents.push(pixels[farIdx]);
    }

    let clusters: Cluster[] = [];
    for (let t = 0; t < iters; t++) {
      clusters = Array.from({length: K}, () => ({ c:{r:0,g:0,b:0}, pts:[], satAvg:0, pop:0 }));
      for (const p of pixels) {
        let k = 0, best = Infinity;
        for (let i = 0; i < K; i++) {
          const d = this.dist2(p, cents[i]);
          if (d < best) { best = d; k = i; }
        }
        clusters[k].pts.push(p);
      }
      for (let i = 0; i < K; i++) {
        if (clusters[i].pts.length === 0) {
          clusters[i].c = pixels[Math.floor(Math.random()*pixels.length)];
          continue;
        }
        let r=0,g=0,b=0;
        clusters[i].pts.forEach(p => { r+=p.r; g+=p.g; b+=p.b; });
        const n = clusters[i].pts.length;
        cents[i] = clusters[i].c = { r: Math.round(r/n), g: Math.round(g/n), b: Math.round(b/n) };
      }
    }
    return clusters;
  }

  // ---- Helpers de color ----
  private rgbToHsl({r,g,b}: RGB) {
    r/=255; g/=255; b/=255;
    const max=Math.max(r,g,b), min=Math.min(r,g,b);
    let h=0,s=0,l=(max+min)/2;
    if (max!==min){
      const d=max-min;
      s = l>0.5 ? d/(2-max-min) : d/(max+min);
      switch(max){
        case r: h=(g-b)/d + (g<b?6:0); break;
        case g: h=(b-r)/d + 2; break;
        case b: h=(r-g)/d + 4; break;
      }
      h/=6;
    }
    return { h, s, l };
  }

  private rgbToHex({r,g,b}: RGB){ return '#'+[r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('').toUpperCase(); }
  private hexToRgb(hex: string): RGB {
    const m = hex.replace('#','');
    return { r: parseInt(m.slice(0,2),16), g: parseInt(m.slice(2,4),16), b: parseInt(m.slice(4,6),16) };
  }
  private hexToRgbStr(hex: string){ const {r,g,b}=this.hexToRgb(hex); return `${r},${g},${b}`; }

  private dist2(a: RGB, b: RGB){ const dr=a.r-b.r, dg=a.g-b.g, db=a.b-b.b; return dr*dr+dg*dg+db*db; }
  private colorDistanceHex(h1: string, h2: string){ return Math.sqrt(this.dist2(this.hexToRgb(h1), this.hexToRgb(h2))); }

  private shade(hex: string, delta: number) {
    const { r,g,b } = this.hexToRgb(hex);
    const clamp = (v:number)=>Math.max(0,Math.min(255, v));
    return this.rgbToHex({ r: clamp(r+delta), g: clamp(g+delta), b: clamp(b+delta) });
  }

  private autoContrast(hex: string){
    const {r,g,b}=this.hexToRgb(hex);
    const lin = (v:number)=> {
      v/=255;
      return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4);
    };
    const L = 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);
    return L > 0.6 ? '#000000' : '#FFFFFF';
  }
}
