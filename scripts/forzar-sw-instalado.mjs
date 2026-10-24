// La PC instalada queda clavada en la versión anterior cuando el manifiesto
// falló una vez (EXISTING_CLIENTS_ONLY). Este parche corre después de ng build
// sobre www/ngsw-worker.js: una navegación pasa a la versión nueva, y al
// terminar de bajarla recarga las ventanas abiertas.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const archivo = resolve(process.argv[2] || 'www/ngsw-worker.js');
let src = readFileSync(archivo, 'utf8');
const marca = 'alahia-sw-pc-instalada';
if (src.includes(marca)) {
  console.log('SW ya marcado', archivo);
  process.exit(0);
}

const guarda = 'if (this.state === DriverReadyState.NORMAL && hash !== this.latestHash && appVersion.isNavigationRequest(event.request)) {';
const guardaNueva = `if (hash !== this.latestHash && appVersion.isNavigationRequest(event.request)) { /* ${marca} */`;
if (!src.includes(guarda)) {
  console.error('No está el guard de versión del service worker');
  process.exit(1);
}
src = src.replace(guarda, guardaNueva);

const aviso = 'await this.notifyClientsAboutVersionReady(manifest, hash);';
const avisoNuevo = `${aviso}
        try {
          const abiertas = await this.scope.clients.matchAll({ type: "window", includeUncontrolled: true });
          await Promise.all(abiertas.map(async (cliente) => {
            try { await cliente.navigate(cliente.url); } catch (err) { /* ${marca} */ }
          }));
        } catch (err) { /* ${marca} */ }`;
if (!src.includes(aviso)) {
  console.error('No está el aviso de versión lista');
  process.exit(1);
}
src = src.replace(aviso, avisoNuevo);

writeFileSync(archivo, src);
console.log('SW marcado', archivo);
