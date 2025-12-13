<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { maintenancesApi } from '$lib/api/maintenances';
	import { vehiclesApi } from '$lib/api/vehicles';
	import { authStore } from '$lib/stores/auth';
	import type { Maintenance } from '$lib/types/maintenance';
	import type { Vehicle } from '$lib/types/vehicle';
	import { MAINTENANCE_TYPES } from '$lib/types/maintenance';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import MaintenanceAttachments from '$lib/components/MaintenanceAttachments.svelte';

	let maintenance: Maintenance | null = null;
	let vehicles: Vehicle[] = [];
	let loading = true;
	let error = '';
	let isEditing = false;
	let isSaving = false;

	let formData = {
		vehicle_id: 0,
		title: '',
		description: '',
		type: 'preventiva' as 'preventiva' | 'corretiva' | 'revisao' | 'outros',
		cost: '',
		km_when_done: '',
		service_date: '',
		next_service_date: '',
		notes: ''
	};

	onMount(async () => {
		await Promise.all([loadMaintenance(), loadVehicles()]);
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

			resetForm();
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

	function resetForm() {
		if (maintenance) {
			formData = {
				vehicle_id: maintenance.vehicle_id,
				title: maintenance.title,
				description: maintenance.description || '',
				type: maintenance.type,
				cost: maintenance.cost ? formatCurrency(maintenance.cost.toString()) : '',
				km_when_done: maintenance.km_when_done ? formatKm(maintenance.km_when_done.toString()) : '',
				service_date: maintenance.service_date.split('T')[0],
				next_service_date: maintenance.next_service_date ? maintenance.next_service_date.split('T')[0] : '',
				notes: maintenance.notes || ''
			};
		}
	}

	async function handleUpdate(e: Event) {
		e.preventDefault();
		if (!maintenance) return;

		isSaving = true;
		try {
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

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
			};

			const res = await maintenancesApi.update(maintenance.id, submitData, token);
			maintenance = res.data || res.maintenance || null;
			isEditing = false;
		} catch (err: any) {
			error = err.message || 'Erro ao atualizar manutenção';
		} finally {
			isSaving = false;
		}
	}

	async function handleComplete() {
		if (!maintenance || maintenance.is_completed) return;

		try {
			const token = $authStore.token;
			if (!token) return;

			const res = await maintenancesApi.complete(maintenance.id, token);
			maintenance = res.data || res.maintenance || null;
		} catch (err: any) {
			alert(err.message || 'Erro ao marcar manutenção como concluída');
		}
	}

	async function handleDelete() {
		if (!maintenance || !confirm('Tem certeza que deseja excluir PERMANENTEMENTE esta manutenção? Esta ação não pode ser desfeita.')) {
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
	}

	function getVehicleInfo(vehicleId: number) {
		const vehicle = vehicles.find(v => v.id === vehicleId) || maintenance?.vehicle;
		return vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : 'Veículo não encontrado';
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
				<a href="/maintenances" class="text-primary-600 hover:text-primary-500 dark:text-primary-400">
					&larr; Voltar para lista
				</a>
			</div>
		</div>
	{:else if maintenance}
		<div class="mx-auto max-w-3xl space-y-6">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<a
						href="/maintenances"
						aria-label="Voltar para lista de manutenções"
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
							{maintenance.title}
						</h1>
						<div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
							<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getStatusBadge(maintenance).class}">
								{getStatusBadge(maintenance).text}
							</span>
							<span class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-600 dark:text-gray-200">
								{getTypeLabel(maintenance.type)}
							</span>
							{#if maintenance.completed_at}
								<span>• Concluída em {formatDate(maintenance.completed_at)}</span>
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
					<form on:submit={handleUpdate} class="space-y-6">
						<div class="grid gap-6 sm:grid-cols-2">
							<!-- Veículo -->
							<div class="sm:col-span-2">
								<label for="vehicle" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
									Veículo *
								</label>
								<select
									id="vehicle"
									bind:value={formData.vehicle_id}
									required
									class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
								>
									<option value={0}>Selecione um veículo...</option>
									{#each vehicles as vehicle}
										<option value={vehicle.id}>
											{vehicle.brand} {vehicle.model} - {vehicle.plate} ({vehicle.year})
										</option>
									{/each}
								</select>
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
							<p class="mt-1 text-lg text-gray-900 dark:text-white">{getVehicleInfo(maintenance.vehicle_id)}</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">{getTypeLabel(maintenance.type)}</p>
						</div>
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Data do Serviço</p>
							<p class="mt-1 text-lg text-gray-900 dark:text-white">{formatDate(maintenance.service_date)}</p>
						</div>
						{#if maintenance.cost}
							<div>
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Custo</p>
								<p class="mt-1 text-lg text-gray-900 dark:text-white">
									{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(maintenance.cost)}
								</p>
							</div>
						{/if}
						{#if maintenance.km_when_done}
							<div>
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">KM quando realizada</p>
								<p class="mt-1 text-lg text-gray-900 dark:text-white">{maintenance.km_when_done.toLocaleString()} km</p>
							</div>
						{/if}
						{#if maintenance.next_service_date}
							<div>
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Próxima Manutenção</p>
								<p class="mt-1 text-lg text-gray-900 dark:text-white">{formatDate(maintenance.next_service_date)}</p>
							</div>
						{/if}
						{#if maintenance.description}
							<div class="sm:col-span-2">
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Descrição</p>
								<p class="mt-1 whitespace-pre-wrap text-gray-900 dark:text-white">{maintenance.description}</p>
							</div>
						{/if}
						{#if maintenance.notes}
							<div class="sm:col-span-2">
								<p class="text-sm font-medium text-gray-500 dark:text-gray-400">Notas</p>
								<p class="mt-1 whitespace-pre-wrap text-gray-900 dark:text-white">{maintenance.notes}</p>
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Attachments -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<MaintenanceAttachments maintenanceId={maintenance.id} />
			</div>

			<!-- Actions -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<h3 class="text-lg font-medium text-gray-900 dark:text-white">Ações</h3>
				<div class="mt-4 flex flex-wrap gap-4">
					{#if !maintenance.is_completed}
						<button
							on:click={handleComplete}
							class="rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none dark:border-green-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
						>
							Marcar como Concluída
						</button>
					{/if}

					<button
						on:click={handleDelete}
						class="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none dark:border-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
					>
						Excluir Manutenção
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
			<h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Manutenção não encontrada</h3>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Não foi possível carregar os dados da manutenção.
			</p>
			<div class="mt-6">
				<a href="/maintenances" class="text-primary-600 hover:text-primary-500 dark:text-primary-400">
					&larr; Voltar para lista
				</a>
			</div>
		</div>
	{/if}
</DashboardLayout>