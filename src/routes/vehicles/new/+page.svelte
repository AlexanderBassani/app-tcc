<script lang="ts">
	import { goto } from '$app/navigation';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';

	let loading = false;
	let error = '';

	let formData = {
		brand: '',
		model: '',
		year: new Date().getFullYear(),
		plate: '',
		color: '',
		current_km: 0,
		purchase_date: new Date().toISOString().split('T')[0],
		notes: ''
	};

	async function handleSubmit(e: Event) {
		e.preventDefault();
		loading = true;
		error = '';

		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			await vehiclesApi.create(formData, token);
			goto('/vehicles');
		} catch (err: any) {
			error = err.message || 'Erro ao criar veículo';
		} finally {
			loading = false;
		}
	}
</script>

<DashboardLayout>
	<div class="mx-auto max-w-2xl space-y-6">
		<div class="flex items-center gap-4">
			<a
				href="/vehicles"
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
			<h1 class="text-2xl font-bold text-gray-800 dark:text-white">Novo Veículo</h1>
		</div>

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
					<!-- Marca -->
					<div>
						<label for="brand" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Marca
						</label>
						<input
							type="text"
							id="brand"
							bind:value={formData.brand}
							required
							class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							placeholder="Ex: Toyota"
						/>
					</div>

					<!-- Modelo -->
					<div>
						<label for="model" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Modelo
						</label>
						<input
							type="text"
							id="model"
							bind:value={formData.model}
							required
							class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							placeholder="Ex: Corolla"
						/>
					</div>

					<!-- Ano -->
					<div>
						<label for="year" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Ano
						</label>
						<input
							type="number"
							id="year"
							bind:value={formData.year}
							required
							min="1900"
							max={new Date().getFullYear() + 1}
							class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
						/>
					</div>

					<!-- Placa -->
					<div>
						<label for="plate" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Placa
						</label>
						<input
							type="text"
							id="plate"
							bind:value={formData.plate}
							required
							class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							placeholder="ABC-1234"
						/>
					</div>

					<!-- Cor -->
					<div>
						<label for="color" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Cor
						</label>
						<input
							type="text"
							id="color"
							bind:value={formData.color}
							required
							class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							placeholder="Ex: Prata"
						/>
					</div>

					<!-- KM Atual -->
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
							min="0"
							class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
						/>
					</div>

					<!-- Data de Compra -->
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

				<!-- Notas -->
				<div>
					<label for="notes" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Notas
					</label>
					<textarea
						id="notes"
						bind:value={formData.notes}
						rows="3"
						class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
						placeholder="Informações adicionais..."
					></textarea>
				</div>

				<div class="flex justify-end gap-3 pt-4">
					<a
						href="/vehicles"
						class="focus:ring-primary-500 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
					>
						Cancelar
					</a>
					<button
						type="submit"
						disabled={loading}
						class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
					>
						{loading ? 'Salvando...' : 'Salvar Veículo'}
					</button>
				</div>
			</form>
		</div>
	</div>
</DashboardLayout>
