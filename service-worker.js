/** Service Worker File
 * 
 * https://developers.google.com/web/fundamentals/instant-and-offline/offline-cookbook/?hl=pt-br
 */
const version = 1.0; // Mude o número da versão quando precisar atualizar os caches


/** Evento que é acionado quando a instalação do service worker é iniciada
 * 
 * Se todos os arquivos forem armazenados no cache corretamente, o service worker estará instalado.
 * Se o download de qualquer dos arquivos falhar, a etapa de instalação também falhará.
 * Isso permite confiar na disponibilidade de todos os ativos definidos, mas também significa que
 * você precisa ser cuidadoso com a lista de arquivos que quer armazenar em cache na etapa de instalação.
 * Se a lista de arquivos for longa, aumentará a chance de falha no armazenamento em cache de um dos arquivos, impedindo a instalação do service worker.
 *
 * https://developers.google.com/web/fundamentals/primers/service-workers/#instalar_um_service_worker
 */
self.addEventListener('install', function (event) {
	
	// Lista de caches obrigatórios pra o funcionamento do site em modo ofiline!
	window.MAIN_CACHE_NAME = 'offline_cache_version_' + version;
	var urls_to_cache = [
		'/',
		'/styles/styles.css',
		'/script/main.js'
	];
	
	
	// O método "waitUntil" recebe uma promessa que faz o service worker esperar
	// até ser cumprida antes de ser desativado pelo navegador.
	event.waitUntil(
	
		// Criar um novo conjunto nomeado de caches
		caches.open(MAIN_CACHE_NAME)
		.then(function (cache) {
			
			console.log('[ServiceWorker] Opened cache: ' + MAIN_CACHE_NAME);
			
			// Se um falhar, falham todos
			return cache.addAll(urls_to_cache);
			
		})
		.then(function () {
			
			// Ativar o novo service worker assim que instalado.
			// Normalmente ele esperaria o antigo worker não esteja mais controlando nenhum cliente.
			// return self.skipWaiting();
			
		})
		.catch(function () {
			
			console.error('[ServiceWorker] An error occurred during installing version ' + version);
			
		})
		
	);
	
});


/** Quando o novo service worker assumir o controle, o evento activate será acionado.
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
	
	// Listar no console todos os clientes abertos no navegador, apenas para depuração
	self.clients.matchAll({
		includeUncontrolled: true
	})
	.then(function (clientList) {
		
		let urls = clientList.map(function (client) {
			return client.url;
		});
		
		console.log('[ServiceWorker] Matching clients:', urls.join(', '));
	});
	
	
	/* 
	 * O código a seguir faz um loop que percorre todos os caches do service worker,
	 * excluindo os que não estão definidos na lista de permissões do cache.
	*/
	const cache_white_list = [ ...MAIN_CACHE_NAME ];
	
	// O método "waitUntil" recebe uma promessa que faz o service worker esperar
	// até ser cumprida antes de ser desativado pelo navegador.
	event.waitUntil(
		
		caches.keys()
		.then(function (cache_names) {
			return Promise.all(
			
				// Loop nos nomes de todos os caches registrados
				cache_names.map(function (cache_name) {
					
					// Excluir aqueles que não estão incluídos na lista da variável 'cache_white_list'
					if ( cache_white_list.includes(cache_name) === false ) return caches.delete( cache_name );
					
				})
				
			);
		})
		.then(function () {
			
			// Instalado com sucesso!
			console.log('[ServiceWorker] Version ' + version + ' activate, now ready to handle fetches!');
			
			// Forçar todos os clientes usarem a nova versão do service worker
			// console.log('[ServiceWorker] Claiming clients for new version'), self.clients.claim();
			
		})
		
	);
	
});


/** 
 * Esse evento examina as solicitações e encontra todos os resultados armazenados em qualquer um dos
 * caches criados pelo service worker. Se tivermos uma resposta correspondente, retornaremos o valor do cache.
 * Caso contrário, retornaremos o resultado de uma chamada para fetch,
 * que criará uma solicitação de rede e retornará os dados se algo for recuperado do servidor.
 * 
 * https://developers.google.com/web/fundamentals/primers/service-workers/#cache_e_solicitacoes_de_retorno
 */
self.addEventListener('fetch', function (event) {
		
	event.respondWith(
		
		// Verificar se a solicitação já está cacheada
		caches.match(event.request)
		.then(function (cache) {
			
			// Se tiver cacheado, retornar o valor salvo, caso contrário, fazer uma solicitação.			
			return cache || fetch(event.request);
			
		})
		
	);
	
	
	// Exemplo de cache cumulativo de páginas, todas as páginas são solicitadas normalmente e
	// guardadas em cache mas quando ocorrer um erro retornar a versão salva no cache
	/*
	if (event.request.mode === 'navigate') {
		// Requisição de navegação
		
		event.respondWith(
			fetch(event.request)
			.then(function (response) {
				
				// Salvar no cache e retornar a resposta mesmo assim
				caches.open('navigation_cache').then(function (cache) {
					cache.add(cache);
				});
				
				return response;
				
			})
			.catch(function (err) {
				
				// Listar os caches salvos com o nome específico
				return caches.open('navigation_cache').then(function (cache_list) {
					
					return cache_list.match(event.request).then(function (cache) {
					
						// Se tiver cacheado, retornar o valor salvo, caso contrário, retornar um erro
						return cache || Response.error();
					
					})
				
				})
			})
		);
	}
	*/
	
});


/** Evento que recebe menssagens dos clients
 * 
 * http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html
 *
 * 
 * 
 */
self.addEventListener('message', function (event) {
	
    console.log('[ServiceWorker] Received message: ' + event.data);
	
	
	
});
