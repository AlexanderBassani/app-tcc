<script lang="ts">
	import { formatKm } from '$lib/utils/formatters';
	import { validateCurrentKm } from '$lib/utils/vehicleValidation';

	// Props
	interface Props {
		value?: number;
		year?: number;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		onchange?: (value: number) => void;
	}

	let {
		value = $bindable(0),
		year = new Date().getFullYear(),
		id = 'current_km',
		required = false,
		disabled = false,
		onchange
	}: Props = $props();

	// State
	let displayValue = $state('0');
	let validation = $state<{ valid: boolean; message: string; warning?: string }>({
		valid: true,
		message: ''
	});
	let isFocused = $state(false);

	// Initialize display value
	$effect(() => {
		if (!isFocused) {
			displayValue = value.toLocaleString('pt-BR');
		}
	});

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		// Remove all non-digit characters
		const numbers = target.value.replace(/\D/g, '');
		const numValue = parseInt(numbers) || 0;

		value = numValue;
		displayValue = numValue.toLocaleString('pt-BR');

		// Validate
		const result = validateCurrentKm(numValue, year);
		validation = result;

		if (onchange) {
			onchange(numValue);
		}
	}

	function handleFocus() {
		isFocused = true;
		// Show raw number when focused
		displayValue = value.toString();
	}

	function handleBlur() {
		isFocused = false;
		// Format with thousand separator when blurred
		displayValue = value.toLocaleString('pt-BR');
	}

	// Revalidate when year changes
	$effect(() => {
		if (year && value > 0) {
			const result = validateCurrentKm(value, year);
			validation = result;
		}
	});
</script>

<div>
	<div class="relative">
		<input
			type="text"
			inputmode="numeric"
			{id}
			{required}
			{disabled}
			value={displayValue}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			placeholder="0"
			class="mt-1 block w-full rounded-md border-gray-300 pr-12 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
		/>
		<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
			<span class="text-gray-500 dark:text-gray-400">km</span>
		</div>
	</div>

	<!-- Display formatted km when not focused -->
	{#if !isFocused && value > 0}
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
			{formatKm(value)}
		</p>
	{/if}

	<!-- Warning message -->
	{#if validation.warning}
		<p class="mt-1 text-sm text-yellow-600 dark:text-yellow-400">
			{validation.warning}
		</p>
	{/if}

	<!-- Validation error -->
	{#if !validation.valid && validation.message}
		<p class="mt-1 text-sm text-red-600 dark:text-red-400">
			{validation.message}
		</p>
	{/if}
</div>
