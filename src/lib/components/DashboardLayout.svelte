<script lang="ts">
	import Sidebar from './Sidebar.svelte';
	import UserDropdown from './UserDropdown.svelte';
	import { page } from '$app/stores';

	let { children } = $props();

	// Get page title based on current route
	const pageTitle = $derived(
		(() => {
			const pathname = $page.url.pathname;
			if (pathname === '/') return 'Dashboard';
			if (pathname.startsWith('/vehicles')) return 'Veículos';
			if (pathname.startsWith('/maintenances')) return 'Manutenções';
			if (pathname.startsWith('/fuelings')) return 'Abastecimentos';
			if (pathname.startsWith('/usuarios')) return 'Usuários';
			if (pathname.startsWith('/preferencias')) return 'Preferências';
			if (pathname.startsWith('/history')) return 'Histórico';
			return 'Dashboard';
		})()
	);
</script>

<div class="flex h-screen bg-gray-50 dark:bg-gray-900">
	<!-- Sidebar -->
	<Sidebar />

	<!-- Main Content -->
	<div class="flex flex-1 flex-col overflow-hidden">
		<!-- Header -->
		<header class="border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
			<div class="flex h-16 items-center justify-between px-8">
				<div class="flex items-center gap-4">
					<h1 class="text-xl font-semibold text-gray-900 dark:text-white">{pageTitle}</h1>
				</div>
				<div class="flex items-center gap-4">
					<!-- Search Bar -->
					<div class="hidden md:block">
						<div class="relative">
							<input
								type="text"
								placeholder="Buscar..."
								class="w-64 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
							/>
							<svg
								class="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								></path>
							</svg>
						</div>
					</div>

					<!-- Notifications -->
					<button
						class="relative rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
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
								d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							></path>
						</svg>
						<span
							class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-800"
						></span>
					</button>

					<!-- User Dropdown -->
					<UserDropdown />
				</div>
			</div>
		</header>

		<!-- Page Content -->
		<main class="flex-1 overflow-y-auto bg-gray-50 p-8 dark:bg-gray-900">
			{@render children()}
		</main>
	</div>
</div>
