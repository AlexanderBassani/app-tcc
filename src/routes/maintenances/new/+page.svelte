<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
timport { page } from '/stores';
	import { maintenancesApi } from '$lib/api/maintenances';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Vehicle } from '$lib/types/vehicle';
	import { MAINTENANCE_TYPES } from '$lib/types/maintenance';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let loading = false;
	let error = '';
	let vehicles: Vehicle[] = [];
	let vehiclesLoading = true;
	let isVehiclePreSelected = false;

	let formData = {
		vehicle_id: 0,
		title: '',
		description: '',
		type: 'preventiva' as 'preventiva' | 'corretiva' | 'revisao' | 'outros',
		cost: '',
		km_when_done: '',
		service_date: new Date().toISOString().split('T')[0],
		next_service_date: '',
		notes: ''
t	next_km: '',
	};
		await loadVehicles();
tonMount(async () => {
		// Verificar se há vehicle_id na URL
		const vehicleIdParam = $page.url.searchParams.get('vehicle_id');
		if (vehicleIdParam) {
			formData.vehicle_id = parseInt(vehicleIdParam);
			isVehiclePreSelected = true;
		}

		await loadVehicles();
	});
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

			const submitData = {
				vehicle_id: formData.vehicle_id,
				title: formData.title,
				description: formData.description || undefined,
				type: formData.type,
				cost: formData.cost ? parseFloat(formData.cost.replace(/[^\d,.-]/g, '').replace(',', '.')) : undefined,
				km_when_done: formData.km_when_done ? parseInt(formData.km_when_done.replace(/\D/g, '')) : undefined,
				service_date: formData.service_date,
				next_service_date: formData.next_service_date || undefined,
				notes: formData.notes || undefined
t			next_km: formData.next_km ? parseInt(formData.next_km.replace(/D/g, '')) : undefined,
			};

			await maintenancesApi.create(submitData, token);
			goto('/maintenances');
		} catch (err: any) {
			error = err.message || 'Erro ao criar manutenção';
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
n	function handleNextKmInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const formatted = formatKm(target.value);
		formData.next_km = formatted;
		target.value = formatted;
	}
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="mx-auto max-w-2xl space-y-6">
			<!-- Header -->
			<div class="flex items-center gap-4">
				<a
					href="/maintenances"
					class="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-gray-500 shadow transition-colors hover:text-gray-700 dark:bg-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					aria-label="Voltar para lista de manutenções"
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
				<h1 class="text-2xl font-bold text-gray-800 dark:text-white">Nova Manutenção</h1>
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

				<form on:submit={handleSubmit} class="space-y-6">
					<div class="grid gap-6 sm:grid-cols-2">
						<!-- Veículo -->
						<div class="sm:col-span-2">
							<label for="vehicle" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Veículo *
							</label>
							{#if vehiclesLoading}
								<div class="mt-1 flex items-center">
									<div class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
									<span class="text-sm text-gray-500">Carregando veículos...</span>
								</div>
							{:else}
								<select
									id="vehicle"
									bind:value={formData.vehicle_id}
									required
t							disabled={isVehiclePreSelected}
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								>
									<option value={0}>Selecione um veículo...</option>
									{#each vehicles as vehicle}
										<option value={vehicle.id}>
											{vehicle.brand} {vehicle.model} - {vehicle.plate} ({vehicle.year})
										</option>
									{/each}
								</select>
							{/if}
						</div>

						<!-- Título -->
						<div class="sm:col-span-2">
							<label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Título *
							</label>
							<input
								type="text"
								id="title"
								bind:value={formData.title}
								required
								maxlength="100"
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								placeholder="Ex: Troca de óleo, Revisão dos 10.000 km..."
							/>
						</div>

						<!-- Tipo -->
						<div>
							<label for="type" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Tipo *
							</label>
							<select
								id="type"
								bind:value={formData.type}
								required
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							>
								{#each MAINTENANCE_TYPES as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</div>

						<!-- Data do Serviço -->
						<div>
							<label for="service_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Data do Serviço *
							</label>
							<input
								type="date"
								id="service_date"
								bind:value={formData.service_date}
								required
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							/>
						</div>

						<!-- Custo -->
						<div>
							<label for="cost" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Custo
							</label>
							<input
								type="text"
								id="cost"
								value={formData.cost}
								on:input={handleCostInput}
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								placeholder="R$ 0,00"
							/>
						</div>

						<!-- KM -->
						<div>
							<label for="km" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								KM quando realizada
							</label>
							<input
								type="text"
								id="km"
								value={formData.km_when_done}
								on:input={handleKmInput}
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								placeholder="0 km"
							/>
						</div>

						<!-- Próxima Manutenção -->
						<div>
							<label for="next_date" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Próxima Manutenção
							</label>
							<input
								type="date"
								id="next_date"
								bind:value={formData.next_service_date}
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							/>
						</div>
					</div>
n						<!-- Próxima Quilometragem -->
						<div>
							<label for="next_km" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Próxima Quilometragem
							</label>
							<input
								type="text"
								id="next_km"
								value={formData.next_km}
								on:input={handleNextKmInput}
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								placeholder="0 km"
							/>
							<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
								Quilometragem estimada para a próxima manutenção
							</p>
						</div>

					<!-- Descrição -->
					<div>
						<label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Descrição
						</label>
						<textarea
							id="description"
							bind:value={formData.description}
							rows="3"
							maxlength="500"
							class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							placeholder="Descreva detalhes da manutenção..."
						></textarea>
					</div>

					<!-- Notas -->
					<div>
						<label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Notas Adicionais
						</label>
						<textarea
							id="notes"
							bind:value={formData.notes}
							rows="3"
							maxlength="500"
							class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							placeholder="Observações, lembretes..."
						></textarea>
					</div>

					<!-- Actions -->
					<div class="flex justify-end gap-3 pt-4">
						<a
							href="/maintenances"
							class="focus:ring-primary-500 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
						>
							Cancelar
						</a>
						<button
							type="submit"
							disabled={loading || vehiclesLoading}
							class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
						>
							{loading ? 'Salvando...' : 'Salvar Manutenção'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</DashboardLayout>
</ProtectedRoute>