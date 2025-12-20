<script lang="ts">
	import { onMount } from 'svelte';
	import { historyApi } from '$lib/api/history';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { HistoryItem, HistoryFilters, HistoryType, MaintenanceCategory, FuelType, SortBy, SortOrder } from '$lib/types/history';
	import type { Vehicle } from '$lib/types/vehicle';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let vehicles: Vehicle[] = [];
	let historyItems: HistoryItem[] = [];
	let loading = true;
	let error = '';
	let totalItems = 0;
	let hasMore = false;

	// Filter state
	let selectedVehicleId: number | null = null;
	let selectedType: HistoryType = 'all';
	let selectedCategory: MaintenanceCategory | null = null;
	let selectedFuelType: FuelType | null = null;
	let startDate = '';
	let endDate = '';
	let minCost: number | null = null;
	let maxCost: number | null = null;
	let sortBy: SortBy = 'date';
	let sortOrder: SortOrder = 'desc';

	// Pagination state
	let limit = 20;
	let offset = 0;
	let currentPage = 1;

	// Filters visibility
	let showAdvancedFilters = false;

	// Constants
	const MAINTENANCE_CATEGORIES: { value: MaintenanceCategory; label: string }[] = [
		{ value: 'preventive', label: 'Preventiva' },
		{ value: 'corrective', label: 'Corretiva' },
		{ value: 'inspection', label: 'Inspeção/Revisão' },
		{ value: 'upgrade', label: 'Melhoria/Upgrade' },
		{ value: 'warranty', label: 'Garantia' },
		{ value: 'recall', label: 'Recall' },
		{ value: 'other', label: 'Outras' }
	];

	const FUEL_TYPES: { value: FuelType; label: string }[] = [
		{ value: 'gasoline', label: 'Gasolina' },
		{ value: 'ethanol', label: 'Etanol' },
		{ value: 'diesel', label: 'Diesel' },
		{ value: 'gnv', label: 'GNV' },
		{ value: 'flex', label: 'Flex' }
	];

	onMount(async () => {
		await loadVehicles();
		await loadHistory();
	});

	async function loadVehicles() {
		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const response = await vehiclesApi.list(token);
			vehicles = response.data || [];
		} catch (err: any) {
			console.error('Error loading vehicles:', err);
		}
	}

	async function loadHistory() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			// Build filters
			const filters: HistoryFilters = {
				limit,
				offset,
				sort_by: sortBy,
				sort_order: sortOrder
			};

			if (selectedVehicleId) filters.vehicle_id = selectedVehicleId;
			if (selectedType !== 'all') filters.type = selectedType;
			if (selectedCategory) filters.category = selectedCategory;
			if (selectedFuelType) filters.fuel_type = selectedFuelType;
			if (startDate) filters.start_date = startDate;
			if (endDate) filters.end_date = endDate;
			if (minCost !== null) filters.min_cost = minCost;
			if (maxCost !== null) filters.max_cost = maxCost;

			const response = await historyApi.list(token, filters);

			if (response.success && response.data) {
				historyItems = response.data.items;
				totalItems = response.data.pagination.total;
				hasMore = response.data.pagination.has_more;
			}

			error = '';
		} catch (err: any) {
			error = err.message || 'Erro ao carregar histórico';
			historyItems = [];
		} finally {
			loading = false;
		}
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

	function getCategoryLabel(category: string) {
		const cat = MAINTENANCE_CATEGORIES.find((c) => c.value === category);
		return cat?.label || category;
	}

	function clearFilters() {
		selectedVehicleId = null;
		selectedType = 'all';
		selectedCategory = null;
		selectedFuelType = null;
		startDate = '';
		endDate = '';
		minCost = null;
		maxCost = null;
		sortBy = 'date';
		sortOrder = 'desc';
		// A reatividade vai disparar loadHistory() automaticamente
	}

	async function nextPage() {
		if (hasMore) {
			offset += limit;
			currentPage++;
			await loadHistory();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	async function previousPage() {
		if (offset > 0) {
			offset = Math.max(0, offset - limit);
			currentPage = Math.max(1, currentPage - 1);
			await loadHistory();
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function toggleAdvancedFilters() {
		showAdvancedFilters = !showAdvancedFilters;
	}

	// Check if any filter is active
	$: hasActiveFilters =
		selectedVehicleId !== null ||
		selectedType !== 'all' ||
		selectedCategory !== null ||
		selectedFuelType !== null ||
		startDate !== '' ||
		endDate !== '' ||
		minCost !== null ||
		maxCost !== null;

	$: totalPages = Math.ceil(totalItems / limit);

	// Calculate total operation cost (maintenance + fuel)
	$: totalOperationCost = historyItems.reduce((sum, item) => {
		return sum + Number(item.cost || 0);
	}, 0);

	// Calculate total distance (difference between max and min km)
	$: {
		const kms = historyItems.map(item => Number(item.km || 0)).filter(km => km > 0);
		if (kms.length > 0) {
			const maxKm = Math.max(...kms);
			const minKm = Math.min(...kms);
			totalDistance = maxKm - minKm;
		} else {
			totalDistance = 0;
		}
	}

	let totalDistance = 0;

	// Calculate cost per km
	$: costPerKm = totalDistance > 0 ? totalOperationCost / totalDistance : 0;

	// Auto-apply filters when any filter changes (reactive statement)
	$: {
		// Watch for filter changes
		selectedVehicleId;
		selectedType;
		selectedCategory;
		selectedFuelType;
		startDate;
		endDate;
		minCost;
		maxCost;
		sortBy;
		sortOrder;

		// Only trigger if vehicles are loaded
		if (vehicles.length > 0) {
			// Reset pagination when filters change
			offset = 0;
			currentPage = 1;

			// Trigger search
			loadHistory();
		}
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Histórico</h1>
				<div class="text-sm text-gray-600 dark:text-gray-400">
					{totalItems} {totalItems === 1 ? 'registro' : 'registros'}
				</div>
			</div>

			<!-- Summary Cards -->
			{#if historyItems.length > 0}
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Total Operation Cost Card -->
					<div class="rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 p-6 shadow-lg">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-blue-100">Custo Total de Operação</p>
								<p class="mt-2 text-3xl font-bold text-white">
									{formatCurrency(totalOperationCost)}
								</p>
								<p class="mt-2 text-sm text-blue-100">
									{#if startDate || endDate}
										Período selecionado
									{:else}
										Todos os registros
									{/if}
								</p>
							</div>
							<div class="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
								<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
								</svg>
							</div>
						</div>
						<div class="mt-4 flex items-center gap-4 text-sm text-blue-100">
							<div>
								<span class="opacity-80">Manutenções:</span>
								<span class="ml-1 font-semibold">{formatCurrency(historyItems.filter(i => i.type === 'maintenance').reduce((sum, i) => sum + Number(i.cost || 0), 0))}</span>
							</div>
							<div>
								<span class="opacity-80">Combustível:</span>
								<span class="ml-1 font-semibold">{formatCurrency(historyItems.filter(i => i.type === 'fuel').reduce((sum, i) => sum + Number(i.cost || 0), 0))}</span>
							</div>
						</div>
					</div>

					<!-- Cost Per Km Card -->
					<div class="rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 p-6 shadow-lg">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-sm font-medium text-orange-100">Custo por Quilômetro</p>
								<p class="mt-2 text-3xl font-bold text-white">
									{#if totalDistance > 0}
										{formatCurrency(costPerKm)}
									{:else}
										<span class="text-2xl">N/A</span>
									{/if}
								</p>
								<p class="mt-2 text-sm text-orange-100">
									{#if totalDistance > 0}
										{totalDistance.toLocaleString('pt-BR')} km percorridos
									{:else}
										Dados insuficientes
									{/if}
								</p>
							</div>
							<div class="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
								<svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
								</svg>
							</div>
						</div>
						{#if totalDistance > 0}
							<div class="mt-4 text-sm text-orange-100">
								<span class="opacity-80">Indicador de eficiência operacional</span>
							</div>
						{:else}
							<div class="mt-4 text-sm text-orange-100">
								<span class="opacity-80">Adicione mais registros para calcular</span>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Filters Section -->
			<div class="space-y-4 rounded-lg bg-white p-6 shadow-sm dark:bg-gray-800">
				<!-- Basic Filters -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
					<!-- Vehicle Filter -->
					<div>
						<label
							for="vehicle-filter"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Veículo
						</label>
						<select
							id="vehicle-filter"
							bind:value={selectedVehicleId}
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

					<!-- Type Filter -->
					<div>
						<label
							for="type-filter"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Tipo de Registro
						</label>
						<select
							id="type-filter"
							bind:value={selectedType}
							class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
						>
							<option value="all">Todos</option>
							<option value="fuel">Abastecimentos</option>
							<option value="maintenance">Manutenções</option>
						</select>
					</div>

					<!-- Sort Filter -->
					<div>
						<label
							for="sort-filter"
							class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Ordenar por
						</label>
						<div class="flex gap-2">
							<select
								id="sort-filter"
								bind:value={sortBy}
								class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							>
								<option value="date">Data</option>
								<option value="km">KM</option>
								<option value="cost">Custo</option>
							</select>
							<button
								onclick={() => {
									sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
								}}
								class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
								aria-label={sortOrder === 'asc' ? 'Ordem crescente' : 'Ordem decrescente'}
							>
								{#if sortOrder === 'asc'}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
										></path>
									</svg>
								{:else}
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
										></path>
									</svg>
								{/if}
							</button>
						</div>
					</div>
				</div>

				<!-- Advanced Filters Toggle -->
				<button
					onclick={toggleAdvancedFilters}
					class="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
				>
					{showAdvancedFilters ? 'Ocultar' : 'Mostrar'} filtros avançados
					<svg
						class="h-4 w-4 transition-transform {showAdvancedFilters ? 'rotate-180' : ''}"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 9l-7 7-7-7"
						></path>
					</svg>
				</button>

				<!-- Advanced Filters -->
				{#if showAdvancedFilters}
					<div class="space-y-4 border-t pt-4 dark:border-gray-700">
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<!-- Category Filter (Maintenance only) -->
							{#if selectedType === 'all' || selectedType === 'maintenance'}
								<div>
									<label
										for="category-filter"
										class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
									>
										Categoria (Manutenção)
									</label>
									<select
										id="category-filter"
										bind:value={selectedCategory}
										class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									>
										<option value={null}>Todas as categorias</option>
										{#each MAINTENANCE_CATEGORIES as category}
											<option value={category.value}>{category.label}</option>
										{/each}
									</select>
								</div>
							{/if}

							<!-- Fuel Type Filter (Fuel only) -->
							{#if selectedType === 'all' || selectedType === 'fuel'}
								<div>
									<label
										for="fuel-type-filter"
										class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
									>
										Tipo de Combustível
									</label>
									<select
										id="fuel-type-filter"
										bind:value={selectedFuelType}
										class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									>
										<option value={null}>Todos os combustíveis</option>
										{#each FUEL_TYPES as fuelType}
											<option value={fuelType.value}>{fuelType.label}</option>
										{/each}
									</select>
								</div>
							{/if}

							<!-- Date Range -->
							<div>
								<label
									for="start-date"
									class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Data Inicial
								</label>
								<input
									id="start-date"
									type="date"
									bind:value={startDate}
									class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								/>
							</div>

							<div>
								<label
									for="end-date"
									class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Data Final
								</label>
								<input
									id="end-date"
									type="date"
									bind:value={endDate}
									class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								/>
							</div>

							<!-- Cost Range -->
							<div>
								<label
									for="min-cost"
									class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Custo Mínimo
								</label>
								<input
									id="min-cost"
									type="number"
									step="0.01"
									min="0"
									bind:value={minCost}
									placeholder="R$ 0,00"
									class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								/>
							</div>

							<div>
								<label
									for="max-cost"
									class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Custo Máximo
								</label>
								<input
									id="max-cost"
									type="number"
									step="0.01"
									min="0"
									bind:value={maxCost}
									placeholder="R$ 0,00"
									class="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								/>
							</div>
						</div>
					</div>
				{/if}

				<!-- Action Buttons -->
				{#if hasActiveFilters}
					<div class="flex items-center justify-between border-t pt-4 dark:border-gray-700">
						<div class="text-sm text-gray-600 dark:text-gray-400">
							Filtros aplicados automaticamente
						</div>
						<button
							onclick={clearFilters}
							class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								></path>
							</svg>
							Limpar Filtros
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
						{hasActiveFilters
							? 'Tente ajustar os filtros para encontrar mais registros.'
							: 'Não há abastecimentos ou manutenções registrados.'}
					</p>
				</div>
			{:else}
				<!-- Timeline -->
				<div class="relative">
					<!-- Vertical line -->
					<div
						class="absolute bottom-0 left-6 top-0 w-0.5 bg-gray-300 dark:bg-gray-700"
					></div>

					<!-- Timeline items -->
					<div class="space-y-6">
						{#each historyItems as item}
							<div class="relative pl-16">
								<!-- Icon circle -->
								<div
									class="absolute left-0 flex h-12 w-12 items-center justify-center rounded-full {item.type ===
									'fuel'
										? 'bg-blue-600'
										: 'bg-orange-600'}"
								>
									{#if item.type === 'fuel'}
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
									class="rounded-xl border border-gray-200 bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:border-gray-700 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900"
								>
									{#if item.type === 'fuel'}
										<div class="flex items-start justify-between gap-4">
											<div class="flex-1 space-y-3">
												<!-- Title and Badges -->
												<div class="flex items-center gap-2">
													<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
														Abastecimento
													</h3>
													{#if item.fuel_type}
														<span
															class="inline-flex items-center rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400"
														>
															{getFuelTypeLabel(item.fuel_type)}
														</span>
													{/if}
													{#if item.is_full_tank}
														<span
															class="inline-flex items-center rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400"
														>
															Tanque Cheio
														</span>
													{/if}
												</div>

												<!-- Vehicle Info -->
												<div class="text-gray-900 dark:text-white">
													<p class="text-sm text-gray-600 dark:text-gray-400">Veículo:</p>
													<p class="font-semibold">{item.vehicle_name}</p>
												</div>

												<!-- Date and KM -->
												<div class="flex gap-6 text-sm text-gray-700 dark:text-gray-300">
													<div>
														<span class="text-gray-600 dark:text-gray-400">Data:</span>
														<span class="ml-1">{formatDate(item.date)}</span>
													</div>
													<div>
														<span class="text-gray-600 dark:text-gray-400">KM:</span>
														<span class="ml-1">{Number(item.km || 0).toLocaleString()}</span>
													</div>
												</div>

												<!-- Liters and Price -->
												{#if item.liters !== undefined && item.liters !== null && item.price_per_liter !== undefined && item.price_per_liter !== null}
													<div class="flex gap-6 text-sm text-gray-700 dark:text-gray-300">
														<div>
															<span class="text-gray-600 dark:text-gray-400">Litros:</span>
															<span class="ml-1">{Number(item.liters).toFixed(2)} L</span>
														</div>
														<div>
															<span class="text-gray-600 dark:text-gray-400">Preço/L:</span>
															<span class="ml-1">{formatCurrency(Number(item.price_per_liter))}</span>
														</div>
													</div>
												{/if}

												<!-- Total Cost and Gas Station -->
												<div
													class="flex items-baseline gap-6 text-sm text-gray-700 dark:text-gray-300"
												>
													<div>
														<span class="text-gray-600 dark:text-gray-400">Total:</span>
														<span
															class="ml-1 text-lg font-bold text-gray-900 dark:text-white"
															>{formatCurrency(Number(item.cost || 0))}</span
														>
													</div>
													{#if item.gas_station}
														<div>
															<span class="text-gray-600 dark:text-gray-400">Posto:</span>
															<span class="ml-1">{item.gas_station}</span>
														</div>
													{/if}
												</div>

												<!-- Consumption -->
												{#if item.consumption !== undefined && item.consumption !== null}
													<div class="text-sm text-gray-700 dark:text-gray-300">
														<span class="text-gray-600 dark:text-gray-400">Consumo:</span>
														<span class="ml-1 font-semibold"
															>{Number(item.consumption).toFixed(2)} km/L</span
														>
													</div>
												{/if}
											</div>

											<!-- Action Button -->
											<a
												href="/fuelings/{item.id}"
												class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
											>
												Ver
											</a>
										</div>
									{:else}
										<div class="flex items-start justify-between gap-4">
											<div class="flex-1 space-y-3">
												<!-- Title and Status Badge and Category -->
												<div class="flex items-center gap-2">
													<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
														Manutenção
													</h3>
													{#if item.is_completed !== undefined}
														<span
															class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold {item.is_completed
																? 'border border-green-500/30 bg-green-500/10 text-green-400'
																: 'border border-red-500/30 bg-red-500/10 text-red-400'}"
														>
															{item.is_completed ? 'Concluída' : 'Pendente'}
														</span>
													{/if}
													{#if item.category}
														<span
															class="inline-flex items-center rounded-full bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300"
														>
															{getCategoryLabel(item.category)}
														</span>
													{/if}
												</div>

												<!-- Vehicle Info -->
												<div class="text-gray-900 dark:text-white">
													<p class="text-sm text-gray-600 dark:text-gray-400">Veículo:</p>
													<p class="font-semibold">{item.vehicle_name}</p>
												</div>

												<!-- Description -->
												{#if item.description}
													<div class="text-gray-900 dark:text-white">
														<p class="text-sm text-gray-600 dark:text-gray-400">Descrição:</p>
														<p class="text-sm">{item.description}</p>
													</div>
												{/if}

												<!-- Date, KM, and Cost -->
												<div class="flex gap-6 text-sm text-gray-700 dark:text-gray-300">
													<div>
														<span class="text-gray-600 dark:text-gray-400">Data:</span>
														<span class="ml-1">{formatDate(item.date)}</span>
													</div>
													<div>
														<span class="text-gray-600 dark:text-gray-400">KM:</span>
														<span class="ml-1">{Number(item.km || 0).toLocaleString()}</span>
													</div>
													<div>
														<span class="text-gray-600 dark:text-gray-400">Custo:</span>
														<span class="ml-1 font-semibold">{formatCurrency(Number(item.cost || 0))}</span>
													</div>
												</div>

												<!-- Service Provider -->
												{#if item.service_provider}
													<div class="text-sm text-gray-700 dark:text-gray-300">
														<span class="text-gray-600 dark:text-gray-400"
															>Prestador:</span
														>
														<span class="ml-1">{item.service_provider}</span>
													</div>
												{/if}

												<!-- Attachments -->
												{#if item.attachments_count && item.attachments_count > 0}
													<div class="text-sm text-gray-700 dark:text-gray-300">
														<span class="text-gray-600 dark:text-gray-400">Anexos:</span>
														<span class="ml-1"
															>{item.attachments_count} {item.attachments_count === 1
																? 'arquivo'
																: 'arquivos'}</span
														>
													</div>
												{/if}
											</div>

											<!-- Action Button -->
											<a
												href="/maintenances/{item.id}"
												class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
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

				<!-- Pagination -->
				{#if totalPages > 1}
					<div class="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
						<div class="text-sm text-gray-600 dark:text-gray-400">
							Página {currentPage} de {totalPages}
						</div>
						<div class="flex gap-2">
							<button
								onclick={previousPage}
								disabled={offset === 0}
								class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
							>
								Anterior
							</button>
							<button
								onclick={nextPage}
								disabled={!hasMore}
								class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
							>
								Próxima
							</button>
						</div>
					</div>
				{/if}
			{/if}
		</div>
	</DashboardLayout>
</ProtectedRoute>
