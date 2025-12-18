<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { maintenancesApi } from '$lib/api/maintenances';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Maintenance } from '$lib/types/maintenance';
	import type { Vehicle } from '$lib/types/vehicle';
	import {
		MAINTENANCE_CATEGORIES,
		COMMON_MAINTENANCE_TYPES,
		type MaintenanceCategory
	} from '$lib/types/maintenance';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import MaintenanceAttachments from '$lib/components/MaintenanceAttachments.svelte';

	let maintenance = $state<Maintenance | null>(null);
	let vehicles = $state<Vehicle[]>([]);
	let loading = $state(true);
	let error = $state('');
	let isEditing = $state(false);
	let isSaving = $state(false);
	let showAdvanced = $state(false);
	let showTypeSuggestions = $state(false);
	let filteredSuggestions = $state<readonly string[]>([]);
	let selectedSuggestionIndex = $state(-1);

	let formData = $state({
		vehicle_id: 0,
		type: '',
		category: 'other' as MaintenanceCategory,
		description: '',
		cost: '',
		km_when_done: '',
		service_date: '',
		next_service_date: '',
		next_km: '',
		notes: '',
		invoice_number: '',
		warranty_until: ''
	});

	// Derived states
	let selectedVehicle = $derived(
		formData.vehicle_id > 0 ? vehicles.find((v) => v.id === formData.vehicle_id) : null
	);
	let descriptionLength = $derived(formData.description.length);
	let notesLength = $derived(formData.notes.length);

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
		Promise.all([loadMaintenance(), loadVehicles()]);

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

	async function loadMaintenance() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) {
				error = 'Usuário não autenticado';
				return;
			}

			const id = Number($page.params.id);
			const res = await maintenancesApi.getById(id, token);

			maintenance = res.data || res.maintenance || null;
			if (!maintenance) {
				throw new Error('Dados da manutenção não encontrados na resposta');
			}

			resetForm();
		} catch (err: any) {
			error = err.message || 'Erro ao carregar manutenção';
		} finally {
			loading = false;
		}
	}

	async function loadVehicles() {
		try {
			const token = $authStore.token;
			if (!token) return;

			const res = await vehiclesApi.list(token);
			vehicles = res.data || [];
		} catch (err: any) {
			console.error('Error loading vehicles:', err);
		}
	}

	function resetForm() {
		if (maintenance) {
			formData = {
				vehicle_id: maintenance.vehicle_id,
				type: maintenance.type,
				category: (maintenance.category as MaintenanceCategory) || 'other',
				description: maintenance.description || '',
				cost: maintenance.cost ? formatCurrency(maintenance.cost.toString()) : '',
				km_when_done: maintenance.km_when_done
					? formatKm(maintenance.km_when_done.toString())
					: '',
				service_date: maintenance.service_date.split('T')[0],
				next_service_date: maintenance.next_service_date
					? maintenance.next_service_date.split('T')[0]
					: '',
				next_km: maintenance.next_km ? formatKm(maintenance.next_km.toString()) : '',
				notes: maintenance.notes || '',
				invoice_number: maintenance.invoice_number || '',
				warranty_until: maintenance.warranty_until
					? maintenance.warranty_until.split('T')[0]
					: ''
			};
		}
	}

	async function handleUpdate(e: Event) {
		e.preventDefault();
		if (!maintenance) return;

		isSaving = true;
		error = '';
		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			// Validar quilometragem
			const kmWhenDone = formData.km_when_done
				? parseInt(formData.km_when_done.replace(/\D/g, ''))
				: undefined;

			const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id);

			if (kmWhenDone !== undefined) {
				if (selectedVehicle && kmWhenDone < selectedVehicle.current_km) {
					throw new Error(
						`A quilometragem informada (${kmWhenDone.toLocaleString('pt-BR')} km) não pode ser menor que a quilometragem atual do veículo (${selectedVehicle.current_km.toLocaleString('pt-BR')} km)`
					);
				}
			}

			// Validar próxima quilometragem
			const nextKm = formData.next_km ? parseInt(formData.next_km.replace(/\D/g, '')) : undefined;

			if (nextKm !== undefined) {
				const currentKmForValidation = kmWhenDone || selectedVehicle?.current_km;

				if (currentKmForValidation && nextKm < currentKmForValidation) {
					throw new Error(
						`A próxima quilometragem (${nextKm.toLocaleString('pt-BR')} km) não pode ser menor que a quilometragem atual cadastrada (${currentKmForValidation.toLocaleString('pt-BR')} km)`
					);
				}
			}

			const submitData = {
				vehicle_id: formData.vehicle_id,
				type: formData.type,
				category: formData.category === 'other' ? undefined : formData.category,
				description: formData.description || undefined,
				cost: formData.cost
					? parseFloat(formData.cost.replace(/[^\d,.-]/g, '').replace(',', '.'))
					: undefined,
				km_when_done: kmWhenDone,
				service_date: formData.service_date,
				next_service_date: formData.next_service_date || undefined,
				next_km: nextKm,
				notes: formData.notes || undefined,
				invoice_number: formData.invoice_number || undefined,
				warranty_until: formData.warranty_until || undefined
			};

			const res = await maintenancesApi.update(maintenance.id, submitData, token);
			maintenance = res.data || res.maintenance || null;
			isEditing = false;
		} catch (err: any) {
			error = err.message || 'Erro ao atualizar manutenção';
		} finally {
			isSaving = false;
		}
	}

	async function handleComplete() {
		if (!maintenance || maintenance.is_completed) return;

		try {
			const token = $authStore.token;
			if (!token) return;

			const res = await maintenancesApi.complete(maintenance.id, token);
			maintenance = res.data || res.maintenance || null;
		} catch (err: any) {
			alert(err.message || 'Erro ao marcar manutenção como concluída');
		}
	}

	async function handleDelete() {
		if (
			!maintenance ||
			!confirm(
				'Tem certeza que deseja excluir PERMANENTEMENTE esta manutenção? Esta ação não pode ser desfeita.'
			)
		) {
			return;
		}

		try {
			const token = $authStore.token;
			if (!token) return;

			await maintenancesApi.delete(maintenance.id, token);
			goto('/maintenances');
		} catch (err: any) {
			alert(err.message || 'Erro ao excluir manutenção');
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('pt-BR');
	}

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
		formData.km_when_done = formatted;
		target.value = formatted;
	}

	function handleNextKmInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const formatted = formatKm(target.value);
		formData.next_km = formatted;
		target.value = formatted;
	}

	function adjustKm(delta: number) {
		const currentKm = formData.km_when_done
			? parseInt(formData.km_when_done.replace(/\D/g, ''))
			: selectedVehicle?.current_km || 0;
		const minKm = selectedVehicle?.current_km || 0;
		const newKm = Math.max(minKm, currentKm + delta);
		formData.km_when_done = formatKm(newKm.toString());
	}

	function adjustNextKm(delta: number) {
		const kmWhenDone = formData.km_when_done
			? parseInt(formData.km_when_done.replace(/\D/g, ''))
			: selectedVehicle?.current_km || 0;
		const currentKm = formData.next_km
			? parseInt(formData.next_km.replace(/\D/g, ''))
			: kmWhenDone;
		const newKm = Math.max(kmWhenDone, currentKm + delta);
		formData.next_km = formatKm(newKm.toString());
	}

	function setWarrantyPreset(months: number) {
		const date = new Date(formData.service_date);
		date.setMonth(date.getMonth() + months);
		formData.warranty_until = date.toISOString().split('T')[0];
	}

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

	function getVehicleInfo(vehicleId: number) {
		const vehicle = vehicles.find((v) => v.id === vehicleId) || maintenance?.vehicle;
		return vehicle
			? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`
			: 'Veículo não encontrado';
	}

	function getStatusBadge(maintenance: Maintenance) {
		if (maintenance.is_completed) {
			return {
				class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
				text: 'Concluída'
			};
		} else {
			return {
				class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
				text: 'Pendente'
			};
		}
	}

	function getTypeLabel(type: string) {
		const types = {
			preventiva: 'Preventiva',
			corretiva: 'Corretiva',
			revisao: 'Revisão',
			outros: 'Outros'
		};
		return types[type as keyof typeof types] || type;
	}
</script>

<DashboardLayout>
	{#if loading}
		<div class="flex justify-center py-12">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
			></div>
		</div>
	{:else if error}
		<div class="mx-auto max-w-2xl">
			<div
				class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
			>
				{error}
			</div>
			<div class="mt-4 text-center">
				<a
					href="/maintenances"
					class="text-blue-600 hover:text-blue-500 dark:text-blue-400"
				>
					&larr; Voltar para lista
				</a>
			</div>
		</div>
	{:else if maintenance}
		<div class="mx-auto max-w-4xl space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a
						href="/maintenances"
						aria-label="Voltar para lista de manutenções"
						class="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-500 shadow transition-colors hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
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
						<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
							{maintenance.type}
						</h1>
						<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
							<span
								class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusBadge(
									maintenance
								).class}"
							>
								{getStatusBadge(maintenance).text}
							</span>
							<span
								class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200"
							>
								{getTypeLabel(maintenance.type)}
							</span>
							{#if maintenance.completed_at}
								<span>• Concluída em {formatDate(maintenance.completed_at)}</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="flex gap-2">
					{#if !isEditing}
						<button
							onclick={() => (isEditing = true)}
							class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
						>
							Editar
						</button>
					{/if}
				</div>
			</div>

			<!-- Content -->
			{#if isEditing}
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

				<form onsubmit={handleUpdate} class="space-y-6">
					<!-- Basic Information Card -->
					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
						<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
							Informações Básicas
						</h2>

						<div class="grid gap-6 sm:grid-cols-2">
							<!-- Vehicle -->
							<div class="sm:col-span-2">
								<label
									for="vehicle"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Veículo <span class="text-red-500">*</span>
								</label>
								<select
									id="vehicle"
									bind:value={formData.vehicle_id}
									required
									disabled
									class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm disabled:cursor-not-allowed disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-900"
								>
									<option value={0}>Selecione um veículo...</option>
									{#each vehicles as vehicle}
										<option value={vehicle.id}>
											{vehicle.brand}
											{vehicle.model} - {vehicle.plate} ({vehicle.year})
										</option>
									{/each}
								</select>
								{#if selectedVehicle}
									<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
										Quilometragem atual: {selectedVehicle.current_km.toLocaleString('pt-BR')} km
									</p>
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
								<div class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Categoria
								</div>
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
									Custo
								</label>
								<input
									type="text"
									id="cost"
									value={formData.cost}
									oninput={handleCostInput}
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

							<!-- KM when done -->
							<div class="sm:col-span-2">
								<label for="km" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Quilometragem no Serviço
								</label>
								<div class="mt-1 flex gap-2">
									<button
										type="button"
										onclick={() => adjustKm(-1000)}
										aria-label="Diminuir quilometragem em 1000 km"
										class="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
										</svg>
									</button>
									<input
										type="text"
										id="km"
										value={formData.km_when_done}
										oninput={handleKmInput}
										class="block flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
										placeholder="0 km"
									/>
									<button
										type="button"
										onclick={() => adjustKm(1000)}
										aria-label="Aumentar quilometragem em 1000 km"
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
													aria-label="Diminuir próxima quilometragem em 1000 km"
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
													value={formData.next_km}
													oninput={handleNextKmInput}
													class="block flex-1 rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
													placeholder="0 km"
												/>
												<button
													type="button"
													onclick={() => adjustNextKm(1000)}
													aria-label="Aumentar próxima quilometragem em 1000 km"
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

								<!-- Notes -->
								<div>
									<div class="flex items-center justify-between">
										<label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
											Notas Adicionais
										</label>
										<span class="text-xs text-gray-500">{notesLength} / 2000</span>
									</div>
									<textarea
										id="notes"
										bind:value={formData.notes}
										rows="3"
										maxlength="2000"
										class="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
										placeholder="Notas ou observações adicionais..."
									></textarea>
								</div>
							</div>
						{/if}
					</div>

					<!-- Actions -->
					<div class="flex justify-end gap-3">
						<button
							type="button"
							onclick={() => {
								isEditing = false;
								resetForm();
							}}
							class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
						>
							Cancelar
						</button>
						<button
							type="submit"
							disabled={isSaving}
							class="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
						>
							{#if isSaving}
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
					<!-- Basic Info Card -->
					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
						<div class="grid gap-6 sm:grid-cols-2">
							<div class="sm:col-span-2">
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Veículo</p>
								<p class="mt-1 text-lg text-gray-900 dark:text-white">
									{getVehicleInfo(maintenance.vehicle_id)}
								</p>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</p>
								<p class="mt-1 text-lg text-gray-900 dark:text-white">
									{getTypeLabel(maintenance.type)}
								</p>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Data do Serviço</p>
								<p class="mt-1 text-lg text-gray-900 dark:text-white">
									{formatDate(maintenance.service_date)}
								</p>
							</div>
							{#if maintenance.cost}
								<div>
									<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Custo</p>
									<p class="mt-1 text-lg text-gray-900 dark:text-white">
										{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
											maintenance.cost
										)}
									</p>
								</div>
							{/if}
							{#if maintenance.km_when_done}
								<div>
									<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
										KM quando realizada
									</p>
									<p class="mt-1 text-lg text-gray-900 dark:text-white">
										{maintenance.km_when_done.toLocaleString('pt-BR')} km
									</p>
								</div>
							{/if}
							{#if maintenance.next_service_date}
								<div>
									<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
										Próxima Manutenção
									</p>
									<p class="mt-1 text-lg text-gray-900 dark:text-white">
										{formatDate(maintenance.next_service_date)}
									</p>
								</div>
							{/if}
							{#if maintenance.next_km}
								<div>
									<p class="text-sm font-medium text-gray-500 dark:text-gray-400">
										Próxima Quilometragem
									</p>
									<p class="mt-1 text-lg text-gray-900 dark:text-white">
										{maintenance.next_km.toLocaleString('pt-BR')} km
									</p>
								</div>
							{/if}
							{#if maintenance.description}
								<div class="sm:col-span-2">
									<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Descrição</p>
									<p class="mt-1 whitespace-pre-wrap text-gray-900 dark:text-white">
										{maintenance.description}
									</p>
								</div>
							{/if}
							{#if maintenance.notes}
								<div class="sm:col-span-2">
									<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</p>
									<p class="mt-1 whitespace-pre-wrap text-gray-900 dark:text-white">
										{maintenance.notes}
									</p>
								</div>
							{/if}
						</div>
					</div>

					<!-- Attachments -->
					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
						<MaintenanceAttachments maintenanceId={maintenance.id} />
					</div>

					<!-- Actions -->
					<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
						<h3 class="text-lg font-medium text-gray-900 dark:text-white">Ações</h3>
						<div class="mt-4 flex flex-wrap gap-4">
							{#if !maintenance.is_completed}
								<button
									onclick={handleComplete}
									class="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
								>
									Marcar como Concluída
								</button>
							{/if}

							<button
								onclick={handleDelete}
								class="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
							>
								Excluir Manutenção
							</button>
						</div>
					</div>
				</div>
			{/if}
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
			<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
				Manutenção não encontrada
			</h3>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Não foi possível carregar os dados da manutenção.
			</p>
			<div class="mt-6">
				<a href="/maintenances" class="text-blue-600 hover:text-blue-500 dark:text-blue-400">
					&larr; Voltar para lista
				</a>
			</div>
		</div>
	{/if}
</DashboardLayout>
