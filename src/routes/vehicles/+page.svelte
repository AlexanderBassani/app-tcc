<script lang="ts">
	import { onMount } from 'svelte';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { maintenancesApi } from '$lib/api/maintenances';
	import { authStore } from '$lib/stores/auth';
	import type { VehicleWithMaintenance } from '$lib/types/vehicle';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let activeVehicles = $state<VehicleWithMaintenance[]>([]);
	let inactiveVehicles = $state<VehicleWithMaintenance[]>([]);
	let loading = $state(true);
	let error = $state('');
	let activeTab = $state<'active' | 'inactive'>('active');

	onMount(async () => {
		await loadVehicles();
	});

	async function loadVehicles() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) return;

			const [activeRes, inactiveRes, maintenancesRes] = await Promise.all([
				vehiclesApi.list(token),
				vehiclesApi.listInactive(token),
				maintenancesApi.list(token)
			]);

			const maintenances = maintenancesRes.data || [];

			// Associar última manutenção a cada veículo ativo
			activeVehicles = activeRes.data.map((vehicle) => {
				const vehicleMaintenances = maintenances.filter((m) => m.vehicle_id === vehicle.id);
				const lastMaintenance =
					vehicleMaintenances.length > 0
						? vehicleMaintenances.sort(
								(a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
							)[0]
						: null;

				return {
					...vehicle,
					last_maintenance: lastMaintenance
						? {
								id: lastMaintenance.id,
								service_date: lastMaintenance.service_date,
								is_completed: lastMaintenance.is_completed,
								type: lastMaintenance.type
							}
						: null
				};
			});

			// Associar última manutenção a cada veículo inativo
			inactiveVehicles = inactiveRes.data.map((vehicle) => {
				const vehicleMaintenances = maintenances.filter((m) => m.vehicle_id === vehicle.id);
				const lastMaintenance =
					vehicleMaintenances.length > 0
						? vehicleMaintenances.sort(
								(a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
							)[0]
						: null;

				return {
					...vehicle,
					last_maintenance: lastMaintenance
						? {
								id: lastMaintenance.id,
								service_date: lastMaintenance.service_date,
								is_completed: lastMaintenance.is_completed,
								type: lastMaintenance.type
							}
						: null
				};
			});
		} catch (err: any) {
			error = err.message || 'Erro ao carregar veículos';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('pt-BR');
	}

	function getMaintenanceStatusClass(lastMaintenance: any) {
		if (!lastMaintenance) {
			return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
		}
		if (lastMaintenance.is_completed) {
			return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
		}
		// Check if overdue
		const daysUntilDue = Math.ceil(
			(new Date(lastMaintenance.service_date).getTime() - new Date().getTime()) /
				(1000 * 60 * 60 * 24)
		);
		if (daysUntilDue < 0) {
			return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
		} else if (daysUntilDue <= 7) {
			return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
		}
		return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
	}

	function getMaintenanceStatusText(lastMaintenance: any) {
		if (!lastMaintenance) {
			return 'Nenhuma manutenção registrada';
		}
		return formatDate(lastMaintenance.service_date);
	}

	function getMaintenanceBadgeText(lastMaintenance: any) {
		if (!lastMaintenance) {
			return '';
		}
		if (lastMaintenance.is_completed) {
			return '';
		}
		const daysUntilDue = Math.ceil(
			(new Date(lastMaintenance.service_date).getTime() - new Date().getTime()) /
				(1000 * 60 * 60 * 24)
		);
		if (daysUntilDue < 0) {
			return 'Atrasada';
		} else if (daysUntilDue <= 7) {
			return 'Pendente';
		}
		return '';
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Meus Veículos</h1>
				<a
					href="/vehicles/new"
					class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						></path>
					</svg>
					Novo Veículo
				</a>
			</div>

			<!-- Tabs -->
			<div class="rounded-lg bg-white p-1 dark:bg-gray-800">
				<div class="flex gap-2">
					<button
						onclick={() => (activeTab = 'active')}
						class="flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors {activeTab ===
						'active'
							? 'bg-blue-600 text-white shadow-sm'
							: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}"
					>
						Ativos ({activeVehicles.length})
					</button>
					<button
						onclick={() => (activeTab = 'inactive')}
						class="flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors {activeTab ===
						'inactive'
							? 'bg-blue-600 text-white shadow-sm'
							: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}"
					>
						Inativos ({inactiveVehicles.length})
					</button>
				</div>
			</div>

			{#if loading}
				<div class="flex justify-center py-12">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
					></div>
				</div>
			{:else if error}
				<div
					class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
				>
					{error}
				</div>
			{:else}
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each activeTab === 'active' ? activeVehicles : inactiveVehicles as vehicle}
						<a
							href="/vehicles/{vehicle.id}"
							class="group relative block overflow-hidden rounded-xl border {vehicle.is_primary
								? 'border-yellow-400 ring-2 ring-yellow-400/50 dark:border-yellow-500 dark:ring-yellow-500/50'
								: 'border-gray-200 dark:border-gray-700'} bg-white p-6 shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900"
						>
							<!-- Primary Star Badge (top left) -->
							{#if vehicle.is_primary}
								<div class="absolute left-0 top-0">
									<div class="relative">
										<svg
											class="h-16 w-16 text-yellow-400 dark:text-yellow-500"
											viewBox="0 0 100 100"
											fill="currentColor"
										>
											<path
												d="M0,0 L100,0 L0,100 Z"
												fill="currentColor"
											/>
										</svg>
										<svg
											class="absolute left-1.5 top-1.5 h-4 w-4 text-white"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
											></path>
										</svg>
									</div>
								</div>
							{/if}

							<!-- Refresh Icon (top right) -->
							<button
								class="absolute right-6 top-6 rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white"
								aria-label="Atualizar dados do veículo"
								onclick={(e) => {
									e.preventDefault();
									loadVehicles();
								}}
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
										d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
									></path>
								</svg>
							</button>

							<!-- Vehicle Name -->
							<div class="mb-4">
								<div class="flex items-center gap-2">
									<h3 class="text-xl font-bold text-gray-900 dark:text-white">
										{vehicle.brand}
										{vehicle.model}
									</h3>
									{#if vehicle.is_primary}
										<span
											class="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
											title="Veículo Principal"
										>
											<svg
												class="h-3.5 w-3.5"
												fill="currentColor"
												viewBox="0 0 20 20"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
												></path>
											</svg>
										</span>
									{/if}
								</div>
								<p class="text-sm text-gray-600 dark:text-gray-400">
									{vehicle.year} • {vehicle.plate}
								</p>
							</div>

							<!-- Mileage -->
							<div class="mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
								<svg
									class="h-5 w-5 text-blue-400"
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
								<span class="font-medium">{vehicle.current_km.toLocaleString()} km</span>
							</div>

							<!-- Color -->
							<div class="mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
								<svg
									class="h-5 w-5 text-pink-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
									></path>
								</svg>
								<span class="font-medium">{vehicle.color}</span>
							</div>

							<!-- Last Maintenance Section -->
							<div class="border-t border-gray-700 pt-4">
								<div class="mb-2 flex items-center justify-between">
									<span class="text-xs font-medium text-gray-400">Última manutenção:</span>
									{#if getMaintenanceBadgeText(vehicle.last_maintenance)}
										<span
											class="rounded-full px-2.5 py-1 text-xs font-semibold {getMaintenanceStatusClass(
												vehicle.last_maintenance
											)}"
										>
											{getMaintenanceBadgeText(vehicle.last_maintenance)}
										</span>
									{/if}
								</div>
								<div class="text-sm text-gray-300">
									{getMaintenanceStatusText(vehicle.last_maintenance)}
								</div>
							</div>

							<!-- Footer - Added date -->
							<div class="mt-4 text-xs text-gray-500">
								Adicionado em {formatDate(vehicle.created_at)}
							</div>
						</a>
					{/each}

					{#if (activeTab === 'active' ? activeVehicles : inactiveVehicles).length === 0}
						<div class="col-span-full py-12 text-center">
							<div
								class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800"
							>
								<svg
									class="h-8 w-8 text-gray-400"
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
									/>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 001-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6 0a1 1 0 001 1h2a1 1 0 001-1m-6 0h6"
									/>
								</svg>
							</div>
							<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
								Nenhum veículo encontrado
							</h3>
							<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
								{#if activeTab === 'active'}
									Comece adicionando um novo veículo à sua frota.
								{:else}
									Não há veículos inativos no momento.
								{/if}
							</p>
							{#if activeTab === 'active'}
								<div class="mt-6">
									<a
										href="/vehicles/new"
										class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
												d="M12 6v6m0 0v6m0-6h6m-6 0H6"
											></path>
										</svg>
										Novo Veículo
									</a>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</DashboardLayout>
</ProtectedRoute>
