// Nome dos dois tipos de caches usados nessa versão do service worker.
// Mude o número para 2, 2.1, etc, quando você precisar atualizar os caches.
// OBS: a mudança do número fará com que todos os navegadores instalem de novo o SW.
const version  = 1;
const PRECACHE = 'precache-v' + version;
const PROGRESSIVE_CACHE = 'progressive-cache';

// Lista de todos os arquivos fundamentais para o funcionamento offline do website.
const PRECACHE_URLS = [
  'index.html',
  '/', // Alias for index.html
  'styles.css',
  'main.js'
];

// Variáveis de cores para ser usada no console
var successColor = '\x1b[32m[ServiceWorker] %s\x1b[0m',
	errorColor = '\x1b[31m[ServiceWorker] %s\x1b[0m',
	infoColor = '\x1b[33m[ServiceWorker] %s\x1b[0m',
	logColor = '\033[30m[ServiceWorker] %s\x1b[0m';

/**
 * O evento 'install' é acionado quando a instalação do service worker é iniciada
 * 
 * Se todos os arquivos forem armazenados no cache corretamente, o service worker estará instalado.
 * Se o download de qualquer dos arquivos falhar, a etapa de instalação também falhará.
 * Isso permite confiar na disponibilidade de todos os ativos definidos, mas também significa que
 * é preciso ser cuidadoso com a lista de arquivos que quer armazenar em cache na etapa de instalação.
 * Se a lista de arquivos for longa, aumentará a chance de falha no armazenamento em cache de um dos arquivos, impedindo a instalação do service worker.
 *
 * https://developers.google.com/web/fundamentals/primers/service-workers/#instalar_um_service_worker
 */
self.addEventListener('install', function (event) {
	event.waitUntil(
		caches.open(PRECACHE)
			// Cachear os urls fundamentais para o funcionamento offline.
			.then(cache => cache.addAll(PRECACHE_URLS))
			// Ativar o novo service worker assim que instalado.
			// Normalmente ele esperaria o antigo worker não esteja mais controlando nenhum cliente.
			.then(self.skipWaiting())

			.then(() => console.log(successColor, `Versão ${version} instalada com sucesso com o scopo:`, self.location.origin))
  );
});


/**
 * Quando o novo service worker assumir o controle, o evento 'activate' será acionado.
 * Ideal para: recursos maiores que não são imediatamente necessários, como ativos para níveis posteriores de um jogo.
 * 
 * O novo service worker será iniciado e o evento install será acionado.
 * Nesse momento, o service worker anterior ainda estará controlando as páginas atuais. Portanto, o novo service worker entrará em um estado waiting.
 * Quando as páginas do site abertas nesse momento forem fechadas, o service worker anterior será finalizado e o novo assumirá o controle.
 * Quando o novo service worker assumir o controle, o evento activate será acionado.
 * 
 * https://developers.google.com/web/fundamentals/primers/service-workers/#update-a-service-worker
 */
self.addEventListener('activate', function (event) {
	const currentCaches = [PRECACHE, PROGRESSIVE_CACHE];
	
  event.waitUntil(
		caches.keys()
			// Fazer a limpeza dos caches antigos
			.then((cacheNames) => {
				return cacheNames.filter((cacheName) => currentCaches.includes(cacheName) === false);
			})
			.then((cachesToDelete) => {
				// Remover os caches antigos
				return Promise.all( cachesToDelete.map((c) => caches.delete(c)) );
			})
			// Forçar todas as outras páginas abertas no navegador a usarem a nova versão do service worker
			.then(() => self.clients.claim())

			.then(() => consoe.log(logColor, `Versão ${version} ativada, pronto para processar solicitações!`))

		);
});


/**
 * O evento 'fetch' cuida de todos as solicitações (do mesmo domínio) feitas pela página.
 * 
 * Se a solicitação já estiver cacheada ele retorna a versão salva anteriormente,
 * caso contrário, ele faz uma nova solicitação de rede e salva no 'progressive-cache'
 * para ser usado na próxima vez.
 * 
 * https://developers.google.com/web/fundamentals/primers/service-workers/#cache_e_solicitacoes_de_retorno
 */
self.addEventListener('fetch', function (event) {
	// Pular requisições de outros domínios, como o Google Analytics.
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
				// Se o cache existir, retornar a versão cacheada
				if (cachedResponse) return cachedResponse;

				return caches.open(PROGRESSIVE_CACHE)
				.then(cache => {
					// Fazer uma requisição
					return fetch(event.request).then(response => {
            // Cachear essa nova solicitação no progressive-cache
            return cache.put(event.request, response.clone()).then(() => response);
          });
        });
      })
    );
  }
});

