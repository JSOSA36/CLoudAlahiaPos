const ICONS = [
  { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  {
    src: 'assets/web-app-manifest-192x192.png',
    sizes: '192x192',
    type: 'image/png',
    purpose: 'maskable'
  },
  {
    src: 'assets/web-app-manifest-512x512.png',
    sizes: '512x512',
    type: 'image/png',
    purpose: 'maskable'
  }
];

export function aplicarManifestPwa(opts: {
  name: string;
  shortName?: string;
  startUrl: string;
  scope: string;
  themeColor: string;
  description?: string;
}): void {
  if (typeof document === 'undefined') return;

  const manifest = {
    name: opts.name,
    short_name: (opts.shortName || opts.name).slice(0, 24),
    description: opts.description || opts.name,
    lang: 'es',
    start_url: opts.startUrl,
    scope: opts.scope,
    display: 'standalone',
    orientation: 'portrait',
    background_color: opts.themeColor,
    theme_color: opts.themeColor,
    icons: ICONS
  };

  let link = document.querySelector('link[data-pwa-shell="1"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    link.setAttribute('data-pwa-shell', '1');
    document.head.appendChild(link);
  }

  const prev = link.getAttribute('data-blob-url');
  if (prev) {
    try { URL.revokeObjectURL(prev); } catch { /* ignore */ }
  }

  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  const url = URL.createObjectURL(blob);
  link.setAttribute('data-blob-url', url);
  link.href = url;

  document.title = opts.name;
  const apple = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (apple) apple.setAttribute('content', opts.shortName || opts.name);
  const theme = document.querySelector('meta[name="theme-color"]');
  if (theme) theme.setAttribute('content', opts.themeColor);
}
