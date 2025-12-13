<script lang="ts">
	import { maintenancesApi } from '$lib/api/maintenances';
	import { authStore } from '$lib/stores/auth';
	import type { Maintenance } from '$lib/types/maintenance';
	import { onMount } from 'svelte';

	let { vehicleId } = $props();

	let maintenances = $state<Maintenance[]>([]);
	let isLoading = $state(false);
	let errorMessage = $state('');

	onMount(() => {
		loadMaintenances();
	});

	async function loadMaintenances() {
		if (!vehicleId) return;

		isLoading = true;
		errorMessage = '';

		try {
			const response = await maintenancesApi.list($authStore.token!);
			// Filtrar apenas as manutenções deste veículo
			maintenances = response.data.filter(m => m.vehicle_id === vehicleId);
		} catch (e: any) {
			console.error('Erro ao carregar manutenções:', e);
			errorMessage = e.message || 'Erro ao carregar manutenções';
		} finally {
			isLoading = false;
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('pt-BR');
	}

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
	}

	function getStatusBadge(isCompleted: boolean) {
		return isCompleted
			? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
			: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
	}

	function getTypeLabel(type: string) {
		const types: Record<string, string> = {
			preventiva: 'Preventiva',
			corretiva: 'Corretiva',
			revisao: 'Revisão',
			outros: 'Outros'
		};
		return types[type] || type;
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
			Manutenções ({maintenances.length})
		</h3>
		<a
			href="/maintenances/new?vehicle_id={vehicleId}"
			class="inline-flex items-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-700"
		>
			<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
			</svg>
			Nova Manutenção
		</a>
	</div>

	{#if errorMessage}
		<div
			class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
		>
			{errorMessage}
		</div>
	{/if}

	{#if isLoading}
		<div class="text-center py-8">
			<div
				class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"
			></div>
			<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando manutenções...</p>
		</div>
	{:else if maintenances.length > 0}
		<div class="space-y-3">
			{#each maintenances as maintenance}
				<a
					href="/maintenances/{maintenance.id}"
					class="block rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="flex items-start justify-between">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-2">
								<h4 class="text-base font-semibold text-gray-900 dark:text-white truncate">
									{maintenance.title}
								</h4>
								<span
									class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getStatusBadge(
										maintenance.is_completed
									)}"
								>
									{maintenance.is_completed ? 'Concluída' : 'Pendente'}
								</span>
							</div>

							<div class="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-300">
								<div class="flex items-center">
									<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
										/>
									</svg>
									{formatDate(maintenance.service_date)}
								</div>

								<div class="flex items-center">
									<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
										/>
									</svg>
									{getTypeLabel(maintenance.type)}
								</div>

								{#if maintenance.cost}
									<div class="flex items-center">
										<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										{formatCurrency(maintenance.cost)}
									</div>
								{/if}

								{#if maintenance.km_when_done}
									<div class="flex items-center">
										<svg class="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M13 10V3L4 14h7v7l9-11h-7z"
											/>
										</svg>
										{maintenance.km_when_done.toLocaleString()} km
									</div>
								{/if}
							</div>

							{#if maintenance.description}
								<p class="mt-2 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
									{maintenance.description}
								</p>
							{/if}
						</div>

						<svg
							class="ml-4 h-5 w-5 text-gray-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 5l7 7-7 7"
							/>
						</svg>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="text-center py-8">
			<svg
				class="mx-auto h-12 w-12 text-gray-400"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
				/>
			</svg>
			<p class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
				Nenhuma manutenção registrada
			</p>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Comece registrando a primeira manutenção deste veículo.
			</p>
			<div class="mt-4">
				<a
					href="/maintenances/new?vehicle_id={vehicleId}"
					class="inline-flex items-center rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Nova Manutenção
				</a>
			</div>
		</div>
	{/if}
</div>
