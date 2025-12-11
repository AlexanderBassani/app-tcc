<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { authStore } from '$lib/stores/auth';

	let isChecking = true;

	onMount(() => {
		// Verificar autenticação
		if (!$authStore.isAuthenticated || !$authStore.token) {
			goto('/login');
			return;
		}
		isChecking = false;
	});
</script>

{#if !isChecking}
	<slot />
{:else}
	<div class="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
		<div
			class="border-primary-500 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
		></div>
	</div>
{/if}
