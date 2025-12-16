<script lang="ts">
	import { authStore, isAdmin } from '$lib/stores/auth';
	import { page } from '$app/stores';

	let usersExpanded = $state(false);

	const isActive = (path: string) => {
		return $page.url.pathname === path;
	};

	const isActiveSection = (path: string) => {
		return $page.url.pathname.startsWith(path);
	};

	// Verifica se estamos em alguma rota de usuários e mantém o menu expandido
	$effect(() => {
		const pathname = $page.url.pathname;
		if (pathname.startsWith('/usuarios')) {
			usersExpanded = true;
		}
	});
</script>

<aside class="w-64 bg-[#1e293b] text-gray-300">
	<div class="flex h-full flex-col">
		<!-- Logo -->
		<div class="flex h-16 items-center gap-3 border-b border-gray-700/50 px-6">
			<div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500">
				<span class="text-2xl font-bold text-white">M</span>
			</div>
			<span class="text-xl font-semibold text-white">MyApp</span>
		</div>

		<!-- Navigation -->
		<nav class="flex-1 space-y-2 overflow-y-auto p-4">
			<!-- Dashboard -->
			<a
				href="/"
				class="flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 text-base transition-all {isActive(
					'/'
				)
					? 'bg-[#3b4f6f] text-white'
					: 'text-gray-300 hover:bg-[#2d3a4f]'}"
			>
				<svg
					class="h-6 w-6"
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
				<div class="space-y-2">
					<button
						onclick={() => (usersExpanded = !usersExpanded)}
						class="flex w-full cursor-pointer items-center justify-between rounded-xl px-4 py-3 text-base text-gray-300 transition-all hover:bg-[#2d3a4f]"
					>
						<div class="flex items-center gap-4">
							<svg
								class="h-6 w-6"
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
							class="h-5 w-5 transition-transform {usersExpanded ? 'rotate-180' : ''}"
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
						<div class="ml-10 space-y-1">
							<a
								href="/usuarios"
								class="block cursor-pointer rounded-lg px-4 py-2 text-sm transition-all {isActive(
									'/usuarios'
								)
									? 'bg-[#3b4f6f] text-white'
									: 'text-gray-400 hover:bg-[#2d3a4f] hover:text-gray-300'}"
							>
								Lista de Usuários
							</a>
							<a
								href="/usuarios/cadastro"
								class="block cursor-pointer rounded-lg px-4 py-2 text-sm transition-all {isActive(
									'/usuarios/cadastro'
								)
									? 'bg-[#3b4f6f] text-white'
									: 'text-gray-400 hover:bg-[#2d3a4f] hover:text-gray-300'}"
							>
								Cadastro de Usuário
							</a>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Vehicles -->
			<a
				href="/vehicles"
				class="flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 text-base transition-all {isActive(
					'/vehicles'
				)
					? 'bg-[#3b4f6f] text-white'
					: 'text-gray-300 hover:bg-[#2d3a4f]'}"
			>
				<svg
					class="h-6 w-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
					></path>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 001-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6 0a1 1 0 001 1h2a1 1 0 001-1m-6 0h6"
					></path>
				</svg>
				<span>Veículos</span>
			</a>

			<!-- Maintenances -->
			<a
				href="/maintenances"
				class="flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 text-base transition-all {isActiveSection('/maintenances')
					? 'bg-[#3b4f6f] text-white'
					: 'text-gray-300 hover:bg-[#2d3a4f]'}"
			>
				<svg
					class="h-6 w-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
					></path>
				</svg>
				<span>Manutenções</span>
			</a>

			<!-- Fuelings -->
			<a
				href="/fuelings"
				class="flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 text-base transition-all {isActiveSection('/fuelings')
					? 'bg-[#3b4f6f] text-white'
					: 'text-gray-300 hover:bg-[#2d3a4f]'}"
			>
				<svg
					class="h-6 w-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M3 10h10a2 2 0 012 2v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a2 2 0 012-2zM5 10V7a2 2 0 012-2h4a2 2 0 012 2v3"
					></path>
				</svg>
				<span>Abastecimentos</span>
			</a>

			<!-- History -->
			<a
				href="/history"
				class="flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 text-base transition-all {isActiveSection('/history')
					? 'bg-[#3b4f6f] text-white'
					: 'text-gray-300 hover:bg-[#2d3a4f]'}"
			>
				<svg
					class="h-6 w-6"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
					></path>
				</svg>
				<span>Histórico</span>
			</a>
		</nav>
	</div>
</aside>
