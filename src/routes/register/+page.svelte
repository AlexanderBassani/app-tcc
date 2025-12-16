<script lang="ts">
	import { authApi } from '$lib/api/auth';
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';

	let firstName = $state('');
	let lastName = $state('');
	let username = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let phone = $state('');
	let dateOfBirth = $state('');
	let gender = $state<'male' | 'female' | 'other' | 'prefer_not_to_say' | ''>('');

	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	function handlePhoneInput(e: Event) {
		const input = e.target as HTMLInputElement;
		let value = input.value.replace(/\D/g, '');

		if (value.length > 11) value = value.slice(0, 11);

		if (value.length > 2) {
			value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
		}
		if (value.length > 9) {
			// (XX) XXXXX
			value = `${value.slice(0, 10)}-${value.slice(10)}`;
		} else if (value.length > 6) {
			// (XX) XXXX
			// Adjust for 8 or 9 digits logic if needed, but standard mask usually waits for full length
			// Let's keep it simple: (XX) XXXXX-XXXX
		}

		// Better mask logic for (XX) XXXXX-XXXX or (XX) XXXX-XXXX
		// Resetting value to raw to re-mask properly
		value = input.value.replace(/\D/g, '');
		if (value.length > 11) value = value.slice(0, 11);

		if (value.length <= 10) {
			// (XX) XXXX-XXXX
			value = value.replace(/^(\d{2})(\d)/, '($1) $2');
			value = value.replace(/(\d{4})(\d)/, '$1-$2');
		} else {
			// (XX) XXXXX-XXXX
			value = value.replace(/^(\d{2})(\d)/, '($1) $2');
			value = value.replace(/(\d{5})(\d)/, '$1-$2');
		}

		phone = value;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		errorMessage = '';
		successMessage = '';

		// Validação básica
		if (password !== confirmPassword) {
			errorMessage = 'As senhas não coincidem.';
			isLoading = false;
			return;
		}

		// Validação de senha forte
		const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
		if (!passwordRegex.test(password)) {
			errorMessage =
				'A senha deve ter no mínimo 8 caracteres, contendo pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.';
			isLoading = false;
			return;
		}

		try {
			await authApi.register({
				first_name: firstName,
				last_name: lastName,
				username: username,
				email: email,
				password: password,
				phone: phone.replace(/\D/g, '') || undefined, // Send only numbers to API
				date_of_birth: dateOfBirth || undefined,
				gender: gender as 'male' | 'female' | 'other' | 'prefer_not_to_say' | undefined
			});

			successMessage = 'Conta criada com sucesso! Redirecionando para o login...';

			setTimeout(() => {
				goto('/login');
			}, 2000);
		} catch (e) {
			console.error('Erro no cadastro:', e);
			errorMessage = e instanceof Error ? e.message : 'Erro ao criar conta. Tente novamente.';
		} finally {
			isLoading = false;
		}
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 px-4 py-12 transition-colors duration-300 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
>
	<div class="w-full max-w-2xl">
		<!-- Card -->
		<div
			class="overflow-hidden rounded-2xl bg-white shadow-xl transition-colors duration-300 dark:bg-gray-800"
		>
			<!-- Header -->
			<div class="bg-primary-600 px-8 py-6 text-center">
				<h1 class="mb-2 text-3xl font-bold text-white">Criar Conta</h1>
				<p class="text-white/80">Preencha os dados abaixo para se cadastrar</p>
			</div>

			<!-- Form -->
			<form onsubmit={handleSubmit} class="space-y-6 px-8 py-8">
				<!-- Messages -->
				{#if errorMessage}
					<div
						transition:fade
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

				{#if successMessage}
					<div
						transition:fade
						class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
						role="alert"
					>
						<div class="flex items-center">
							<svg class="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
									clip-rule="evenodd"
								/>
							</svg>
							<span>{successMessage}</span>
						</div>
					</div>
				{/if}

				<div class="grid gap-6 md:grid-cols-2">
					<!-- First Name -->
					<div>
						<label
							for="firstName"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Nome *
						</label>
						<input
							type="text"
							id="firstName"
							bind:value={firstName}
							required
							class="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
						/>
					</div>

					<!-- Last Name -->
					<div>
						<label
							for="lastName"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Sobrenome *
						</label>
						<input
							type="text"
							id="lastName"
							bind:value={lastName}
							required
							class="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
						/>
					</div>
				</div>

				<div class="grid gap-6 md:grid-cols-2">
					<!-- Username -->
					<div>
						<label
							for="username"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Usuário *
						</label>
						<input
							type="text"
							id="username"
							bind:value={username}
							required
							class="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
						/>
					</div>

					<!-- Email -->
					<div>
						<label
							for="email"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Email *
						</label>
						<input
							type="email"
							id="email"
							bind:value={email}
							required
							class="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
						/>
					</div>
				</div>

				<div class="grid gap-6 md:grid-cols-2">
					<!-- Password -->
					<div>
						<label
							for="password"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Senha *
						</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							required
							minlength="6"
							class="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
						/>

						{#if password.length > 0}
							<!-- Password Strength Indicators -->
							<div class="mt-2 space-y-1 text-xs" transition:fade>
								<p class="font-medium text-gray-600 dark:text-gray-400">A senha deve conter:</p>
								<ul class="space-y-1">
									<li
										class="flex items-center {password.length >= 8
											? 'text-green-600 dark:text-green-400'
											: 'text-gray-500 dark:text-gray-500'}"
									>
										<svg
											class="mr-1.5 h-3.5 w-3.5 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											{#if password.length >= 8}
												<path
													fill-rule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clip-rule="evenodd"
												/>
											{:else}
												<circle cx="10" cy="10" r="3" />
											{/if}
										</svg>
										Mínimo de 8 caracteres
									</li>
									<li
										class="flex items-center {/[A-Z]/.test(password)
											? 'text-green-600 dark:text-green-400'
											: 'text-gray-500 dark:text-gray-500'}"
									>
										<svg
											class="mr-1.5 h-3.5 w-3.5 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											{#if /[A-Z]/.test(password)}
												<path
													fill-rule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clip-rule="evenodd"
												/>
											{:else}
												<circle cx="10" cy="10" r="3" />
											{/if}
										</svg>
										Uma letra maiúscula
									</li>
									<li
										class="flex items-center {/[a-z]/.test(password)
											? 'text-green-600 dark:text-green-400'
											: 'text-gray-500 dark:text-gray-500'}"
									>
										<svg
											class="mr-1.5 h-3.5 w-3.5 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											{#if /[a-z]/.test(password)}
												<path
													fill-rule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clip-rule="evenodd"
												/>
											{:else}
												<circle cx="10" cy="10" r="3" />
											{/if}
										</svg>
										Uma letra minúscula
									</li>
									<li
										class="flex items-center {/\d/.test(password)
											? 'text-green-600 dark:text-green-400'
											: 'text-gray-500 dark:text-gray-500'}"
									>
										<svg
											class="mr-1.5 h-3.5 w-3.5 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											{#if /\d/.test(password)}
												<path
													fill-rule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clip-rule="evenodd"
												/>
											{:else}
												<circle cx="10" cy="10" r="3" />
											{/if}
										</svg>
										Um número
									</li>
									<li
										class="flex items-center {/[^A-Za-z0-9]/.test(password)
											? 'text-green-600 dark:text-green-400'
											: 'text-gray-500 dark:text-gray-500'}"
									>
										<svg
											class="mr-1.5 h-3.5 w-3.5 flex-shrink-0"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											{#if /[^A-Za-z0-9]/.test(password)}
												<path
													fill-rule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clip-rule="evenodd"
												/>
											{:else}
												<circle cx="10" cy="10" r="3" />
											{/if}
										</svg>
										Um caractere especial
									</li>
								</ul>
							</div>
						{/if}
					</div>

					<!-- Confirm Password -->
					<div>
						<label
							for="confirmPassword"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Confirmar Senha *
						</label>
						<input
							type="password"
							id="confirmPassword"
							bind:value={confirmPassword}
							required
							minlength="6"
							class="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
						/>
					</div>
				</div>

				<div class="grid gap-6 md:grid-cols-3">
					<!-- Phone -->
					<div>
						<label
							for="phone"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Telefone
						</label>
						<input
							type="tel"
							id="phone"
							bind:value={phone}
							oninput={handlePhoneInput}
							maxlength="15"
							placeholder="(99) 99999-9999"
							class="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
						/>
					</div>

					<!-- Date of Birth -->
					<div>
						<label
							for="dateOfBirth"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Data de Nascimento
						</label>
						<input
							type="date"
							id="dateOfBirth"
							bind:value={dateOfBirth}
							class="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
						/>
					</div>

					<!-- Gender -->
					<div>
						<label
							for="gender"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Gênero
						</label>
						<select
							id="gender"
							bind:value={gender}
							class="focus:ring-primary-500 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 transition duration-200 outline-none focus:border-transparent focus:ring-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
						>
							<option value="">Selecione...</option>
							<option value="male">Masculino</option>
							<option value="female">Feminino</option>
							<option value="other">Outro</option>
							<option value="prefer_not_to_say">Prefiro não dizer</option>
						</select>
					</div>
				</div>

				<!-- Submit Button -->
				<button
					type="submit"
					disabled={isLoading}
					class="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 mt-4 w-full transform cursor-pointer rounded-lg px-4 py-3 font-semibold text-white transition duration-200 hover:scale-[1.02] focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
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
							Criando conta...
						</span>
					{:else}
						Criar Conta
					{/if}
				</button>
			</form>

			<!-- Footer -->
			<div
				class="border-t border-gray-100 bg-gray-50 px-8 py-4 text-center dark:border-gray-700 dark:bg-gray-700/50"
			>
				<p class="text-sm text-gray-600 dark:text-gray-400">
					Já tem uma conta?
					<a
						href="/login"
						class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
					>
						Fazer login
					</a>
				</p>
			</div>
		</div>
	</div>
</div>
