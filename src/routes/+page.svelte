<script lang="ts">
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { authStore } from '$lib/stores/auth';

	// Mock Data - Statistics Cards
	const stats = [
		{
			title: 'Total de Veículos',
			value: '12',
			change: '+2',
			changeLabel: 'este mês',
			icon: 'car',
			color: 'blue',
			trend: 'up'
		},
		{
			title: 'Manutenções Pendentes',
			value: '5',
			change: '-3',
			changeLabel: 'vs mês anterior',
			icon: 'wrench',
			color: 'orange',
			trend: 'down'
		},
		{
			title: 'Abastecimentos (Mês)',
			value: '28',
			change: '+8',
			changeLabel: 'vs mês anterior',
			icon: 'fuel',
			color: 'green',
			trend: 'up'
		},
		{
			title: 'Custo Médio/km',
			value: 'R$ 0,85',
			change: '-5%',
			changeLabel: 'vs mês anterior',
			icon: 'chart',
			color: 'purple',
			trend: 'down'
		}
	];

	// Recent Activities
	const recentActivities = [
		{
			id: 1,
			type: 'fueling',
			vehicle: 'Honda Civic - ABC-1234',
			description: 'Abastecimento de 45L',
			date: '2025-12-15',
			amount: 'R$ 315,00'
		},
		{
			id: 2,
			type: 'maintenance',
			vehicle: 'Toyota Corolla - XYZ-5678',
			description: 'Troca de óleo',
			date: '2025-12-14',
			amount: 'R$ 280,00'
		},
		{
			id: 3,
			type: 'fueling',
			vehicle: 'Volkswagen Golf - DEF-9012',
			description: 'Abastecimento de 38L',
			date: '2025-12-13',
			amount: 'R$ 266,00'
		},
		{
			id: 4,
			type: 'maintenance',
			vehicle: 'Honda Civic - ABC-1234',
			description: 'Revisão dos 10.000km',
			date: '2025-12-12',
			amount: 'R$ 450,00'
		},
		{
			id: 5,
			type: 'fueling',
			vehicle: 'Ford Focus - GHI-3456',
			description: 'Abastecimento de 42L',
			date: '2025-12-11',
			amount: 'R$ 294,00'
		}
	];

	// Monthly Spending with breakdown
	const monthlySpending = [
		{
			month: 'Jun',
			fuel: 320,
			maintenance: 150,
			others: 80,
			total: 550
		},
		{
			month: 'Jul',
			fuel: 280,
			maintenance: 200,
			others: 60,
			total: 540
		},
		{
			month: 'Ago',
			fuel: 350,
			maintenance: 100,
			others: 90,
			total: 540
		},
		{
			month: 'Set',
			fuel: 310,
			maintenance: 250,
			others: 65,
			total: 625
		},
		{
			month: 'Out',
			fuel: 290,
			maintenance: 180,
			others: 90,
			total: 560
		},
		{
			month: 'Nov',
			fuel: 330,
			maintenance: 120,
			others: 95,
			total: 545
		}
	];

	const maxSpending = Math.max(...monthlySpending.map((m) => m.total));

	// Distribution by Category (Donut Chart)
	const categoryDistribution = [
		{ label: 'Combustível', value: 1880, color: '#3b82f6', percentage: 56 },
		{ label: 'Manutenção', value: 1000, color: '#f97316', percentage: 30 },
		{ label: 'Outros', value: 480, color: '#ec4899', percentage: 14 }
	];

	const totalDistribution = categoryDistribution.reduce((sum, cat) => sum + cat.value, 0);

	// Upcoming Maintenances
	const upcomingMaintenances = [
		{
			vehicle: 'Honda Civic - ABC-1234',
			type: 'Troca de Pneus',
			dueDate: '2025-12-20',
			daysLeft: 4
		},
		{
			vehicle: 'Toyota Corolla - XYZ-5678',
			type: 'Revisão 20.000km',
			dueDate: '2025-12-25',
			daysLeft: 9
		},
		{
			vehicle: 'Volkswagen Golf - DEF-9012',
			type: 'Alinhamento e Balanceamento',
			dueDate: '2026-01-05',
			daysLeft: 20
		}
	];
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="space-y-6">
			<!-- Welcome Section -->
			<div class="rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white shadow-lg">
				<h2 class="text-2xl font-bold">
					Olá, {$authStore.user?.first_name || 'Usuário'}!
				</h2>
				<p class="mt-2 text-blue-100">Bem-vindo ao painel de controle do AutoTrack</p>
			</div>

			<!-- Statistics Cards Grid -->
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each stats as stat}
					<div
						class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
					>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<p class="text-sm font-medium text-gray-600 dark:text-gray-400">
									{stat.title}
								</p>
								<p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
									{stat.value}
								</p>
								<div class="mt-2 flex items-center gap-1 text-sm">
									<span
										class="font-semibold {stat.trend === 'up'
											? 'text-green-600 dark:text-green-400'
											: 'text-red-600 dark:text-red-400'}"
									>
										{stat.change}
									</span>
									<span class="text-gray-500 dark:text-gray-400">{stat.changeLabel}</span>
								</div>
							</div>
							<div
								class="flex h-12 w-12 items-center justify-center rounded-lg bg-{stat.color}-100 dark:bg-{stat.color}-900/20"
							>
								{#if stat.icon === 'car'}
									<svg
										class="h-6 w-6 text-{stat.color}-600 dark:text-{stat.color}-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 001-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6 0a1 1 0 001 1h2a1 1 0 001-1m-6 0h6"
										/>
									</svg>
								{:else if stat.icon === 'wrench'}
									<svg
										class="h-6 w-6 text-{stat.color}-600 dark:text-{stat.color}-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
										/>
									</svg>
								{:else if stat.icon === 'fuel'}
									<svg
										class="h-6 w-6 text-{stat.color}-600 dark:text-{stat.color}-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M3 10h10a2 2 0 012 2v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a2 2 0 012-2zM5 10V7a2 2 0 012-2h4a2 2 0 012 2v3"
										/>
									</svg>
								{:else}
									<svg
										class="h-6 w-6 text-{stat.color}-600 dark:text-{stat.color}-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
										/>
									</svg>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Monthly Spending Chart -->
				<div
					class="rounded-xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 shadow-lg"
				>
					<h3 class="mb-6 text-lg font-semibold text-white">
						Comparativo Mensal
					</h3>

					<!-- Chart Container -->
					<div class="relative">
						<!-- Y-axis labels -->
						<div class="absolute left-0 top-0 flex h-64 flex-col justify-between text-xs text-gray-400">
							<span>R$800</span>
							<span>R$600</span>
							<span>R$400</span>
							<span>R$200</span>
							<span>R$0</span>
						</div>

						<!-- Chart -->
						<div class="ml-12 flex h-64 items-end justify-between gap-3">
							{#each monthlySpending as data}
								<div class="group relative flex flex-1 flex-col items-center gap-3">
									<!-- Stacked Bar Container -->
									<div class="relative flex w-full flex-col-reverse" style="height: {(data.total / maxSpending) * 240}px">
										<!-- Combustível (blue) - bottom -->
										<div
											class="w-full bg-blue-500 transition-all group-hover:bg-blue-600"
											style="height: {(data.fuel / data.total) * 100}%"
										></div>
										<!-- Manutenção (orange) - middle -->
										<div
											class="w-full bg-orange-500 transition-all group-hover:bg-orange-600"
											style="height: {(data.maintenance / data.total) * 100}%"
										></div>
										<!-- Outros (magenta) - top -->
										<div
											class="w-full bg-pink-500 transition-all group-hover:bg-pink-600"
											style="height: {(data.others / data.total) * 100}%; border-radius: 4px 4px 0 0;"
										></div>

										<!-- Tooltip -->
										<div
											class="absolute -top-16 left-1/2 z-10 hidden w-32 -translate-x-1/2 rounded-lg bg-gray-900 p-2 text-xs text-white shadow-xl group-hover:block"
										>
											<div class="space-y-1">
												<div class="flex justify-between">
													<span class="text-gray-400">Combustível:</span>
													<span class="font-semibold">R$ {data.fuel}</span>
												</div>
												<div class="flex justify-between">
													<span class="text-gray-400">Manutenção:</span>
													<span class="font-semibold">R$ {data.maintenance}</span>
												</div>
												<div class="flex justify-between">
													<span class="text-gray-400">Outros:</span>
													<span class="font-semibold">R$ {data.others}</span>
												</div>
												<div class="flex justify-between border-t border-gray-700 pt-1">
													<span class="text-gray-300">Total:</span>
													<span class="font-bold">R$ {data.total}</span>
												</div>
											</div>
										</div>
									</div>

									<!-- Month Label -->
									<span class="text-xs font-medium text-gray-400">{data.month}</span>
								</div>
							{/each}
						</div>
					</div>

					<!-- Legend -->
					<div class="mt-6 flex items-center justify-center gap-6 text-sm">
						<div class="flex items-center gap-2">
							<div class="h-3 w-3 rounded-sm bg-blue-500"></div>
							<span class="text-gray-300">Combustível</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="h-3 w-3 rounded-sm bg-orange-500"></div>
							<span class="text-gray-300">Manutenção</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="h-3 w-3 rounded-sm bg-pink-500"></div>
							<span class="text-gray-300">Outros</span>
						</div>
					</div>
				</div>

				<!-- Distribution by Category -->
				<div
					class="rounded-xl bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 shadow-lg"
				>
					<h3 class="mb-6 text-lg font-semibold text-white">Distribuição por Categoria</h3>

					<div class="flex flex-col items-center justify-center gap-6">
						<!-- Donut Chart SVG -->
						<div class="relative h-48 w-48 shrink-0">
							<svg viewBox="0 0 200 200" class="h-full w-full -rotate-90 transform">
								<!-- Background Circle -->
								<circle
									cx="100"
									cy="100"
									r="80"
									fill="none"
									stroke="#1e293b"
									stroke-width="40"
								/>
								<!-- Donut segments -->
								{#each categoryDistribution as category, i}
									{@const circumference = 2 * Math.PI * 80}
									{@const offset = categoryDistribution
										.slice(0, i)
										.reduce((sum, cat) => sum + cat.percentage, 0)}
									{@const strokeDasharray = `${(category.percentage / 100) * circumference} ${circumference}`}
									{@const rotation = (offset / 100) * 360}

									<circle
										cx="100"
										cy="100"
										r="80"
										fill="none"
										stroke={category.color}
										stroke-width="40"
										stroke-dasharray={strokeDasharray}
										transform="rotate({rotation} 100 100)"
										class="transition-all duration-300 hover:opacity-80"
									/>
								{/each}
							</svg>
							<!-- Center text -->
							<div class="absolute inset-0 flex items-center justify-center">
								<div class="text-center">
									<p class="text-xl font-bold text-white">R$ {totalDistribution.toLocaleString('pt-BR')}</p>
									<p class="text-xs text-gray-400">Total</p>
								</div>
							</div>
						</div>

						<!-- Legend -->
						<div class="w-full space-y-3">
							{#each categoryDistribution as category}
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<div class="h-3 w-3 rounded-sm" style="background-color: {category.color}"></div>
										<span class="text-sm font-medium text-gray-300">{category.label}</span>
									</div>
									<div class="text-right">
										<p class="text-sm font-bold text-white">R$ {category.value.toLocaleString('pt-BR')}</p>
										<p class="text-xs text-gray-400">{category.percentage}%</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<!-- Upcoming Maintenances -->
				<div
					class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					<h3 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
						Manutenções Próximas
					</h3>
					<div class="space-y-4">
						{#each upcomingMaintenances as maintenance}
							<div class="border-l-4 border-blue-500 bg-blue-50 p-3 dark:bg-blue-900/20">
								<p class="text-sm font-semibold text-gray-900 dark:text-white">
									{maintenance.vehicle}
								</p>
								<p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
									{maintenance.type}
								</p>
								<div class="mt-2 flex items-center justify-between">
									<span class="text-xs text-gray-500 dark:text-gray-400"
										>{maintenance.dueDate}</span
									>
									<span
										class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
									>
										{maintenance.daysLeft} dias
									</span>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Recent Activities -->
				<div
					class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					<h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
						Atividades Recentes
					</h3>
					<div class="space-y-4">
						{#each recentActivities.slice(0, 3) as activity}
							<div class="flex items-start gap-4 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-700">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg {activity.type ===
									'fueling'
										? 'bg-green-100 dark:bg-green-900/20'
										: 'bg-orange-100 dark:bg-orange-900/20'}"
								>
									{#if activity.type === 'fueling'}
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
												d="M3 10h10a2 2 0 012 2v7a1 1 0 01-1 1H4a1 1 0 01-1-1v-7a2 2 0 012-2z"
											/>
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
												d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"
											/>
										</svg>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-gray-900 dark:text-white">
										{activity.description}
									</p>
									<p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
										{activity.vehicle}
									</p>
									<p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
										{new Date(activity.date).toLocaleDateString('pt-BR')}
									</p>
								</div>
								<div class="text-right">
									<p class="text-sm font-semibold text-gray-900 dark:text-white">
										{activity.amount}
									</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</DashboardLayout>
</ProtectedRoute>
