<script lang="ts">
	import { onMount } from 'svelte';
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { authStore } from '$lib/stores/auth';
	import { dashboardApi } from '$lib/api/dashboard';
	import type { MonthlyExpense, RecentActivity, UpcomingReminder } from '$lib/types/dashboard';

	let loading = true;
	let error = '';
	let monthlyExpenses: MonthlyExpense[] = [];
	let recentActivities: RecentActivity[] = [];
	let upcomingReminders: UpcomingReminder[] = [];
	let periodTotal = 0;
	let periodAvg = 0;

	onMount(async () => {
		await loadDashboardData();
	});

	async function loadDashboardData() {
		try {
			loading = true;
			const token = $authStore.token;
			if (!token) throw new Error('Usuário não autenticado');

			// Load all dashboard data
			const [overviewRes] = await Promise.all([
				dashboardApi.getOverview(token, { months: 6 })
			]);

			monthlyExpenses = overviewRes.data.expenses.monthly;
			periodTotal = overviewRes.data.expenses.totals.total;
			periodAvg = overviewRes.data.expenses.totals.total / (overviewRes.data.expenses.monthly.length || 1);
			recentActivities = overviewRes.data.recent_activities;
			upcomingReminders = overviewRes.data.upcoming_maintenances;
		} catch (err: any) {
			error = err.message || 'Erro ao carregar dados do dashboard';
			console.error('Dashboard error:', err);
		} finally {
			loading = false;
		}
	}

	// Mock Data - Statistics Cards (will be replaced with real data later)
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

	// Computed values
	$: monthlySpending =
		monthlyExpenses && monthlyExpenses.length > 0
			? monthlyExpenses.map((expense) => ({
					month: expense.month,
					fuel: expense.fuel,
					maintenance: expense.maintenance,
					others: expense.others,
					total: expense.total
			  }))
			: [];

	$: maxSpending = monthlySpending.length > 0 ? Math.max(...monthlySpending.map((m) => m.total)) : 1;

	// Calculate Y-axis maximum value (rounded up for clean labels)
	$: chartMaxValue = calculateChartMaxValue(maxSpending);

	// Calculate Y-axis labels dynamically
	$: yAxisLabels = calculateYAxisLabels(chartMaxValue);

	function calculateChartMaxValue(max: number): number {
		if (max === 0) return 0;

		// Round up to nearest nice number for better readability
		let step: number;
		if (max <= 100) {
			step = Math.ceil(max / 4 / 10) * 10;
		} else if (max <= 1000) {
			step = Math.ceil(max / 4 / 50) * 50;
		} else if (max <= 10000) {
			step = Math.ceil(max / 4 / 100) * 100;
		} else {
			step = Math.ceil(max / 4 / 500) * 500;
		}

		return step * 4;
	}

	function calculateYAxisLabels(maxValue: number): string[] {
		if (maxValue === 0) return ['R$ 0,00', 'R$ 0,00', 'R$ 0,00', 'R$ 0,00', 'R$ 0,00'];

		return [
			formatCurrency(maxValue),
			formatCurrency(maxValue * 0.75),
			formatCurrency(maxValue * 0.5),
			formatCurrency(maxValue * 0.25),
			'R$ 0,00'
		];
	}

	$: categoryDistribution = calculateCategoryDistribution();

	$: totalDistribution =
		categoryDistribution && categoryDistribution.length > 0
			? categoryDistribution.reduce((sum, cat) => sum + cat.value, 0)
			: 0;

	function calculateCategoryDistribution() {
		if (!monthlyExpenses || monthlyExpenses.length === 0) return [];

		const totalFuel = monthlyExpenses.reduce((sum, m) => sum + m.fuel, 0);
		const totalMaintenance = monthlyExpenses.reduce((sum, m) => sum + m.maintenance, 0);
		const totalOther = monthlyExpenses.reduce((sum, m) => sum + m.others, 0);
		const total = totalFuel + totalMaintenance + totalOther;

		if (total === 0) return [];

		return [
			{
				label: 'Combustível',
				value: totalFuel,
				color: '#3b82f6',
				percentage: Math.round((totalFuel / total) * 100)
			},
			{
				label: 'Manutenção',
				value: totalMaintenance,
				color: '#f97316',
				percentage: Math.round((totalMaintenance / total) * 100)
			},
			{
				label: 'Outros',
				value: totalOther,
				color: '#ec4899',
				percentage: Math.round((totalOther / total) * 100)
			}
		];
	}

	function formatCurrency(value: number): string {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL'
		}).format(value);
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
			<div
				class="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
			>
				{error}
			</div>
		{:else}
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
					{#if !monthlySpending || monthlySpending.length === 0}
						<div class="flex h-64 items-center justify-center">
							<p class="text-sm text-gray-400">Nenhum dado disponível</p>
						</div>
					{:else}
						<div class="relative">
							<!-- Y-axis labels -->
							<div
								class="absolute left-0 top-0 z-10 flex h-64 flex-col justify-between text-xs text-gray-400"
							>
								{#each yAxisLabels as label}
									<span class="bg-[#1e293b] px-1">{label}</span>
								{/each}
							</div>

							<!-- Chart -->
							<div class="ml-16 flex h-64 items-end justify-between gap-3">
								{#each monthlySpending as data}
									{@const barHeight = chartMaxValue > 0 ? (data.total / chartMaxValue) * 240 : 0}
									{@const fuelPercent = data.total > 0 ? (data.fuel / data.total) * 100 : 0}
									{@const maintenancePercent = data.total > 0 ? (data.maintenance / data.total) * 100 : 0}
									{@const othersPercent = data.total > 0 ? (data.others / data.total) * 100 : 0}

									<div class="group relative flex flex-1 flex-col items-center gap-3">
										<!-- Stacked Bar Container -->
										<div class="relative flex w-full flex-col-reverse" style="height: {barHeight}px">
											<!-- Combustível (blue) - bottom -->
											<div
												class="w-full bg-blue-500 transition-all group-hover:bg-blue-600"
												style="height: {fuelPercent}%"
											></div>
											<!-- Manutenção (orange) - middle -->
											<div
												class="w-full bg-orange-500 transition-all group-hover:bg-orange-600"
												style="height: {maintenancePercent}%"
											></div>
											<!-- Outros (magenta) - top -->
											<div
												class="w-full bg-pink-500 transition-all group-hover:bg-pink-600"
												style="height: {othersPercent}%; border-radius: 4px 4px 0 0;"
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
					{/if}

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

					{#if !categoryDistribution || categoryDistribution.length === 0}
						<div class="flex h-64 items-center justify-center">
							<p class="text-sm text-gray-400">Nenhum dado disponível</p>
						</div>
					{:else}
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
					{/if}
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
					{#if !upcomingReminders || upcomingReminders.length === 0}
						<p class="text-sm text-gray-500 dark:text-gray-400">
							Nenhuma manutenção próxima agendada
						</p>
					{:else}
						<div class="space-y-4">
							{#each upcomingReminders.slice(0, 3) as reminder}
								{@const isUrgent = reminder.days_until !== null && reminder.days_until <= 7}
								<div
									class="border-l-4 p-3 {isUrgent
										? 'border-red-500 bg-red-50 dark:bg-red-900/20'
										: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'}"
								>
									<p class="text-sm font-semibold text-gray-900 dark:text-white">
										{reminder.vehicle}
									</p>
									<p class="mt-1 text-xs text-gray-600 dark:text-gray-400">
										{reminder.title}
									</p>
									<div class="mt-2 flex items-center justify-between">
										{#if reminder.date}
											<span class="text-xs text-gray-500 dark:text-gray-400">
												{new Date(reminder.date).toLocaleDateString('pt-BR')}
											</span>
										{/if}
										{#if reminder.days_until !== null}
											<span
												class="rounded-full px-2 py-1 text-xs font-medium {isUrgent
													? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
													: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}"
											>
												{reminder.days_until} dias
											</span>
										{:else if reminder.km_until !== null}
											<span
												class="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
											>
												{reminder.km_until} km
											</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Recent Activities -->
				<div
					class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					<h3 class="mb-6 text-lg font-semibold text-gray-900 dark:text-white">
						Atividades Recentes
					</h3>
					{#if !recentActivities || recentActivities.length === 0}
						<p class="text-sm text-gray-500 dark:text-gray-400">Nenhuma atividade recente</p>
					{:else}
						<div class="space-y-4">
							{#each recentActivities.slice(0, 3) as activity}
								<div
									class="flex items-start gap-4 border-b border-gray-100 pb-4 last:border-0 dark:border-gray-700"
								>
									<div
										class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg {activity.type ===
										'fuel'
											? 'bg-green-100 dark:bg-green-900/20'
											: 'bg-orange-100 dark:bg-orange-900/20'}"
									>
										{#if activity.type === 'fuel'}
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
									<div class="min-w-0 flex-1">
										<p class="text-sm font-medium text-gray-900 dark:text-white">
											{activity.description || 'Sem descrição'}
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
											{formatCurrency(activity.cost)}
										</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>
		{/if}
	</DashboardLayout>
</ProtectedRoute>
