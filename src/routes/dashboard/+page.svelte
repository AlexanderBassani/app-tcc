<script lang="ts">
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import { authStore } from '$lib/stores/auth';
</script>

<DashboardLayout>
	<div class="space-y-6">
		<!-- Welcome Section -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
			<h2 class="text-2xl font-bold text-gray-800 dark:text-white">
				Bem-vindo, {$authStore.user?.first_name}!
			</h2>
			<p class="mt-2 text-gray-600 dark:text-gray-300">
				Este é o seu painel principal. Aqui você pode gerenciar todas as funcionalidades do
				sistema.
			</p>
		</div>

		<!-- Stats Cards -->
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
			<!-- Card 1 -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Usuários</p>
						<p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">-</p>
					</div>
					<div class="rounded-full bg-blue-100 p-3 dark:bg-blue-900/20">
						<svg
							class="h-8 w-8 text-blue-600 dark:text-blue-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							></path>
						</svg>
					</div>
				</div>
			</div>

			<!-- Card 2 -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Atividades</p>
						<p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">-</p>
					</div>
					<div class="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
						<svg
							class="h-8 w-8 text-green-600 dark:text-green-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
							></path>
						</svg>
					</div>
				</div>
			</div>

			<!-- Card 3 -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-gray-600 dark:text-gray-400">Notificações</p>
						<p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">-</p>
					</div>
					<div class="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/20">
						<svg
							class="h-8 w-8 text-yellow-600 dark:text-yellow-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
							></path>
						</svg>
					</div>
				</div>
			</div>
		</div>

		<!-- Recent Activity -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
			<h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
				Atividades Recentes
			</h3>
			<div class="space-y-4">
				<p class="text-gray-500 dark:text-gray-400">Nenhuma atividade recente</p>
			</div>
		</div>
	</div>
</DashboardLayout>
