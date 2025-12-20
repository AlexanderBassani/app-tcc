<script lang="ts">
	import { POPULAR_MODELS } from '$lib/data/vehicleConstants';
	import { validateModel } from '$lib/utils/vehicleValidation';

	// Props
	interface Props {
		value?: string;
		brand?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		onchange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		brand = '',
		id = 'model',
		required = false,
		disabled = false,
		onchange
	}: Props = $props();

	// State
	let isOpen = $state(false);
	let searchTerm = $state('');
	let highlightedIndex = $state(-1);
	let inputElement: HTMLInputElement | undefined = $state();
	let validation = $state<{ valid: boolean; message: string }>({ valid: true, message: '' });

	// Get models for selected brand
	const brandModels = $derived(() => {
		if (!brand) return [];
		return POPULAR_MODELS[brand] || [];
	});

	// Filter models based on search term
	const filteredModels = $derived(() => {
		const models = brandModels();
		if (searchTerm === '') {
			return models;
		}
		return models.filter((model) => model.toLowerCase().includes(searchTerm.toLowerCase()));
	});

	function selectModel(modelName: string) {
		value = modelName;
		searchTerm = modelName;
		isOpen = false;
		highlightedIndex = -1;

		// Validate
		const result = validateModel(modelName);
		validation = result;

		if (onchange) {
			onchange(modelName);
		}
	}

	function handleInputFocus() {
		isOpen = true;
		if (value) {
			searchTerm = '';
		}
	}

	function handleInputBlur() {
		setTimeout(() => {
			isOpen = false;
			if (!value) {
				searchTerm = '';
			} else {
				searchTerm = value;
			}
		}, 200);
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		searchTerm = target.value;
		value = target.value;
		highlightedIndex = -1;

		// Validate
		const result = validateModel(target.value);
		validation = result;

		if (onchange) {
			onchange(target.value);
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (!isOpen) {
			if (event.key === 'ArrowDown' || event.key === 'Enter') {
				event.preventDefault();
				isOpen = true;
			}
			return;
		}

		const models = filteredModels();

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				highlightedIndex = Math.min(highlightedIndex + 1, models.length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, -1);
				break;
			case 'Enter':
				event.preventDefault();
				if (highlightedIndex >= 0 && highlightedIndex < models.length) {
					selectModel(models[highlightedIndex]);
				}
				break;
			case 'Escape':
				event.preventDefault();
				isOpen = false;
				searchTerm = value;
				break;
		}
	}

	// Initialize search term with value
	$effect(() => {
		if (value && !searchTerm && !isOpen) {
			searchTerm = value;
		}
	});

	// Reset value if brand changes
	$effect(() => {
		if (brand) {
			// If current value is not in the new brand's models, clear it
			const models = POPULAR_MODELS[brand] || [];
			if (value && !models.includes(value)) {
				// Don't clear custom models
				// value = '';
				// searchTerm = '';
			}
		}
	});
</script>

<div class="relative">
	<input
		type="text"
		{id}
		{required}
		{disabled}
		bind:this={inputElement}
		value={searchTerm}
		oninput={handleInput}
		onfocus={handleInputFocus}
		onblur={handleInputBlur}
		onkeydown={handleKeyDown}
		placeholder={brand ? 'Ex: Corolla, Civic, Gol...' : 'Selecione uma marca primeiro'}
		autocomplete="off"
		class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
	/>

	<!-- Dropdown list -->
	{#if isOpen && filteredModels().length > 0}
		<div
			class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700"
		>
			{#each filteredModels() as model, index}
				<button
					type="button"
					class="w-full cursor-pointer px-4 py-2 text-left text-sm transition-colors {index ===
					highlightedIndex
						? 'bg-primary-600 text-white'
						: 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-600'}"
					onmousedown={() => selectModel(model)}
					onmouseenter={() => (highlightedIndex = index)}
				>
					{model}
				</button>
			{/each}
		</div>
	{/if}

	<!-- No results / Custom model message -->
	{#if isOpen && filteredModels().length === 0 && searchTerm && brand}
		<div
			class="absolute z-10 mt-1 w-full rounded-md bg-white px-4 py-2 text-sm text-gray-500 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700 dark:text-gray-400"
		>
			Modelo personalizado: "{searchTerm}"
		</div>
	{/if}

	<!-- Helper text -->
	{#if !brand && !searchTerm}
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
			Selecione uma marca para ver sugestões de modelos
		</p>
	{:else if brand && brandModels().length > 0 && !searchTerm && !isOpen}
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
			{brandModels().length} modelos disponíveis para {brand}
		</p>
	{/if}

	<!-- Validation message -->
	{#if !validation.valid && validation.message}
		<p class="mt-1 text-sm text-red-600 dark:text-red-400">
			{validation.message}
		</p>
	{/if}

	<!-- Hidden input for form submission -->
	<input type="hidden" name={id} {value} />
</div>
