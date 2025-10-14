<script lang="ts">
	import { authStore, isAdmin } from '$lib/stores/auth';
	import { authApi } from '$lib/api/auth';
	import { goto } from '$app/navigation';

	let dropdownOpen = $state(false);

	function toggleDropdown() {
		dropdownOpen = !dropdownOpen;
	}

	async function handleLogout() {
		try {
			// Chamar endpoint de logout se houver token
			if ($authStore.token) {
				await authApi.logout($authStore.token);
			}

			// Limpar store local
			authStore.logout();

			// Chamar action do servidor para limpar cookies
			await fetch('/login?/logout', {
				method: 'POST'
			});

			// Redirecionar usando window.location para forçar reload completo
			window.location.href = '/login';
		} catch (error) {
			console.error('Erro ao fazer logout:', error);
			// Mesmo com erro, redirecionar
			authStore.logout();
			window.location.href = '/login';
		}
	}

	function getInitials(name?: string) {
		if (!name) return '?';
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	// Close dropdown when clicking outside
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('#user-dropdown')) {
			dropdownOpen = false;
		}
	}

	$effect(() => {
		if (dropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});
</script>

{#if $authStore.user}
	<div id="user-dropdown" class="relative">
		<button
			onclick={toggleDropdown}
			class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600"
		>
			<!-- Avatar -->
			{#if $authStore.user.profile_image_url}
				<img
					src={$authStore.user.profile_image_url}
					alt={`${$authStore.user.first_name} ${$authStore.user.last_name}`}
					class="h-9 w-9 rounded-full object-cover"
				/>
			{:else}
				<div
					class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white"
				>
					{getInitials(`${$authStore.user.first_name} ${$authStore.user.last_name}`)}
				</div>
			{/if}

			<!-- User Info -->
			<div class="text-left">
				<p class="text-sm font-medium text-gray-700 dark:text-gray-200">
					{$authStore.user.first_name} {$authStore.user.last_name}
				</p>
				{#if isAdmin($authStore.user)}
					<p class="text-xs text-gray-500 dark:text-gray-400">Administrador</p>
				{/if}
			</div>

			<!-- Chevron -->
			<svg
				class="h-4 w-4 text-gray-500 transition-transform dark:text-gray-400 {dropdownOpen
					? 'rotate-180'
					: ''}"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"
				></path>
			</svg>
		</button>

		<!-- Dropdown Menu -->
		{#if dropdownOpen}
			<div
				class="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-lg border border-gray-300 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-700"
			>
				<div class="p-3 border-b border-gray-300 dark:border-gray-600">
					<p class="text-sm font-medium text-gray-900 dark:text-white">
						{$authStore.user.first_name} {$authStore.user.last_name}
					</p>
					<p class="text-xs text-gray-500 dark:text-gray-400 truncate">
						{$authStore.user.email}
					</p>
				</div>

				<div class="p-1">
					<a
						href="/preferencias"
						class="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
							></path>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							></path>
						</svg>
						Preferências
					</a>
					<button
						onclick={handleLogout}
						class="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
					>
						<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
							></path>
						</svg>
						Sair
					</button>
				</div>
			</div>
		{/if}
	</div>
{/if}
