<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Vehicle } from '$lib/types/vehicle';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import SearchableSelect from '$lib/components/SearchableSelect.svelte';
	import PlateInput from '$lib/components/PlateInput.svelte';
	import ColorSelect from '$lib/components/ColorSelect.svelte';
	import ModelSelect from '$lib/components/ModelSelect.svelte';
	import KilometersInput from '$lib/components/KilometersInput.svelte';
	import { FUEL_TYPES } from '$lib/types/fueling';
	import { carBrands } from '$lib/data/carBrands';
	import { QUICK_YEARS, ALL_YEARS, NOTE_SUGGESTIONS } from '$lib/data/vehicleConstants';
	import {
		validateBrand,
		validateModel,
		validateYear,
		validatePurchaseDate,
		validateNotes,
		calculateOwnershipDuration,
		getVehicleAge,
		validateCurrentKm
	} from '$lib/utils/vehicleValidation';

	// State
	let loading = $state(false);
	let vehicleLoading = $state(true);
	let error = $state('');
	let vehicle = $state<Vehicle | null>(null);
	let showYearDropdown = $state(false);
	let showNoteSuggestions = $state(false);
	let plateValid = $state(true); // Start as true since we're editing existing
	let plateMessage = $state('');
	let plateAvailable = $state<boolean | null>(true);
	let originalPlate = $state('');

	// Form data with Svelte 5 runes
	let formData = $state({
		brand: '',
		model: '',
		year: new Date().getFullYear(),
		plate: '',
		color: '',
		current_km: 0,
		fuel_type: '',
		purchase_date: '',
		is_primary: false,
		notes: ''
	});

	// Validation states
	let validations = $state({
		brand: { valid: true, message: '' },
		model: { valid: true, message: '' },
		year: { valid: true, message: '' },
		purchaseDate: { valid: true, message: '' },
		notes: { valid: true, message: '' },
		currentKm: { valid: true, message: '' },
		fuelType: { valid: true, message: '' }
	});

	// Character counter for notes
	const notesCharCount = $derived(formData.notes.length);
	const notesCharLimit = 1000;

	// Calculate ownership duration
	const ownershipDuration = $derived.by(() => {
		if (formData.purchase_date) {
			return calculateOwnershipDuration(formData.purchase_date);
		}
		return '';
	});

	// Vehicle age
	const vehicleAge = $derived.by(() => {
		return getVehicleAge(formData.year);
	});

	// Check if form is valid
	const isFormValid = $derived.by(() => {
		return (
			formData.brand &&
			formData.model &&
			formData.year &&
			formData.plate &&
			formData.fuel_type &&
			plateValid &&
			plateAvailable !== false &&
			validations.brand.valid &&
			validations.model.valid &&
			validations.year.valid &&
			validations.purchaseDate.valid &&
			validations.notes.valid &&
			validations.currentKm.valid &&
			validations.fuelType.valid
		);
	});

	onMount(async () => {
		await loadVehicle();
	});

	async function loadVehicle() {
		try {
			vehicleLoading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const id = Number($page.params.id);
			const res = await vehiclesApi.getById(id, token);
			vehicle = res.data;

			if (!vehicle) {
				throw new Error('Veículo não encontrado');
			}

			// Populate form with vehicle data
			originalPlate = vehicle.plate;
			formData = {
				brand: vehicle.brand,
				model: vehicle.model,
				year: vehicle.year,
				plate: vehicle.plate,
				color: vehicle.color || '',
				current_km: vehicle.current_km,
				fuel_type: vehicle.fuel_type || '',
				purchase_date: vehicle.purchase_date ? vehicle.purchase_date.split('T')[0] : '',
				is_primary: vehicle.is_primary || false,
				notes: vehicle.notes || ''
			};

			// Set plate as valid since it's existing
			plateValid = true;
			plateAvailable = true;
		} catch (err: any) {
			error = err.message || 'Erro ao carregar veículo';
		} finally {
			vehicleLoading = false;
		}
	}

	// Watchers for validation
	$effect(() => {
		if (formData.brand) {
			const result = validateBrand(formData.brand);
			validations.brand = result;
		}
	});

	$effect(() => {
		if (formData.model) {
			const result = validateModel(formData.model);
			validations.model = result;
		}
	});

	$effect(() => {
		// Validate mileage
		const result = validateCurrentKm(formData.current_km, formData.year);
		validations.currentKm = result;
	});

	$effect(() => {
		if (formData.fuel_type) {
			validations.fuelType = { valid: true, message: '' };
		} else {
			validations.fuelType = { valid: false, message: 'Selecione o tipo de combustível' };
		}
	});

	function handleYearChange(year: number) {
		formData.year = year;
		const result = validateYear(year);
		validations.year = result;
		showYearDropdown = false;
	}

	function handlePlateValidation(valid: boolean, message: string) {
		plateValid = valid;
		plateMessage = message;
	}

	async function checkPlateAvailability(plate: string) {
		const token = $authStore.token;
		if (!token) return { available: null, message: '' };

		// If plate hasn't changed, it's available (it's the same vehicle)
		if (plate.toUpperCase() === originalPlate.toUpperCase()) {
			plateAvailable = true;
			return { available: true, message: '✅ Placa atual do veículo' };
		}

		const result = await vehiclesApi.checkPlate(plate, token);
		plateAvailable = result.available;
		return result;
	}

	function handlePurchaseDateChange(event: Event) {
		const target = event.target as HTMLInputElement;
		formData.purchase_date = target.value;
		const result = validatePurchaseDate(target.value, formData.year);
		validations.purchaseDate = result;
	}

	function handleNotesChange(event: Event) {
		const target = event.target as HTMLTextAreaElement;
		formData.notes = target.value;
		const result = validateNotes(target.value);
		validations.notes = result;
	}

	function addNoteSuggestion(suggestion: string) {
		if (formData.notes) {
			formData.notes += `\n${suggestion}`;
		} else {
			formData.notes = suggestion;
		}
		const result = validateNotes(formData.notes);
		validations.notes = result;
		showNoteSuggestions = false;
	}

	// Fuel Type Config (UI)
	const fuelTypeConfig = {
		gasoline: { icon: '⛽', color: 'red', label: 'Gasolina' },
		ethanol: { icon: '🌿', color: 'green', label: 'Etanol' },
		diesel: { icon: '🚛', color: 'gray', label: 'Diesel' },
		gnv: { icon: '💨', color: 'blue', label: 'GNV' },
		flex: { icon: '🔄', color: 'purple', label: 'Flex' },
		electric: { icon: '⚡', color: 'yellow', label: 'Elétrico' }
	};

	async function handleSubmit(e: Event) {
		e.preventDefault();

		// Final validation
		if (!isFormValid) {
			error = 'Por favor, corrija os erros no formulário';
			return;
		}

		if (!vehicle) {
			error = 'Veículo não encontrado';
			return;
		}

		loading = true;
		error = '';

		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			// Prepare data for API
			const submitData = {
				brand: formData.brand.trim(),
				model: formData.model.trim(),
				year: formData.year,
				plate: formData.plate.toUpperCase(),
				color: formData.color.trim() || 'Não informado',
				current_km: formData.current_km,
				fuel_type: formData.fuel_type,
				purchase_date: formData.purchase_date || new Date().toISOString().split('T')[0],
				is_primary: formData.is_primary,
				notes: formData.notes.trim()
			};

			await vehiclesApi.update(vehicle.id, submitData, token);
			goto(`/vehicles/${vehicle.id}`);
		} catch (err: any) {
			error = err.message || 'Erro ao atualizar veículo';
			console.error('Error updating vehicle:', err);
		} finally {
			loading = false;
		}
	}

	function handleCancel() {
		if (vehicle) {
			goto(`/vehicles/${vehicle.id}`);
		} else {
			goto('/vehicles');
		}
	}
</script>

<DashboardLayout>
	<div class="mx-auto max-w-4xl space-y-6 px-4 py-6">
		<!-- Header -->
		<div class="flex items-center gap-4">
			<button
				onclick={handleCancel}
				class="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-500 shadow transition-colors hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
				aria-label="Voltar"
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
			</button>
			<div>
				<h1 class="text-3xl font-bold text-gray-800 dark:text-white">Editar Veículo</h1>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Atualize as informações do seu veículo
				</p>
			</div>
		</div>

		<!-- Loading State -->
		{#if vehicleLoading}
			<div class="flex justify-center py-12">
				<div
					class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
				></div>
			</div>
		{:else if error && !vehicle}
			<div
				class="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400"
			>
				<svg
					class="h-5 w-5 flex-shrink-0"
					fill="currentColor"
					viewBox="0 0 20 20"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						fill-rule="evenodd"
						d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
						clip-rule="evenodd"
					></path>
				</svg>
				<span>{error}</span>
			</div>
		{:else}
			<!-- Error Alert -->
			{#if error}
				<div
					class="flex items-center gap-3 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400"
				>
					<svg
						class="h-5 w-5 flex-shrink-0"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						></path>
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-6">
				<!-- Step 1: Identification -->
				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
					<h2 class="mb-6 text-lg font-semibold text-gray-800 dark:text-white">
						1. Identificação do Veículo
					</h2>

					<div class="grid gap-6 sm:grid-cols-2">
						<!-- Brand -->
						<div>
							<label for="brand" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Marca <span class="text-red-500">*</span>
							</label>
							<SearchableSelect
								id="brand"
								options={carBrands}
								bind:value={formData.brand}
								placeholder="Ex: Toyota, Volkswagen, Chevrolet"
								required
							/>
							{#if !validations.brand.valid && validations.brand.message}
								<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									{validations.brand.message}
								</p>
							{/if}
						</div>

						<!-- Model -->
						<div>
							<label for="model" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Modelo <span class="text-red-500">*</span>
							</label>
							<ModelSelect id="model" bind:value={formData.model} brand={formData.brand} required />
							{#if !validations.model.valid && validations.model.message}
								<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									{validations.model.message}
								</p>
							{/if}
						</div>

						<!-- Year -->
						<div>
							<label for="year" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Ano <span class="text-red-500">*</span>
							</label>
							<div class="relative">
								<button
									type="button"
									onclick={() => (showYearDropdown = !showYearDropdown)}
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 flex w-full items-center justify-between rounded-md border border-gray-300 bg-white px-4 py-2 text-left shadow-sm focus:ring-2 focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								>
									<span>{formData.year}</span>
									<svg
										class="h-5 w-5 text-gray-400"
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
								</button>

								{#if showYearDropdown}
									<div
										class="ring-opacity-5 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black dark:bg-gray-700"
									>
										<div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
											Anos recentes
										</div>
										{#each QUICK_YEARS as year}
											<button
												type="button"
												onclick={() => handleYearChange(year)}
												class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-600 {year ===
												formData.year
													? 'bg-primary-600 hover:bg-primary-700 text-white'
													: ''}"
											>
												{year}
											</button>
										{/each}
										<div class="border-t border-gray-200 dark:border-gray-600"></div>
										<div class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
											Todos os anos
										</div>
										{#each ALL_YEARS as year}
											{#if !QUICK_YEARS.includes(year)}
												<button
													type="button"
													onclick={() => handleYearChange(year)}
													class="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-600 {year ===
													formData.year
														? 'bg-primary-600 hover:bg-primary-700 text-white'
														: ''}"
												>
													{year}
												</button>
											{/if}
										{/each}
									</div>
								{/if}
							</div>
							<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{vehicleAge}</p>
							{#if !validations.year.valid && validations.year.message}
								<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									{validations.year.message}
								</p>
							{/if}
						</div>

						<!-- Plate -->
						<div>
							<label for="plate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Placa <span class="text-red-500">*</span>
							</label>
							<PlateInput
								bind:value={formData.plate}
								onvalidation={handlePlateValidation}
								checkAvailability={checkPlateAvailability}
								required
							/>
						</div>
					</div>
				</div>

				<!-- Step 2: Characteristics -->
				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
					<h2 class="mb-6 text-lg font-semibold text-gray-800 dark:text-white">
						2. Características
					</h2>

					<div class="grid gap-6 sm:grid-cols-2">
						<!-- Color -->
						<div>
							<label for="color" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Cor <span class="text-sm text-gray-500">(opcional)</span>
							</label>
							<ColorSelect bind:value={formData.color} />
						</div>

						<!-- Fuel Type -->
						<div class="sm:col-span-2">
							<div class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Tipo de Combustível <span class="text-red-500">*</span>
							</div>
							<div class="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
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
							{#if !validations.fuelType.valid && validations.fuelType.message}
								<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									{validations.fuelType.message}
								</p>
							{/if}
						</div>

						<!-- Current KM -->
						<div>
							<label
								for="current_km"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Quilometragem Atual <span class="text-red-500">*</span>
							</label>
							<KilometersInput
								bind:value={formData.current_km}
								year={formData.year}
								required={true}
							/>
							{#if !validations.currentKm.valid && validations.currentKm.message}
								<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									{validations.currentKm.message}
								</p>
							{/if}
						</div>

						<!-- Purchase Date -->
						<div>
							<label
								for="purchase_date"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Data de Aquisição <span class="text-sm text-gray-500">(opcional)</span>
							</label>
							<input
								type="date"
								id="purchase_date"
								bind:value={formData.purchase_date}
								oninput={handlePurchaseDateChange}
								max={new Date().toISOString().split('T')[0]}
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							/>
							{#if ownershipDuration}
								<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
									Tempo de posse: {ownershipDuration}
								</p>
							{/if}
							{#if !validations.purchaseDate.valid && validations.purchaseDate.message}
								<p class="mt-1 text-sm text-red-600 dark:text-red-400">
									{validations.purchaseDate.message}
								</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Step 3: Details -->
				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
					<h2 class="mb-6 text-lg font-semibold text-gray-800 dark:text-white">
						3. Detalhes e Observações
					</h2>

					<!-- Primary Vehicle -->
					<div class="mb-6">
						<label class="flex cursor-pointer items-center gap-3">
							<input
								type="checkbox"
								bind:checked={formData.is_primary}
								class="text-primary-600 focus:ring-primary-500 h-5 w-5 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-600"
							/>
							<div>
								<span class="text-sm font-medium text-gray-700 dark:text-gray-300">
									Veículo Principal
								</span>
								<p class="text-xs text-gray-500 dark:text-gray-400">
									Este é o meu veículo principal (usado com mais frequência)
								</p>
							</div>
						</label>
					</div>

					<!-- Notes -->
					<div>
						<div class="mb-2 flex items-center justify-between">
							<label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Observações <span class="text-sm text-gray-500">(opcional)</span>
							</label>
							<button
								type="button"
								onclick={() => (showNoteSuggestions = !showNoteSuggestions)}
								class="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
							>
								{showNoteSuggestions ? 'Ocultar' : 'Sugestões'}
							</button>
						</div>

						{#if showNoteSuggestions}
							<div class="mb-3 flex flex-wrap gap-2">
								{#each NOTE_SUGGESTIONS as suggestion}
									<button
										type="button"
										onclick={() => addNoteSuggestion(suggestion)}
										class="hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors dark:bg-gray-600 dark:text-gray-300"
									>
										{suggestion}
									</button>
								{/each}
							</div>
						{/if}

						<textarea
							id="notes"
							bind:value={formData.notes}
							oninput={handleNotesChange}
							rows="4"
							maxlength={notesCharLimit}
							placeholder="Ex: Veículo seminovo, kit multimídia, sensor de estacionamento..."
							class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
						></textarea>
						<div class="mt-1 flex items-center justify-between text-sm">
							<span class="text-gray-500 dark:text-gray-400">
								{notesCharCount} / {notesCharLimit} caracteres
							</span>
							{#if !validations.notes.valid && validations.notes.message}
								<span class="text-red-600 dark:text-red-400">
									{validations.notes.message}
								</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Form Actions -->
				<div class="flex justify-end gap-3 rounded-lg bg-white p-6 shadow dark:bg-gray-700">
					<button
						type="button"
						onclick={handleCancel}
						disabled={loading}
						class="focus:ring-primary-500 rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
					>
						Cancelar
					</button>
					<button
						type="submit"
						disabled={loading || !isFormValid}
						class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if loading}
							<svg
								class="h-5 w-5 animate-spin"
								fill="none"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
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
							<span>Salvando...</span>
						{:else}
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
									d="M5 13l4 4L19 7"
								></path>
							</svg>
							<span>Salvar Alterações</span>
						{/if}
					</button>
				</div>
			</form>
		{/if}
	</div>
</DashboardLayout>
