<script lang="ts">
	import type { Fueling } from '$lib/types/fueling';
	import {
		formatCurrency,
		formatConsumption,
		formatKm,
		formatDate,
		percentageDiff,
		getPriceIndicator
	} from '$lib/utils/formatters';

	interface Props {
		lastFueling: Fueling | null;
		currentKm: number;
		currentLiters: number;
		currentPricePerLiter: number;
		currentTotalCost: number;
		isFull: boolean;
		avgConsumption: number | null;
		avgPricePerLiter: number;
		tankCapacity?: number;
	}

	let {
		lastFueling,
		currentKm,
		currentLiters,
		currentPricePerLiter,
		currentTotalCost,
		isFull,
		avgConsumption,
		avgPricePerLiter,
		tankCapacity = 50
	}: Props = $props();

	// Calculate km since last fueling
	let kmSinceLastFueling = $derived(
		lastFueling && currentKm > 0 ? currentKm - lastFueling.km : 0
	);

	// Calculate consumption for current fueling
	let currentConsumption = $derived.by(() => {
		if (!isFull || !lastFueling || kmSinceLastFueling <= 0 || !currentLiters || currentLiters <= 0 || isNaN(currentLiters)) {
			return null;
		}
		return kmSinceLastFueling / currentLiters;
	});

	// Calculate cost per km
	let costPerKm = $derived.by(() => {
		if (kmSinceLastFueling <= 0 || !currentTotalCost || currentTotalCost <= 0 || isNaN(currentTotalCost)) return null;
		return currentTotalCost / kmSinceLastFueling;
	});

	// Compare current consumption with average
	let consumptionComparison = $derived.by(() => {
		if (!currentConsumption || !avgConsumption) return null;
		const diff = percentageDiff(avgConsumption, currentConsumption);
		return {
			diff,
			isBetter: currentConsumption > avgConsumption,
			isWorse: currentConsumption < avgConsumption,
			isSimilar: Math.abs(diff) < 5
		};
	});

	// Price comparison
	let priceComparison = $derived.by(() => {
		if (!lastFueling || !currentPricePerLiter || currentPricePerLiter <= 0 || isNaN(currentPricePerLiter)) return null;
		const diff = percentageDiff(lastFueling.price_per_liter, currentPricePerLiter);
		const indicator = getPriceIndicator(currentPricePerLiter, lastFueling.price_per_liter);
		return {
			diff,
			indicator,
			priceDiff: currentPricePerLiter - lastFueling.price_per_liter
		};
	});

	// Estimated autonomy
	let estimatedAutonomy = $derived.by(() => {
		if (!avgConsumption || tankCapacity <= 0) return null;
		return tankCapacity * avgConsumption;
	});

	// Days since last fueling
	let daysSinceLastFueling = $derived.by(() => {
		if (!lastFueling) return null;
		const today = new Date();
		const lastDate = new Date(lastFueling.date);
		const diff = today.getTime() - lastDate.getTime();
		return Math.floor(diff / (1000 * 60 * 60 * 24));
	});

	// Warnings
	let warnings = $derived.by(() => {
		const warns: string[] = [];

		// Price warning
		if (priceComparison && Math.abs(priceComparison.diff) > 20) {
			warns.push(
				priceComparison.diff > 0
					? `Preço ${Math.abs(priceComparison.diff).toFixed(1)}% mais caro`
					: `Preço ${Math.abs(priceComparison.diff).toFixed(1)}% mais barato`
			);
		}

		// Consumption warning
		if (currentConsumption && currentConsumption < 5) {
			warns.push('Consumo muito baixo - verificar?');
		}

		// Km warning
		if (kmSinceLastFueling > 1000) {
			warns.push(`${formatKm(kmSinceLastFueling)} desde último abastecimento`);
		}

		// Days warning
		if (daysSinceLastFueling && daysSinceLastFueling > 30) {
			warns.push(`${daysSinceLastFueling} dias desde último abastecimento`);
		}

		return warns;
	});
</script>

<div class="space-y-4">
	<!-- Total Cost - Destacado -->
	<div
		class="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg dark:from-blue-600 dark:to-blue-700"
	>
		<div class="text-sm font-medium opacity-90">Custo Total</div>
		<div class="mt-2 text-3xl font-bold">{formatCurrency(currentTotalCost)}</div>
	</div>

	{#if lastFueling}
		<!-- Last Fueling Info -->
		<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
			<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Último Abastecimento</h3>
			<div class="mt-3 space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-gray-400">Data</span>
					<span class="font-medium text-gray-900 dark:text-white"
						>{formatDate(lastFueling.date)}</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600 dark:text-gray-400">KM</span>
					<span class="font-medium text-gray-900 dark:text-white"
						>{formatKm(lastFueling.km)}</span
					>
				</div>
				{#if daysSinceLastFueling !== null}
					<div class="flex justify-between">
						<span class="text-gray-600 dark:text-gray-400">Há</span>
						<span class="font-medium text-gray-900 dark:text-white"
							>{daysSinceLastFueling} {daysSinceLastFueling === 1 ? 'dia' : 'dias'}</span
						>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if kmSinceLastFueling > 0}
		<!-- Km Percorridos -->
		<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
			<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">KM Percorridos</h3>
			<div class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
				{formatKm(kmSinceLastFueling)}
			</div>
		</div>
	{/if}

	{#if currentConsumption !== null}
		<!-- Consumo Atual -->
		<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
			<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Consumo Estimado</h3>
			<div class="mt-2 flex items-baseline gap-2">
				<span class="text-2xl font-bold text-gray-900 dark:text-white">
					{formatConsumption(currentConsumption)}
				</span>
				{#if consumptionComparison}
					{#if consumptionComparison.isBetter}
						<span class="flex items-center text-sm font-medium text-green-600 dark:text-green-400">
							<svg class="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
							{Math.abs(consumptionComparison.diff).toFixed(1)}%
						</span>
					{:else if consumptionComparison.isWorse}
						<span class="flex items-center text-sm font-medium text-red-600 dark:text-red-400">
							<svg class="mr-1 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
							{Math.abs(consumptionComparison.diff).toFixed(1)}%
						</span>
					{/if}
				{/if}
			</div>
			{#if avgConsumption}
				<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
					Média: {formatConsumption(avgConsumption)}
				</p>
			{/if}
		</div>
	{/if}

	{#if costPerKm !== null}
		<!-- Custo por KM -->
		<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
			<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Custo por KM</h3>
			<div class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
				{formatCurrency(costPerKm)}/km
			</div>
		</div>
	{/if}

	{#if priceComparison}
		<!-- Comparação de Preço -->
		<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
			<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Comparação de Preço</h3>
			<div class="mt-2 flex items-center gap-2">
				{#if priceComparison.indicator === 'green'}
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
					>
						<svg
							class="h-5 w-5 text-green-600 dark:text-green-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div>
						<div class="text-lg font-bold text-green-600 dark:text-green-400">
							{formatCurrency(Math.abs(priceComparison.priceDiff))} mais barato
						</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">
							{Math.abs(priceComparison.diff).toFixed(1)}% de economia
						</div>
					</div>
				{:else if priceComparison.indicator === 'red'}
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
					>
						<svg
							class="h-5 w-5 text-red-600 dark:text-red-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div>
						<div class="text-lg font-bold text-red-600 dark:text-red-400">
							{formatCurrency(priceComparison.priceDiff)} mais caro
						</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">
							+{priceComparison.diff.toFixed(1)}%
						</div>
					</div>
				{:else}
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30"
					>
						<svg
							class="h-5 w-5 text-yellow-600 dark:text-yellow-400"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3a1 1 0 002 0V7zm-1 6a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
						</svg>
					</div>
					<div>
						<div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">Preço similar</div>
						<div class="text-xs text-gray-500 dark:text-gray-400">
							Variação de {Math.abs(priceComparison.diff).toFixed(1)}%
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	{#if estimatedAutonomy !== null}
		<!-- Autonomia Estimada -->
		<div class="rounded-lg bg-white p-4 shadow dark:bg-gray-700">
			<h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Autonomia Estimada</h3>
			<div class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
				~{formatKm(Math.round(estimatedAutonomy))}
			</div>
			<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
				Com tanque de {tankCapacity}L cheio
			</p>
		</div>
	{/if}

	{#if warnings.length > 0}
		<!-- Warnings -->
		<div class="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
			<h3 class="flex items-center text-sm font-semibold text-yellow-800 dark:text-yellow-400">
				<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
						clip-rule="evenodd"
					/>
				</svg>
				Avisos
			</h3>
			<ul class="mt-2 space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
				{#each warnings as warning}
					<li class="flex items-start">
						<span class="mr-2">⚠️</span>
						<span>{warning}</span>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if !isFull}
		<!-- Tank not full warning -->
		<div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
			<h3 class="flex items-center text-sm font-semibold text-blue-800 dark:text-blue-400">
				<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
					<path
						fill-rule="evenodd"
						d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
						clip-rule="evenodd"
					/>
				</svg>
				Informação
			</h3>
			<p class="mt-2 text-sm text-blue-700 dark:text-blue-300">
				Marque "Tanque cheio" para calcular o consumo médio (km/L) com precisão.
			</p>
		</div>
	{/if}
</div>
