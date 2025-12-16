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
		const vehicle = vehicles.find((v) => v.id === vehicleId);
		return vehicle
			? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})`
			: 'Veículo não encontrado';
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
				class: 'bg-green-500/10 text-green-400 border border-green-500/30',
				text: 'Concluída'
			};
		} else {
			return {
				class: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30',
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

	$: filteredMaintenances = maintenances.filter((maintenance) => {
		if (selectedFilter === 'pending') return !maintenance.is_completed;
		if (selectedFilter === 'completed') return maintenance.is_completed;
		return true;
	});

	$: allCount = maintenances.length;
	$: pendingCount = maintenances.filter((m) => !m.is_completed).length;
	$: completedCount = maintenances.filter((m) => m.is_completed).length;

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
				<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Manutenções</h1>
				<a
					href="/maintenances/new"
					class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
				>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						></path>
					</svg>
					Nova Manutenção
				</a>
			</div>

			<!-- Tabs / Filters -->
			<div class="rounded-lg bg-white p-1 dark:bg-gray-800">
				<div class="flex gap-2">
					<button
						class="flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors {selectedFilter ===
						'all'
							? 'bg-blue-600 text-white shadow-sm'
							: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}"
						onclick={() => (selectedFilter = 'all')}
					>
						Todas ({allCount})
					</button>
					<button
						class="flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors {selectedFilter ===
						'pending'
							? 'bg-blue-600 text-white shadow-sm'
							: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}"
						onclick={() => (selectedFilter = 'pending')}
					>
						Pendentes ({pendingCount})
					</button>
					<button
						class="flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-colors {selectedFilter ===
						'completed'
							? 'bg-blue-600 text-white shadow-sm'
							: 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'}"
						onclick={() => (selectedFilter = 'completed')}
					>
						Concluídas ({completedCount})
					</button>
				</div>
			</div>

			{#if loading}
				<div class="flex justify-center py-12">
					<div
						class="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"
					></div>
				</div>
			{:else if error}
				<div
					class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
				>
					{error}
				</div>
			{:else if filteredMaintenances.length === 0}
				<div
					class="rounded-xl bg-white p-12 text-center shadow-sm dark:bg-gray-800"
				>
					<svg
						class="mx-auto h-16 w-16 text-gray-400"
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
					<h3 class="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
						Nenhuma manutenção encontrada
					</h3>
					<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
						{selectedFilter === 'all'
							? 'Comece criando sua primeira manutenção.'
							: `Não há manutenções ${selectedFilter === 'pending' ? 'pendentes' : 'concluídas'}.`}
					</p>
					{#if selectedFilter === 'all'}
						<div class="mt-6">
							<a
								href="/maintenances/new"
								class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
							>
								<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 6v6m0 0v6m0-6h6m-6 0H6"
									></path>
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
						<div
							class="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-800 to-gray-900 p-6 shadow-lg transition-all hover:shadow-xl dark:border-gray-700"
						>
							<div class="flex items-start justify-between gap-4">
								<div class="flex-1 space-y-3">
									<!-- Status Badge and Type -->
									<div class="flex items-center gap-2">
										<span
											class="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold {getStatusBadge(
												maintenance
											).class}"
										>
											{getStatusBadge(maintenance).text}
										</span>
										<span
											class="inline-flex items-center rounded-full bg-gray-700 px-3 py-1 text-xs font-medium text-gray-300"
										>
											{getTypeLabel(maintenance.type)}
										</span>
									</div>

									<!-- Vehicle Info -->
									<div class="text-white">
										<p class="text-sm text-gray-400">Veículo:</p>
										<p class="font-semibold">{getVehicleInfo(maintenance.vehicle_id)}</p>
									</div>

									<!-- Description -->
									{#if maintenance.description}
										<div class="text-white">
											<p class="text-sm text-gray-400">Descrição:</p>
											<p class="text-sm">{maintenance.description}</p>
										</div>
									{/if}

									<!-- Date and Cost -->
									<div class="flex gap-6 text-sm text-gray-300">
										<div>
											<span class="text-gray-400">Data:</span>
											<span class="ml-1">{formatDate(maintenance.service_date)}</span>
										</div>
										{#if maintenance.cost}
											<div>
												<span class="text-gray-400">Custo:</span>
												<span class="ml-1 font-semibold">{formatCurrency(maintenance.cost)}</span>
											</div>
										{/if}
									</div>
								</div>

								<!-- Action Buttons -->
								<div class="flex gap-2">
									<a
										href="/maintenances/{maintenance.id}"
										class="rounded-lg border border-gray-600 bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
									>
										Ver
									</a>
									{#if !maintenance.is_completed}
										<button
											onclick={() => handleComplete(maintenance.id)}
											class="rounded-lg border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
										>
											Concluir
										</button>
									{/if}
									<button
										onclick={() => handleDelete(maintenance.id)}
										class="rounded-lg border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
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
