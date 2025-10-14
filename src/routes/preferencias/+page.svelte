<script lang="ts">
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';
	import { preferencesApi } from '$lib/api/preferences';

	// Theme preferences
	let themeMode = $state('system');
	let themeColor = $state('blue');

	// Interface preferences
	let fontSize = $state('medium');
	let compactMode = $state(false);
	let animationsEnabled = $state(true);

	// Accessibility preferences
	let highContrast = $state(false);
	let reduceMotion = $state(false);

	let isLoading = $state(false);
	let isSaving = $state(false);
	let saveMessage = $state('');
	let errorMessage = $state('');

	const themeModes = [
		{ value: 'light', label: 'Claro' },
		{ value: 'dark', label: 'Escuro' },
		{ value: 'system', label: 'Sistema' }
	];

	const themeColors = [
		{ value: 'blue', label: 'Azul', class: 'bg-blue-500' },
		{ value: 'purple', label: 'Roxo', class: 'bg-purple-500' },
		{ value: 'green', label: 'Verde', class: 'bg-green-500' },
		{ value: 'red', label: 'Vermelho', class: 'bg-red-500' },
		{ value: 'orange', label: 'Laranja', class: 'bg-orange-500' }
	];

	const fontSizes = [
		{ value: 'small', label: 'Pequeno' },
		{ value: 'medium', label: 'Médio' },
		{ value: 'large', label: 'Grande' },
		{ value: 'extra-large', label: 'Extra Grande' }
	];

	onMount(() => {
		loadPreferences();
	});

	async function loadPreferences() {
		isLoading = true;
		errorMessage = '';

		try {
			if (!$authStore.token) {
				throw new Error('Token não encontrado');
			}

			const response = await preferencesApi.get($authStore.token);
			const prefs = response.data;

			// Set preferences from API
			themeMode = prefs.theme_mode || 'system';
			themeColor = prefs.theme_color || 'blue';
			fontSize = prefs.font_size || 'medium';
			compactMode = prefs.compact_mode ?? false;
			animationsEnabled = prefs.animations_enabled ?? true;
			highContrast = prefs.high_contrast ?? false;
			reduceMotion = prefs.reduce_motion ?? false;

			// Apply settings immediately
			applyTheme();
			applyThemeColor();
			applyFontSize();
		} catch (error) {
			console.error('Erro ao carregar preferências:', error);

			// Fallback to localStorage
			const stored = localStorage.getItem('theme');
			if (stored) {
				themeMode = stored === 'dark' ? 'dark' : stored === 'light' ? 'light' : 'system';
			}

			const storedColor = localStorage.getItem('themeColor');
			if (storedColor) {
				themeColor = storedColor;
			}

			const storedFontSize = localStorage.getItem('fontSize');
			if (storedFontSize) {
				fontSize = storedFontSize;
			}

			// Apply settings
			applyTheme();
			applyThemeColor();
			applyFontSize();
		} finally {
			isLoading = false;
		}
	}

	async function handleSave() {
		isSaving = true;
		saveMessage = '';
		errorMessage = '';

		try {
			if (!$authStore.token) {
				throw new Error('Token não encontrado');
			}

			// Save to API
			await preferencesApi.update(
				{
					theme_mode: themeMode,
					theme_color: themeColor,
					font_size: fontSize,
					compact_mode: compactMode,
					animations_enabled: animationsEnabled,
					high_contrast: highContrast,
					reduce_motion: reduceMotion
				},
				$authStore.token
			);

			// Apply settings
			applyTheme();
			applyThemeColor();
			applyFontSize();

			// Save to localStorage as backup
			localStorage.setItem('theme', themeMode === 'system' ? '' : themeMode);
			localStorage.setItem('themeColor', themeColor);
			localStorage.setItem('fontSize', fontSize);

			saveMessage = 'Preferências salvas com sucesso!';
			setTimeout(() => {
				saveMessage = '';
			}, 3000);
		} catch (error) {
			console.error('Erro ao salvar preferências:', error);
			errorMessage =
				error instanceof Error ? error.message : 'Erro ao salvar preferências. Tente novamente.';
		} finally {
			isSaving = false;
		}
	}

	function applyTheme() {
		if (themeMode === 'system') {
			localStorage.removeItem('theme');
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			document.documentElement.classList.toggle('dark', prefersDark);
		} else {
			localStorage.setItem('theme', themeMode);
			document.documentElement.classList.toggle('dark', themeMode === 'dark');
		}
	}

	function applyThemeColor() {
		if (themeColor === 'blue') {
			document.documentElement.removeAttribute('data-theme');
		} else {
			document.documentElement.setAttribute('data-theme', themeColor);
		}
	}

	function applyFontSize() {
		document.documentElement.setAttribute('data-font-size', fontSize);
	}

	// Apply theme when it changes
	$effect(() => {
		if (themeMode) {
			applyTheme();
		}
	});

	// Apply theme color when it changes
	$effect(() => {
		if (themeColor) {
			applyThemeColor();
		}
	});

	// Apply font size when it changes
	$effect(() => {
		if (fontSize) {
			applyFontSize();
		}
	});
</script>

<DashboardLayout>
	<div class="space-y-6">
		<!-- Header -->
		<div>
			<h1 class="text-3xl font-bold text-gray-900 dark:text-white">Preferências</h1>
			<p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
				Personalize a aparência e o comportamento do sistema
			</p>
		</div>

	<!-- Loading State -->
	{#if isLoading}
		<div class="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300" role="alert">
			<div class="flex items-center">
				<svg class="mr-2 h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
					<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
				</svg>
				Carregando preferências...
			</div>
		</div>
	{/if}

	<!-- Success Message -->
	{#if saveMessage}
		<div
			class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
			role="alert"
		>
			<div class="flex items-center">
				<svg class="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
				</svg>
				{saveMessage}
			</div>
		</div>
	{/if}

	<!-- Error Message -->
	{#if errorMessage}
		<div
			class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
			role="alert"
		>
			<div class="flex items-center">
				<svg class="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
					<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
				</svg>
				{errorMessage}
			</div>
		</div>
	{/if}

	<div class="space-y-6">
		<!-- Tema e Aparência -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Tema e Aparência</h2>

			<!-- Theme Mode -->
			<div class="mb-6">
				<label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Modo do Tema
				</label>
				<div class="grid grid-cols-3 gap-3">
					{#each themeModes as mode}
						<button
							type="button"
							onclick={() => (themeMode = mode.value)}
							class="rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all {themeMode ===
							mode.value
								? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-300'
								: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'}"
						>
							{mode.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Theme Color -->
			<div>
				<label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Cor do Tema
				</label>
				<div class="flex gap-3">
					{#each themeColors as color}
						<button
							type="button"
							onclick={() => (themeColor = color.value)}
							class="group relative flex h-10 w-10 items-center justify-center rounded-full transition-all"
							title={color.label}
						>
							<div class="{color.class} h-8 w-8 rounded-full"></div>
							{#if themeColor === color.value}
								<div class="absolute inset-0 rounded-full border-2 border-gray-900 dark:border-white"></div>
							{/if}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Interface -->
		<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Interface</h2>

			<!-- Font Size -->
			<div class="mb-6">
				<label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
					Tamanho da Fonte
				</label>
				<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					{#each fontSizes as size}
						<button
							type="button"
							onclick={() => (fontSize = size.value)}
							class="rounded-lg border-2 px-4 py-2 text-sm font-medium transition-all {fontSize ===
							size.value
								? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-400 dark:bg-primary-900/30 dark:text-primary-300'
								: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'}"
						>
							{size.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Compact Mode -->
			<!-- <div class="flex items-center justify-between">
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Modo Compacto
					</label>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Reduz o espaçamento entre elementos
					</p>
				</div>
				<button
					type="button"
					onclick={() => (compactMode = !compactMode)}
					class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {compactMode
						? 'bg-indigo-600'
						: 'bg-gray-300 dark:bg-gray-600'}"
				>
					<span
						class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {compactMode
							? 'translate-x-6'
							: 'translate-x-1'}"
					></span>
				</button>
			</div> -->

			<!-- Animations Enabled -->
			<!-- <div class="mt-4 flex items-center justify-between">
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Animações Habilitadas
					</label>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Ativa animações e transições na interface
					</p>
				</div>
				<button
					type="button"
					onclick={() => (animationsEnabled = !animationsEnabled)}
					class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {animationsEnabled
						? 'bg-indigo-600'
						: 'bg-gray-300 dark:bg-gray-600'}"
				>
					<span
						class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {animationsEnabled
							? 'translate-x-6'
							: 'translate-x-1'}"
					></span>
				</button>
			</div> -->
		</div>

		<!-- Acessibilidade -->
		<!-- <div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">Acessibilidade</h2>

			<div class="flex items-center justify-between">
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Alto Contraste
					</label>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Aumenta o contraste das cores para melhor visibilidade
					</p>
				</div>
				<button
					type="button"
					onclick={() => (highContrast = !highContrast)}
					class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {highContrast
						? 'bg-indigo-600'
						: 'bg-gray-300 dark:bg-gray-600'}"
				>
					<span
						class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {highContrast
							? 'translate-x-6'
							: 'translate-x-1'}"
					></span>
				</button>
			</div>

			<div class="mt-4 flex items-center justify-between">
				<div>
					<label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
						Reduzir Movimento
					</label>
					<p class="text-xs text-gray-500 dark:text-gray-400">
						Minimiza animações para reduzir distrações
					</p>
				</div>
				<button
					type="button"
					onclick={() => (reduceMotion = !reduceMotion)}
					class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {reduceMotion
						? 'bg-indigo-600'
						: 'bg-gray-300 dark:bg-gray-600'}"
				>
					<span
						class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform {reduceMotion
							? 'translate-x-6'
							: 'translate-x-1'}"
					></span>
				</button>
			</div>
		</div> -->
	</div>

	<!-- Save Button -->
	<div class="flex justify-end">
		<button
			type="button"
			onclick={handleSave}
			disabled={isSaving || isLoading}
			class="cursor-pointer rounded-lg bg-primary-600 px-6 py-3 font-semibold text-white transition duration-200 hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isSaving}
				<span class="flex items-center">
					<svg
						class="mr-2 -ml-1 h-5 w-5 animate-spin text-white"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
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
					Salvando...
				</span>
			{:else}
				Salvar Preferências
			{/if}
		</button>
	</div>
</div>
</DashboardLayout>
