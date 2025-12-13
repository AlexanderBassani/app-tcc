<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { authStore } from '$lib/stores/auth';
	import { theme } from '$lib/stores/theme';
	import { onMount } from 'svelte';
	import InstallPrompt from '$lib/components/InstallPrompt.svelte';

	let { children } = $props();

	// Inicializar auth e tema ao carregar a aplicação
	onMount(() => {
		authStore.initialize();
		theme.init();

		// DESABILITADO TEMPORARIAMENTE: Service Worker causa problemas de cache durante desenvolvimento
		// Descomente em produção se necessário
		/*
		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/sw.js')
				.then((registration) => {
					console.log('Service Worker registrado:', registration);
				})
				.catch((error) => {
					console.error('Erro ao registrar Service Worker:', error);
				});
		}
		*/
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if typeof window !== 'undefined'}
	<InstallPrompt />
{/if}

{@render children?.()}
