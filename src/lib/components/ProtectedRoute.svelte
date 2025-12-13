<script lang="ts">
	import { goto } from '$app/navigation';
	import { authStore, isAdmin } from '$lib/stores/auth';
	import { onMount } from 'svelte';

	let { adminOnly = false } = $props();

	let isChecking = $state(true);

	onMount(() => {
		console.log('🔍 [ProtectedRoute] Checking permissions');
		console.log('   adminOnly:', adminOnly);
		console.log('   isAdmin:', isAdmin($authStore.user));

		// IMPORTANTE: O +layout.server.ts JÁ verificou autenticação server-side
		// Aqui só verificamos permissões de admin
		if (adminOnly && !isAdmin($authStore.user)) {
			console.log('   ➡️  Redirecting to / (not admin)');
			goto('/');
			return;
		}

		console.log('   ✅ Access granted');
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
