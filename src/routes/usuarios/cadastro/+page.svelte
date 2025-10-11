<script lang="ts">
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';

	let formData = $state({
		name: '',
		email: '',
		login: '',
		password: '',
		confirmPassword: '',
		isAdmin: false
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		// TODO: Implementar lógica de cadastro
		console.log('Form data:', formData);
	}
</script>

<DashboardLayout>
	<div class="space-y-6">
		<!-- Header -->
		<div>
			<h2 class="text-2xl font-bold text-gray-800 dark:text-white">Cadastro de Usuário</h2>
			<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
				Preencha os dados para criar um novo usuário
			</p>
		</div>

		<!-- Form -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
			<form onsubmit={handleSubmit} class="space-y-6">
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Nome -->
					<div>
						<label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Nome Completo
						</label>
						<input
							type="text"
							id="name"
							bind:value={formData.name}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							required
						/>
					</div>

					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Email
						</label>
						<input
							type="email"
							id="email"
							bind:value={formData.email}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							required
						/>
					</div>

					<!-- Login -->
					<div>
						<label for="login" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Login
						</label>
						<input
							type="text"
							id="login"
							bind:value={formData.login}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							required
						/>
					</div>

					<!-- Password -->
					<div>
						<label
							for="password"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Senha
						</label>
						<input
							type="password"
							id="password"
							bind:value={formData.password}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							required
						/>
					</div>

					<!-- Confirm Password -->
					<div>
						<label
							for="confirmPassword"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Confirmar Senha
						</label>
						<input
							type="password"
							id="confirmPassword"
							bind:value={formData.confirmPassword}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
							required
						/>
					</div>

					<!-- Admin Checkbox -->
					<div class="flex items-center">
						<input
							type="checkbox"
							id="isAdmin"
							bind:checked={formData.isAdmin}
							class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
						/>
						<label for="isAdmin" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
							Usuário Administrador
						</label>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex justify-end gap-3 border-t pt-6 dark:border-gray-700">
					<a
						href="/dashboard/usuarios"
						class="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Cancelar
					</a>
					<button
						type="submit"
						class="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
					>
						Cadastrar Usuário
					</button>
				</div>
			</form>
		</div>
	</div>
</DashboardLayout>
