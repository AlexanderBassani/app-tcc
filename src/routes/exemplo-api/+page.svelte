<script lang="ts">
	import { onMount } from 'svelte';
	import { api } from '$lib/api/client';

	let users: any[] = $state([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			// Exemplo: buscar usuários da API
			// Você precisará ter um token válido para rotas protegidas
			const response = await api.get('/api/users');
			users = response;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Erro ao carregar dados';
			console.error('Erro:', e);
		} finally {
			loading = false;
		}
	});

	async function handleLogin() {
		try {
			const response = await api.post('/api/users/login', {
				login: 'admin',
				password: 'admin123'
			});
			console.log('Login realizado:', response);
			// Salvar token no localStorage ou store
			// localStorage.setItem('token', response.token);
		} catch (e) {
			console.error('Erro no login:', e);
		}
	}
</script>

<div class="container">
	<h1>Exemplo de Conexão com API</h1>

	<button onclick={handleLogin}>Testar Login</button>

	{#if loading}
		<p>Carregando...</p>
	{:else if error}
		<p class="error">Erro: {error}</p>
	{:else}
		<h2>Usuários:</h2>
		<ul>
			{#each users as user}
				<li>{user.name || user.email}</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.container {
		padding: 2rem;
	}

	.error {
		color: red;
	}

	button {
		padding: 0.5rem 1rem;
		margin: 1rem 0;
		cursor: pointer;
	}

	ul {
		list-style: none;
		padding: 0;
	}

	li {
		padding: 0.5rem;
		margin: 0.5rem 0;
		background: #f0f0f0;
		border-radius: 4px;
	}
</style>
