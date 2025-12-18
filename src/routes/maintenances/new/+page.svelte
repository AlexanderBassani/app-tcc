<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { maintenancesApi } from '$lib/api/maintenances';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Vehicle } from '$lib/types/vehicle';
	import {
		MAINTENANCE_CATEGORIES,
		COMMON_MAINTENANCE_TYPES,
		type MaintenanceCategory
	} from '$lib/types/maintenance';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	// State
	let loading = $state(false);
	let error = $state('');
	let vehicles = $state<Vehicle[]>([]);
	let vehiclesLoading = $state(true);
	let isVehiclePreSelected = $state(false);
	let showAdvanced = $state(false);
	let showTypeSuggestions = $state(false);
	let filteredSuggestions = $state<readonly string[]>([]);
	let selectedSuggestionIndex = $state(-1);

	// Form data
	let formData = $state({
		vehicle_id: 0,
		type: '',
		category: 'other' as MaintenanceCategory,
		description: '',
		cost: '',
		km_at_service: '',
		service_date: new Date().toISOString().split('T')[0],
		next_service_km: '',
		next_service_date: '',
		invoice_number: '',
		warranty_until: ''
	});

	// Selected vehicle info
	let selectedVehicle = $derived(
		formData.vehicle_id > 0 ? vehicles.find((v) => v.id === formData.vehicle_id) : null
	);

	// Character counter for description
	let descriptionLength = $derived(formData.description.length);

	// Pre-fill km when vehicle is selected
	$effect(() => {
		if (formData.vehicle_id > 0 && selectedVehicle) {
			formData.km_at_service = formatKm(selectedVehicle.current_km.toString());
		}
	});

	// Filter suggestions based on input
	$effect(() => {
		if (showTypeSuggestions) {
			if (formData.type && formData.type.length >= 1) {
				const searchTerm = formData.type.toLowerCase();
				filteredSuggestions = COMMON_MAINTENANCE_TYPES.filter((type) =>
					type.toLowerCase().includes(searchTerm)
				);
			} else {
				filteredSuggestions = COMMON_MAINTENANCE_TYPES;
			}
			selectedSuggestionIndex = -1;
		}
	});

	onMount(() => {
		// Check if vehicle_id is pre-selected via URL
		const vehicleIdParam = $page.url.searchParams.get('vehicle_id');
		if (vehicleIdParam) {
			formData.vehicle_id = parseInt(vehicleIdParam);
			isVehiclePreSelected = true;
		}

		loadVehicles();

		// Close suggestions dropdown when clicking outside
		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			const typeInput = document.getElementById('type');
			const dropdown = typeInput?.nextElementSibling;

			if (typeInput && !typeInput.contains(target) && dropdown && !dropdown.contains(target)) {
				showTypeSuggestions = false;
			}
		}

		document.addEventListener('click', handleClickOutside);

		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});

	async function loadVehicles() {
		try {
			vehiclesLoading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const res = await vehiclesApi.list(token);
			vehicles = res.data || [];
		} catch (err: any) {
			error = err.message || 'Erro ao carregar veículos';
		} finally {
			vehiclesLoading = false;
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			if (formData.vehicle_id === 0) {
				throw new Error('Selecione um veículo');
			}

			if (!formData.type || formData.type.trim().length < 2) {
				throw new Error('Tipo de manutenção deve ter pelo menos 2 caracteres');
			}

			// Parse values
			const kmAtService = formData.km_at_service
				? parseInt(formData.km_at_service.replace(/\D/g, ''))
				: undefined;

			const nextServiceKm = formData.next_service_km
				? parseInt(formData.next_service_km.replace(/\D/g, ''))
				: undefined;

			const cost = formData.cost
				? parseFloat(formData.cost.replace(/[^\d,.-]/g, '').replace(',', '.'))
				: 0;

			// Validations
			if (kmAtService === undefined) {
				throw new Error('Quilometragem é obrigatória');
			}

			if (selectedVehicle && kmAtService < selectedVehicle.current_km) {
				throw new Error(
					`A quilometragem (${kmAtService.toLocaleString('pt-BR')} km) não pode ser menor que a atual do veículo (${selectedVehicle.current_km.toLocaleString('pt-BR')} km)`
				);
			}

			if (nextServiceKm !== undefined && nextServiceKm < kmAtService) {
				throw new Error('A próxima quilometragem deve ser maior que a atual');
			}

			// Build submit data
			const submitData = {
				vehicle_id: formData.vehicle_id,
				type: formData.type.trim(),
				category: formData.category === 'other' ? undefined : formData.category,
				description: formData.description.trim() || undefined,
				cost: cost,
				km_at_service: kmAtService,
				service_date: formData.service_date,
				next_service_km: nextServiceKm,
				next_service_date: formData.next_service_date || undefined,
				invoice_number: formData.invoice_number.trim() || undefined,
				warranty_until: formData.warranty_until || undefined
			};

			await maintenancesApi.create(submitData, token);
			goto('/maintenances');
		} catch (err: any) {
			error = err.message || 'Erro ao criar manutenção';
		} finally {
			loading = false;
		}
	}

	// Mask functions
	function formatCurrency(value: string) {
		const numbers = value.replace(/\D/g, '');
		const formatted = (parseInt(numbers || '0') / 100).toLocaleString('pt-BR', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
		return numbers ? `R$ ${formatted}` : '';
	}

	function formatKm(value: string) {
		const numbers = value.replace(/\D/g, '');
		return numbers ? parseInt(numbers).toLocaleString('pt-BR') + ' km' : '';
	}

	function handleCostInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const formatted = formatCurrency(target.value);
		formData.cost = formatted;
		target.value = formatted;
	}

	function handleKmInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const formatted = formatKm(target.value);
		formData.km_at_service = formatted;
		target.value = formatted;
	}

	function handleNextKmInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const formatted = formatKm(target.value);
		formData.next_service_km = formatted;
		target.value = formatted;
	}

	// Increment/decrement functions
	function adjustKm(delta: number) {
		const currentKm = formData.km_at_service
			? parseInt(formData.km_at_service.replace(/\D/g, ''))
			: selectedVehicle?.current_km || 0;
		const minKm = selectedVehicle?.current_km || 0;
		const newKm = Math.max(minKm, currentKm + delta);
		formData.km_at_service = formatKm(newKm.toString());
	}

	function adjustNextKm(delta: number) {
		const kmAtService = formData.km_at_service
			? parseInt(formData.km_at_service.replace(/\D/g, ''))
			: selectedVehicle?.current_km || 0;
		const currentKm = formData.next_service_km
			? parseInt(formData.next_service_km.replace(/\D/g, ''))
			: kmAtService;
		const newKm = Math.max(kmAtService, currentKm + delta);
		formData.next_service_km = formatKm(newKm.toString());
	}

	// Quick warranty presets
	function setWarrantyPreset(months: number) {
		const date = new Date(formData.service_date);
		date.setMonth(date.getMonth() + months);
		formData.warranty_until = date.toISOString().split('T')[0];
	}

	// Suggestion selection
	function selectSuggestion(type: string) {
		formData.type = type;
		showTypeSuggestions = false;
		selectedSuggestionIndex = -1;
		setTimeout(() => {
			const input = document.getElementById('type') as HTMLInputElement;
			input?.blur();
		}, 0);
	}

	function handleTypeKeydown(e: KeyboardEvent) {
		if (!showTypeSuggestions || filteredSuggestions.length === 0) {
			if (e.key === 'ArrowDown') {
				showTypeSuggestions = true;
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				selectedSuggestionIndex = Math.min(
					selectedSuggestionIndex + 1,
					filteredSuggestions.length - 1
				);
				break;

			case 'ArrowUp':
				e.preventDefault();
				selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
				break;

			case 'Enter':
				e.preventDefault();
				if (selectedSuggestionIndex >= 0) {
					selectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
				} else if (filteredSuggestions.length > 0) {
					selectSuggestion(filteredSuggestions[0]);
				}
				break;

			case 'Escape':
				e.preventDefault();
				showTypeSuggestions = false;
				selectedSuggestionIndex = -1;
				break;
		}
	}

	// Get category display info
	function getCategoryInfo(value: MaintenanceCategory) {
		return MAINTENANCE_CATEGORIES.find((c) => c.value === value);
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="mx-auto max-w-4xl space-y-6">
			<!-- Header -->
			<div class="flex items-center gap-4">
				<a
					href="/maintenances"
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-500 shadow transition-colors hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
					aria-label="Voltar"
				>
					<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M10 19l-7-7m0 0l7-7m-7 7h18"
						></path>
					</svg>
				</a>
				<div>
					<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Nova Manutenção</h1>
					<p class="text-sm text-gray-500 dark:text-gray-400">
						Registre uma manutenção realizada no veículo
					</p>
				</div>
			</div>

			<!-- Error Alert -->
			{#if error}
				<div
					class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
				>
					<div class="flex items-start">
						<svg class="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="ml-3">
							<p class="text-sm font-medium">{error}</p>
						</div>
					</div>
				</div>
			{/if}

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-6">
				<!-- Basic Information Card -->
				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
					<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
						Informações Básicas
					</h2>

					<div class="grid gap-6 sm:grid-cols-2">
						<!-- Vehicle -->
						<div class="sm:col-span-2">
							<label for="vehicle" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Veículo <span class="text-red-500">*</span>
							</label>
							{#if vehiclesLoading}
								<div class="mt-1 flex items-center">
									<div
										class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
									></div>
									<span class="text-sm text-gray-500">Carregando veículos...</span>
								</div>
							{:else}
								<select
									id="vehicle"
									bind:value={formData.vehicle_id}
									required
									disabled={isVehiclePreSelected}
									class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								>
									<option value={0}>Selecione um veículo...</option>
									{#each vehicles as vehicle}
										<option value={vehicle.id}>
											{vehicle.brand}
											{vehicle.model}
											{vehicle.year} - {vehicle.plate} ({vehicle.current_km.toLocaleString('pt-BR')} km)
										</option>
									{/each}
								</select>
								{#if selectedVehicle}
									<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
										Quilometragem atual: {selectedVehicle.current_km.toLocaleString('pt-BR')} km
									</p>
								{/if}
							{/if}
						</div>

						<!-- Type (with autocomplete) -->
						<div class="relative sm:col-span-2">
							<label for="type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Tipo de Manutenção <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="type"
								bind:value={formData.type}
								required
								minlength="2"
								maxlength="100"
								class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								placeholder="Ex: Troca de óleo, Alinhamento..."
								autocomplete="off"
								onfocus={() => (showTypeSuggestions = true)}
								onkeydown={handleTypeKeydown}
							/>
							{#if showTypeSuggestions && filteredSuggestions.length > 0}
								<div
									class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
								>
									{#each filteredSuggestions as suggestion, index}
										<button
											type="button"
											class="block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-600 {selectedSuggestionIndex ===
											index
												? 'bg-blue-100 dark:bg-blue-900/30'
												: ''}"
											data-suggestion-selected={selectedSuggestionIndex === index}
											onclick={() => selectSuggestion(suggestion)}
											onmouseenter={() => (selectedSuggestionIndex = index)}
										>
											{suggestion}
										</button>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Category -->
						<div class="sm:col-span-2">
							<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Categoria
							</label>
							<div class="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
								{#each MAINTENANCE_CATEGORIES as category}
									<label
										class="relative flex cursor-pointer rounded-lg border p-3 focus:outline-none {formData.category ===
										category.value
											? 'border-blue-600 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
											: 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-700'}"
									>
										<input
											type="radio"
											bind:group={formData.category}
											value={category.value}
											class="sr-only"
										/>
										<span class="flex flex-1 items-center">
											<span class="flex flex-col text-sm">
												<span class="text-lg">{category.icon}</span>
												<span
													class="font-medium {formData.category === category.value
														? 'text-blue-900 dark:text-blue-100'
														: 'text-gray-900 dark:text-gray-100'}"
												>
													{category.label}
												</span>
											</span>
										</span>
									</label>
								{/each}
							</div>
						</div>

						<!-- Description -->
						<div class="sm:col-span-2">
							<div class="flex items-center justify-between">
								<label
									for="description"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Descrição Detalhada
								</label>
								<span class="text-xs text-gray-500">{descriptionLength} / 2000</span>
							</div>
							<textarea
								id="description"
								bind:value={formData.description}
								rows="4"
								maxlength="2000"
								class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								placeholder="Descreva os serviços realizados, peças trocadas, observações importantes..."
							></textarea>
						</div>

						<!-- Cost and Date -->
						<div>
							<label for="cost" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Custo <span class="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="cost"
								value={formData.cost}
								oninput={handleCostInput}
								required
								class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
								placeholder="R$ 0,00"
							/>
							<p class="mt-1 text-xs text-gray-500">Digite 0 para serviços gratuitos</p>
						</div>

						<div>
							<label
								for="service_date"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Data do Serviço <span class="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="service_date"
								bind:value={formData.service_date}
								max={new Date().toISOString().split('T')[0]}
								required
								class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							/>
						</div>

						<!-- KM at Service -->
						<div class="sm:col-span-2">
							<label for="km" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Quilometragem no Serviço <span class="text-red-500">*</span>
							</label>
							<div class="mt-1 flex gap-2">
								<button
									type="button"
									onclick={() => adjustKm(-1000)}
									class="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
								>
									<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
									</svg>
								</button>
								<input
									type="text"
									id="km"
									value={formData.km_at_service}
									oninput={handleKmInput}
									required
									class="block flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
									placeholder="0 km"
								/>
								<button
									type="button"
									onclick={() => adjustKm(1000)}
									class="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
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
							{#if selectedVehicle}
								<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
									Mínimo: {selectedVehicle.current_km.toLocaleString('pt-BR')} km
								</p>
							{/if}
						</div>
					</div>
				</div>

				<!-- Advanced Options (Collapsible) -->
				<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
					<button
						type="button"
						onclick={() => (showAdvanced = !showAdvanced)}
						class="flex w-full items-center justify-between text-lg font-semibold text-gray-900 dark:text-white"
					>
						<span>Opções Avançadas</span>
						<svg
							class="h-5 w-5 transition-transform {showAdvanced ? 'rotate-180' : ''}"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if showAdvanced}
						<div class="mt-4 space-y-6">
							<!-- Next Maintenance -->
							<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
								<h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
									Próxima Manutenção
								</h3>
								<div class="grid gap-4 sm:grid-cols-2">
									<div>
										<label
											for="next_km"
											class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>
											Quilometragem
										</label>
										<div class="mt-1 flex gap-2">
											<button
												type="button"
												onclick={() => adjustNextKm(-1000)}
												class="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
												id="next_km"
												value={formData.next_service_km}
												oninput={handleNextKmInput}
												class="block flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
												placeholder="0 km"
											/>
											<button
												type="button"
												onclick={() => adjustNextKm(1000)}
												class="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
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
									</div>

									<div>
										<label
											for="next_date"
											class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>
											Data Prevista
										</label>
										<input
											type="date"
											id="next_date"
											bind:value={formData.next_service_date}
											min={new Date().toISOString().split('T')[0]}
											class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
										/>
									</div>
								</div>
							</div>

							<!-- Documentation -->
							<div class="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
								<h3 class="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Documentação</h3>
								<div class="grid gap-4 sm:grid-cols-2">
									<div>
										<label
											for="invoice"
											class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>
											Número da Nota Fiscal
										</label>
										<input
											type="text"
											id="invoice"
											bind:value={formData.invoice_number}
											maxlength="50"
											class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
											placeholder="Ex: NF-2024/12345"
										/>
									</div>

									<div>
										<label
											for="warranty"
											class="block text-sm font-medium text-gray-700 dark:text-gray-300"
										>
											Garantia até
										</label>
										<input
											type="date"
											id="warranty"
											bind:value={formData.warranty_until}
											min={formData.service_date}
											class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
										/>
										<div class="mt-2 flex flex-wrap gap-2">
											<button
												type="button"
												onclick={() => setWarrantyPreset(6)}
												class="rounded-md bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
											>
												+6 meses
											</button>
											<button
												type="button"
												onclick={() => setWarrantyPreset(12)}
												class="rounded-md bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
											>
												+1 ano
											</button>
											<button
												type="button"
												onclick={() => setWarrantyPreset(24)}
												class="rounded-md bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600"
											>
												+2 anos
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/if}
				</div>

				<!-- Actions -->
				<div class="flex justify-end gap-3">
					<a
						href="/maintenances"
						class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
					>
						Cancelar
					</a>
					<button
						type="submit"
						disabled={loading || vehiclesLoading}
						class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
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
							Salvar Manutenção
						{/if}
					</button>
				</div>
			</form>
		</div>
	</DashboardLayout>
</ProtectedRoute>
