<script lang="ts">
	import { onMount } from 'svelte';
	import { maintenancesApi } from '$lib/api/maintenances';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Maintenance } from '$lib/types/maintenance';
	import type { Vehicle } from '$lib/types/vehicle';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let maintenances: Maintenance[] = [];
	let vehicles: Vehicle[] = [];
	let loading = true;
	let error = '';
	let selectedFilter = 'all'; // all, pending, completed

	onMount(async () => {
		await loadData();
	});

	async function loadData() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			const [maintenancesRes, vehiclesRes] = await Promise.all([
				maintenancesApi.list(token),
				vehiclesApi.list(token)
			]);

			maintenances = maintenancesRes.data || [];
			vehicles = vehiclesRes.data || [];
		} catch (err: any) {
			error = err.message || 'Erro ao carregar dados';
		} finally {
			loading = false;
		}
	}

	function getVehicleInfo(vehicleId: number) {
		const vehicle = vehicles.find(v => v.id === vehicleId);
		return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : 'Veículo não encontrado';
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('pt-BR');
	}

	function formatCurrency(value?: number) {
		if (!value) return 'N/A';
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(value);
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

	$: filteredMaintenances = maintenances.filter(maintenance => {
		if (selectedFilter === 'pending') return !maintenance.is_completed;
		if (selectedFilter === 'completed') return maintenance.is_completed;
		return true;
	});

	async function handleComplete(id: number) {
		try {
			const token = $authStore.token;
			if (!token) return;

			await maintenancesApi.complete(id, token);
			await loadData(); // Reload data
		} catch (err: any) {
			alert(err.message || 'Erro ao marcar manutenção como concluída');
		}
	}

	async function handleDelete(id: number) {
		if (!confirm('Tem certeza que deseja excluir esta manutenção?')) return;

		try {
			const token = $authStore.token;
			if (!token) return;

			await maintenancesApi.delete(id, token);
			await loadData(); // Reload data
		} catch (err: any) {
			alert(err.message || 'Erro ao excluir manutenção');
		}
	}
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h1 class="text-2xl font-bold text-gray-800 dark:text-white">Manutenções</h1>
				<a
					href="/maintenances/new"
					class="bg-primary-600 hover:bg-primary-700 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors"
				>
					<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
					</svg>
					Nova Manutenção
				</a>
			</div>

			<!-- Filters -->
			<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
				<div class="flex gap-4">
					<button
						class="rounded-md px-3 py-2 text-sm font-medium {selectedFilter === 'all'
							? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
							: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
						on:click={() => (selectedFilter = 'all')}
					>
						Todas ({maintenances.length})
					</button>
					<button
						class="rounded-md px-3 py-2 text-sm font-medium {selectedFilter === 'pending'
							? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
							: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
						on:click={() => (selectedFilter = 'pending')}
					>
						Pendentes ({maintenances.filter(m => !m.is_completed).length})
					</button>
					<button
						class="rounded-md px-3 py-2 text-sm font-medium {selectedFilter === 'completed'
							? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
							: 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}"
						on:click={() => (selectedFilter = 'completed')}
					>
						Concluídas ({maintenances.filter(m => m.is_completed).length})
					</button>
				</div>
			</div>

			{#if loading}
				<div class="flex justify-center py-12">
					<div
						class="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
					></div>
				</div>
			{:else if error}
				<div class="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
					{error}
				</div>
			{:else if filteredMaintenances.length === 0}
				<div class="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-700">
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
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						></path>
					</svg>
					<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
						Nenhuma manutenção encontrada
					</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
						{selectedFilter === 'all' 
							? 'Comece criando sua primeira manutenção.' 
							: `Não há manutenções ${selectedFilter === 'pending' ? 'pendentes' : 'concluídas'}.`}
					</p>
					{#if selectedFilter === 'all'}
						<div class="mt-6">
							<a
								href="/maintenances/new"
								class="bg-primary-600 hover:bg-primary-700 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm"
							>
								<svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
								</svg>
								Nova Manutenção
							</a>
						</div>
					{/if}
				</div>
			{:else}
				<!-- Maintenance List -->
				<div class="space-y-4">
					{#each filteredMaintenances as maintenance (maintenance.id)}
						<div class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg dark:bg-gray-700">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<div class="flex items-center gap-3">
										<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
											{maintenance.title}
										</h3>
										<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusBadge(maintenance).class}">
											{getStatusBadge(maintenance).text}
										</span>
										<span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-600 dark:text-gray-200">
											{getTypeLabel(maintenance.type)}
										</span>
									</div>
									
									<div class="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
										<p><strong>Veículo:</strong> {getVehicleInfo(maintenance.vehicle_id)}</p>
										{#if maintenance.description}
											<p><strong>Descrição:</strong> {maintenance.description}</p>
										{/if}
										<div class="flex gap-4">
											<p><strong>Data:</strong> {formatDate(maintenance.service_date)}</p>
											{#if maintenance.cost}
												<p><strong>Custo:</strong> {formatCurrency(maintenance.cost)}</p>
											{/if}
											{#if maintenance.km_when_done}
												<p><strong>KM:</strong> {maintenance.km_when_done.toLocaleString()}</p>
											{/if}
										</div>
									</div>
								</div>

								<div class="flex gap-2">
									<a
										href="/maintenances/{maintenance.id}"
										class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
									>
										Ver
									</a>
									{#if !maintenance.is_completed}
										<button
											on:click={() => handleComplete(maintenance.id)}
											class="inline-flex items-center rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 shadow-sm hover:bg-green-100 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
										>
											Concluir
										</button>
									{/if}
									<button
										on:click={() => handleDelete(maintenance.id)}
										class="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-100 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
									>
										Excluir
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</DashboardLayout>
</ProtectedRoute>