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
	import VehicleMaintenances from '$lib/components/VehicleMaintenances.svelte';
	import { carBrands } from '$lib/data/carBrands';
	import { VEHICLE_COLORS, NOTE_SUGGESTIONS } from '$lib/data/vehicleConstants';
	import {
		validateBrand,
		validateModel,
		validateYear,
		validatePurchaseDate,
		validateNotes,
		calculateOwnershipDuration,
		getVehicleAge,
		formatPlate
	} from '$lib/utils/vehicleValidation';
	import { formatDate } from '$lib/utils/formatters';

	let vehicle: Vehicle | null = $state(null);
	let loading = $state(true);
	let error = $state('');
	let isEditing = $state(false);
	let isSaving = $state(false);
	let showNoteSuggestions = $state(false);

	let formData = $state({
		brand: '',
		model: '',
		year: 0,
		plate: '',
		color: '',
		current_km: 0,
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
		notes: { valid: true, message: '' }
	});

	// Derived values
	const notesCharCount = $derived(formData.notes.length);
	const notesCharLimit = 1000;

	const ownershipDuration = $derived.by(() => {
		if (formData.purchase_date) {
			return calculateOwnershipDuration(formData.purchase_date);
		}
		return '';
	});

	const vehicleAge = $derived.by(() => {
		return getVehicleAge(formData.year);
	});

	const selectedColor = $derived.by(() => {
		return VEHICLE_COLORS.find((c) => c.name === vehicle?.color);
	});

	// Watchers for validation
	$effect(() => {
		if (formData.brand && isEditing) {
			const result = validateBrand(formData.brand);
			validations.brand = result;
		}
	});

	$effect(() => {
		if (formData.model && isEditing) {
			const result = validateModel(formData.model);
			validations.model = result;
		}
	});

	$effect(() => {
		if (formData.year && isEditing) {
			const result = validateYear(formData.year);
			validations.year = result;
		}
	});

	onMount(async () => {
		await loadVehicle();
	});

	async function loadVehicle() {
		try {
			loading = true;
			const token = $authStore.token;

			if (!token) {
				error = 'Usuário não autenticado';
				return;
			}

			const id = Number($page.params.id);
			const res = await vehiclesApi.getById(id, token);
			vehicle = res.data || res.vehicle || null;

			if (!vehicle) {
				throw new Error('Dados do veículo não encontrados na resposta');
			}

			resetForm();
		} catch (err: any) {
			console.error('Error loading vehicle:', err);
			error = err.message || 'Erro ao carregar veículo';
		} finally {
			loading = false;
		}
	}

	function resetForm() {
		if (vehicle) {
			formData = {
				brand: vehicle.brand,
				model: vehicle.model,
				year: vehicle.year,
				plate: vehicle.plate,
				color: vehicle.color,
				current_km: vehicle.current_km,
				purchase_date: vehicle.purchase_date.split('T')[0],
				is_primary: vehicle.is_primary,
				notes: vehicle.notes || ''
			};
		}
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

	async function handleUpdate(e: Event) {
		e.preventDefault();
		if (!vehicle) return;

		isSaving = true;
		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const submitData = {
				brand: formData.brand.trim(),
				model: formData.model.trim(),
				year: formData.year,
				plate: formData.plate.toUpperCase(),
				color: formData.color.trim(),
				current_km: formData.current_km,
				purchase_date: formData.purchase_date,
				is_primary: formData.is_primary,
				notes: formData.notes.trim()
			};

			const res = await vehiclesApi.update(vehicle.id, submitData, token);
			vehicle = res.data || res.vehicle || null;
			isEditing = false;
		} catch (err: any) {
			error = err.message || 'Erro ao atualizar veículo';
		} finally {
			isSaving = false;
		}
	}

	async function handleInactivate() {
		if (!vehicle || !confirm('Tem certeza que deseja inativar este veículo?')) return;

		try {
			const token = $authStore.token;
			if (!token) return;

			const res = await vehiclesApi.inactivate(vehicle.id, token);
			vehicle = res.data || res.vehicle || null;
		} catch (err: any) {
			alert(err.message || 'Erro ao inativar veículo');
		}
	}

	async function handleReactivate() {
		if (!vehicle || !confirm('Tem certeza que deseja reativar este veículo?')) return;

		try {
			const token = $authStore.token;
			if (!token) return;

			const res = await vehiclesApi.reactivate(vehicle.id, token);
			vehicle = res.data || res.vehicle || null;
		} catch (err: any) {
			alert(err.message || 'Erro ao reativar veículo');
		}
	}

	async function handleDelete() {
		if (
			!vehicle ||
			!confirm(
				'Tem certeza que deseja excluir PERMANENTEMENTE este veículo? Esta ação não pode ser desfeita.'
			)
		)
			return;

		try {
			const token = $authStore.token;
			if (!token) return;

			await vehiclesApi.delete(vehicle.id, token);
			goto('/vehicles');
		} catch (err: any) {
			alert(err.message || 'Erro ao excluir veículo');
		}
	}
</script>

<DashboardLayout>
	{#if loading}
		<div class="flex justify-center py-12">
			<div
				class="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
			></div>
		</div>
	{:else if error}
		<div class="mx-auto max-w-2xl">
			<div class="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
				{error}
			</div>
			<div class="mt-4 text-center">
				<a href="/vehicles" class="text-primary-600 hover:text-primary-500 dark:text-primary-400">
					&larr; Voltar para lista
				</a>
			</div>
		</div>
	{:else if vehicle}
		<div class="mx-auto max-w-4xl space-y-6 px-4 py-6">
			<!-- Primary Vehicle Banner -->
			{#if vehicle.is_primary}
				<div class="relative overflow-hidden rounded-xl bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 p-1 shadow-lg">
					<div class="flex items-center gap-3 rounded-lg bg-white p-4 dark:bg-gray-800">
						<div class="flex-shrink-0">
							<svg
								class="h-8 w-8 text-yellow-500"
								fill="currentColor"
								viewBox="0 0 20 20"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
								></path>
							</svg>
						</div>
						<div class="flex-1">
							<h2 class="text-lg font-bold text-gray-900 dark:text-white">
								Veículo Principal
							</h2>
							<p class="text-sm text-gray-600 dark:text-gray-400">
								Este é o seu veículo mais utilizado
							</p>
						</div>
						<div class="flex-shrink-0">
							<span class="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
								<svg class="mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
								</svg>
								Principal
							</span>
						</div>
					</div>
				</div>
			{/if}

			<!-- Header -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a
						href="/vehicles"
						aria-label="Voltar para lista de veículos"
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-500 shadow transition-colors hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
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
					<div>
						<h1 class="text-3xl font-bold text-gray-800 dark:text-white">
							{vehicle.brand}
							{vehicle.model}
						</h1>
						<div class="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
							<span>{vehicle.year}</span>
							<span>•</span>
							<span class="uppercase">{formatPlate(vehicle.plate)}</span>
							{#if vehicle.is_primary}
								<span
									class="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900/30 dark:text-primary-300"
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
									Principal
								</span>
							{/if}
							{#if !vehicle.is_active}
								<span
									class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200"
								>
									Inativo
								</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="flex gap-2">
					{#if !isEditing}
						<button
							onclick={() => (isEditing = true)}
							class="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600"
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
									d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
								></path>
							</svg>
							Editar
						</button>
					{/if}
				</div>
			</div>

			<!-- Content -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				{#if isEditing}
					<!-- Edit Form -->
					<form onsubmit={handleUpdate} class="space-y-6">
						<h2 class="mb-6 text-lg font-semibold text-gray-800 dark:text-white">
							Editar Informações
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
									placeholder="Digite para buscar uma marca..."
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
								<ModelSelect
									id="model"
									bind:value={formData.model}
									brand={formData.brand}
									required
								/>
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
								<input
									type="number"
									id="year"
									bind:value={formData.year}
									required
									min="1900"
									max={new Date().getFullYear() + 1}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								/>
								<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{vehicleAge}</p>
								{#if !validations.year.valid && validations.year.message}
									<p class="mt-1 text-sm text-red-600 dark:text-red-400">
										{validations.year.message}
									</p>
								{/if}
							</div>

							<!-- Plate (read-only) -->
							<div>
								<label for="plate_display" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Placa
								</label>
								<input
									type="text"
									id="plate_display"
									value={formatPlate(vehicle.plate)}
									disabled
									class="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 uppercase"
								/>
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									A placa não pode ser alterada
								</p>
							</div>

							<!-- Color -->
							<div>
								<label for="color" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Cor
								</label>
								<ColorSelect bind:value={formData.color} />
							</div>

							<!-- Current KM -->
							<div>
								<label
									for="current_km"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Quilometragem Atual <span class="text-red-500">*</span>
								</label>
								<KilometersInput bind:value={formData.current_km} year={formData.year} />
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									KM anterior: {vehicle.current_km.toLocaleString('pt-BR')} km
								</p>
							</div>

							<!-- Purchase Date -->
							<div class="sm:col-span-2">
								<label
									for="purchase_date"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Data de Aquisição
								</label>
								<input
									type="date"
									id="purchase_date"
									bind:value={formData.purchase_date}
									oninput={handlePurchaseDateChange}
									max={new Date().toISOString().split('T')[0]}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
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

						<!-- Primary Vehicle -->
						<div class="mb-6">
							<label class="flex items-center gap-3 cursor-pointer">
								<input
									type="checkbox"
									bind:checked={formData.is_primary}
									class="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600"
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
									Observações
								</label>
								<button
									type="button"
									onclick={() => (showNoteSuggestions = !showNoteSuggestions)}
									class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
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
											class="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700 transition-colors hover:bg-primary-100 hover:text-primary-700 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-primary-900"
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
								class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
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

						<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-600">
							<button
								type="button"
								onclick={() => {
									isEditing = false;
									resetForm();
								}}
								disabled={isSaving}
								class="rounded-md border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSaving}
								class="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-primary-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if isSaving}
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
				{:else}
					<!-- View Mode -->
					<div class="grid gap-6 sm:grid-cols-2">
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Marca</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">{vehicle.brand}</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Modelo</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">{vehicle.model}</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Ano</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">{vehicle.year}</p>
							<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
								{getVehicleAge(vehicle.year)}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Placa</p>
							<p class="mt-1 text-lg font-mono uppercase text-gray-900 dark:text-white">
								{formatPlate(vehicle.plate)}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Cor</p>
							<div class="mt-1 flex items-center gap-2">
								{#if selectedColor}
									<div
										class="h-6 w-6 rounded-full border-2 shadow-sm"
										style="background-color: {selectedColor.hex}; border-color: {selectedColor.borderColor}"
									></div>
								{/if}
								<p class="text-lg text-gray-900 dark:text-white">{vehicle.color}</p>
							</div>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">KM Atual</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">
								{vehicle.current_km.toLocaleString('pt-BR')} km
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Aquisição</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">
								{formatDate(vehicle.purchase_date)}
							</p>
							{#if calculateOwnershipDuration(vehicle.purchase_date)}
								<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
									Tempo de posse: {calculateOwnershipDuration(vehicle.purchase_date)}
								</p>
							{/if}
						</div>
						{#if vehicle.is_primary}
							<div class="col-span-full">
								<div class="flex items-center gap-2 rounded-lg bg-primary-50 p-4 dark:bg-primary-900/20">
									<svg
										class="h-5 w-5 text-primary-600 dark:text-primary-400"
										fill="currentColor"
										viewBox="0 0 20 20"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
										></path>
									</svg>
									<div>
										<p class="text-sm font-medium text-primary-900 dark:text-primary-100">
											Veículo Principal
										</p>
										<p class="text-xs text-primary-700 dark:text-primary-300">
											Este é o seu veículo principal
										</p>
									</div>
								</div>
							</div>
						{/if}
						<div class="col-span-full">
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Observações</p>
							<p class="mt-1 whitespace-pre-wrap text-gray-900 dark:text-white">
								{vehicle.notes || '-'}
							</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Maintenances -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<VehicleMaintenances vehicleId={vehicle.id} />
			</div>

			<!-- Actions -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<h3 class="text-lg font-medium text-gray-900 dark:text-white">Ações</h3>
				<div class="mt-4 flex flex-wrap gap-4">
					{#if vehicle.is_active}
						<button
							onclick={handleInactivate}
							class="inline-flex items-center gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
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
									d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
								></path>
							</svg>
							Inativar Veículo
						</button>
					{:else}
						<button
							onclick={handleReactivate}
							class="inline-flex items-center gap-2 rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
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
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
							Reativar Veículo
						</button>
					{/if}

					<button
						onclick={handleDelete}
						class="inline-flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
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
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							></path>
						</svg>
						Excluir Veículo
					</button>
				</div>
			</div>
		</div>
	{:else}
		<div class="p-12 text-center">
			<div
				class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700"
			>
				<svg class="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
					/>
				</svg>
			</div>
			<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Veículo não encontrado</h3>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Não foi possível carregar os dados do veículo.
			</p>
			<div class="mt-6">
				<a href="/vehicles" class="text-primary-600 hover:text-primary-500 dark:text-primary-400">
					&larr; Voltar para lista
				</a>
			</div>
		</div>
	{/if}
</DashboardLayout>
