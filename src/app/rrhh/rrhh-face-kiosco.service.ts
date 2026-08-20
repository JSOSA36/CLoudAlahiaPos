import { Injectable } from '@angular/core';

const FACE_API_SRC = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
const FACE_MODELS = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

type FaceApi = any;

@Injectable({ providedIn: 'root' })
export class RrhhFaceKioscoService {
  private faceapi: FaceApi | null = null;
  private loadPromise: Promise<FaceApi> | null = null;
  private stream: MediaStream | null = null;

  async ensureModels(): Promise<void> {
    await this.loadApi();
  }

  async startCamera(video: HTMLVideoElement, facing: 'user' | 'environment'): Promise<void> {
    this.stopCamera();
    video.setAttribute('playsinline', 'true');
    video.setAttribute('autoplay', 'true');
    video.muted = true;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: facing,
        width: { ideal: 720 },
        height: { ideal: 960 }
      }
    });
    this.stream = stream;
    video.srcObject = stream;
    video.playsInline = true;
    await new Promise<void>((resolve) => {
      if (video.readyState >= 2) {
        resolve();
        return;
      }
      const done = () => resolve();
      video.onloadedmetadata = done;
      setTimeout(done, 1200);
    });
    try {
      await video.play();
    } catch {
      /* iOS a veces exige otro gesto; el srcObject ya está. */
    }
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  async analyze(video: HTMLVideoElement): Promise<RrhhFaceSample | null> {
    const faceapi = await this.loadApi();
    if (!video.videoWidth) return null;
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 });
    const all = await faceapi.detectAllFaces(video, options).withFaceLandmarks().withFaceDescriptors();
    if (!all?.length) return { kind: 'none' };
    if (all.length > 1) return { kind: 'many' };

    const det = all[0];
    const box = det.detection.box;
    const minSide = Math.min(video.videoWidth, video.videoHeight);
    const ratio = Math.min(box.width, box.height) / minSide;
    if (ratio < 0.12) return { kind: 'far' };

    return {
      kind: 'ok',
      embedding: Array.from(det.descriptor as Float32Array)
    };
  }

  private async loadApi(): Promise<FaceApi> {
    if (this.faceapi) return this.faceapi;
    if (!this.loadPromise) {
      this.loadPromise = (async () => {
        await this.loadScript(FACE_API_SRC);
        const faceapi = (window as any).faceapi;
        if (!faceapi) throw new Error('No se pudo cargar el motor facial.');
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODELS),
          faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODELS),
          faceapi.nets.faceRecognitionNet.loadFromUri(FACE_MODELS)
        ]);
        this.faceapi = faceapi;
        return faceapi;
      })();
    }
    return this.loadPromise;
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-alahia-face="1"]`) as HTMLScriptElement | null;
      if (existing && (window as any).faceapi) {
        resolve();
        return;
      }
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('No se pudo cargar face-api.')));
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.setAttribute('data-alahia-face', '1');
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar face-api.'));
      document.head.appendChild(s);
    });
  }
}

export type RrhhFaceSample =
  | { kind: 'none' }
  | { kind: 'many' }
  | { kind: 'far' }
  | { kind: 'ok'; embedding: number[] };
