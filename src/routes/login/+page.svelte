<script lang="ts">
	import { authStore } from '$lib/stores/auth';
	import { authApi } from '$lib/api/auth';
	import { goto } from '$app/navigation';

	let login = $state('');
	let password = $state('');
	let rememberMe = $state(false);
	let isLoading = $state(false);
	let errorMessage = $state('');

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		errorMessage = '';

		try {
			const response = await authApi.login({
				login: login,
				password: password
			});

			// Salvar no store (localStorage/sessionStorage)
			authStore.login(response.user, response.token, rememberMe);

			// Salvar token nos cookies via action do servidor
			const formData = new FormData();
			formData.append('token', response.token);
			formData.append('rememberMe', String(rememberMe));

			await fetch('?/login', {
				method: 'POST',
				body: formData
			});

			// Redirecionar para a página inicial
			window.location.href = '/';
		} catch (e) {
			console.error('Erro no login:', e);
			errorMessage =
				e instanceof Error ? e.message : 'Erro ao fazer login. Verifique suas credenciais.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4 py-12 transition-colors duration-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
>
	<div class="w-full max-w-md">
		<!-- Card -->
		<div
			class="overflow-hidden rounded-2xl bg-white shadow-xl transition-colors duration-300 dark:bg-gray-800"
		>
			<!-- Header -->
			<div
				class="bg-primary-600 px-8 py-6 text-center"
			>
				<h1 class="mb-2 text-3xl font-bold text-white">Bem-vindo</h1>
				<p class="text-white/80">Faça login para continuar</p>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-6 px-8 py-8">
				<!-- Error Message -->
				{#if errorMessage}
					<div
						class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
						role="alert"
					>
						<div class="flex items-center">
							<svg class="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>{errorMessage}</span>
						</div>
					</div>
				{/if}

				<!-- Login -->
				<div>
					<label
						for="login"
						class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Login
					</label>
					<input
						type="login"
						id="login"
						bind:value={login}
						required
						placeholder="nome usuário ou email"
						class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
					/>
				</div>

				<!-- Password -->
				<div>
					<label
						for="password"
						class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Senha
					</label>
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						placeholder="••••••••"
						class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
					/>
				</div>

				<!-- Remember me & Forgot password -->
				<div class="flex items-center justify-between">
					<label class="flex items-center">
						<input
							type="checkbox"
							bind:checked={rememberMe}
							class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
						/>
						<span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Lembrar-me</span>
					</label>
					<a
						href="/forgot-password"
						class="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
					>
						Esqueceu a senha?
					</a>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isLoading}
					class="w-full transform cursor-pointer rounded-lg bg-primary-600 px-4 py-3 font-semibold text-white transition duration-200 hover:scale-[1.02] hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
				>
					{#if isLoading}
						<span class="flex items-center justify-center">
							<svg
								class="mr-3 -ml-1 h-5 w-5 animate-spin text-white"
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
							Entrando...
						</span>
					{:else}
						Entrar
					{/if}
				</button>

				<!-- Divider -->
				<div class="relative">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="bg-white px-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
							>Ou continue com</span
						>
					</div>
				</div>

				<!-- Social Login Buttons -->
				<div class="grid grid-cols-2 gap-3">
					<button
						type="button"
						class="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 transition duration-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						<span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Google</span>
					</button>
					<button
						type="button"
						class="flex items-center justify-center rounded-lg border border-gray-300 px-4 py-3 transition duration-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
					>
						<svg class="h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
							<path
								d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
							/>
						</svg>
						<span class="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">Facebook</span>
					</button>
				</div>
			</form>

			<!-- Footer -->
			<div
				class="border-t border-gray-100 bg-gray-50 px-8 py-4 text-center dark:border-gray-700 dark:bg-gray-700/50"
			>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Não tem uma conta?
					<a
						href="/register"
						class="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
					>
						Criar conta
					</a>
				</p>
			</div>
		</div>
	</div>
</div>
