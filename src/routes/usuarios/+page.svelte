<script lang="ts">
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import { usersApi } from '$lib/api/users';
	import { authStore, type User } from '$lib/stores/auth';

	let users = $state<User[]>([]);
	let isLoading = $state(true);
	let error = $state('');

	// Aguarda o token estar disponível antes de buscar usuários
	$effect(() => {
		if ($authStore.token) {
			fetchUsers();
		}
	});

	async function fetchUsers() {
		try {
			isLoading = true;
			error = '';

			if (!$authStore.token) {
				throw new Error('Token não encontrado');
			}

			const response = await usersApi.list($authStore.token);
			users = response.data;
		} catch (e) {
			console.error('Erro ao carregar usuários:', e);
			error = e instanceof Error ? e.message : 'Erro ao carregar usuários';
		} finally {
			isLoading = false;
		}
	}

	function formatDate(date?: string) {
		if (!date) return '-';
		return new Date(date).toLocaleDateString('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		});
	}
</script>

<DashboardLayout>
	<div class="space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold text-gray-800 dark:text-white">Lista de Usuários</h2>
				<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
					Gerencie todos os usuários do sistema
				</p>
			</div>
			<a
				href="/dashboard/usuarios/cadastro"
				class="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
			>
				Novo Usuário
			</a>
		</div>

		<!-- Error Message -->
		{#if error}
			<div
				class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
			>
				{error}
			</div>
		{/if}

		<!-- Users Table -->
		<div class="overflow-hidden rounded-lg bg-white shadow dark:bg-gray-700">
			<div class="overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
					<thead class="bg-gray-100 dark:bg-gray-600">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>
								Nome
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>
								Email
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>
								Username
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>
								Tipo
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>
								Status
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>
								Cadastro
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
							>
								Ações
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white shadow dark:bg-gray-700">
						{#if isLoading}
							<tr>
								<td colspan="7" class="px-6 py-12 text-center">
									<div class="flex items-center justify-center">
										<svg
											class="h-6 w-6 animate-spin text-blue-600"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										<span class="ml-2 text-gray-500 dark:text-gray-400">Carregando...</span>
									</div>
								</td>
							</tr>
						{:else if users.length === 0}
							<tr>
								<td colspan="7" class="px-6 py-12 text-center">
									<p class="text-gray-500 dark:text-gray-400">Nenhum usuário cadastrado</p>
								</td>
							</tr>
						{:else}
							{#each users as user (user.id)}
								<tr class="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
									<td class="whitespace-nowrap px-6 py-4">
										<div class="flex items-center">
											<div
												class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white"
											>
												{user.first_name[0]}{user.last_name[0]}
											</div>
											<div class="ml-4">
												<div class="text-sm font-medium text-gray-900 dark:text-white">
													{user.first_name}
													{user.last_name}
												</div>
											</div>
										</div>
									</td>
									<td class="whitespace-nowrap px-6 py-4">
										<div class="text-sm text-gray-900 dark:text-white">{user.email}</div>
										{#if user.email_verified}
											<span
												class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/20 dark:text-green-300"
											>
												Verificado
											</span>
										{/if}
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
										{user.username}
									</td>
									<td class="whitespace-nowrap px-6 py-4">
										{#if user.role === 'admin'}
											<span
												class="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold leading-5 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
											>
												Administrador
											</span>
										{:else}
											<span
												class="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold leading-5 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
											>
												Usuário
											</span>
										{/if}
									</td>
									<td class="whitespace-nowrap px-6 py-4">
										{#if user.status === 'active'}
											<span
												class="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold leading-5 text-green-800 dark:bg-green-900/20 dark:text-green-300"
											>
												Ativo
											</span>
										{:else}
											<span
												class="inline-flex rounded-full bg-red-100 px-2 py-1 text-xs font-semibold leading-5 text-red-800 dark:bg-red-900/20 dark:text-red-300"
											>
												Inativo
											</span>
										{/if}
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
										{formatDate(user.created_at)}
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm font-medium">
										<button
											class="cursor-pointer text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
										>
											Editar
										</button>
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Total Count -->
		{#if users.length > 0}
			<div class="text-sm text-gray-500 dark:text-gray-400">
				Total: {users.length} usuário{users.length !== 1 ? 's' : ''}
			</div>
		{/if}
	</div>
</DashboardLayout>
