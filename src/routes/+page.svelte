<script lang="ts">
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
	import { authStore } from '$lib/stores/auth';

	// Mock Data
	const kpis = {
		totalSpent: {
			value: 'R$ 3.360',
			label: 'Total Gasto',
			trend: '+12%',
			trendLabel: 'vs mês anterior',
			trendPositive: false // Spending increased (bad) usually, but context matters. In finance dashboards, red usually means expense went up.
		},
		avgPerKm: {
			value: 'R$ 0,85',
			label: 'Média/km',
			trend: '-5%',
			trendLabel: 'vs mês anterior',
			trendPositive: true // Cost went down (good)
		}
	};

	const distribution = {
		total: 3360,
		segments: [
			{ label: 'Combustível', value: 1880, color: '#3b82f6', percentage: 56 }, // blue-500
			{ label: 'Manutenção', value: 1000, color: '#f97316', percentage: 30 }, // orange-500
			{ label: 'Outros', value: 480, color: '#a855f7', percentage: 14 } // purple-500
		]
	};

	// SVG Donut Chart Logic
	// Calculate offsets for SVG stroke-dasharray
	const radius = 80;
	const circumference = 2 * Math.PI * radius;

	let currentAngle = 0;
	const donutSegments = distribution.segments.map((segment) => {
		const strokeDasharray = `${(segment.percentage / 100) * circumference} ${circumference}`;
		const rotation = currentAngle;
		currentAngle += (segment.percentage / 100) * 360;
		return { ...segment, strokeDasharray, rotation };
	});

	const monthlyData = [
		{ month: 'Jun', values: [320, 150, 80], total: 550 },
		{ month: 'Jul', values: [280, 200, 60], total: 540 },
		{ month: 'Ago', values: [350, 100, 90], total: 540 },
		{ month: 'Set', values: [310, 250, 65], total: 625 },
		{ month: 'Out', values: [290, 180, 90], total: 560 },
		{ month: 'Nov', values: [330, 120, 95], total: 545 }
	];

	// Colors matching the distribution segments
	const barColors = ['bg-blue-500', 'bg-orange-500', 'bg-purple-500'];
</script>

<ProtectedRoute>
	<DashboardLayout>
		<div class="space-y-6">
			<!-- Welcome Section -->
			<!-- <div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<h2 class="text-2xl font-bold text-gray-800 dark:text-white">
					Bem-vindo, {$authStore.user?.first_name}!
				</h2>
			</div> -->

			<!-- Top Stats Cards -->
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<!-- Total Gasto -->
				<div
					class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="flex items-start justify-between">
						<div>
							<div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-blue-500"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
								</svg>
								<span class="text-sm font-medium">{kpis.totalSpent.label}</span>
							</div>
							<div class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
								{kpis.totalSpent.value}
							</div>
							<div
								class="mt-2 flex items-center gap-1 text-sm font-medium text-red-500 dark:text-red-400"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
									<polyline points="17 6 23 6 23 12"></polyline>
								</svg>
								<span>{kpis.totalSpent.trend}</span>
								<span class="font-normal text-gray-400">{kpis.totalSpent.trendLabel}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Media/km -->
				<div
					class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
				>
					<div class="flex items-start justify-between">
						<div>
							<div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5 text-green-500"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path
										d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
									/>
								</svg>
								<!-- Using heart as placeholder, maybe fuel pump or speedometer better? -->
								<!-- Icon: Gas Pump/Speedometer generic representation for 'Media/km' -->
								<span class="text-sm font-medium">{kpis.avgPerKm.label}</span>
							</div>
							<div class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
								{kpis.avgPerKm.value}
							</div>
							<div
								class="mt-2 flex items-center gap-1 text-sm font-medium text-green-500 dark:text-green-400"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
									<polyline points="17 18 23 18 23 12"></polyline>
								</svg>
								<span>{kpis.avgPerKm.trend}</span>
								<span class="font-normal text-gray-400">{kpis.avgPerKm.trendLabel}</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Distribuição por Categoria -->
			<div
				class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
			>
				<h3 class="mb-6 font-medium text-gray-700 dark:text-gray-200">
					Distribuição por Categoria
				</h3>

				<div class="flex flex-col items-center justify-center gap-8 md:flex-row md:justify-around">
					<!-- SVG Donut Chart -->
					<div class="relative h-48 w-48 shrink-0">
						<svg viewBox="0 0 200 200" class="h-full w-full -rotate-90 transform">
							<!-- Background Circle -->
							<circle
								cx="100"
								cy="100"
								r={radius}
								fill="none"
								stroke="currentColor"
								stroke-width="25"
								class="text-gray-100 dark:text-gray-700"
							/>
							<!-- Segments -->
							{#each donutSegments as segment}
								<circle
									cx="100"
									cy="100"
									r={radius}
									fill="none"
									stroke={segment.color}
									stroke-width="25"
									stroke-dasharray={segment.strokeDasharray}
									transform="rotate({segment.rotation} 100 100)"
									class="transition-all duration-500 hover:opacity-90"
								/>
							{/each}
						</svg>
						<!-- Center Label (Optional, maybe Total?) -->
					</div>

					<!-- Legend -->
					<div class="w-full max-w-xs space-y-4">
						{#each distribution.segments as segment}
							<div class="group flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="h-3 w-3 rounded-full" style="background-color: {segment.color}"></div>
									<span class="font-medium text-gray-600 dark:text-gray-300">{segment.label}</span>
								</div>
								<div class="text-right">
									<p class="text-sm font-bold text-gray-900 dark:text-gray-100">
										R$ {segment.value}
									</p>
									<p class="text-xs text-gray-500">{segment.percentage}%</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Comparativo Mensal -->
			<div
				class="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800"
			>
				<h3 class="mb-6 text-lg font-bold text-gray-900 dark:text-white">Comparativo Mensal</h3>

				<div class="relative flex h-64 items-end justify-between gap-2 pt-4 sm:gap-4">
					<!-- Grid Lines Background -->
					<div
						class="pointer-events-none absolute inset-0 flex flex-col justify-between pb-6 text-xs text-gray-400"
					>
						<div class="h-0 w-full border-b border-gray-100 dark:border-gray-700"></div>
						<div class="h-0 w-full border-b border-gray-100 dark:border-gray-700"></div>
						<div class="h-0 w-full border-b border-gray-100 dark:border-gray-700"></div>
						<div class="h-0 w-full border-b border-gray-100 dark:border-gray-700"></div>
						<div class="h-0 w-full border-b border-gray-200 dark:border-gray-600"></div>
					</div>

					<!-- Y-Axis Labels -->
					<div
						class="z-10 hidden h-full flex-col justify-between bg-white/50 pr-2 pb-6 text-xs text-gray-400 backdrop-blur-[1px] sm:flex dark:bg-gray-800/50"
					>
						<span>R$800</span>
						<span>R$600</span>
						<span>R$400</span>
						<span>R$200</span>
						<span>R$0</span>
					</div>

					{#each monthlyData as data}
						<div class="group relative z-10 flex h-full w-full flex-col justify-end gap-2">
							<!-- Stacked Bar -->
							<div
								class="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-t-sm"
							>
								<!-- Bars are percentage of max (approx 800 for scaling) -->
								<!-- Purple (Top) -->
								<div
									class="{barColors[2]} mb-[1px] w-full"
									style="height: {(data.values[2] / 800) * 100}%"
								></div>
								<!-- Orange (Middle) -->
								<div
									class="{barColors[1]} mb-[1px] w-full"
									style="height: {(data.values[1] / 800) * 100}%"
								></div>
								<!-- Blue (Bottom) -->
								<div
									class="{barColors[0]} w-full"
									style="height: {(data.values[0] / 800) * 100}%"
								></div>
							</div>
							<!-- X-Axis Label -->
							<span class="text-center text-xs font-medium text-gray-500 dark:text-gray-400"
								>{data.month}</span
							>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</DashboardLayout>
</ProtectedRoute>
