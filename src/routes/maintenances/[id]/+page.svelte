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
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import MaintenanceAttachments from '$lib/components/MaintenanceAttachments.svelte';

	let maintenance = $state<Maintenance | null>(null);
	let vehicles = $state<Vehicle[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(() => {
		Promise.all([loadMaintenance(), loadVehicles()]);
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

	function getVehicleInfo(vehicleId: number) {
		const vehicle = vehicles.find((v) => v.id === vehicleId) || maintenance?.vehicle;
		return vehicle
			? `${vehicle.brand} ${vehicle.model} ${vehicle.plate ? `• ${vehicle.plate}` : ''}`
			: 'Veículo não encontrado';
	}

	function getCategoryInfo(category?: string) {
		if (!category) return null;
		const cat = MAINTENANCE_CATEGORIES.find((c) => c.value === category);
		return cat;
	}

	function getStatusBadge(isCompleted: boolean) {
		if (isCompleted) {
			return {
				class: 'border-green-500/30 bg-green-500/10 text-green-400',
				icon: '✓',
				text: 'Concluída'
			};
		} else {
			return {
				class: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
				icon: '⏱',
				text: 'Pendente'
			};
		}
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
					<a href="/maintenances" class="text-blue-600 hover:text-blue-500 dark:text-blue-400">
						&larr; Voltar para lista
					</a>
				</div>
			</div>
		{:else if maintenance}
			<div class="mx-auto max-w-5xl space-y-6">
				<!-- Header -->
				<div class="flex items-start justify-between">
					<div class="flex items-start gap-4">
						<a
							href="/maintenances"
							aria-label="Voltar para lista de manutenções"
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
							<h1 class="text-3xl font-bold text-gray-900 dark:text-white">
								{maintenance.type}
							</h1>
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
								{getVehicleInfo(maintenance.vehicle_id)}
							</p>
						</div>
					</div>

					<div class="flex gap-2">
						<a
							href="/maintenances/{maintenance.id}/edit"
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
						{#if !maintenance.is_completed}
							<button
								onclick={async () => {
									try {
										const token = $authStore.token;
										if (!token) return;
										const res = await maintenancesApi.complete(maintenance.id, token);
										maintenance = res.data || res.maintenance || null;
									} catch (err: any) {
										alert(err.message || 'Erro ao marcar como concluída');
									}
								}}
								class="inline-flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-medium text-green-700 shadow-sm transition-colors hover:bg-green-100 dark:border-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
							>
								<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									></path>
								</svg>
								Marcar como Concluída
							</button>
						{/if}
					</div>
				</div>

				<!-- Info Cards -->
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<!-- Vehicle Card -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-sm transition-all hover:shadow-md"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-xs font-medium uppercase tracking-wide text-gray-400">
									Veículo
								</p>
								<p class="mt-2 text-lg font-bold text-white">
									{vehicles.find((v) => v.id === maintenance.vehicle_id)?.brand || ''}
									{vehicles.find((v) => v.id === maintenance.vehicle_id)?.model || ''}
								</p>
								<p class="mt-1 text-sm text-gray-400">
									{vehicles.find((v) => v.id === maintenance.vehicle_id)?.plate || ''}
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
										d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 001-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6 0a1 1 0 001 1h2a1 1 0 001-1m-6 0h6"
									></path>
								</svg>
							</div>
						</div>
					</div>

					<!-- Date Card -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-sm transition-all hover:shadow-md"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-xs font-medium uppercase tracking-wide text-gray-400">
									Data
								</p>
								<p class="mt-2 text-lg font-bold text-white">
									{formatDate(maintenance.service_date)}
								</p>
								{#if maintenance.km_when_done}
									<p class="mt-1 text-sm text-gray-400">
										{Number(maintenance.km_when_done || 0).toLocaleString()} km
									</p>
								{/if}
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20"
							>
								<svg
									class="h-6 w-6 text-purple-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									></path>
								</svg>
							</div>
						</div>
					</div>

					<!-- Cost Card -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-sm transition-all hover:shadow-md"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-xs font-medium uppercase tracking-wide text-gray-400">
									Custo
								</p>
								<p class="mt-2 text-lg font-bold text-white">
									{formatCurrency(Number(maintenance.cost || 0))}
								</p>
								{#if maintenance.invoice_number}
									<p class="mt-1 text-xs text-gray-400">
										NF: {maintenance.invoice_number}
									</p>
								{/if}
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

					<!-- Status Card -->
					<div
						class="group relative overflow-hidden rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-sm transition-all hover:shadow-md"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-xs font-medium uppercase tracking-wide text-gray-400">
									Status
								</p>
								<div class="mt-2">
									<span
										class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold {getStatusBadge(
											maintenance.is_completed
										).class}"
									>
										<span>{getStatusBadge(maintenance.is_completed).icon}</span>
										{getStatusBadge(maintenance.is_completed).text}
									</span>
								</div>
								{#if getCategoryInfo(maintenance.category)}
									<p class="mt-2 text-xs text-gray-400">
										{getCategoryInfo(maintenance.category)?.icon}
										{getCategoryInfo(maintenance.category)?.label}
									</p>
								{/if}
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-xl {maintenance.is_completed
									? 'bg-green-500/20'
									: 'bg-orange-500/20'}"
							>
								<svg
									class="h-6 w-6 {maintenance.is_completed
										? 'text-green-400'
										: 'text-orange-400'}"
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
							</div>
						</div>
					</div>
				</div>

				<!-- Description Section -->
				{#if maintenance.description}
					<div
						class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					>
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
										d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
									></path>
								</svg>
							</div>
							<h2 class="text-lg font-semibold text-gray-900 dark:text-white">
								Descrição do Serviço
							</h2>
						</div>
						<div class="mt-4">
							<p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
								{maintenance.description}
							</p>
						</div>
					</div>
				{/if}

				<!-- Additional Info Grid -->
				{#if maintenance.next_service_date || maintenance.next_km || maintenance.warranty_until || maintenance.notes}
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<!-- Next Maintenance -->
						{#if maintenance.next_service_date || maintenance.next_km}
							<div
								class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
							>
								<div class="flex items-center gap-2">
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
									<h3 class="font-semibold text-gray-900 dark:text-white">Próxima Manutenção</h3>
								</div>
								<div class="mt-4 space-y-2">
									{#if maintenance.next_service_date}
										<div class="flex justify-between">
											<span class="text-sm text-gray-600 dark:text-gray-400">Data prevista:</span>
											<span class="text-sm font-medium text-gray-900 dark:text-white">
												{formatDate(maintenance.next_service_date)}
											</span>
										</div>
									{/if}
									{#if maintenance.next_km}
										<div class="flex justify-between">
											<span class="text-sm text-gray-600 dark:text-gray-400">KM previsto:</span>
											<span class="text-sm font-medium text-gray-900 dark:text-white">
												{Number(maintenance.next_km).toLocaleString()} km
											</span>
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Warranty -->
						{#if maintenance.warranty_until}
							<div
								class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
							>
								<div class="flex items-center gap-2">
									<svg
										class="h-5 w-5 text-purple-600 dark:text-purple-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
										></path>
									</svg>
									<h3 class="font-semibold text-gray-900 dark:text-white">Garantia</h3>
								</div>
								<div class="mt-4">
									<div class="flex justify-between">
										<span class="text-sm text-gray-600 dark:text-gray-400">Válida até:</span>
										<span class="text-sm font-medium text-gray-900 dark:text-white">
											{formatDate(maintenance.warranty_until)}
										</span>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Notes -->
				{#if maintenance.notes}
					<div
						class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="flex items-center gap-2">
							<svg
								class="h-5 w-5 text-gray-600 dark:text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
								></path>
							</svg>
							<h3 class="font-semibold text-gray-900 dark:text-white">Notas Adicionais</h3>
						</div>
						<div class="mt-4">
							<p class="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
								{maintenance.notes}
							</p>
						</div>
					</div>
				{/if}

				<!-- Attachments -->
				<div
					class="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="flex items-center gap-3">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30"
						>
							<svg
								class="h-5 w-5 text-yellow-600 dark:text-yellow-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
								></path>
							</svg>
						</div>
						<h2 class="text-lg font-semibold text-gray-900 dark:text-white">Anexos</h2>
					</div>
					<div class="mt-4">
						<MaintenanceAttachments maintenanceId={maintenance.id} />
					</div>
				</div>

				<!-- Delete Action -->
				<div
					class="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20"
				>
					<div class="flex items-start gap-4">
						<div class="flex-shrink-0">
							<svg
								class="h-6 w-6 text-red-600 dark:text-red-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
								></path>
							</svg>
						</div>
						<div class="flex-1">
							<h3 class="text-sm font-semibold text-red-900 dark:text-red-400">Zona de Perigo</h3>
							<p class="mt-1 text-sm text-red-700 dark:text-red-400">
								Excluir esta manutenção é uma ação permanente e não pode ser desfeita.
							</p>
							<div class="mt-4">
								<button
									onclick={handleDelete}
									class="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50 dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
								>
									<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										></path>
									</svg>
									Excluir Manutenção
								</button>
							</div>
						</div>
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
</ProtectedRoute>
