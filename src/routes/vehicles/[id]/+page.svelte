<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Vehicle } from '$lib/types/vehicle';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';

	let vehicle: Vehicle | null = null;
	let loading = true;
	let error = '';
	let isEditing = false;
	let isSaving = false;

	let formData = {
		brand: '',
		model: '',
		year: 0,
		plate: '',
		color: '',
		current_km: 0,
		purchase_date: '',
		notes: ''
	};

	onMount(async () => {
		await loadVehicle();
	});

	async function loadVehicle() {
		console.log('loadVehicle called');
		try {
			loading = true;
			const token = $authStore.token;
			console.log('Token:', token ? 'Found' : 'Missing');

			if (!token) {
				error = 'Usuário não autenticado';
				return;
			}

			const id = Number($page.params.id);
			console.log('Vehicle ID:', id);

			const res = await vehiclesApi.getById(id, token);
			console.log('API Response:', res);

			// Handle both structures (mock uses .vehicle, real API uses .data)
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
				notes: vehicle.notes || ''
			};
		}
	}

	async function handleUpdate(e: Event) {
		e.preventDefault();
		if (!vehicle) return;

		isSaving = true;
		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const res = await vehiclesApi.update(vehicle.id, formData, token);
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

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('pt-BR');
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
		<div class="mx-auto max-w-3xl space-y-6">
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
						<h1 class="text-2xl font-bold text-gray-800 dark:text-white">
							{vehicle.brand}
							{vehicle.model}
						</h1>
						<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
							<span>{vehicle.year}</span>
							<span>•</span>
							<span>{vehicle.plate}</span>
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
					<form onsubmit={handleUpdate} class="space-y-6">
						<div class="grid gap-6 sm:grid-cols-2">
							<div>
								<label
									for="brand"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Marca
								</label>
								<input
									type="text"
									id="brand"
									bind:value={formData.brand}
									required
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								/>
							</div>
							<div>
								<label
									for="model"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Modelo
								</label>
								<input
									type="text"
									id="model"
									bind:value={formData.model}
									required
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								/>
							</div>
							<div>
								<label
									for="year"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Ano
								</label>
								<input
									type="number"
									id="year"
									bind:value={formData.year}
									required
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								/>
							</div>
							<div>
								<label
									for="plate"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Placa
								</label>
								<input
									type="text"
									id="plate"
									bind:value={formData.plate}
									required
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								/>
							</div>
							<div>
								<label
									for="color"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Cor
								</label>
								<input
									type="text"
									id="color"
									bind:value={formData.color}
									required
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								/>
							</div>
							<div>
								<label
									for="current_km"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									KM Atual
								</label>
								<input
									type="number"
									id="current_km"
									bind:value={formData.current_km}
									required
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								/>
							</div>
							<div>
								<label
									for="purchase_date"
									class="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Data de Compra
								</label>
								<input
									type="date"
									id="purchase_date"
									bind:value={formData.purchase_date}
									required
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								/>
							</div>
						</div>
						<div>
							<label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
								Notas
							</label>
							<textarea
								id="notes"
								bind:value={formData.notes}
								rows="3"
								class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							></textarea>
						</div>
						<div class="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-600">
							<button
								type="button"
								onclick={() => {
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
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Placa</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">{vehicle.plate}</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Cor</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">{vehicle.color}</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">KM Atual</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">
								{vehicle.current_km.toLocaleString()} km
							</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Data de Compra</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">
								{formatDate(vehicle.purchase_date)}
							</p>
						</div>
						<div class="col-span-full">
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</p>
							<p class="mt-1 whitespace-pre-wrap text-gray-900 dark:text-white">
								{vehicle.notes || '-'}
							</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<h3 class="text-lg font-medium text-gray-900 dark:text-white">Ações</h3>
				<div class="mt-4 flex flex-wrap gap-4">
					{#if vehicle.is_active}
						<button
							onclick={handleInactivate}
							class="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-2 text-sm font-medium text-yellow-700 hover:bg-yellow-100 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:outline-none dark:border-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
						>
							Inativar Veículo
						</button>
					{:else}
						<button
							onclick={handleReactivate}
							class="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none dark:border-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
						>
							Reativar Veículo
						</button>
					{/if}

					<button
						onclick={handleDelete}
						class="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
					>
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
			<div
				class="mt-8 rounded bg-gray-100 p-4 text-left text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400"
			>
				<p class="font-bold">Debug Info:</p>
				<p>ID: {$page.params.id}</p>
				<p>Token: {$authStore.token ? 'Presente' : 'Ausente'}</p>
				<p>Loading: {loading}</p>
				<p>Error: {error || 'None'}</p>
			</div>
		</div>
	{/if}
</DashboardLayout>
