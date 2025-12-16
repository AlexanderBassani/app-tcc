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

	let fueling: Fueling | null = null;
	let vehicles: Vehicle[] = [];
	let loading = true;
	let error = '';
	let isEditing = false;
	let isSaving = false;

	let formData = {
		vehicle_id: 0,
		date: '',
		km: '',
		liters: '',
		price_per_liter: '',
		fuel_type: 'gasoline' as 'gasoline' | 'ethanol' | 'diesel' | 'flex' | 'gnv' | 'electric',
		is_full_tank: true,
		gas_station: '',
		notes: ''
	};

	onMount(async () => {
		await Promise.all([loadFueling(), loadVehicles()]);
	});

	async function loadFueling() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) {
				error = 'Usuário não autenticado';
				return;
			}

			const id = Number($page.params.id);
			const res = await fuelingsApi.getById(id, token);

			fueling = res.data || null;
			if (!fueling) {
				throw new Error('Dados do abastecimento não encontrados na resposta');
			}

			resetForm();
		} catch (err: any) {
			error = err.message || 'Erro ao carregar abastecimento';
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
		if (fueling) {
			formData = {
				vehicle_id: fueling.vehicle_id,
				date: fueling.date.split('T')[0],
				km: formatKm(fueling.km.toString()),
				liters: formatLiters(fueling.liters.toString()),
				price_per_liter: formatCurrency(fueling.price_per_liter.toString()),
				fuel_type: fueling.fuel_type,
				is_full_tank: fueling.is_full_tank,
				gas_station: fueling.gas_station || '',
				notes: fueling.notes || ''
			};
		}
	}

	async function handleUpdate(e: Event) {
		e.preventDefault();
		if (!fueling) return;

		isSaving = true;
		error = '';
		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const km = parseInt(formData.km.replace(/\D/g, ''));
			const selectedVehicle = vehicles.find((v) => v.id === formData.vehicle_id);

			if (selectedVehicle && km < selectedVehicle.current_km) {
				throw new Error(
					`A quilometragem informada (${km.toLocaleString('pt-BR')} km) não pode ser menor que a quilometragem atual do veículo (${selectedVehicle.current_km.toLocaleString('pt-BR')} km)`
				);
			}

			const submitData = {
				date: formData.date,
				km: km,
				liters: parseFloat(formData.liters.replace(/[^\d,.-]/g, '').replace(',', '.')),
				price_per_liter: parseFloat(formData.price_per_liter.replace(/[^\d,.-]/g, '').replace(',', '.')),
				fuel_type: formData.fuel_type,
				is_full_tank: formData.is_full_tank,
				gas_station: formData.gas_station || undefined,
				notes: formData.notes || undefined
			};

			const res = await fuelingsApi.update(fueling.id, submitData, token);
			fueling = res.data || null;
			isEditing = false;
		} catch (err: any) {
			error = err.message || 'Erro ao atualizar abastecimento';
		} finally {
			isSaving = false;
		}
	}

	async function handleDelete() {
		if (
			!fueling ||
			!confirm(
				'Tem certeza que deseja excluir este abastecimento? Esta ação não pode ser desfeita.'
			)
		) {
			return;
		}

		try {
			const token = $authStore.token;
			if (!token) return;

			await fuelingsApi.delete(fueling.id, token);
			goto('/fuelings');
		} catch (err: any) {
			alert(err.message || 'Erro ao excluir abastecimento');
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('pt-BR');
	}

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

	function getVehicleInfo(vehicleId: number) {
		const vehicle = vehicles.find((v) => v.id === vehicleId) || fueling?.vehicle;
		return vehicle
			? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`
			: 'Veículo não encontrado';
	}

	function getFuelTypeLabel(type: string) {
		const fuelType = FUEL_TYPES.find(ft => ft.value === type);
		return fuelType?.label || type;
	}

	// Calcular total automaticamente
	let totalCost = $derived.by(() => {
		const liters = formData.liters ? parseFloat(formData.liters.replace(/[^\d,.-]/g, '').replace(',', '.')) : 0;
		const pricePerLiter = formData.price_per_liter ? parseFloat(formData.price_per_liter.replace(/[^\d,.-]/g, '').replace(',', '.')) : 0;
		const total = liters * pricePerLiter;
		return total > 0 ? new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(total) : 'R$ 0,00';
	});
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
				<a
					href="/fuelings"
					class="text-primary-600 hover:text-primary-500 dark:text-primary-400"
				>
					&larr; Voltar para lista
				</a>
			</div>
		</div>
	{:else if fueling}
		<div class="mx-auto max-w-3xl space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a
						href="/fuelings"
						aria-label="Voltar para lista de abastecimentos"
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
						<h1 class="text-2xl font-bold text-gray-800 dark:text-white">
							Abastecimento
						</h1>
						<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
							<span class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
								{getFuelTypeLabel(fueling.fuel_type)}
							</span>
							{#if fueling.is_full_tank}
								<span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
									Tanque Cheio
								</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="flex gap-2">
					{#if !isEditing}
						<button
							on:click={() => (isEditing = true)}
							class="rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
						>
							Editar
						</button>
					{/if}
				</div>
			</div>

			<!-- Content -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				{#if isEditing}
					{#if error}
						<div
							class="mb-6 rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400"
						>
							{error}
						</div>
					{/if}

					<form on:submit={handleUpdate} class="space-y-6">
						<div class="grid gap-6 sm:grid-cols-2">
							<!-- Veículo (readonly) -->
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
									required
									disabled
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								>
									<option value={0}>Selecione um veículo...</option>
									{#each vehicles as vehicle}
										<option value={vehicle.id}>
											{vehicle.brand}
											{vehicle.model} - {vehicle.plate} ({vehicle.year})
										</option>
									{/each}
								</select>
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
										on:click={decrementKm}
										class="flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
										</svg>
									</button>
									<input
										type="text"
										id="km"
										value={formData.km}
										on:input={handleKmInput}
										required
										class="focus:border-primary-500 focus:ring-primary-500 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
										placeholder="0 km"
									/>
									<button
										type="button"
										on:click={incrementKm}
										class="flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
									>
										<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
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
								<label for="fuel_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
								<label for="liters" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Litros *
								</label>
								<input
									type="text"
									id="liters"
									value={formData.liters}
									on:input={handleLitersInput}
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
									on:input={handlePriceInput}
									required
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
									placeholder="R$ 0,00"
								/>
							</div>

							<!-- Total (calculado) -->
							<div>
								<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Total
								</label>
								<div class="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-gray-900 dark:border-gray-600 dark:bg-gray-600 dark:text-white">
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
										class="focus:ring-primary-500 h-4 w-4 rounded border-gray-300 text-primary-600 dark:border-gray-600 dark:bg-gray-700"
									/>
									<label for="is_full_tank" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
										Tanque cheio
									</label>
								</div>
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
							></textarea>
						</div>

						<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-600">
							<button
								type="button"
								on:click={() => {
									isEditing = false;
									resetForm();
								}}
								class="focus:ring-primary-500 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={isSaving}
								class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
							>
								{isSaving ? 'Salvando...' : 'Salvar Alterações'}
							</button>
						</div>
					</form>
				{:else}
					<div class="grid gap-6 sm:grid-cols-2">
						<div class="sm:col-span-2">
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Veículo</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">
								{getVehicleInfo(fueling.vehicle_id)}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Data</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">
								{formatDate(fueling.date)}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Quilometragem</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">
								{fueling.km.toLocaleString()} km
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Combustível</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">
								{getFuelTypeLabel(fueling.fuel_type)}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Litros</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">
								{fueling.liters.toFixed(2)} L
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Preço por Litro</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">
								{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
									fueling.price_per_liter
								)}
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
							<p class="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
								{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
									fueling.total_cost
								)}
							</p>
						</div>
						{#if fueling.gas_station}
							<div class="sm:col-span-2">
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Posto</p>
								<p class="mt-1 text-gray-900 dark:text-white">
									{fueling.gas_station}
								</p>
							</div>
						{/if}
						{#if fueling.notes}
							<div class="sm:col-span-2">
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Observações</p>
								<p class="mt-1 whitespace-pre-wrap text-gray-900 dark:text-white">
									{fueling.notes}
								</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<h3 class="text-lg font-medium text-gray-900 dark:text-white">Ações</h3>
				<div class="mt-4 flex flex-wrap gap-4">
					<button
						on:click={handleDelete}
						class="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
					>
						Excluir Abastecimento
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
			<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
				Abastecimento não encontrado
			</h3>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Não foi possível carregar os dados do abastecimento.
			</p>
			<div class="mt-6">
				<a
					href="/fuelings"
					class="text-primary-600 hover:text-primary-500 dark:text-primary-400"
				>
					&larr; Voltar para lista
				</a>
			</div>
		</div>
	{/if}
</DashboardLayout>
