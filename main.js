/** Comando para instalar o service worker 
 * OBS: Você pode chamar register() todas as vezes que uma página é carregada, sem se preocupar com isso,
 * o navegador saberá se o service worker já está registrado ou não e se comportará adequadamente.
 * 
 * https://developers.google.com/web/fundamentals/primers/service-workers/#registrar_um_service_worker
 */
if ( 'serviceWorker' in navigator ) {
	window.addEventListener('load', function () {
		
		navigator.serviceWorker.register('service-worker.js')
		.then(function (registration) {
			
			// Forçar o navegador a atualizar o service worker manualmente, por exemplo se um usuário fica muito tempo sem recarregar a página.
      // Usar esse comando só é necessário caso você atualize seu worker frequentemente e seu site é single page.
			// registration.update();
			
		}).catch(function (err) {
			
			// Registration failed :(
			console.error('[ServiceWorker] Falha durante a instalação do novo SW: ', err);
			
		});
		
	});
}
