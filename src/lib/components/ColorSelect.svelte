<script lang="ts">
	import { VEHICLE_COLORS } from '$lib/data/vehicleConstants';
	import { validateColor } from '$lib/utils/vehicleValidation';

	// Props
	interface Props {
		value?: string;
		id?: string;
		required?: boolean;
		disabled?: boolean;
		onchange?: (value: string) => void;
	}

	let {
		value = $bindable(''),
		id = 'color',
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

	// Filter colors based on search term
	const filteredColors = $derived(() => {
		if (searchTerm === '') {
			return VEHICLE_COLORS;
		}
		return VEHICLE_COLORS.filter((color) =>
			color.name.toLowerCase().includes(searchTerm.toLowerCase())
		);
	});

	// Selected color object
	const selectedColor = $derived.by(() => {
		return VEHICLE_COLORS.find((c) => c.name === value);
	});

	function selectColor(colorName: string) {
		value = colorName;
		searchTerm = colorName;
		isOpen = false;
		highlightedIndex = -1;

		// Validate
		const result = validateColor(colorName);
		validation = result;

		if (onchange) {
			onchange(colorName);
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

		// Validate custom color
		const result = validateColor(target.value);
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

		switch (event.key) {
			case 'ArrowDown':
				event.preventDefault();
				highlightedIndex = Math.min(highlightedIndex + 1, filteredColors().length - 1);
				break;
			case 'ArrowUp':
				event.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, -1);
				break;
			case 'Enter':
				event.preventDefault();
				if (highlightedIndex >= 0 && highlightedIndex < filteredColors().length) {
					selectColor(filteredColors()[highlightedIndex].name);
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
</script>

<div class="relative">
	<div class="flex items-center gap-2">
		<!-- Color preview circle -->
		{#if selectedColor}
			<div
				class="mt-1 h-8 w-8 flex-shrink-0 rounded-full border-2 shadow-sm"
				style="background-color: {selectedColor.hex}; border-color: {selectedColor.borderColor}"
				aria-label="Cor selecionada: {selectedColor.name}"
			></div>
		{:else}
			<div
				class="mt-1 h-8 w-8 flex-shrink-0 rounded-full border-2 border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
			></div>
		{/if}

		<!-- Input field -->
		<div class="relative flex-1">
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
				placeholder="Ex: Branco, Prata, Azul..."
				autocomplete="off"
				class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
			/>
		</div>
	</div>

	<!-- Dropdown list -->
	{#if isOpen && filteredColors().length > 0}
		<div
			class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700"
		>
			{#each filteredColors() as color, index}
				<button
					type="button"
					class="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm transition-colors {index ===
					highlightedIndex
						? 'bg-primary-600 text-white'
						: 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-600'}"
					onmousedown={() => selectColor(color.name)}
					onmouseenter={() => (highlightedIndex = index)}
				>
					<!-- Color circle -->
					<div
						class="h-6 w-6 flex-shrink-0 rounded-full border-2 shadow-sm"
						style="background-color: {color.hex}; border-color: {color.borderColor}"
					></div>
					<!-- Color name -->
					<span>{color.name}</span>
				</button>
			{/each}
		</div>
	{/if}

	<!-- No results message -->
	{#if isOpen && filteredColors().length === 0 && searchTerm}
		<div
			class="absolute z-10 mt-1 w-full rounded-md bg-white px-4 py-2 text-sm text-gray-500 shadow-lg ring-1 ring-black ring-opacity-5 dark:bg-gray-700 dark:text-gray-400"
		>
			Cor personalizada: "{searchTerm}"
		</div>
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
