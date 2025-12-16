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
	let loading = true;
	let error = '';

	onMount(async () => {
		await loadVehicles();
	});

	async function loadVehicles() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const vehiclesRes = await vehiclesApi.list(token);
			vehicles = vehiclesRes.data || [];

			// Select first vehicle by default
			if (vehicles.length > 0) {
				selectedVehicleId = vehicles[0].id;
				await loadHistory();
			}
		} catch (err: any) {
			error = err.message || 'Erro ao carregar veículos';
		} finally {
			loading = false;
		}
	}

	async function loadHistory() {
		if (!selectedVehicleId) {
			historyItems = [];
			return;
		}

		try {
			loading = true;
			error = '';
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			// Fetch both fuelings and maintenances for the selected vehicle
			const [fuelingsRes, maintenancesRes] = await Promise.all([
				fuelingsApi.list(token, { vehicleId: selectedVehicleId, limit: 1000 }),
				maintenancesApi.list(token)
			]);

			const fuelings = fuelingsRes.data || [];
			const allMaintenances = maintenancesRes.data || [];

			// Filter maintenances by vehicle
			const maintenances = allMaintenances.filter(m => m.vehicle_id === selectedVehicleId);

			// Convert to unified history items
			const fuelingItems: HistoryItem[] = fuelings.map(f => ({
				id: f.id,
				type: 'fueling' as const,
				date: f.date,
				vehicle_id: f.vehicle_id,
				data: f
			}));

			const maintenanceItems: HistoryItem[] = maintenances.map(m => ({
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
		} catch (err: any) {
			error = err.message || 'Erro ao carregar histórico';
		} finally {
			loading = false;
		}
	}

	function getVehicleInfo(vehicleId: number) {
		const vehicle = vehicles.find(v => v.id === vehicleId);
		return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : 'Veículo não encontrado';
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
		const fuelType = FUEL_TYPES.find(ft => ft.value === type);
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

	async function handleVehicleChange() {
		await loadHistory();
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold text-gray-800 dark:text-white">Histórico</h1>
			</div>

			<!-- Vehicle Selector -->
			<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
				<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Selecione o Veículo
				</label>
				<select
					bind:value={selectedVehicleId}
					on:change={handleVehicleChange}
					class="block w-full md:w-96 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
					disabled={vehicles.length === 0}
				>
					<option value={null}>Selecione um veículo</option>
					{#each vehicles as vehicle}
						<option value={vehicle.id}>
							{vehicle.brand} {vehicle.model} ({vehicle.plate})
						</option>
					{/each}
				</select>
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
			{:else if !selectedVehicleId}
				<div class="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-700">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
						></path>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
						Selecione um veículo
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Escolha um veículo para visualizar seu histórico.
					</p>
				</div>
			{:else if vehicles.length === 0}
				<div class="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-700">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
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
					<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
						Nenhum veículo cadastrado
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Cadastre um veículo para começar a visualizar o histórico.
					</p>
					<div class="mt-6">
						<a
							href="/vehicles/new"
							class="bg-primary-600 hover:bg-primary-700 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
							</svg>
							Cadastrar Veículo
						</a>
					</div>
				</div>
			{:else if historyItems.length === 0}
				<div class="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-700">
					<svg
						class="mx-auto h-12 w-12 text-gray-400"
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
					<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
						Nenhum registro encontrado
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Este veículo ainda não possui abastecimentos ou manutenções registrados.
					</p>
				</div>
			{:else}
				<!-- Timeline -->
				<div class="relative">
					<!-- Vertical line -->
					<div
						class="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-600"
						style="margin-left: 11px;"
					></div>

					<!-- Timeline items -->
					<div class="space-y-6">
						{#each historyItems as item (item.type + '-' + item.id)}
							<div class="relative pl-16">
								<!-- Icon circle -->
								<div
									class="absolute left-0 flex h-12 w-12 items-center justify-center rounded-full {item.type ===
									'fueling'
										? 'bg-blue-100 dark:bg-blue-900/30'
										: 'bg-orange-100 dark:bg-orange-900/30'}"
								>
									{#if item.type === 'fueling'}
										<!-- Gas pump icon -->
										<svg
											class="h-6 w-6 text-blue-600 dark:text-blue-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M3 10h10a2 2 0 012 2v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a2 2 0 012-2zM5 10V7a2 2 0 012-2h4a2 2 0 012 2v3M5 10v3m8-3v3m4-7v11"
											></path>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17 4l3 3-3 3"
											></path>
										</svg>
									{:else}
										<!-- Wrench icon -->
										<svg
											class="h-6 w-6 text-orange-600 dark:text-orange-400"
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
									class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-700"
								>
									{#if item.type === 'fueling'}
										{@const fueling = item.data as Fueling}
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<div class="flex items-center gap-3">
													<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
														Abastecimento
													</h3>
													<span
														class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
													>
														{getFuelTypeLabel(fueling.fuel_type)}
													</span>
													{#if fueling.is_full_tank}
														<span
															class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400"
														>
															Tanque Cheio
														</span>
													{/if}
												</div>

												<div
													class="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-3"
												>
													<div>
														<span class="font-medium">Data:</span>
														{formatDate(fueling.date)}
													</div>
													<div>
														<span class="font-medium">KM:</span>
														{Number(fueling.km).toLocaleString()}
													</div>
													<div>
														<span class="font-medium">Litros:</span>
														{Number(fueling.liters).toFixed(2)} L
													</div>
													<div>
														<span class="font-medium">Preço/L:</span>
														{formatCurrency(Number(fueling.price_per_liter))}
													</div>
													<div>
														<span class="font-medium">Total:</span>
														<span class="font-semibold text-gray-900 dark:text-white">
															{formatCurrency(Number(fueling.total_cost))}
														</span>
													</div>
													{#if fueling.gas_station}
														<div class="col-span-2 md:col-span-1">
															<span class="font-medium">Posto:</span>
															{fueling.gas_station}
														</div>
													{/if}
												</div>

												{#if fueling.notes}
													<div class="mt-3 text-sm text-gray-600 dark:text-gray-300">
														<span class="font-medium">Observações:</span>
														{fueling.notes}
													</div>
												{/if}
											</div>

											<a
												href="/fuelings/{fueling.id}"
												class="ml-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
											>
												Ver
											</a>
										</div>
									{:else}
										{@const maintenance = item.data as Maintenance}
										<div class="flex items-start justify-between">
											<div class="flex-1">
												<div class="flex items-center gap-3">
													<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
														{maintenance.title}
													</h3>
													<span
														class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {maintenance.is_completed
															? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
															: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'}"
													>
														{maintenance.is_completed ? 'Concluída' : 'Pendente'}
													</span>
													<span
														class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-600 dark:text-gray-200"
													>
														{getMaintenanceTypeLabel(maintenance.type)}
													</span>
												</div>

												<div class="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
													{#if maintenance.description}
														<p><strong>Descrição:</strong> {maintenance.description}</p>
													{/if}
													<div class="flex gap-4 flex-wrap">
														<p><strong>Data:</strong> {formatDate(maintenance.service_date)}</p>
														{#if maintenance.cost}
															<p><strong>Custo:</strong> {formatCurrency(maintenance.cost)}</p>
														{/if}
														{#if maintenance.km_when_done}
															<p><strong>KM:</strong> {maintenance.km_when_done.toLocaleString()}</p>
														{/if}
													</div>
													{#if maintenance.notes}
														<p><strong>Observações:</strong> {maintenance.notes}</p>
													{/if}
												</div>
											</div>

											<a
												href="/maintenances/{maintenance.id}"
												class="ml-4 inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
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
