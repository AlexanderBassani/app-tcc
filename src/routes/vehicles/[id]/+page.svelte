<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { fuelingsApi } from '$lib/api/fuelings';
	import { maintenancesApi } from '$lib/api/maintenances';
	import { authStore } from '$lib/stores/auth';
	import type { Vehicle } from '$lib/types/vehicle';
	import type { Fueling } from '$lib/types/fueling';
	import type { Maintenance } from '$lib/types/maintenance';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';

	let vehicle: Vehicle | null = $state(null);
	let fuelings: Fueling[] = $state([]);
	let maintenances: Maintenance[] = $state([]);
	let loading = $state(true);
	let error = $state('');

	// Computed KPIs
	let totalMaintenanceCost = $derived(
		maintenances.reduce((sum, m) => sum + (m.cost || 0), 0)
	);

	let pendingMaintenances = $derived(
		maintenances.filter(m => !m.is_completed).length
	);

	let totalFuelVolume = $derived(
		fuelings.reduce((sum, f) => sum + (f.liters || 0), 0)
	);

	onMount(async () => {
		await Promise.all([loadVehicle(), loadFuelings(), loadMaintenances()]);
	});

	async function loadVehicle() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) {
				error = 'Usuário não autenticado';
				return;
			}

			const id = Number($page.params.id);
			const res = await vehiclesApi.getById(id, token);

			vehicle = res.data;
			if (!vehicle) {
				throw new Error('Veículo não encontrado');
			}
		} catch (err: any) {
			error = err.message || 'Erro ao carregar veículo';
		} finally {
			loading = false;
		}
	}

	async function loadFuelings() {
		try {
			const token = $authStore.token;
			if (!token) return;

			const id = Number($page.params.id);
			const res = await fuelingsApi.list(token, { vehicleId: id, limit: 2 });
			fuelings = res.data || [];
		} catch (err) {
			console.error('Error loading fuelings:', err);
		}
	}

	async function loadMaintenances() {
		try {
			const token = $authStore.token;
			if (!token) return;

			const id = Number($page.params.id);
			const res = await maintenancesApi.list(token);
			maintenances = (res.data || []).filter((m: Maintenance) => m.vehicle_id === id).slice(0, 3);
		} catch (err) {
			console.error('Error loading maintenances:', err);
		}
	}

	async function handleDelete() {
		if (
			!vehicle ||
			!confirm(
				'Tem certeza que deseja excluir PERMANENTEMENTE este veículo? Esta ação não pode ser desfeita e todos os registros associados serão perdidos.'
			)
		) {
			return;
		}

		try {
			const token = $authStore.token;
			if (!token) return;

			await vehiclesApi.delete(vehicle.id, token, true);
			goto('/vehicles');
		} catch (err: any) {
			alert(err.message || 'Erro ao excluir veículo');
		}
	}

	async function toggleStatus() {
		if (!vehicle) return;

		try {
			const token = $authStore.token;
			if (!token) return;

			const newStatus = !vehicle.is_active;
			await vehiclesApi.update(
				vehicle.id,
				{
					...vehicle,
					is_active: newStatus
				},
				token
			);

			vehicle.is_active = newStatus;
		} catch (err: any) {
			alert(err.message || 'Erro ao alterar status do veículo');
		}
	}

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}

	function formatCurrency(value: number) {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(value);
	}

	function getFuelTypeLabel(type: string) {
		const types: Record<string, string> = {
			gasoline: 'Gasolina',
			ethanol: 'Etanol',
			diesel: 'Diesel',
			gnv: 'GNV',
			flex: 'Flex'
		};
		return types[type] || type;
	}
</script>

<ProtectedRoute>
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
					<a href="/vehicles" class="text-blue-600 hover:text-blue-500 dark:text-blue-400">
						&larr; Voltar para lista
					</a>
				</div>
			</div>
		{:else if vehicle}
			<div class="mx-auto max-w-7xl space-y-6">
				<!-- Header -->
				<div class="flex items-start justify-between">
					<div class="flex items-start gap-4">
						<a
							href="/vehicles"
							aria-label="Voltar para lista de veículos"
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-white/50 text-gray-500 backdrop-blur-sm transition-all hover:bg-white hover:text-gray-700 hover:shadow-md dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
						>
							<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M10 19l-7-7m0 0l7-7m-7 7h18"
								></path>
							</svg>
						</a>
						<div>
							<div class="flex items-center gap-3">
								<h1 class="text-3xl font-bold text-gray-900 dark:text-white">
									{vehicle.brand} {vehicle.model}
								</h1>
								{#if vehicle.is_active}
									<span
										class="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-sm font-semibold text-green-400"
									>
										<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
										Ativo
									</span>
								{:else}
									<span
										class="inline-flex items-center gap-1.5 rounded-full border border-gray-500/30 bg-gray-500/10 px-3 py-1 text-sm font-semibold text-gray-400"
									>
										<span class="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
										Inativo
									</span>
								{/if}
							</div>
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
								{vehicle.year} • {vehicle.plate}
							</p>
						</div>
					</div>

					<a
						href="/vehicles/{vehicle.id}/edit"
						class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
							></path>
						</svg>
						Editar
					</a>
				</div>

				<!-- KPI Cards -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<!-- Quilometragem -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-xs font-medium uppercase tracking-wide text-gray-400">
									Quilometragem
								</p>
								<p class="mt-2 text-2xl font-bold text-white">
									{Number(vehicle.current_km || 0).toLocaleString()} km
								</p>
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20"
							>
								<svg
									class="h-6 w-6 text-blue-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 10V3L4 14h7v7l9-11h-7z"
									></path>
								</svg>
							</div>
						</div>
					</div>

					<!-- Manutenções -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-xs font-medium uppercase tracking-wide text-gray-400">
									Manutenções
								</p>
								<p class="mt-2 text-2xl font-bold text-white">
									{pendingMaintenances}
									<span class="text-base font-normal text-gray-400">pendentes</span>
								</p>
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20"
							>
								<svg
									class="h-6 w-6 text-orange-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
									></path>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									></path>
								</svg>
							</div>
						</div>
					</div>

					<!-- Gastos Manutenção -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-xs font-medium uppercase tracking-wide text-gray-400">
									Gastos Manutenção
								</p>
								<p class="mt-2 text-2xl font-bold text-white">
									{formatCurrency(totalMaintenanceCost)}
								</p>
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/20"
							>
								<svg
									class="h-6 w-6 text-green-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
							</div>
						</div>
					</div>

					<!-- Combustível -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-700"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-xs font-medium uppercase tracking-wide text-gray-400">
									Combustível
								</p>
								<p class="mt-2 text-2xl font-bold text-white">
									{Math.round(totalFuelVolume)}L
								</p>
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20"
							>
								<svg
									class="h-6 w-6 text-blue-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
									></path>
								</svg>
							</div>
						</div>
					</div>
				</div>

				<!-- Informações do Veículo -->
				<div
					class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="flex items-center gap-3 mb-6">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30"
						>
							<svg
								class="h-5 w-5 text-blue-600 dark:text-blue-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								></path>
							</svg>
						</div>
						<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
							Informações do Veículo
						</h2>
					</div>

					<div class="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
						<!-- COR -->
						<div>
							<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
									></path>
								</svg>
								<span>COR</span>
							</div>
							<p class="mt-1 font-medium text-gray-900 dark:text-white">
								{vehicle.color || '-'}
							</p>
						</div>

						<!-- KM ATUAL -->
						<div>
							<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M13 10V3L4 14h7v7l9-11h-7z"
									></path>
								</svg>
								<span>KM ATUAL</span>
							</div>
							<p class="mt-1 font-medium text-gray-900 dark:text-white">
								{Number(vehicle.current_km || 0).toLocaleString()} km
							</p>
						</div>

						<!-- DATA DE COMPRA -->
						<div>
							<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									></path>
								</svg>
								<span>DATA DE COMPRA</span>
							</div>
							<p class="mt-1 font-medium text-gray-900 dark:text-white">
								{vehicle.purchase_date ? formatDate(vehicle.purchase_date) : '-'}
							</p>
						</div>

						<!-- NOTAS -->
						<div>
							<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
									></path>
								</svg>
								<span>NOTAS</span>
							</div>
							<p class="mt-1 font-medium text-gray-900 dark:text-white">
								{vehicle.notes || '-'}
							</p>
						</div>
					</div>
				</div>

				<!-- Grid com Manutenções e Abastecimentos -->
				<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
					<!-- Manutenções -->
					<div
						class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="flex items-center justify-between mb-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30"
								>
									<svg
										class="h-5 w-5 text-orange-600 dark:text-orange-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
										></path>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										></path>
									</svg>
								</div>
								<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
									Manutenções
									<span class="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400"
										>{maintenances.length}</span
									>
								</h3>
							</div>
							<a
								href="/maintenances/new?vehicle_id={vehicle.id}"
								class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
							>
								+ Nova Manutenção
							</a>
						</div>

						<div class="space-y-3">
							{#if maintenances.length === 0}
								<p class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
									Nenhuma manutenção registrada
								</p>
							{:else}
								{#each maintenances as maintenance}
									<a
										href="/maintenances/{maintenance.id}"
										class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
									>
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-lg {maintenance.is_completed
													? 'bg-green-100 dark:bg-green-900/30'
													: 'bg-orange-100 dark:bg-orange-900/30'}"
											>
												{#if maintenance.is_completed}
													<svg
														class="h-5 w-5 text-green-600 dark:text-green-400"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
														></path>
													</svg>
												{:else}
													<svg
														class="h-5 w-5 text-orange-600 dark:text-orange-400"
														fill="none"
														stroke="currentColor"
														viewBox="0 0 24 24"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
														></path>
													</svg>
												{/if}
											</div>
											<div>
												<p class="font-medium text-gray-900 dark:text-white">
													{maintenance.type}
												</p>
												<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
													<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
														></path>
													</svg>
													<span>{formatDate(maintenance.service_date)}</span>
													<span class="ml-2">{formatCurrency(maintenance.cost || 0)}</span>
												</div>
											</div>
										</div>
										<svg
											class="h-5 w-5 text-gray-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 5l7 7-7 7"
											></path>
										</svg>
									</a>
								{/each}
							{/if}
						</div>
					</div>

					<!-- Abastecimentos -->
					<div
						class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="flex items-center justify-between mb-6">
							<div class="flex items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30"
								>
									<svg
										class="h-5 w-5 text-blue-600 dark:text-blue-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
										></path>
									</svg>
								</div>
								<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
									Abastecimentos
									<span class="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400"
										>{fuelings.length}</span
									>
								</h3>
							</div>
							<a
								href="/fuelings/new?vehicle_id={vehicle.id}"
								class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
							>
								+ Novo Abastecimento
							</a>
						</div>

						<div class="space-y-3">
							{#if fuelings.length === 0}
								<p class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
									Nenhum abastecimento registrado
								</p>
							{:else}
								{#each fuelings as fueling}
									<a
										href="/fuelings/{fueling.id}"
										class="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
									>
										<div class="flex items-center gap-3">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30"
											>
												<span class="text-sm font-bold text-blue-600 dark:text-blue-400">
													{Math.round(fueling.liters || 0)}L
												</span>
											</div>
											<div>
												<p class="font-medium text-gray-900 dark:text-white">
													{getFuelTypeLabel(fueling.fuel_type)}
												</p>
												<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
													<svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															stroke-width="2"
															d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
														></path>
													</svg>
													<span>{formatDate(fueling.date)}</span>
													<span class="ml-2">{formatCurrency(fueling.total_cost || 0)}</span>
												</div>
											</div>
										</div>
										<svg
											class="h-5 w-5 text-gray-400"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 5l7 7-7 7"
											></path>
										</svg>
									</a>
								{/each}
							{/if}
						</div>
					</div>
				</div>

				<!-- Ações -->
				<div
					class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Ações</h3>
					<div class="flex flex-wrap gap-3">
						<button
							onclick={toggleStatus}
							class="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors {vehicle.is_active
								? 'border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50'
								: 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'}"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								></path>
							</svg>
							{vehicle.is_active ? 'Inativar Veículo' : 'Ativar Veículo'}
						</button>

						<button
							onclick={handleDelete}
							class="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
						>
							<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
								></path>
							</svg>
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
				<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">
					Veículo não encontrado
				</h3>
				<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
					Não foi possível carregar os dados do veículo.
				</p>
				<div class="mt-6">
					<a href="/vehicles" class="text-blue-600 hover:text-blue-500 dark:text-blue-400">
						&larr; Voltar para lista
					</a>
				</div>
			</div>
		{/if}
	</DashboardLayout>
</ProtectedRoute>
