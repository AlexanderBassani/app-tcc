<script lang="ts">
	import { onMount } from 'svelte';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Vehicle } from '$lib/types/vehicle';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let activeVehicles: Vehicle[] = [];
	let inactiveVehicles: Vehicle[] = [];
	let loading = true;
	let error = '';
	let activeTab: 'active' | 'inactive' = 'active';

	onMount(async () => {
		await loadVehicles();
	});

	async function loadVehicles() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) return;

			const [activeRes, inactiveRes] = await Promise.all([
				vehiclesApi.list(token),
				vehiclesApi.listInactive(token)
			]);

			activeVehicles = activeRes.data;
			inactiveVehicles = inactiveRes.data;
		} catch (err: any) {
			error = err.message || 'Erro ao carregar veículos';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('pt-BR');
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="space-y-6">
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold text-gray-800 dark:text-white">Meus Veículos</h1>
				<a
					href="/vehicles/new"
					class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 rounded-lg px-4 py-2 text-white transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
				>
					Novo Veículo
				</a>
			</div>

			<!-- Tabs -->
			<div class="border-b border-gray-200 dark:border-gray-700">
				<nav class="-mb-px flex space-x-8">
					<button
						onclick={() => (activeTab = 'active')}
						class="border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors {activeTab ===
						'active'
							? 'border-primary-500 text-primary-600 dark:text-primary-400'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
					>
						Ativos ({activeVehicles.length})
					</button>
					<button
						onclick={() => (activeTab = 'inactive')}
						class="border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors {activeTab ===
						'inactive'
							? 'border-primary-500 text-primary-600 dark:text-primary-400'
							: 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}"
					>
						Inativos ({inactiveVehicles.length})
					</button>
				</nav>
			</div>

			{#if loading}
				<div class="flex justify-center py-12">
					<div
						class="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
					></div>
				</div>
			{:else if error}
				<div class="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
					{error}
				</div>
			{:else}
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each activeTab === 'active' ? activeVehicles : inactiveVehicles as vehicle}
						<a
							href="/vehicles/{vehicle.id}"
							class="group relative block overflow-hidden rounded-lg bg-white shadow transition-all hover:-translate-y-1 hover:shadow-md dark:bg-gray-700"
						>
							<div class="p-6">
								<div class="flex items-start justify-between">
									<div>
										<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
											{vehicle.brand}
											{vehicle.model}
										</h3>
										<p class="text-sm text-gray-500 dark:text-gray-400">
											{vehicle.year} • {vehicle.plate}
										</p>
									</div>
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-400"
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
												d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
											></path>
										</svg>
									</div>
								</div>

								<div class="mt-4 space-y-2">
									<div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
										<svg
											class="mr-2 h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											></path>
										</svg>
										{vehicle.current_km.toLocaleString()} km
									</div>
									<div class="flex items-center text-sm text-gray-600 dark:text-gray-300">
										<svg
											class="mr-2 h-4 w-4"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
											></path>
										</svg>
										{vehicle.color}
									</div>
								</div>
							</div>
							<div class="bg-gray-50 px-6 py-3 dark:bg-gray-600/50">
								<p class="text-xs text-gray-500 dark:text-gray-400">
									Adicionado em {formatDate(vehicle.created_at)}
								</p>
							</div>
						</a>
					{/each}

					{#if (activeTab === 'active' ? activeVehicles : inactiveVehicles).length === 0}
						<div class="col-span-full py-12 text-center">
							<div
								class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
							>
								<svg
									class="h-6 w-6 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
									></path>
								</svg>
							</div>
							<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
								Nenhum veículo encontrado
							</h3>
							<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
								Comece adicionando um novo veículo.
							</p>
							<div class="mt-6">
								<a
									href="/vehicles/new"
									class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 inline-flex items-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none"
								>
									Novo Veículo
								</a>
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</DashboardLayout>
</ProtectedRoute>
