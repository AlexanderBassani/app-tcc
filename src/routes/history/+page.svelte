<script lang="ts">
	import { onMount } from 'svelte';
	import { fuelingsApi } from '$lib/api/fuelings';
	import { maintenancesApi } from '$lib/api/maintenances';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Fueling } from '$lib/types/fueling';
	import type { Maintenance } from '$lib/types/maintenance';
	import type { Vehicle } from '$lib/types/vehicle';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { FUEL_TYPES } from '$lib/types/fueling';

	type HistoryItem = {
		id: number;
		type: 'fueling' | 'maintenance';
		date: string;
		vehicle_id: number;
		data: Fueling | Maintenance;
	};

	let vehicles: Vehicle[] = [];
	let selectedVehicleId: number | null = null;
	let historyItems: HistoryItem[] = [];
	let filteredHistoryItems: HistoryItem[] = [];
	let loading = true;
	let error = '';

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			// Fetch vehicles, fuelings and maintenances
			const [vehiclesRes, fuelingsRes, maintenancesRes] = await Promise.all([
				vehiclesApi.list(token),
				fuelingsApi.list(token, { limit: 1000 }),
				maintenancesApi.list(token)
			]);

			vehicles = vehiclesRes.data || [];
			const fuelings = fuelingsRes.data || [];
			const maintenances = maintenancesRes.data || [];

			// Convert to unified history items
			const fuelingItems: HistoryItem[] = fuelings.map((f) => ({
				id: f.id,
				type: 'fueling' as const,
				date: f.date,
				vehicle_id: f.vehicle_id,
				data: f
			}));

			const maintenanceItems: HistoryItem[] = maintenances.map((m) => ({
				id: m.id,
				type: 'maintenance' as const,
				date: m.service_date,
				vehicle_id: m.vehicle_id,
				data: m
			}));

			// Combine and sort chronologically (newest first)
			historyItems = [...fuelingItems, ...maintenanceItems].sort((a, b) => {
				return new Date(b.date).getTime() - new Date(a.date).getTime();
			});

			// Apply vehicle filter
			filterHistoryItems();
		} catch (err: any) {
			error = err.message || 'Erro ao carregar histórico';
		} finally {
			loading = false;
		}
	}

	async function loadHistory() {
		await loadData();
	}

	function getVehicleInfo(vehicleId: number) {
		const vehicle = vehicles.find((v) => v.id === vehicleId);
		return vehicle
			? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`
			: 'Veículo não encontrado';
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function formatCurrency(value: number) {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(value);
	}

	function getFuelTypeLabel(type: string) {
		const fuelType = FUEL_TYPES.find((ft) => ft.value === type);
		return fuelType?.label || type;
	}

	function getMaintenanceTypeLabel(type: string) {
		const types = {
			preventiva: 'Preventiva',
			corretiva: 'Corretiva',
			revisao: 'Revisão',
			outros: 'Outros'
		};
		return types[type as keyof typeof types] || type;
	}

	function filterHistoryItems() {
		if (selectedVehicleId === null) {
			filteredHistoryItems = historyItems;
		} else {
			filteredHistoryItems = historyItems.filter(
				(item) => item.vehicle_id === selectedVehicleId
			);
		}
	}

	function handleVehicleChange() {
		filterHistoryItems();
	}

	function clearFilters() {
		selectedVehicleId = null;
		filterHistoryItems();
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Histórico</h1>
			</div>

			<!-- Filters -->
			<div class="rounded-lg bg-white p-4 dark:bg-gray-800">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
							Filtrar por Veículo
						</label>
						<select
							bind:value={selectedVehicleId}
							on:change={handleVehicleChange}
							class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						>
							<option value={null}>Todos os veículos</option>
							{#each vehicles as vehicle}
								<option value={vehicle.id}>
									{vehicle.brand} {vehicle.model} ({vehicle.plate})
								</option>
							{/each}
						</select>
					</div>
				</div>

				{#if selectedVehicleId !== null}
					<div class="mt-4">
						<button
							on:click={clearFilters}
							class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
						>
							Limpar filtros
						</button>
					</div>
				{/if}
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
			{:else if vehicles.length === 0}
				<div class="rounded-xl bg-white p-12 text-center shadow-sm dark:bg-gray-800">
					<svg
						class="mx-auto h-16 w-16 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
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
					<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
						Nenhum veículo cadastrado
					</h3>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Cadastre um veículo para começar a visualizar o histórico.
					</p>
					<div class="mt-6">
						<a
							href="/vehicles/new"
							class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 6v6m0 0v6m0-6h6m-6 0H6"
								></path>
							</svg>
							Cadastrar Veículo
						</a>
					</div>
				</div>
			{:else if filteredHistoryItems.length === 0 && selectedVehicleId !== null}
				<div class="rounded-xl bg-white p-12 text-center shadow-sm dark:bg-gray-800">
					<svg
						class="mx-auto h-16 w-16 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
						Nenhum registro encontrado
					</h3>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Não há registros para o veículo selecionado.
					</p>
				</div>
			{:else if historyItems.length === 0}
				<div class="rounded-xl bg-white p-12 text-center shadow-sm dark:bg-gray-800">
					<svg
						class="mx-auto h-16 w-16 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
						Nenhum registro encontrado
					</h3>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Não há abastecimentos ou manutenções registrados.
					</p>
				</div>
			{:else}
				<!-- Timeline -->
				<div class="relative">
					<!-- Vertical line -->
					<div class="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-700"></div>

					<!-- Timeline items -->
					<div class="space-y-6">
						{#each filteredHistoryItems as item (item.type + '-' + item.id)}
							<div class="relative pl-16">
								<!-- Icon circle -->
								<div
									class="absolute left-0 flex h-12 w-12 items-center justify-center rounded-full {item.type ===
									'fueling'
										? 'bg-blue-600'
										: 'bg-orange-600'}"
								>
									{#if item.type === 'fueling'}
										<!-- Gas pump icon -->
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
											class="h-6 w-6 text-white"
											><line x1="3" x2="15" y1="22" y2="22"></line><line
												x1="4"
												x2="14"
												y1="9"
												y2="9"
											></line><path d="M14 22V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v18"></path><path
												d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L18 5"
											></path></svg
										>
									{:else}
										<!-- Wrench icon -->
										<svg
											class="h-6 w-6 text-white"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
											></path>
										</svg>
									{/if}
								</div>

								<!-- Content card -->
								<div
									class="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-800 to-gray-900 p-6 shadow-lg transition-all hover:shadow-xl dark:border-gray-700"
								>
									{#if item.type === 'fueling'}
										{@const fueling = item.data as Fueling}
										<div class="flex items-start justify-between gap-4">
											<div class="flex-1 space-y-3">
												<!-- Title and Badges -->
												<div class="flex items-center gap-2">
													<h3 class="text-lg font-semibold text-white">Abastecimento</h3>
													<span
														class="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400"
													>
														{getFuelTypeLabel(fueling.fuel_type)}
													</span>
													{#if fueling.is_full_tank}
														<span
															class="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400"
														>
															Tanque Cheio
														</span>
													{/if}
												</div>

												<!-- Vehicle Info -->
												<div class="text-white">
													<p class="text-sm text-gray-400">Veículo:</p>
													<p class="font-semibold">{getVehicleInfo(fueling.vehicle_id)}</p>
												</div>

												<!-- Date and KM -->
												<div class="flex gap-6 text-sm text-gray-300">
													<div>
														<span class="text-gray-400">Data:</span>
														<span class="ml-1">{formatDate(fueling.date)}</span>
													</div>
													<div>
														<span class="text-gray-400">KM:</span>
														<span class="ml-1">{Number(fueling.km).toLocaleString()}</span>
													</div>
												</div>

												<!-- Liters and Price -->
												<div class="flex gap-6 text-sm text-gray-300">
													<div>
														<span class="text-gray-400">Litros:</span>
														<span class="ml-1">{Number(fueling.liters).toFixed(2)} L</span>
													</div>
													<div>
														<span class="text-gray-400">Preço/L:</span>
														<span class="ml-1"
															>{formatCurrency(Number(fueling.price_per_liter))}</span
														>
													</div>
												</div>

												<!-- Total Cost and Gas Station -->
												<div class="flex items-baseline gap-6 text-sm text-gray-300">
													<div>
														<span class="text-gray-400">Total:</span>
														<span class="ml-1 text-lg font-bold text-white"
															>{formatCurrency(Number(fueling.total_cost))}</span
														>
													</div>
													{#if fueling.gas_station}
														<div>
															<span class="text-gray-400">Posto:</span>
															<span class="ml-1">{fueling.gas_station}</span>
														</div>
													{/if}
												</div>
											</div>

											<!-- Action Button -->
											<a
												href="/fuelings/{fueling.id}"
												class="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
											>
												Ver
											</a>
										</div>
									{:else}
										{@const maintenance = item.data as Maintenance}
										<div class="flex items-start justify-between gap-4">
											<div class="flex-1 space-y-3">
												<!-- Title and Status Badge and Type -->
												<div class="flex items-center gap-2">
													<h3 class="text-lg font-semibold text-white">Manutenção</h3>
													<span
														class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold {maintenance.is_completed
															? 'border border-green-500/30 bg-green-500/10 text-green-400'
															: 'border border-red-500/30 bg-red-500/10 text-red-400'}"
													>
														{maintenance.is_completed ? 'Concluída' : 'Pendente'}
													</span>
													<span
														class="inline-flex items-center rounded-full bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300"
													>
														{getMaintenanceTypeLabel(maintenance.type)}
													</span>
												</div>

												<!-- Vehicle Info -->
												<div class="text-white">
													<p class="text-sm text-gray-400">Veículo:</p>
													<p class="font-semibold">{getVehicleInfo(maintenance.vehicle_id)}</p>
												</div>

												<!-- Title -->
												{#if maintenance.title}
													<div class="text-white">
														<p class="text-sm text-gray-400">Título:</p>
														<p class="font-medium">{maintenance.title}</p>
													</div>
												{/if}

												<!-- Description -->
												{#if maintenance.description}
													<div class="text-white">
														<p class="text-sm text-gray-400">Descrição:</p>
														<p class="text-sm">{maintenance.description}</p>
													</div>
												{/if}

												<!-- Date and Cost -->
												<div class="flex gap-6 text-sm text-gray-300">
													<div>
														<span class="text-gray-400">Data:</span>
														<span class="ml-1">{formatDate(maintenance.service_date)}</span>
													</div>
													{#if maintenance.cost}
														<div>
															<span class="text-gray-400">Custo:</span>
															<span class="ml-1 font-semibold"
																>{formatCurrency(maintenance.cost)}</span
															>
														</div>
													{/if}
												</div>
											</div>

											<!-- Action Button -->
											<a
												href="/maintenances/{maintenance.id}"
												class="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
											>
												Ver
											</a>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</DashboardLayout>
</ProtectedRoute>
