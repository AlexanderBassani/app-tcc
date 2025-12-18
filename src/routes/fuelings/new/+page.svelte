<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { fuelingsApi } from '$lib/api/fuelings';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Vehicle } from '$lib/types/vehicle';
	import { FUEL_TYPES } from '$lib/types/fueling';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let loading = $state(false);
	let error = $state('');
	let vehicles = $state<Vehicle[]>([]);
	let vehiclesLoading = $state(true);
	let isVehiclePreSelected = $state(false);

	let formData = $state({
		vehicle_id: 0,
		date: new Date().toISOString().split('T')[0],
		km: '',
		liters: '',
		price_per_liter: '',
		fuel_type: 'gasoline' as 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'gnv' | 'electric',
		is_full_tank: true,
		gas_station: '',
		notes: ''
	});

	// Preencher quilometragem quando veículo é selecionado
	$effect(() => {
		if (formData.vehicle_id > 0 && vehicles.length > 0) {
			const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id);
			if (selectedVehicle) {
				// Sempre preencher com a quilometragem atual do veículo
				formData.km = formatKm(selectedVehicle.current_km.toString());
			}
		}
	});

	onMount(async () => {
		const vehicleIdParam = $page.url.searchParams.get('vehicle_id');
		if (vehicleIdParam) {
			formData.vehicle_id = parseInt(vehicleIdParam);
			isVehiclePreSelected = true;
		}

		await loadVehicles();
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

			const km = parseInt(formData.km.replace(/\D/g, ''));
			const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id);

			if (selectedVehicle && km < selectedVehicle.current_km) {
				throw new Error(
					`A quilometragem informada (${km.toLocaleString('pt-BR')} km) não pode ser menor que a quilometragem atual do veículo (${selectedVehicle.current_km.toLocaleString('pt-BR')} km)`
				);
			}

			const submitData = {
				vehicle_id: formData.vehicle_id,
				date: formData.date,
				km: km,
				liters: parseFloat(formData.liters.replace(/[^\d,.-]/g, '').replace(',', '.')),
				price_per_liter: parseFloat(
					formData.price_per_liter.replace(/[^\d,.-]/g, '').replace(',', '.')
				),
				fuel_type: formData.fuel_type,
				is_full_tank: formData.is_full_tank,
				gas_station: formData.gas_station || undefined,
				notes: formData.notes || undefined
			};

			await fuelingsApi.create(submitData, token);
			goto('/fuelings');
		} catch (err: any) {
			error = err.message || 'Erro ao criar abastecimento';
		} finally {
			loading = false;
		}
	}

	// Masks for input fields
	function formatCurrency(value: string) {
		const numbers = value.replace(/\D/g, '');
		const formatted = (parseInt(numbers) / 100).toLocaleString('pt-BR', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
		return numbers ? `R$ ${formatted}` : '';
	}

	function formatLiters(value: string) {
		const numbers = value.replace(/\D/g, '');
		const formatted = (parseInt(numbers) / 100).toLocaleString('pt-BR', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
		return numbers ? `${formatted} L` : '';
	}

	function formatKm(value: string) {
		const numbers = value.replace(/\D/g, '');
		return numbers ? parseInt(numbers).toLocaleString('pt-BR') + ' km' : '';
	}

	function handlePriceInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const formatted = formatCurrency(target.value);
		formData.price_per_liter = formatted;
		target.value = formatted;
	}

	function handleLitersInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const formatted = formatLiters(target.value);
		formData.liters = formatted;
		target.value = formatted;
	}

	function handleKmInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const formatted = formatKm(target.value);
		formData.km = formatted;
		target.value = formatted;
	}

	function incrementKm() {
		const currentKm = formData.km ? parseInt(formData.km.replace(/\D/g, '')) : 0;
		formData.km = formatKm((currentKm + 1000).toString());
	}

	function decrementKm() {
		const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id);
		const minKm = selectedVehicle?.current_km || 0;
		const currentKm = formData.km ? parseInt(formData.km.replace(/\D/g, '')) : minKm;
		const newKm = Math.max(minKm, currentKm - 1000);
		formData.km = formatKm(newKm.toString());
	}

	// Calcular total automaticamente
	let totalCost = $derived.by(() => {
		const liters = formData.liters
			? parseFloat(formData.liters.replace(/[^\d,.-]/g, '').replace(',', '.'))
			: 0;
		const pricePerLiter = formData.price_per_liter
			? parseFloat(formData.price_per_liter.replace(/[^\d,.-]/g, '').replace(',', '.'))
			: 0;
		const total = liters * pricePerLiter;
		return total > 0
			? new Intl.NumberFormat('pt-BR', {
					style: 'currency',
					currency: 'BRL'
				}).format(total)
			: 'R$ 0,00';
	});
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="mx-auto max-w-2xl space-y-6">
			<!-- Header -->
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
				<h1 class="text-2xl font-bold text-gray-800 dark:text-white">Novo Abastecimento</h1>
			</div>

			<!-- Form -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				{#if error}
					<div
						class="mb-6 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400"
					>
						{error}
					</div>
				{/if}

				<form onsubmit={handleSubmit} class="space-y-6">
					<div class="grid gap-6 sm:grid-cols-2">
						<!-- Veículo -->
						<div class="sm:col-span-2">
							<label
								for="vehicle"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Veículo *
							</label>
							{#if vehiclesLoading}
								<div class="mt-1 flex items-center">
									<div
										class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
									></div>
									<span class="text-sm text-gray-500">Carregando veículos...</span>
								</div>
							{:else}
								<select
									id="vehicle"
									bind:value={formData.vehicle_id}
									required
									disabled={isVehiclePreSelected}
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								>
									<option value={0}>Selecione um veículo...</option>
									{#each vehicles as vehicle}
										<option value={vehicle.id}>
											{vehicle.brand}
											{vehicle.model} - {vehicle.plate} ({vehicle.year})
										</option>
									{/each}
								</select>
							{/if}
						</div>

						<!-- Data -->
						<div>
							<label for="date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Data *
							</label>
							<input
								type="date"
								id="date"
								bind:value={formData.date}
								required
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							/>
						</div>

						<!-- KM -->
						<div>
							<label for="km" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Quilometragem *
							</label>
							<div class="relative mt-1 flex gap-2">
								<button
									type="button"
									onclick={decrementKm}
									aria-label="Diminuir quilometragem"
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
									class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
									placeholder="0 km"
								/>
								<button
									type="button"
									onclick={incrementKm}
									aria-label="Aumentar quilometragem"
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
							{#if formData.vehicle_id > 0}
								{@const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id)}
								{#if selectedVehicle}
									<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
										Quilometragem mínima: {selectedVehicle.current_km.toLocaleString('pt-BR')} km
									</p>
								{/if}
							{/if}
						</div>

						<!-- Tipo de Combustível -->
						<div>
							<label
								for="fuel_type"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Tipo de Combustível *
							</label>
							<select
								id="fuel_type"
								bind:value={formData.fuel_type}
								required
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							>
								{#each FUEL_TYPES as fuelType}
									<option value={fuelType.value}>{fuelType.label}</option>
								{/each}
							</select>
						</div>

						<!-- Litros -->
						<div>
							<label
								for="liters"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Litros *
							</label>
							<input
								type="text"
								id="liters"
								value={formData.liters}
								oninput={handleLitersInput}
								required
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								placeholder="0,00 L"
							/>
						</div>

						<!-- Preço por Litro -->
						<div>
							<label for="price" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Preço por Litro *
							</label>
							<input
								type="text"
								id="price"
								value={formData.price_per_liter}
								oninput={handlePriceInput}
								required
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								placeholder="R$ 0,00"
							/>
						</div>

						<!-- Total (calculado) -->
						<div>
							<div class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Total
							</div>
							<div
								class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							>
								{totalCost}
							</div>
						</div>

						<!-- Tanque Cheio -->
						<div class="sm:col-span-2">
							<div class="flex items-center">
								<input
									type="checkbox"
									id="is_full_tank"
									bind:checked={formData.is_full_tank}
									class="focus:ring-primary-500 text-primary-600 h-4 w-4 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700"
								/>
								<label
									for="is_full_tank"
									class="ml-2 block text-sm text-gray-700 dark:text-gray-300"
								>
									Tanque cheio
								</label>
							</div>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Marque esta opção se o tanque foi completamente abastecido
							</p>
						</div>

						<!-- Posto -->
						<div class="sm:col-span-2">
							<label
								for="gas_station"
								class="block text-sm font-medium text-gray-700 dark:text-gray-300"
							>
								Posto de Gasolina
							</label>
							<input
								type="text"
								id="gas_station"
								bind:value={formData.gas_station}
								maxlength="100"
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								placeholder="Nome do posto..."
							/>
						</div>
					</div>

					<!-- Observações -->
					<div>
						<label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Observações
						</label>
						<textarea
							id="notes"
							bind:value={formData.notes}
							rows="3"
							maxlength="500"
							class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							placeholder="Informações adicionais..."
						></textarea>
					</div>

					<!-- Actions -->
					<div class="flex justify-end gap-3 pt-4">
						<a
							href="/fuelings"
							class="focus:ring-primary-500 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
						>
							Cancelar
						</a>
						<button
							type="submit"
							disabled={loading || vehiclesLoading}
							class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						>
							{loading ? 'Salvando...' : 'Salvar Abastecimento'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</DashboardLayout>
</ProtectedRoute>
