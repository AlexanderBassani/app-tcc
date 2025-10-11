<script lang="ts">
	import { authStore, isAdmin } from '$lib/stores/auth';
	import { page } from '$app/stores';

	let usersExpanded = $state(false);

	const isActive = (path: string) => {
		return $page.url.pathname === path;
	};

	// Verifica se estamos em alguma rota de usuários e mantém o menu expandido
	$effect(() => {
		const pathname = $page.url.pathname;
		if (pathname.startsWith('/usuarios')) {
			usersExpanded = true;
		}
	});
</script>

<aside class="w-64 border-r border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700">
	<div class="flex h-full flex-col">
		<!-- Logo -->
		<div class="flex h-16 items-center gap-3 border-b border-gray-300 px-6 dark:border-gray-600">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
				<span class="text-xl font-bold text-white">M</span>
			</div>
			<span class="text-xl font-bold text-gray-800 dark:text-white">MyApp</span>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 space-y-1 overflow-y-auto p-4">
			<!-- Dashboard -->
			<a
				href="/"
				class="flex cursor-pointer items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors {isActive(
					'/'
				)
					? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
					: 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600'}"
			>
				<svg
					class="h-5 w-5"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
					></path>
				</svg>
				<span>Dashboard</span>
			</a>

			<!-- Admin Section - Only visible for admin users -->
			{#if isAdmin($authStore.user)}
				<div class="space-y-1">
					<button
						onclick={() => (usersExpanded = !usersExpanded)}
						class="flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600"
					>
						<div class="flex items-center gap-3">
							<svg
								class="h-5 w-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
								></path>
							</svg>
							<span>Usuários</span>
						</div>
						<svg
							class="h-4 w-4 transition-transform {usersExpanded ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 9l-7 7-7-7"
							></path>
						</svg>
					</button>

					<!-- Submenu -->
					{#if usersExpanded}
						<div class="ml-4 space-y-1 border-l-2 border-gray-300 pl-4 dark:border-gray-600">
							<a
								href="/usuarios"
								class="block cursor-pointer rounded-lg px-4 py-2 text-sm transition-colors {isActive(
									'/usuarios'
								)
									? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
									: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'}"
							>
								Lista de Usuários
							</a>
							<a
								href="/usuarios/cadastro"
								class="block cursor-pointer rounded-lg px-4 py-2 text-sm transition-colors {isActive(
									'/usuarios/cadastro'
								)
									? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
									: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600'}"
							>
								Cadastro de Usuário
							</a>
						</div>
					{/if}
				</div>
			{/if}
		</nav>

		<!-- Footer -->
		<div class="border-t border-gray-300 p-4 dark:border-gray-600">
			<p class="text-center text-xs text-gray-500 dark:text-gray-400">
				© 2025 MyApp - TCC PUC
			</p>
		</div>
	</div>
</aside>
