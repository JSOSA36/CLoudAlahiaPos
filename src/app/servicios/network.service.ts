import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NetworkService {

  async isStableConnection(): Promise<boolean> {
    if (!navigator.onLine) return false;

    try {
      await fetch('/assets/ping.json', {
        method: 'GET',
        cache: 'no-store'
      });
      return true;
    } catch {
      return false;
    }
  }
}
