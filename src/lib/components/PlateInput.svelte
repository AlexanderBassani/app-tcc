<script lang="ts">
	import { applyPlateMask, validatePlate, formatPlate } from '$lib/utils/vehicleValidation';

	// Props
	interface Props {
		value?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		onchange?: (value: string) => void;
		onvalidation?: (valid: boolean, message: string) => void;
		checkAvailability?: (plate: string) => Promise<{
			available: boolean | null;
			message: string;
		}>;
	}

	let {
		value = $bindable(''),
		id = 'plate',
		required = false,
		disabled = false,
		onchange,
		onvalidation,
		checkAvailability
	}: Props = $props();

	// State
	let displayValue = $state('');
	let validation = $state<{ valid: boolean; format: string | null; message: string }>({
		valid: false,
		format: null,
		message: ''
	});
	let availabilityStatus = $state<{
		checking: boolean;
		available: boolean | null;
		message: string;
	}>({
		checking: false,
		available: null,
		message: ''
	});
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let isFocused = $state(false);

	// Initialize display value
	$effect(() => {
		if (value && !isFocused) {
			displayValue = applyPlateMask(value);
		}
	});

	// Handle input change
	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const formatted = applyPlateMask(target.value);
		displayValue = formatted;

		// Update the actual value (without hyphens)
		const clean = formatPlate(target.value);
		value = clean;

		// Validate format
		const result = validatePlate(clean);
		validation = result;

		// Call validation callback
		if (onvalidation) {
			onvalidation(result.valid, result.message);
		}

		// Call change callback
		if (onchange) {
			onchange(clean);
		}

		// Check availability if valid and callback provided
		if (result.valid && checkAvailability) {
			// Debounce the API call
			if (debounceTimer) {
				clearTimeout(debounceTimer);
			}

			debounceTimer = setTimeout(async () => {
				availabilityStatus = {
					checking: true,
					available: null,
					message: ''
				};

				const status = await checkAvailability(clean);
				availabilityStatus = {
					checking: false,
					available: status.available,
					message: status.message
				};
			}, 500);
		} else {
			availabilityStatus = {
				checking: false,
				available: null,
				message: ''
			};
		}
	}

	function handleFocus() {
		isFocused = true;
	}

	function handleBlur() {
		isFocused = false;
		if (value) {
			displayValue = applyPlateMask(value);
		}
	}

	// Computed styles
	const inputClasses = $derived(() => {
		const base =
			'mt-1 block w-full rounded-md border shadow-sm focus:ring-2 focus:ring-offset-0 disabled:opacity-50 dark:bg-gray-600 dark:text-white uppercase';

		if (availabilityStatus.checking) {
			return `${base} border-gray-300 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600`;
		}

		if (availabilityStatus.available === false) {
			return `${base} border-red-500 focus:border-red-500 focus:ring-red-500`;
		}

		if (validation.valid && availabilityStatus.available === true) {
			return `${base} border-green-500 focus:border-green-500 focus:ring-green-500`;
		}

		if (displayValue && !validation.valid) {
			return `${base} border-red-500 focus:border-red-500 focus:ring-red-500`;
		}

		return `${base} border-gray-300 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-600`;
	});
</script>

<div class="relative">
	<div class="flex items-center gap-2">
		<!-- Plate icon -->
		<div class="mt-1 flex-shrink-0">
			<svg
				class="h-5 w-5 text-gray-400 dark:text-gray-500"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
				></path>
			</svg>
		</div>

		<!-- Input field -->
		<div class="relative flex-1">
			<input
				type="text"
				{id}
				{required}
				{disabled}
				value={displayValue}
				oninput={handleInput}
				onfocus={handleFocus}
				onblur={handleBlur}
				class={inputClasses()}
				placeholder="ABC-1D23 ou ABC-1234"
				maxlength="8"
				autocomplete="off"
			/>

			<!-- Status icon -->
			{#if availabilityStatus.checking}
				<div class="absolute right-3 top-1/2 -translate-y-1/2">
					<svg
						class="h-5 w-5 animate-spin text-blue-500"
						fill="none"
						viewBox="0 0 24 24"
						xmlns="http://www.w3.org/2000/svg"
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
				</div>
			{:else if validation.valid && availabilityStatus.available === true}
				<div class="absolute right-3 top-1/2 -translate-y-1/2">
					<svg
						class="h-5 w-5 text-green-500"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						></path>
					</svg>
				</div>
			{:else if availabilityStatus.available === false || (displayValue && !validation.valid)}
				<div class="absolute right-3 top-1/2 -translate-y-1/2">
					<svg
						class="h-5 w-5 text-red-500"
						fill="currentColor"
						viewBox="0 0 20 20"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						></path>
					</svg>
				</div>
			{/if}
		</div>
	</div>

	<!-- Validation messages -->
	{#if displayValue}
		{#if !validation.valid && validation.message}
			<p class="mt-1 text-sm text-red-600 dark:text-red-400">
				{validation.message}
			</p>
		{:else if validation.valid && validation.format}
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Formato {validation.format === 'mercosul' ? 'Mercosul' : 'Antigo'}
			</p>
		{/if}

		{#if availabilityStatus.message}
			<p
				class="mt-1 text-sm {availabilityStatus.available
					? 'text-green-600 dark:text-green-400'
					: 'text-red-600 dark:text-red-400'}"
			>
				{availabilityStatus.message}
			</p>
		{/if}
	{/if}
</div>
