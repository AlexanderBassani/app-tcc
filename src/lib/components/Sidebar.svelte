<script lang="ts">
	import { authStore, isAdmin } from '$lib/stores/auth';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let usersExpanded = $state(false);
	let isCollapsed = $state(false);

	// Load collapsed state from localStorage on mount
	onMount(() => {
		const savedState = localStorage.getItem('sidebarCollapsed');
		if (savedState !== null) {
			isCollapsed = savedState === 'true';
		}
	});

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

	function toggleSidebar() {
		isCollapsed = !isCollapsed;
		// Save state to localStorage
		localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
	}
</script>

<aside
	class="bg-white text-gray-700 transition-all duration-300 dark:bg-[#1e293b] dark:text-gray-300 {isCollapsed ? 'w-20' : 'w-64'}"
>
	<div class="flex h-full flex-col">
		<!-- Logo and Toggle -->
		<div class="flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-700/50 {isCollapsed ? 'justify-center' : 'justify-between'}">
			{#if !isCollapsed}
				<h1 class="text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
					AutoManager
				</h1>
				<button
					onclick={toggleSidebar}
					class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2d3a4f] dark:hover:text-white"
					title="Recolher menu"
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
							d="M4 6h16M4 12h16M4 18h16"
						></path>
					</svg>
				</button>
			{:else}
				<button
					onclick={toggleSidebar}
					class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2d3a4f] dark:hover:text-white"
					title="Expandir menu"
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
							d="M4 6h16M4 12h16M4 18h16"
						></path>
					</svg>
				</button>
			{/if}
		</div>

		<!-- Navigation -->
		<nav class="flex-1 space-y-2 overflow-y-auto p-4">
			<!-- Dashboard -->
			<a
				href="/"
				class="flex cursor-pointer items-center gap-4 rounded-xl px-3 py-3 text-base transition-all {isActive(
					'/'
				)
					? 'bg-blue-50 text-blue-600 dark:bg-[#3b4f6f] dark:text-white'
					: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2d3a4f]'}"
				title="Dashboard"
			>
				<svg
					class="h-6 w-6 flex-shrink-0"
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
				{#if !isCollapsed}
					<span>Dashboard</span>
				{/if}
			</a>

			<!-- Admin Section - Only visible for admin users -->
			{#if isAdmin($authStore.user)}
				<div class="space-y-2">
					<button
						onclick={() => (usersExpanded = !usersExpanded)}
						class="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-base text-gray-700 transition-all hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2d3a4f]"
						title="Usuários"
					>
						<div class="flex items-center gap-4">
							<svg
								class="h-6 w-6 flex-shrink-0"
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
							{#if !isCollapsed}
								<span>Usuários</span>
							{/if}
						</div>
						{#if !isCollapsed}
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
						{/if}
					</button>

					<!-- Submenu -->
					{#if usersExpanded && !isCollapsed}
						<div class="ml-10 space-y-1">
							<a
								href="/usuarios"
								class="block cursor-pointer rounded-lg px-4 py-2 text-sm transition-all {isActive(
									'/usuarios'
								)
									? 'bg-blue-50 text-blue-600 dark:bg-[#3b4f6f] dark:text-white'
									: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2d3a4f] dark:hover:text-gray-300'}"
							>
								Lista de Usuários
							</a>
							<a
								href="/usuarios/cadastro"
								class="block cursor-pointer rounded-lg px-4 py-2 text-sm transition-all {isActive(
									'/usuarios/cadastro'
								)
									? 'bg-blue-50 text-blue-600 dark:bg-[#3b4f6f] dark:text-white'
									: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-[#2d3a4f] dark:hover:text-gray-300'}"
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
				class="flex cursor-pointer items-center gap-4 rounded-xl px-3 py-3 text-base transition-all {isActive(
					'/vehicles'
				)
					? 'bg-blue-50 text-blue-600 dark:bg-[#3b4f6f] dark:text-white'
					: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2d3a4f]'}"
				title="Veículos"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-car h-5 w-5 flex-shrink-0"
					><path
						d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"
					></path><circle cx="7" cy="17" r="2"></circle><path d="M9 17h6"></path><circle
						cx="17"
						cy="17"
						r="2"
					></circle></svg
				>
				{#if !isCollapsed}
					<span>Veículos</span>
				{/if}
			</a>

			<!-- Maintenances -->
			<a
				href="/maintenances"
				class="flex cursor-pointer items-center gap-4 rounded-xl px-3 py-3 text-base transition-all {isActiveSection(
					'/maintenances'
				)
					? 'bg-blue-50 text-blue-600 dark:bg-[#3b4f6f] dark:text-white'
					: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2d3a4f]'}"
				title="Manutenções"
			>
				<svg
					class="h-6 w-6 flex-shrink-0"
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
				{#if !isCollapsed}
					<span>Manutenções</span>
				{/if}
			</a>

			<!-- Fuelings -->
			<a
				href="/fuelings"
				class="flex cursor-pointer items-center gap-4 rounded-xl px-3 py-3 text-base transition-all {isActiveSection(
					'/fuelings'
				)
					? 'bg-blue-50 text-blue-600 dark:bg-[#3b4f6f] dark:text-white'
					: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2d3a4f]'}"
				title="Abastecimentos"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="lucide lucide-fuel h-5 w-5 flex-shrink-0"
					><line x1="3" x2="15" y1="22" y2="22"></line><line x1="4" x2="14" y1="9" y2="9"
					></line><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path><path
						d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"
					></path></svg
				>
				{#if !isCollapsed}
					<span>Abastecimentos</span>
				{/if}
			</a>

			<!-- History -->
			<a
				href="/history"
				class="flex cursor-pointer items-center gap-4 rounded-xl px-3 py-3 text-base transition-all {isActiveSection(
					'/history'
				)
					? 'bg-blue-50 text-blue-600 dark:bg-[#3b4f6f] dark:text-white'
					: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-[#2d3a4f]'}"
				title="Histórico"
			>
				<svg
					class="h-6 w-6 flex-shrink-0"
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
				{#if !isCollapsed}
					<span>Histórico</span>
				{/if}
			</a>
		</nav>
	</div>
</aside>
