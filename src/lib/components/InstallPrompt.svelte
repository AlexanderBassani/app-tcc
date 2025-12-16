<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let deferredPrompt: any = null;
	let showInstallPrompt = $state(false);
	let isInstalled = $state(false);

	onMount(() => {
		// Verificar se já está instalado
		if (window.matchMedia('(display-mode: standalone)').matches) {
			isInstalled = true;
			return;
		}

		// Capturar evento de instalação
		window.addEventListener('beforeinstallprompt', (e) => {
			e.preventDefault();
			deferredPrompt = e;
			showInstallPrompt = true;
		});

		// Detectar quando foi instalado
		window.addEventListener('appinstalled', () => {
			isInstalled = true;
			showInstallPrompt = false;
			deferredPrompt = null;
		});
	});

	async function handleInstall() {
		if (!deferredPrompt) return;

		deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === 'accepted') {
			console.log('PWA instalado');
		}

		deferredPrompt = null;
		showInstallPrompt = false;
	}

	function dismissPrompt() {
		showInstallPrompt = false;
	}
</script>

{#if showInstallPrompt && !isInstalled}
	<div
		class="fixed right-4 bottom-4 left-4 z-50 mx-auto max-w-md rounded-lg bg-white p-4 shadow-lg sm:right-4 sm:left-auto dark:bg-gray-800"
	>
		<div class="flex items-start gap-3">
			<div class="flex-shrink-0">
				<svg
					class="text-primary-600 dark:text-primary-400 h-8 w-8"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
					></path>
				</svg>
			</div>
			<div class="flex-1">
				<h3 class="text-sm font-semibold text-gray-900 dark:text-white">Instalar Aplicativo</h3>
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
					Instale o Vehicle Manager na sua tela inicial para acesso rápido e uso offline.
				</p>
				<div class="mt-3 flex gap-2">
					<button
						onclick={handleInstall}
						class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 rounded-md px-3 py-1.5 text-sm font-medium text-white focus:ring-2 focus:ring-offset-2 focus:outline-none"
					>
						Instalar
					</button>
					<button
						onclick={dismissPrompt}
						class="focus:ring-primary-500 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Agora não
					</button>
				</div>
			</div>
			<button
				onclick={dismissPrompt}
				class="flex-shrink-0 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
				aria-label="Fechar"
			>
				<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
						clip-rule="evenodd"
					></path>
				</svg>
			</button>
		</div>
	</div>
{/if}
