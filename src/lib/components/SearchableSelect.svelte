<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	export let options: string[] = [];
	export let value: string = '';
	export let placeholder: string = 'Selecione...';
	export let id: string = '';
	export let required: boolean = false;

	const dispatch = createEventDispatcher();

	let isOpen = false;
	let searchTerm = '';
	let filteredOptions: string[] = options;
	let highlightedIndex = -1;
	let inputElement: HTMLInputElement;

	$: {
		if (searchTerm === '') {
			filteredOptions = options;
		} else {
			filteredOptions = options.filter((option) =>
				option.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}
		highlightedIndex = -1;
	}

	function selectOption(option: string) {
		value = option;
		searchTerm = option;
		isOpen = false;
		dispatch('change', value);
	}

	function handleInputFocus() {
		isOpen = true;
		// Only clear searchTerm if there's a selected value
		if (value) {
			searchTerm = '';
		}
	}

	function handleInputBlur() {
		// Delay to allow click on option
		setTimeout(() => {
			isOpen = false;
			if (!value) {
				searchTerm = '';
			} else {
				searchTerm = value;
			}
		}, 200);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (!isOpen) {
			if (e.key === 'ArrowDown' || e.key === 'Enter') {
				e.preventDefault();
				isOpen = true;
			}
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				highlightedIndex = Math.min(highlightedIndex + 1, filteredOptions.length - 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				highlightedIndex = Math.max(highlightedIndex - 1, -1);
				break;
			case 'Enter':
				e.preventDefault();
				if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
					selectOption(filteredOptions[highlightedIndex]);
				}
				break;
			case 'Escape':
				e.preventDefault();
				isOpen = false;
				searchTerm = value;
				break;
		}
	}

	// Initialize searchTerm with value only when not focused
	$: if (value && !searchTerm && !isOpen) {
		searchTerm = value;
	}
</script>

<div class="relative">
	<input
		type="text"
		{id}
		bind:this={inputElement}
		bind:value={searchTerm}
		on:focus={handleInputFocus}
		on:blur={handleInputBlur}
		on:keydown={handleKeyDown}
		{placeholder}
		{required}
		autocomplete="off"
		class="focus:border-primary-500 focus:ring-primary-500 mt-1 block w-full rounded-md border-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-600 dark:text-white"
	/>

	{#if isOpen && filteredOptions.length > 0}
		<div
			class="ring-opacity-5 absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black dark:bg-gray-700"
		>
			{#each filteredOptions as option, index}
				<button
					type="button"
					class="w-full cursor-pointer px-4 py-2 text-left text-sm transition-colors {index ===
					highlightedIndex
						? 'bg-primary-600 text-white'
						: 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-600'}"
					on:mousedown={() => selectOption(option)}
					on:mouseenter={() => (highlightedIndex = index)}
				>
					{option}
				</button>
			{/each}
		</div>
	{/if}

	{#if isOpen && filteredOptions.length === 0 && searchTerm}
		<div
			class="ring-opacity-5 absolute z-10 mt-1 w-full rounded-md bg-white px-4 py-2 text-sm text-gray-500 shadow-lg ring-1 ring-black dark:bg-gray-700 dark:text-gray-400"
		>
			Nenhuma opção encontrada
		</div>
	{/if}

	<!-- Hidden input to store the actual value for form submission -->
	<input type="hidden" name={id} bind:value />
</div>
