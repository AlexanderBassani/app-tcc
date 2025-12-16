<script lang="ts">
	import { onMount } from 'svelte';
	import { fuelingsApi } from '$lib/api/fuelings';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Fueling } from '$lib/types/fueling';
	import type { Vehicle } from '$lib/types/vehicle';
	import { FUEL_TYPES, SORT_OPTIONS } from '$lib/types/fueling';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let fuelings: Fueling[] = [];
	let vehicles: Vehicle[] = [];
	let loading = true;
	let error = '';

	// Filters
	let selectedVehicle: number | undefined = undefined;
	let startDate = '';
	let endDate = '';
	let sortBy = 'date:DESC';
	let page = 1;
	let limit = 20;
	let totalPages = 1;

	onMount(async () => {
		await loadVehicles();
		await loadData();
	});

	async function loadVehicles() {
		try {
			const token = $authStore.token;
			if (!token) return;

			const vehiclesRes = await vehiclesApi.list(token);
			vehicles = vehiclesRes.data || [];
		} catch (err: any) {
			console.error('Erro ao carregar veículos:', err);
		}
	}

	async function loadData() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const response = await fuelingsApi.list(token, {
				page,
				limit,
				vehicleId: selectedVehicle,
				from: startDate || undefined,
				to: endDate || undefined,
				sort: sortBy as any
			});

			fuelings = response.data || [];
			totalPages = response.pagination?.pages || 1;
		} catch (err: any) {
			error = err.message || 'Erro ao carregar dados';
		} finally {
			loading = false;
		}
	}

	function getVehicleInfo(vehicleId: number) {
		const vehicle = vehicles.find(v => v.id === vehicleId);
		return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : 'Veículo não encontrado';
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('pt-BR');
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

	function calculateConsumption(fueling: Fueling, index: number): string {
		if (!fueling.is_full_tank) return 'N/A';

		// Find previous full tank for same vehicle
		for (let i = index + 1; i < fuelings.length; i++) {
			if (fuelings[i].vehicle_id === fueling.vehicle_id && fuelings[i].is_full_tank) {
				const kmDiff = Number(fueling.km) - Number(fuelings[i].km);
				const consumption = kmDiff / Number(fueling.liters);
				return `${consumption.toFixed(2)} km/L`;
			}
		}
		return 'N/A';
	}

	async function handleDelete(id: number) {
		if (!confirm('Tem certeza que deseja excluir este abastecimento?')) return;

		try {
			const token = $authStore.token;
			if (!token) return;

			await fuelingsApi.delete(id, token);
			await loadData();
		} catch (err: any) {
			alert(err.message || 'Erro ao excluir abastecimento');
		}
	}

	async function handleFilterChange() {
		page = 1;
		await loadData();
	}

	async function handlePageChange(newPage: number) {
		page = newPage;
		await loadData();
	}

	function clearFilters() {
		selectedVehicle = undefined;
		startDate = '';
		endDate = '';
		sortBy = 'date:DESC';
		page = 1;
		loadData();
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold text-gray-800 dark:text-white">Abastecimentos</h1>
				<a
					href="/fuelings/new"
					class="bg-primary-600 hover:bg-primary-700 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
					</svg>
					Novo Abastecimento
				</a>
			</div>

			<!-- Filters -->
			<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Veículo
						</label>
						<select
							bind:value={selectedVehicle}
							on:change={handleFilterChange}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
						>
							<option value={undefined}>Todos os veículos</option>
							{#each vehicles as vehicle}
								<option value={vehicle.id}>
									{vehicle.brand} {vehicle.model} ({vehicle.plate})
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Data Inicial
						</label>
						<input
							type="date"
							bind:value={startDate}
							on:change={handleFilterChange}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Data Final
						</label>
						<input
							type="date"
							bind:value={endDate}
							on:change={handleFilterChange}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
						/>
					</div>

					<div>
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Ordenar por
						</label>
						<select
							bind:value={sortBy}
							on:change={handleFilterChange}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
						>
							{#each SORT_OPTIONS as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
				</div>

				{#if selectedVehicle || startDate || endDate || sortBy !== 'date:DESC'}
					<div class="mt-4">
						<button
							on:click={clearFilters}
							class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
						>
							Limpar filtros
						</button>
					</div>
				{/if}
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
			{:else if fuelings.length === 0}
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
							d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
						></path>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
						Nenhum abastecimento encontrado
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Comece registrando seu primeiro abastecimento.
					</p>
					<div class="mt-6">
						<a
							href="/fuelings/new"
							class="bg-primary-600 hover:bg-primary-700 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
						>
							<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
							</svg>
							Novo Abastecimento
						</a>
					</div>
				</div>
			{:else}
				<!-- Fueling List -->
				<div class="space-y-4">
					{#each fuelings as fueling, index (fueling.id)}
						<div class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-700">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-3">
										<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
											{getVehicleInfo(fueling.vehicle_id)}
										</h3>
										<span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
											{getFuelTypeLabel(fueling.fuel_type)}
										</span>
										{#if fueling.is_full_tank}
											<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
												Tanque Cheio
											</span>
										{/if}
									</div>

									<div class="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-4">
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
										<div>
											<span class="font-medium">Consumo:</span>
											{calculateConsumption(fueling, index)}
										</div>
										{#if fueling.gas_station}
											<div class="col-span-2">
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

								<div class="flex gap-2">
									<a
										href="/fuelings/{fueling.id}"
										class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
									>
										Editar
									</a>
									<button
										on:click={() => handleDelete(fueling.id)}
										class="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
									>
										Excluir
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="flex items-center justify-center gap-2">
						<button
							on:click={() => handlePageChange(page - 1)}
							disabled={page === 1}
							class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
						>
							Anterior
						</button>
						<span class="text-sm text-gray-700 dark:text-gray-300">
							Página {page} de {totalPages}
						</span>
						<button
							on:click={() => handlePageChange(page + 1)}
							disabled={page === totalPages}
							class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
						>
							Próxima
						</button>
					</div>
				{/if}
			{/if}
		</div>
	</DashboardLayout>
</ProtectedRoute>
