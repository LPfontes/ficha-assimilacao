const CACHE_NAME = 'assimilacao-rpg-v2';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './icons.js',
  './manifest.json',
  './css/variables.css',
  './css/components.css',
  './css/sheet.css',
  './css/wizard.css',
  './css/modals.css',
  './css/dice.css',
  './css/responsive.css',
  './js/state.js',
  './js/characteristics.js',
  './js/assimilations.js',
  './js/wizard.js',
  './js/sheet.js',
  './js/modals.js',
  './js/roller.js',
  './js/health.js',
  './js/chat.js',
  './js/logger.js',
  './js/conflito.js',
  './css/conflito.css',
  './dice/libs/three.min.js',
  './dice/libs/cannon.min.js',
  './dice/libs/teal.js',
  './dice/dice.js',
  './dice/',
  './dice/index.html',
  './dice/styles.css',
  './dice/main.js',
  './dice/assets/background.svg',
  './dice/assets/icon.png',
  './dice/assets/nc93322.mp3',
  './assets/logoAssimilacao.webp',
  './assets/logotipoAssimilacao.webp',
  './assets/fundo1.webp',
  './assets/fundo2.jpeg',
  './assets/d6/1-2(D6).webp',
  './assets/d6/3-4(D6).webp',
  './assets/d6/5(D6).webp',
  './assets/d6/6(D6).webp',
  './assets/d10/1-2(D10).webp',
  './assets/d10/3-4(D10).webp',
  './assets/d10/5(D10).webp',
  './assets/d10/6(D10).webp',
  './assets/d10/7(D10).webp',
  './assets/d10/8(D10).webp',
  './assets/d10/9(D10).webp',
  './assets/d10/10(D10).webp',
  './assets/d12/1-2(D12).webp',
  './assets/d12/3-4(D12).webp',
  './assets/d12/5(D12).webp',
  './assets/d12/6(D12).webp',
  './assets/d12/7(D12).webp',
  './assets/d12/8(D12).webp',
  './assets/d12/9(D12).webp',
  './assets/d12/10(D12).webp',
  './assets/d12/11(D12).webp',
  './assets/d12/12(D12).webp',
  './assets/avatar.png'
];

// Instala o service worker e armazena os recursos estáticos em cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativa e remove caches antigos
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request)
        .then((response) => {
          // Armazena dinamicamente requisições de fontes e arquivos locais com sucesso (status 200)
          if (response && response.status === 200) {
            const url = e.request.url;
            const isLocal = url.startsWith(self.location.origin);
            const isFont = url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com');
            if (isLocal || isFont) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(e.request, responseClone);
              });
            }
          }
          return response;
        })
        .catch((err) => {
          // Trata falhas de rede (offline) graciosamente sem estourar exceções não capturadas
          console.warn('Recurso indisponível offline:', e.request.url);
          return new Response('Offline', { status: 503, statusText: 'Offline Resource Unavailable' });
        });
    })
  );
});
