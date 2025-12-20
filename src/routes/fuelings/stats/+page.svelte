<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { fuelingsApi } from '$lib/api/fuelings';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Vehicle } from '$lib/types/vehicle';
	import type { FuelingStatsResponse } from '$lib/types/fueling';
	import { PERIOD_OPTIONS } from '$lib/types/fueling';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let vehicles: Vehicle[] = [];
	let stats: FuelingStatsResponse['data'] | null = null;
	let loading = true;
	let error = '';

	// Filters
	let selectedVehicle: number | undefined = undefined;
	let startDate = '';
	let endDate = '';
	let period: 'daily' | 'monthly' | 'yearly' = 'monthly';

	onMount(async () => {
		const vehicleIdParam = $page.url.searchParams.get('vehicle_id');
		if (vehicleIdParam) {
			selectedVehicle = parseInt(vehicleIdParam);
		}

		await loadVehicles();
		await loadStats();
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

	async function loadStats() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			if (!selectedVehicle) {
				stats = null;
				return;
			}

			const response = await fuelingsApi.getVehicleStats(selectedVehicle, token, {
				from: startDate || undefined,
				to: endDate || undefined,
				period
			});

			stats = response.data || null;
		} catch (err: any) {
			error = err.message || 'Erro ao carregar estatísticas';
		} finally {
			loading = false;
		}
	}

	function formatCurrency(value: number) {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(value);
	}

	function formatDate(dateString: string) {
		if (period === 'monthly') {
			const [year, month] = dateString.split('-');
			const date = new Date(parseInt(year), parseInt(month) - 1);
			return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
		} else if (period === 'yearly') {
			return dateString;
		}
		return new Date(dateString).toLocaleDateString('pt-BR');
	}

	function getVehicleInfo(vehicleId: number) {
		const vehicle = vehicles.find(v => v.id === vehicleId);
		return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : '';
	}

	async function handleFilterChange() {
		await loadStats();
	}

	function clearFilters() {
		startDate = '';
		endDate = '';
		period = 'monthly';
		loadStats();
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a
						href="/fuelings"
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-500 shadow transition-colors hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
						aria-label="Voltar para abastecimentos"
					>
						<svg
							class="h-6 w-6"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							></path>
						</svg>
					</a>
					<h1 class="text-2xl font-bold text-gray-800 dark:text-white">Estatísticas de Abastecimento</h1>
				</div>
			</div>

			<!-- Filters -->
			<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
				<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
					<div>
						<label for="stats-vehicle" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Veículo *
						</label>
						<select
							id="stats-vehicle"
							bind:value={selectedVehicle}
							on:change={handleFilterChange}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
						>
							<option value={undefined}>Selecione um veículo...</option>
							{#each vehicles as vehicle}
								<option value={vehicle.id}>
									{vehicle.brand} {vehicle.model} ({vehicle.plate})
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label for="stats-start-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Data Inicial
						</label>
						<input
							id="stats-start-date"
							type="date"
							bind:value={startDate}
							on:change={handleFilterChange}
							disabled={!selectedVehicle}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
						/>
					</div>

					<div>
						<label for="stats-end-date" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Data Final
						</label>
						<input
							id="stats-end-date"
							type="date"
							bind:value={endDate}
							on:change={handleFilterChange}
							disabled={!selectedVehicle}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
						/>
					</div>

					<div>
						<label for="stats-period" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Período
						</label>
						<select
							id="stats-period"
							bind:value={period}
							on:change={handleFilterChange}
							disabled={!selectedVehicle}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
						>
							{#each PERIOD_OPTIONS as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
				</div>

				{#if startDate || endDate || period !== 'monthly'}
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

			{#if !selectedVehicle}
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
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						></path>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
						Selecione um veículo
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Escolha um veículo no filtro acima para visualizar as estatísticas de abastecimento.
					</p>
				</div>
			{:else if loading}
				<div class="flex justify-center py-12">
					<div
						class="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
					></div>
				</div>
			{:else if error}
				<div class="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
					{error}
				</div>
			{:else if stats}
				<!-- Overview Cards -->
				<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
						<div class="flex items-center">
							<div class="flex-shrink-0 rounded-md bg-blue-100 p-3 dark:bg-blue-900/30">
								<svg class="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Registros</p>
								<p class="text-2xl font-semibold text-gray-900 dark:text-white">
									{stats.overview.total_records}
								</p>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
						<div class="flex items-center">
							<div class="flex-shrink-0 rounded-md bg-green-100 p-3 dark:bg-green-900/30">
								<svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total de Litros</p>
								<p class="text-2xl font-semibold text-gray-900 dark:text-white">
									{Number.isFinite(stats.overview.total_liters) ? stats.overview.total_liters.toFixed(2) : '0,00'} L
								</p>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
						<div class="flex items-center">
							<div class="flex-shrink-0 rounded-md bg-yellow-100 p-3 dark:bg-yellow-900/30">
								<svg class="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Gasto Total</p>
								<p class="text-2xl font-semibold text-gray-900 dark:text-white">
									{formatCurrency(Number(stats.overview.total_cost))}
								</p>
							</div>
						</div>
					</div>

					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
						<div class="flex items-center">
							<div class="flex-shrink-0 rounded-md bg-purple-100 p-3 dark:bg-purple-900/30">
								<svg class="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
								</svg>
							</div>
							<div class="ml-4">
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Preço Médio/L</p>
								<p class="text-2xl font-semibold text-gray-900 dark:text-white">
									{formatCurrency(Number(stats.overview.avg_price_per_liter))}
								</p>
							</div>
						</div>
					</div>
				</div>

				<!-- Consumption -->
				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
					<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Consumo Médio</h2>
					<div class="grid gap-6 sm:grid-cols-2">
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Km por Litro</p>
							<p class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
								{stats.consumption.avg_km_per_liter !== null
									? `${Number(stats.consumption.avg_km_per_liter).toFixed(2)} km/L`
									: 'N/A'}
							</p>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Baseado em {stats.consumption.records_used} abastecimentos completos
							</p>
						</div>
					</div>
				</div>

				<!-- Period Stats -->
				{#if stats.by_period && stats.by_period.length > 0}
					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
						<h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
							Estatísticas por Período
						</h2>
						<div class="overflow-x-auto">
							<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
								<thead class="bg-gray-50 dark:bg-gray-600">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
											Período
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
											Registros
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
											Litros
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
											Gasto Total
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300">
											Preço Médio/L
										</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-700 dark:divide-gray-600">
									{#each stats.by_period as periodStat}
										<tr>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
												{formatDate(periodStat.day || periodStat.month || periodStat.year || '')}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
												{periodStat.count}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
												{Number.isFinite(periodStat.total_liters) ? periodStat.total_liters.toFixed(2) : '0,00'} L
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
												{formatCurrency(Number(periodStat.total_cost))}
											</td>
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
												{formatCurrency(Number(periodStat.avg_price))}
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</DashboardLayout>
</ProtectedRoute>
