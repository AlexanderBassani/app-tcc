<script lang="ts">
	import DashboardLayout from '$lib/components/DashboardLayout.svelte';
	import { usersApi } from '$lib/api/users';
	import { authStore } from '$lib/stores/auth';

	let formData = $state({
		first_name: '',
		last_name: '',
		username: '',
		email: '',
		password: '',
		confirmPassword: '',
		role: 'user' as 'admin' | 'user',
		phone: '',
		date_of_birth: '',
		gender: '' as 'male' | 'female' | 'other' | 'prefer_not_to_say' | '',
		bio: '',
		status: 'active' as 'active' | 'inactive',
		preferred_language: 'pt-BR',
		timezone: 'America/Sao_Paulo',
		marketing_emails_consent: false
	});

	let errorMessage = $state('');
	let successMessage = $state('');
	let isLoading = $state(false);

	function formatPhone(value: string): string {
		// Remove tudo que não é número
		const numbers = value.replace(/\D/g, '');

		// Aplica a máscara conforme a quantidade de dígitos
		if (numbers.length <= 2) {
			return numbers;
		} else if (numbers.length <= 6) {
			return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
		} else if (numbers.length <= 10) {
			return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
		} else {
			return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
		}
	}

	function handlePhoneInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const formatted = formatPhone(input.value);
		formData.phone = formatted;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		errorMessage = '';
		successMessage = '';

		// Validações básicas
		if (formData.password !== formData.confirmPassword) {
			errorMessage = 'As senhas não coincidem';
			return;
		}

		if (formData.password.length < 6) {
			errorMessage = 'A senha deve ter pelo menos 6 caracteres';
			return;
		}

		isLoading = true;

		try {
			// Verificar se o usuário está autenticado
			if (!$authStore.token) {
				errorMessage = 'Você precisa estar autenticado para criar usuários';
				return;
			}

			// Preparar dados para enviar - remover campos vazios opcionais
			const payload: any = {
				first_name: formData.first_name,
				last_name: formData.last_name,
				username: formData.username,
				email: formData.email,
				password: formData.password,
				role: formData.role,
				status: formData.status,
				preferred_language: formData.preferred_language,
				timezone: formData.timezone,
				marketing_emails_consent: formData.marketing_emails_consent
			};

			// Adicionar campos opcionais apenas se preenchidos
			if (formData.phone) {
				// Remover formatação do telefone antes de enviar
				payload.phone = formData.phone.replace(/\D/g, '');
			}
			if (formData.date_of_birth) payload.date_of_birth = formData.date_of_birth;
			if (formData.gender) payload.gender = formData.gender;
			if (formData.bio) payload.bio = formData.bio;

			// Chamar API
			const response = await usersApi.create(payload, $authStore.token);

			successMessage = 'Usuário cadastrado com sucesso!';

			// Redirecionar após sucesso
			setTimeout(() => {
				window.location.href = '/usuarios';
			}, 1500);
		} catch (e: any) {
			console.error('Erro ao cadastrar usuário:', e);

			// Tratar erros específicos da API
			if (e.response?.data?.error) {
				errorMessage = e.response.data.error;
				if (e.response.data.message) {
					errorMessage += ': ' + e.response.data.message;
				}
			} else if (e.message) {
				errorMessage = e.message;
			} else {
				errorMessage = 'Erro ao cadastrar usuário. Tente novamente.';
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<DashboardLayout>
	<div class="space-y-6">
		<!-- Header -->
		<div>
			<h2 class="text-2xl font-bold text-gray-800 dark:text-white">Cadastro de Usuário</h2>
			<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">
				Preencha os dados para criar um novo usuário no sistema
			</p>
		</div>

		<!-- Messages -->
		{#if errorMessage}
			<div
				class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300"
			>
				{errorMessage}
			</div>
		{/if}

		{#if successMessage}
			<div
				class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
			>
				{successMessage}
			</div>
		{/if}

		<!-- Form -->
		<form onsubmit={handleSubmit} class="space-y-6">
			<!-- Informações Básicas -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
					Informações Básicas
				</h3>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Primeiro Nome -->
					<div>
						<label
							for="first_name"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Primeiro Nome <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="first_name"
							bind:value={formData.first_name}
							maxlength="50"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							required
						/>
					</div>

					<!-- Sobrenome -->
					<div>
						<label
							for="last_name"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Sobrenome <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="last_name"
							bind:value={formData.last_name}
							maxlength="50"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							required
						/>
					</div>

					<!-- Username -->
					<div>
						<label
							for="username"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Nome de Usuário <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							id="username"
							bind:value={formData.username}
							maxlength="30"
							pattern="[a-zA-Z0-9_]+"
							title="Apenas letras, números e underscore"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							required
						/>
						<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
							Apenas letras, números e underscore
						</p>
					</div>

					<!-- Email -->
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Email <span class="text-red-500">*</span>
						</label>
						<input
							type="email"
							id="email"
							bind:value={formData.email}
							maxlength="100"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							required
						/>
					</div>

					<!-- Telefone -->
					<div>
						<label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Telefone
						</label>
						<input
							type="tel"
							id="phone"
							value={formData.phone}
							oninput={handlePhoneInput}
							maxlength="15"
							placeholder="(00) 00000-0000"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
						/>
					</div>

					<!-- Data de Nascimento -->
					<div>
						<label
							for="date_of_birth"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Data de Nascimento
						</label>
						<input
							type="date"
							id="date_of_birth"
							bind:value={formData.date_of_birth}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
						/>
					</div>

					<!-- Gênero -->
					<div>
						<label for="gender" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Gênero
						</label>
						<select
							id="gender"
							bind:value={formData.gender}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
						>
							<option value="">Selecione...</option>
							<option value="male">Masculino</option>
							<option value="female">Feminino</option>
							<option value="other">Outro</option>
							<option value="prefer_not_to_say">Prefiro não dizer</option>
						</select>
					</div>

					<!-- Bio -->
					<div class="md:col-span-2">
						<label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Biografia
						</label>
						<textarea
							id="bio"
							bind:value={formData.bio}
							rows="3"
							maxlength="500"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							placeholder="Conte um pouco sobre você..."
						></textarea>
						<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
							Máximo de 500 caracteres
						</p>
					</div>
				</div>
			</div>

			<!-- Autenticação e Segurança -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">
					Autenticação e Segurança
				</h3>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Senha -->
					<div>
						<label
							for="password"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Senha <span class="text-red-500">*</span>
						</label>
						<input
							type="password"
							id="password"
							bind:value={formData.password}
							minlength="6"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							required
						/>
						<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Mínimo de 6 caracteres</p>
					</div>

					<!-- Confirmar Senha -->
					<div>
						<label
							for="confirmPassword"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Confirmar Senha <span class="text-red-500">*</span>
						</label>
						<input
							type="password"
							id="confirmPassword"
							bind:value={formData.confirmPassword}
							minlength="6"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							required
						/>
					</div>

					<!-- Tipo de Usuário -->
					<div>
						<label for="role" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Tipo de Usuário <span class="text-red-500">*</span>
						</label>
						<select
							id="role"
							bind:value={formData.role}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							required
						>
							<option value="user">Usuário</option>
							<option value="admin">Administrador</option>
						</select>
					</div>

					<!-- Status -->
					<div>
						<label for="status" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
							Status <span class="text-red-500">*</span>
						</label>
						<select
							id="status"
							bind:value={formData.status}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
							required
						>
							<option value="active">Ativo</option>
							<option value="inactive">Inativo</option>
						</select>
					</div>
				</div>
			</div>

			<!-- Preferências -->
			<div class="rounded-lg bg-white p-6 shadow dark:bg-gray-700">
				<h3 class="mb-4 text-lg font-semibold text-gray-800 dark:text-white">Preferências</h3>
				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<!-- Idioma -->
					<div>
						<label
							for="preferred_language"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Idioma Preferido
						</label>
						<select
							id="preferred_language"
							bind:value={formData.preferred_language}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
						>
							<option value="pt-BR">Português (Brasil)</option>
							<option value="en-US">English (US)</option>
							<option value="es-ES">Español</option>
						</select>
					</div>

					<!-- Fuso Horário -->
					<div>
						<label
							for="timezone"
							class="block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Fuso Horário
						</label>
						<select
							id="timezone"
							bind:value={formData.timezone}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
						>
							<option value="America/Sao_Paulo">América/São Paulo (BRT)</option>
							<option value="America/New_York">América/Nova York (EST)</option>
							<option value="Europe/London">Europa/Londres (GMT)</option>
							<option value="Asia/Tokyo">Ásia/Tóquio (JST)</option>
						</select>
					</div>

					<!-- Consentimento de Marketing -->
					<div class="md:col-span-2">
						<div class="flex items-center">
							<input
								type="checkbox"
								id="marketing_emails_consent"
								bind:checked={formData.marketing_emails_consent}
								class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-600"
							/>
							<label
								for="marketing_emails_consent"
								class="ml-2 block text-sm text-gray-700 dark:text-gray-300"
							>
								Aceito receber emails de marketing e novidades
							</label>
						</div>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex justify-end gap-3">
				<a
					href="/usuarios"
					class="cursor-pointer rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
				>
					Cancelar
				</a>
				<button
					type="submit"
					disabled={isLoading}
					class="cursor-pointer rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isLoading}
						<span class="flex items-center">
							<svg
								class="mr-2 h-4 w-4 animate-spin"
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
							Cadastrando...
						</span>
					{:else}
						Cadastrar Usuário
					{/if}
				</button>
			</div>
		</form>
	</div>
</DashboardLayout>
