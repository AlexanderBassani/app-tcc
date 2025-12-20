<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { fuelingsApi } from '$lib/api/fuelings';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Fueling } from '$lib/types/fueling';
	import type { Vehicle } from '$lib/types/vehicle';
	import { FUEL_TYPES } from '$lib/types/fueling';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import FuelingStatsSidebar from '$lib/components/FuelingStatsSidebar.svelte';
	import {
		maskCurrency,
		maskLiters,
		maskKm,
		parseCurrency,
		parseLiters,
		parseKm,
		formatCurrency,
		formatKm,
		formatDate
	} from '$lib/utils/formatters';

	// ========================================
	// STATE MANAGEMENT
	// ========================================

	let fueling = $state<Fueling | null>(null);
	let loading = $state(true);
	let error = $state('');
	let success = $state(false);
	let isEditing = $state(false);
	let vehicles = $state<Vehicle[]>([]);
	let vehiclesLoading = $state(false);

	// Last fueling data for comparison
	let lastFueling = $state<Fueling | null>(null);
	let lastFuelingLoading = $state(false);

	// Statistics for selected vehicle
	let vehicleStats = $state<{
		avg_consumption: number | null;
		avg_price_per_liter: number;
		avg_liters_per_fueling: number;
	} | null>(null);
	let statsLoading = $state(false);

	// Gas stations history (for autocomplete)
	let gasStations = $state<string[]>([]);
	let showGasStationSuggestions = $state(false);

	// Form validation errors
	let validationErrors = $state<Record<string, string>>({});

	// Form data
	let formData = $state({
		vehicle_id: 0,
		date: '',
		time: '',
		km: '',
		liters: '',
		price_per_liter: '',
		fuel_type: 'gasoline' as 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'gnv' | 'electric',
		is_full_tank: true,
		gas_station: '',
		notes: ''
	});

	// Character counters
	let notesLength = $derived(formData.notes.length);
	let gasStationLength = $derived(formData.gas_station.length);

	// ========================================
	// CALCULATED VALUES
	// ========================================

	// Parse numeric values from formatted strings
	let parsedKm = $derived(parseKm(formData.km));
	let parsedLiters = $derived(parseLiters(formData.liters));
	let parsedPricePerLiter = $derived(parseCurrency(formData.price_per_liter));

	// Total cost calculation
	let totalCost = $derived(parsedLiters * parsedPricePerLiter);

	// Selected vehicle
	let selectedVehicle = $derived(vehicles.find((v) => v.id === formData.vehicle_id) || null);

	// Km difference from last fueling
	let kmDiff = $derived.by(() => {
		if (!lastFueling || parsedKm <= 0) return 0;
		return parsedKm - lastFueling.km;
	});

	// Price difference from last fueling
	let priceDiff = $derived.by(() => {
		if (!lastFueling || parsedPricePerLiter <= 0) return null;
		return parsedPricePerLiter - lastFueling.price_per_liter;
	});

	// ========================================
	// LIFECYCLE & DATA LOADING
	// ========================================

	onMount(() => {
		loadFueling();
		loadVehicles();
		loadGasStations();
	});

	// Load last fueling and stats when vehicle changes
	$effect(() => {
		if (formData.vehicle_id > 0 && isEditing) {
			loadLastFueling();
			loadVehicleStats();
		}
	});

	// ========================================
	// DATA FETCHING FUNCTIONS
	// ========================================

	async function loadFueling() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const id = Number($page.params.id);
			const res = await fuelingsApi.getById(id, token);

			fueling = res.data || null;
			if (!fueling) {
				throw new Error('Abastecimento não encontrado');
			}

			// Populate form with existing data
			formData = {
				vehicle_id: fueling.vehicle_id,
				date: fueling.date.split('T')[0],
				time: fueling.date.split('T')[1]?.substring(0, 5) || '',
				km: maskKm(fueling.km.toString()),
				liters: maskLiters(fueling.liters.toString()),
				price_per_liter: maskCurrency(fueling.price_per_liter.toString()),
				fuel_type: fueling.fuel_type,
				is_full_tank: fueling.is_full_tank,
				gas_station: fueling.gas_station || '',
				notes: fueling.notes || ''
			};
		} catch (err: any) {
			error = err.message || 'Erro ao carregar abastecimento';
		} finally {
			loading = false;
		}
	}

	async function loadVehicles() {
		try {
			vehiclesLoading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const res = await vehiclesApi.list(token);
			vehicles = res.data || [];
		} catch (err: any) {
			console.error('Erro ao carregar veículos:', err);
		} finally {
			vehiclesLoading = false;
		}
	}

	async function loadLastFueling() {
		if (formData.vehicle_id <= 0 || !fueling) return;

		try {
			lastFuelingLoading = true;
			const token = $authStore.token;
			if (!token) return;

			const res = await fuelingsApi.list(token, {
				vehicleId: formData.vehicle_id,
				limit: 2,
				sort: 'date:DESC'
			});

			// Get the fueling before the current one
			lastFueling = res.data.find((f) => f.id !== fueling?.id) || null;
		} catch (err: any) {
			console.error('Erro ao carregar último abastecimento:', err);
		} finally {
			lastFuelingLoading = false;
		}
	}

	async function loadVehicleStats() {
		if (formData.vehicle_id <= 0) return;

		try {
			statsLoading = true;
			const token = $authStore.token;
			if (!token) return;

			const res = await fuelingsApi.getVehicleStats(formData.vehicle_id, token);

			vehicleStats = {
				avg_consumption: res.data.consumption.avg_km_per_liter,
				avg_price_per_liter: res.data.overview.avg_price_per_liter,
				avg_liters_per_fueling:
					res.data.overview.total_records > 0
						? res.data.overview.total_liters / res.data.overview.total_records
						: 0
			};
		} catch (err: any) {
			console.error('Erro ao carregar estatísticas:', err);
		} finally {
			statsLoading = false;
		}
	}

	function loadGasStations() {
		const stored = localStorage.getItem('gasStations');
		if (stored) {
			gasStations = JSON.parse(stored);
		}
	}

	function saveGasStation(station: string) {
		if (!station.trim()) return;
		if (!gasStations.includes(station)) {
			gasStations = [...gasStations, station];
			localStorage.setItem('gasStations', JSON.stringify(gasStations));
		}
	}

	// ========================================
	// FORM VALIDATION
	// ========================================

	function validateForm(): boolean {
		validationErrors = {};

		// Vehicle
		if (formData.vehicle_id <= 0) {
			validationErrors.vehicle_id = 'Selecione um veículo';
		}

		// Date
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		const selectedDate = new Date(formData.date);
		if (selectedDate > today) {
			validationErrors.date = 'A data não pode ser futura';
		}

		// Km validation
		if (parsedKm <= 0) {
			validationErrors.km = 'Quilometragem deve ser maior que zero';
		}

		// Liters validation
		if (parsedLiters <= 0) {
			validationErrors.liters = 'Litros deve ser maior que zero';
		} else if (parsedLiters < 0.1) {
			validationErrors.liters = 'Litros muito baixo (mínimo 0,1L)';
		} else if (parsedLiters > 150) {
			validationErrors.liters = 'Litros muito alto (máximo 150L)';
		}

		// Price validation
		if (parsedPricePerLiter <= 0) {
			validationErrors.price_per_liter = 'Preço deve ser maior que zero';
		} else if (parsedPricePerLiter < 1) {
			validationErrors.price_per_liter = 'Preço muito baixo (mínimo R$ 1,00)';
		} else if (parsedPricePerLiter > 15) {
			validationErrors.price_per_liter = 'Preço muito alto (máximo R$ 15,00)';
		}

		// Gas station length
		if (formData.gas_station.length > 100) {
			validationErrors.gas_station = 'Máximo 100 caracteres';
		}

		// Notes length
		if (formData.notes.length > 500) {
			validationErrors.notes = 'Máximo 500 caracteres';
		}

		return Object.keys(validationErrors).length === 0;
	}

	// ========================================
	// INPUT HANDLERS
	// ========================================

	function handleKmInput(e: Event) {
		const target = e.target as HTMLInputElement;
		formData.km = maskKm(target.value);
		delete validationErrors.km;
	}

	function handleLitersInput(e: Event) {
		const target = e.target as HTMLInputElement;
		formData.liters = maskLiters(target.value);
		delete validationErrors.liters;
	}

	function handlePriceInput(e: Event) {
		const target = e.target as HTMLInputElement;
		formData.price_per_liter = maskCurrency(target.value);
		delete validationErrors.price_per_liter;
	}

	function incrementKm() {
		const currentKm = parsedKm;
		formData.km = maskKm((currentKm + 1000).toString());
	}

	function decrementKm() {
		const currentKm = parsedKm;
		const newKm = Math.max(0, currentKm - 1000);
		formData.km = maskKm(newKm.toString());
	}

	function handleGasStationInput() {
		showGasStationSuggestions = formData.gas_station.length > 0;
		delete validationErrors.gas_station;
	}

	function selectGasStation(station: string) {
		formData.gas_station = station;
		showGasStationSuggestions = false;
	}

	// ========================================
	// FORM ACTIONS
	// ========================================

	function toggleEdit() {
		isEditing = !isEditing;
		if (!isEditing && fueling) {
			// Reset form to original values
			formData = {
				vehicle_id: fueling.vehicle_id,
				date: fueling.date.split('T')[0],
				time: fueling.date.split('T')[1]?.substring(0, 5) || '',
				km: maskKm(fueling.km.toString()),
				liters: maskLiters(fueling.liters.toString()),
				price_per_liter: maskCurrency(fueling.price_per_liter.toString()),
				fuel_type: fueling.fuel_type,
				is_full_tank: fueling.is_full_tank,
				gas_station: fueling.gas_station || '',
				notes: fueling.notes || ''
			};
			validationErrors = {};
		}
	}

	async function handleUpdate(e: Event) {
		e.preventDefault();
		if (!fueling) return;

		if (!validateForm()) {
			error = 'Corrija os erros no formulário';
			const firstError = document.querySelector('.border-red-500');
			firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			return;
		}

		loading = true;
		error = '';

		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const updateData = {
				date: formData.date,
				km: parsedKm,
				liters: parsedLiters,
				price_per_liter: parsedPricePerLiter,
				fuel_type: formData.fuel_type,
				is_full_tank: formData.is_full_tank,
				gas_station: formData.gas_station.trim() || undefined,
				notes: formData.notes.trim() || undefined
			};

			await fuelingsApi.update(fueling.id, updateData, token);

			// Save gas station to history
			if (formData.gas_station.trim()) {
				saveGasStation(formData.gas_station.trim());
			}

			success = true;
			isEditing = false;

			// Reload fueling data
			await loadFueling();

			setTimeout(() => {
				success = false;
			}, 3000);
		} catch (err: any) {
			error = err.message || 'Erro ao atualizar abastecimento';
		} finally {
			loading = false;
		}
	}

	async function handleDelete() {
		if (!fueling) return;
		if (!confirm('Tem certeza que deseja excluir este abastecimento?')) return;

		loading = true;
		error = '';

		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			await fuelingsApi.delete(fueling.id, token);
			goto('/fuelings');
		} catch (err: any) {
			error = err.message || 'Erro ao excluir abastecimento';
			loading = false;
		}
	}

	// ========================================
	// FUEL TYPE CONFIG
	// ========================================

	const fuelTypeConfig = {
		gasoline: { icon: '⛽', color: 'red', label: 'Gasolina' },
		ethanol: { icon: '🌿', color: 'green', label: 'Etanol' },
		diesel: { icon: '🚛', color: 'gray', label: 'Diesel' },
		gnv: { icon: '💨', color: 'blue', label: 'GNV' },
		flex: { icon: '🔄', color: 'purple', label: 'Flex' },
		electric: { icon: '⚡', color: 'yellow', label: 'Elétrico' }
	};

	function getFuelTypeLabel(type: string): string {
		const config = fuelTypeConfig[type as keyof typeof fuelTypeConfig];
		return config ? config.label : type;
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="mx-auto max-w-7xl space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a
						href="/fuelings"
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-500 shadow transition-colors hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
						aria-label="Voltar para lista de abastecimentos"
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
								d="M10 19l-7-7m0 0l7-7m-7 7h18"
							></path>
						</svg>
					</a>
					<h1 class="text-2xl font-bold text-gray-800 dark:text-white">
						{isEditing ? 'Editar' : 'Detalhes do'} Abastecimento
					</h1>
				</div>

				{#if !loading && fueling}
					<div class="flex gap-3">
						{#if isEditing}
							<button
								type="button"
								onclick={toggleEdit}
								class="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
								Cancelar Edição
							</button>
						{:else}
							<button
								onclick={toggleEdit}
								class="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
								Editar
							</button>
						{/if}
						<button
							onclick={handleDelete}
							disabled={loading}
							class="inline-flex items-center gap-2 rounded-md border border-red-600 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:hover:bg-red-900/20"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								/>
							</svg>
							Excluir
						</button>
					</div>
				{/if}
			</div>

			<!-- Success Message -->
			{#if success}
				<div
					class="animate-fade-in rounded-lg bg-green-50 p-4 text-green-700 dark:bg-green-900/30 dark:text-green-400"
				>
					<div class="flex items-center">
						<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						Abastecimento atualizado com sucesso!
					</div>
				</div>
			{/if}

			{#if loading}
				<!-- Loading State -->
				<div class="flex items-center justify-center py-12">
					<div class="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
				</div>
			{:else if error && !fueling}
				<!-- Error State -->
				<div class="rounded-lg bg-red-50 p-6 text-center dark:bg-red-900/30">
					<svg
						class="mx-auto h-12 w-12 text-red-600 dark:text-red-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
					<h2 class="mt-4 text-lg font-semibold text-red-800 dark:text-red-400">{error}</h2>
					<a
						href="/fuelings"
						class="mt-4 inline-block text-sm text-red-700 underline hover:text-red-800 dark:text-red-300"
					>
						Voltar para lista de abastecimentos
					</a>
				</div>
			{:else if fueling}
				<!-- Content -->
				<div class="grid gap-6 lg:grid-cols-3">
					<!-- Main Column (2/3) -->
					<div class="lg:col-span-2">
						<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
							{#if error && isEditing}
								<div
									class="mb-6 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400"
								>
									<div class="flex items-center">
										<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
												clip-rule="evenodd"
											/>
										</svg>
										{error}
									</div>
								</div>
							{/if}

							{#if isEditing}
								<!-- Edit Form -->
								<form onsubmit={handleUpdate} class="space-y-6">
									<!-- Similar structure to new fueling form -->
									<!-- Grupo 1: Veículo e Data -->
									<div class="space-y-4">
										<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
											Informações Básicas
										</h2>

										<div class="grid gap-4 sm:grid-cols-2">
											<!-- Veículo (disabled in edit mode) -->
											<div class="sm:col-span-2">
												<label
													for="vehicle"
													class="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Veículo *
												</label>
												<select
													id="vehicle"
													bind:value={formData.vehicle_id}
													disabled
													class="focus:border-blue-500 focus:ring-blue-500 mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
												>
													{#each vehicles as vehicle}
														<option value={vehicle.id}>
															{vehicle.brand}
															{vehicle.model} - {vehicle.plate} ({vehicle.year})
														</option>
													{/each}
												</select>
												<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
													O veículo não pode ser alterado
												</p>
											</div>

											<!-- Data -->
											<div>
												<label
													for="date"
													class="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Data *
												</label>
												<input
													type="date"
													id="date"
													bind:value={formData.date}
													required
													max={new Date().toISOString().split('T')[0]}
													class="focus:border-blue-500 focus:ring-blue-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white {validationErrors.date
														? 'border-red-500'
														: ''}"
												/>
												{#if validationErrors.date}
													<p class="mt-1 text-sm text-red-600 dark:text-red-400">
														{validationErrors.date}
													</p>
												{/if}
											</div>

											<!-- Horário -->
											<div>
												<label
													for="time"
													class="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Horário (opcional)
												</label>
												<input
													type="time"
													id="time"
													bind:value={formData.time}
													class="focus:border-blue-500 focus:ring-blue-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
												/>
											</div>
										</div>
									</div>

									<hr class="border-gray-200 dark:border-gray-600" />

									<!-- Grupo 2: Quilometragem e Combustível -->
									<div class="space-y-4">
										<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
											Quilometragem e Combustível
										</h2>

										<div class="grid gap-4 sm:grid-cols-2">
											<!-- KM -->
											<div>
												<label
													for="km"
													class="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Quilometragem *
												</label>
												<div class="relative mt-1 flex gap-2">
													<button
														type="button"
														onclick={decrementKm}
														aria-label="Diminuir quilometragem em 1.000 km"
														class="flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
													>
														<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M20 12H4"
															/>
														</svg>
													</button>
													<input
														type="text"
														id="km"
														value={formData.km}
														oninput={handleKmInput}
														required
														class="focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white {validationErrors.km
															? 'border-red-500'
															: ''}"
														placeholder="0 km"
													/>
													<button
														type="button"
														onclick={incrementKm}
														aria-label="Aumentar quilometragem em 1.000 km"
														class="flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
													>
														<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path
																stroke-linecap="round"
																stroke-linejoin="round"
																stroke-width="2"
																d="M12 4v16m8-8H4"
															/>
														</svg>
													</button>
												</div>
												{#if validationErrors.km}
													<p class="mt-1 text-sm text-red-600 dark:text-red-400">
														{validationErrors.km}
													</p>
												{/if}
											</div>

											<!-- Tipo de Combustível -->
											<div>
												<div class="block text-sm font-medium text-gray-700 dark:text-gray-300">
													Tipo de Combustível *
												</div>
												<div class="mt-2 grid grid-cols-3 gap-2">
													{#each FUEL_TYPES as fuelType}
														{@const config = fuelTypeConfig[fuelType.value]}
														<button
															type="button"
															onclick={() => (formData.fuel_type = fuelType.value)}
															class="flex flex-col items-center justify-center gap-1 rounded-lg border-2 p-3 transition-all {formData.fuel_type ===
															fuelType.value
																? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
																: 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'}"
															aria-label="Selecionar {config.label}"
														>
															<span class="text-2xl">{config.icon}</span>
															<span
																class="text-xs font-medium {formData.fuel_type === fuelType.value
																	? 'text-blue-700 dark:text-blue-400'
																	: 'text-gray-700 dark:text-gray-300'}"
															>
																{config.label}
															</span>
														</button>
													{/each}
												</div>
											</div>
										</div>
									</div>

									<hr class="border-gray-200 dark:border-gray-600" />

									<!-- Grupo 3: Valores -->
									<div class="space-y-4">
										<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Valores</h2>

										<div class="grid gap-4 sm:grid-cols-3">
											<!-- Litros -->
											<div>
												<label
													for="liters"
													class="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Litros *
												</label>
												<div class="relative mt-1">
													<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
														⛽
													</span>
													<input
														type="text"
														id="liters"
														value={formData.liters}
														oninput={handleLitersInput}
														required
														class="focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md border-gray-300 pl-10 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white {validationErrors.liters
															? 'border-red-500'
															: ''}"
														placeholder="0,00 L"
													/>
												</div>
												{#if validationErrors.liters}
													<p class="mt-1 text-sm text-red-600 dark:text-red-400">
														{validationErrors.liters}
													</p>
												{:else if vehicleStats && Number.isFinite(vehicleStats.avg_liters_per_fueling) && vehicleStats.avg_liters_per_fueling > 0 && parsedLiters > 0}
													<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
														Média: {vehicleStats.avg_liters_per_fueling.toFixed(2)} L
													</p>
												{/if}
											</div>

											<!-- Preço por Litro -->
											<div>
												<label
													for="price"
													class="block text-sm font-medium text-gray-700 dark:text-gray-300"
												>
													Preço por Litro *
												</label>
												<input
													type="text"
													id="price"
													value={formData.price_per_liter}
													oninput={handlePriceInput}
													required
													class="focus:border-blue-500 focus:ring-blue-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white {validationErrors.price_per_liter
														? 'border-red-500'
														: ''}"
													placeholder="R$ 0,00"
												/>
												{#if validationErrors.price_per_liter}
													<p class="mt-1 text-sm text-red-600 dark:text-red-400">
														{validationErrors.price_per_liter}
													</p>
												{:else if priceDiff !== null && lastFueling}
													{@const percentDiff =
														((parsedPricePerLiter - lastFueling.price_per_liter) /
															lastFueling.price_per_liter) *
														100}
													<p
														class="mt-1 text-xs {Math.abs(percentDiff) > 20
															? 'text-yellow-600 dark:text-yellow-400'
															: 'text-gray-500 dark:text-gray-400'}"
													>
														{priceDiff > 0 ? '+' : ''}{formatCurrency(priceDiff)} vs anterior
													</p>
												{/if}
											</div>

											<!-- Total (calculado) -->
											<div>
												<div class="block text-sm font-medium text-gray-700 dark:text-gray-300">
													Total (calculado)
												</div>
												<div
													class="mt-1 flex h-[42px] items-center rounded-md border-2 border-blue-500 bg-blue-50 px-3 text-xl font-bold text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
												>
													{formatCurrency(totalCost)}
												</div>
											</div>
										</div>
									</div>

									<hr class="border-gray-200 dark:border-gray-600" />

									<!-- Grupo 4: Detalhes -->
									<div class="space-y-4">
										<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
											Detalhes Adicionais
										</h2>

										<!-- Tanque Cheio -->
										<div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
											<div class="flex items-start gap-3">
												<input
													type="checkbox"
													id="is_full_tank"
													bind:checked={formData.is_full_tank}
													class="focus:ring-blue-500 text-blue-600 mt-1 h-5 w-5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
												/>
												<div class="flex-1">
													<label
														for="is_full_tank"
														class="block font-medium text-gray-900 dark:text-white"
													>
														Tanque cheio
													</label>
													<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
														Marque se o tanque foi completamente abastecido. Necessário para
														calcular o consumo médio (km/L) com precisão.
													</p>
												</div>
											</div>
										</div>

										<!-- Posto -->
										<div>
											<label
												for="gas_station"
												class="block text-sm font-medium text-gray-700 dark:text-gray-300"
											>
												Posto de Combustível (opcional)
											</label>
											<div class="relative mt-1">
												<input
													type="text"
													id="gas_station"
													bind:value={formData.gas_station}
													oninput={handleGasStationInput}
													onblur={() => setTimeout(() => (showGasStationSuggestions = false), 200)}
													maxlength="100"
													class="focus:border-blue-500 focus:ring-blue-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white {validationErrors.gas_station
														? 'border-red-500'
														: ''}"
													placeholder="Ex: Shell Centro, Petrobras Avenida..."
												/>
												{#if showGasStationSuggestions && gasStations.length > 0}
													<div
														class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg dark:bg-gray-600"
													>
														{#each gasStations.filter((s) => s
																.toLowerCase()
																.includes(formData.gas_station.toLowerCase())) as station}
															<button
																type="button"
																onclick={() => selectGasStation(station)}
																class="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
															>
																{station}
															</button>
														{/each}
													</div>
												{/if}
											</div>
											<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
												{gasStationLength}/100 caracteres
											</p>
											{#if validationErrors.gas_station}
												<p class="mt-1 text-sm text-red-600 dark:text-red-400">
													{validationErrors.gas_station}
												</p>
											{/if}
										</div>

										<!-- Observações -->
										<div>
											<label
												for="notes"
												class="block text-sm font-medium text-gray-700 dark:text-gray-300"
											>
												Observações (opcional)
											</label>
											<textarea
												id="notes"
												bind:value={formData.notes}
												rows="3"
												maxlength="500"
												class="focus:border-blue-500 focus:ring-blue-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white {validationErrors.notes
													? 'border-red-500'
													: ''}"
												placeholder="Ex: Promoção do posto, trânsito pesado, viagem..."
											></textarea>
											<div
												class="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400"
											>
												<span>Informações adicionais sobre este abastecimento</span>
												<span class={notesLength > 450 ? 'text-yellow-600 dark:text-yellow-400' : ''}
													>{notesLength}/500</span
												>
											</div>
											{#if validationErrors.notes}
												<p class="mt-1 text-sm text-red-600 dark:text-red-400">
													{validationErrors.notes}
												</p>
											{/if}
										</div>
									</div>

									<!-- Actions -->
									<div class="flex justify-end gap-3 pt-4">
										<button
											type="submit"
											disabled={loading}
											class="inline-flex items-center justify-center rounded-md bg-blue-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
										>
											{#if loading}
												<svg class="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
													<circle
														class="opacity-25"
														cx="12"
														cy="12"
														r="10"
														stroke="currentColor"
														stroke-width="4"
													></circle>
													<path
														class="opacity-75"
														fill="currentColor"
														d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
													></path>
												</svg>
												Salvando...
											{:else}
												Salvar Alterações
											{/if}
										</button>
									</div>
								</form>
							{:else}
								<!-- View Mode -->
								<div class="space-y-6">
									<!-- Informações Básicas -->
									<div>
										<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
											Informações Básicas
										</h2>
										<div class="grid gap-6 sm:grid-cols-2">
											<div>
												<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Veículo</p>
												<p class="mt-1 text-lg text-gray-900 dark:text-white">
													{#if fueling.vehicle}
														{fueling.vehicle.brand}
														{fueling.vehicle.model} - {fueling.vehicle.plate}
													{:else}
														{vehicles.find((v) => v.id === fueling.vehicle_id)?.brand}
														{vehicles.find((v) => v.id === fueling.vehicle_id)?.model} -
														{vehicles.find((v) => v.id === fueling.vehicle_id)?.plate}
													{/if}
												</p>
											</div>
											<div>
												<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Data</p>
												<p class="mt-1 text-lg text-gray-900 dark:text-white">
													{formatDate(fueling.date)}
												</p>
											</div>
											<div>
												<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
													Quilometragem
												</p>
												<p class="mt-1 text-lg text-gray-900 dark:text-white">
													{formatKm(fueling.km)}
												</p>
											</div>
											<div>
												<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
													Tipo de Combustível
												</p>
												<p class="mt-1 text-lg text-gray-900 dark:text-white">
													{getFuelTypeLabel(fueling.fuel_type)}
												</p>
											</div>
										</div>
									</div>

									<hr class="border-gray-200 dark:border-gray-600" />

									<!-- Valores -->
									<div>
										<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Valores</h2>
										<div class="grid gap-6 sm:grid-cols-3">
											<div>
												<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Litros</p>
												<p class="mt-1 text-lg text-gray-900 dark:text-white">
													{Number.isFinite(Number(fueling.liters)) ? Number(fueling.liters).toFixed(2) : '0,00'} L
												</p>
											</div>
											<div>
												<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
													Preço por Litro
												</p>
												<p class="mt-1 text-lg text-gray-900 dark:text-white">
													{formatCurrency(fueling.price_per_liter)}
												</p>
											</div>
											<div>
												<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
													Custo Total
												</p>
												<p class="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
													{formatCurrency(fueling.total_cost)}
												</p>
											</div>
										</div>
									</div>

									<hr class="border-gray-200 dark:border-gray-600" />

									<!-- Detalhes -->
									<div>
										<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
											Detalhes Adicionais
										</h2>
										<div class="space-y-4">
											<div>
												<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
													Tanque Cheio
												</p>
												<p class="mt-1 text-lg text-gray-900 dark:text-white">
													{fueling.is_full_tank ? 'Sim' : 'Não'}
												</p>
											</div>
											{#if fueling.gas_station}
												<div>
													<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Posto</p>
													<p class="mt-1 text-lg text-gray-900 dark:text-white">
														{fueling.gas_station}
													</p>
												</div>
											{/if}
											{#if fueling.notes}
												<div>
													<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
														Observações
													</p>
													<p class="mt-1 text-gray-900 dark:text-white">
														{fueling.notes}
													</p>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/if}
						</div>
					</div>

					<!-- Sidebar Column (1/3) -->
					<div class="lg:col-span-1">
						{#if isEditing && formData.vehicle_id > 0 && !lastFuelingLoading && !statsLoading}
							<FuelingStatsSidebar
								{lastFueling}
								currentKm={parsedKm}
								currentLiters={parsedLiters}
								currentPricePerLiter={parsedPricePerLiter}
								currentTotalCost={totalCost}
								isFull={formData.is_full_tank}
								avgConsumption={vehicleStats?.avg_consumption || null}
								avgPricePerLiter={vehicleStats?.avg_price_per_liter || 0}
							/>
						{:else if isEditing && formData.vehicle_id > 0}
							<!-- Loading skeleton -->
							<div class="space-y-4">
								<div class="h-32 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-600"></div>
								<div class="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-600"></div>
								<div class="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-600"></div>
							</div>
						{:else}
							<!-- View mode sidebar - Show basic info -->
							<div class="space-y-4">
								<!-- Custo Total Destacado -->
								<div
									class="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg dark:from-blue-600 dark:to-blue-700"
								>
									<div class="text-sm font-medium opacity-90">Custo Total</div>
									<div class="mt-2 text-3xl font-bold">{formatCurrency(fueling.total_cost)}</div>
								</div>

								<!-- Info Card -->
								<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
									<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
										Informações do Registro
									</h3>
									<div class="mt-3 space-y-2 text-sm">
										<div class="flex justify-between">
											<span class="text-gray-600 dark:text-gray-400">Criado em</span>
											<span class="font-medium text-gray-900 dark:text-white">
												{formatDate(fueling.created_at)}
											</span>
										</div>
										<div class="flex justify-between">
											<span class="text-gray-600 dark:text-gray-400">ID do Registro</span>
											<span class="font-medium text-gray-900 dark:text-white">#{fueling.id}</span>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</DashboardLayout>
</ProtectedRoute>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.5s ease-out;
	}
</style>
