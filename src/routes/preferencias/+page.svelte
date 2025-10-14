<script lang="ts">
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/auth';

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
	let saveMessage = $state('');

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
		// TODO: Buscar preferências da API
		// Por enquanto, carregar do localStorage como fallback
		const stored = localStorage.getItem('theme');
		if (stored) {
			themeMode = stored === 'dark' ? 'dark' : stored === 'light' ? 'light' : 'system';
		}
	}

	async function handleSave() {
		isLoading = true;
		saveMessage = '';

		try {
			// TODO: Salvar preferências na API
			// await preferencesApi.update({
			//   theme_mode: themeMode,
			//   theme_color: themeColor,
			//   font_size: fontSize,
			//   compact_mode: compactMode,
			//   animations_enabled: animationsEnabled,
			//   high_contrast: highContrast,
			//   reduce_motion: reduceMotion
			// });

			// Por enquanto, salvar no localStorage
			applyTheme();

			saveMessage = 'Preferências salvas com sucesso!';
			setTimeout(() => {
				saveMessage = '';
			}, 3000);
		} catch (error) {
			console.error('Erro ao salvar preferências:', error);
			saveMessage = 'Erro ao salvar preferências.';
		} finally {
			isLoading = false;
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

	// Apply theme when it changes
	$effect(() => {
		if (themeMode) {
			applyTheme();
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

	<!-- Success/Error Message -->
	{#if saveMessage}
		<div
			class="rounded-lg border px-4 py-3 text-sm {saveMessage.includes('sucesso')
				? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
				: 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'}"
			role="alert"
		>
			{saveMessage}
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
								? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300'
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
								? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-300'
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
			disabled={isLoading}
			class="cursor-pointer rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-semibold text-white transition duration-200 hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if isLoading}
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
