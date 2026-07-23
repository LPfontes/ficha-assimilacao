// Constantes de Cache e Verificação Semanal
const CACHE_NAME = 'assimilacao-rpg-v2';
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000; // 1 semana em milissegundos (604.800.000 ms)

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


// Auxiliares para ler/salvar o timestamp da última verificação do servidor
async function getLastServerCheckTime() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/__server_check_time__');
    if (response) {
      const data = await response.json();
      return data.timestamp || 0;
    }
  } catch (err) {
    console.warn('SW: Não foi possível obter o timestamp da última verificação.', err);
  }
  return 0;
}

async function setLastServerCheckTime(timestamp) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = new Response(JSON.stringify({ timestamp }), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put('/__server_check_time__', response);
  } catch (err) {
    console.warn('SW: Não foi possível salvar o timestamp da última verificação.', err);
  }
}

// Verifica a disponibilidade do servidor a cada 1 semana
async function checkServerAvailability() {
  const now = Date.now();
  const lastCheck = await getLastServerCheckTime();

  // Se ainda não passou 1 semana desde a última verificação, não executa
  if (lastCheck > 0 && (now - lastCheck) < ONE_WEEK_MS) {
    return;
  }

  try {
    // Tenta acessar o servidor ignorando o cache
    const response = await fetch(`${self.location.origin}/manifest.json?t=${now}`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (response && response.ok) {
      console.log('SW: Verificação semanal do servidor bem-sucedida (Resposta OK). Atualizando timestamp e recarregando aplicação...');
      await setLastServerCheckTime(now);

      // Notifica todos os clientes (janelas abertas) para recarregarem a aplicação
      const clientsList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clientsList) {
        client.postMessage({ type: 'RELOAD_APP' });
      }
    } else {
      console.warn('SW: Verificação semanal do servidor retornou erro/status não OK. Resetando o timeout (novo ciclo de 1 semana).');
      await setLastServerCheckTime(now);
    }
  } catch (error) {
    console.warn('SW: Erro de rede ao verificar o servidor. Resetando o timeout (novo ciclo de 1 semana).', error);
    await setLastServerCheckTime(now);
  }
}

let serverCheckInterval = null;
function startWeeklyCheckTimer() {
  if (serverCheckInterval) clearInterval(serverCheckInterval);

  // Executa uma verificação ao iniciar
  checkServerAvailability();

  // Re-verifica periodicamente (a cada 1 hora) para checar se o intervalo de 1 semana expirou
  serverCheckInterval = setInterval(() => {
    checkServerAvailability();
  }, 60 * 60 * 1000);
}

// Instala o service worker e armazena os recursos estáticos em cache
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Ativa e remove caches antigos, iniciando o timer semanal
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
    }).then(() => {
      startWeeklyCheckTimer();
    })
  );
  self.clients.claim();
});

// Manipula mensagens enviadas do cliente para o Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_SERVER_NOW') {
    checkServerAvailability();
  }
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  // Ignora requisições de checagem do servidor para evitar interceptação pelo cache
  if (e.request.url.includes('/__server_check_time__')) return;

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

