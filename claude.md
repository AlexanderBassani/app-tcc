# Vehicle Manager - Guia do Projeto

## Visão Geral

Sistema de gerenciamento de veículos e manutenções desenvolvido como TCC. Aplicação web full-stack com frontend em SvelteKit e backend em Node.js/Express.

**Repositórios:**
- Frontend (este): `C:/Users/alexa/Desktop/PUC/tcc/app`
- Backend API: `C:/Users/alexa/Desktop/PUC/tcc/api`

**URL da API de Produção:**
- `https://api-tcc-production-80e5.up.railway.app`

---

## Stack Tecnológico

### Frontend
- **SvelteKit** 2.43.2 - Framework full-stack
- **Svelte** 5.39.5 - Usando Svelte 5 Runes (`$state`, `$derived`, `$effect`)
- **TypeScript** - Tipagem estática
- **Tailwind CSS** 4.1.13 - Estilização
- **Vite** - Build tool

### Testes
- **Vitest** - Testes unitários
- **Playwright** - Testes E2E

### Backend
- Node.js + Express
- PostgreSQL
- Railway (hospedagem)

---

## Estrutura de Pastas

```
app/
├── src/
│   ├── lib/
│   │   ├── api/              # Clientes API
│   │   │   ├── client.ts     # Cliente HTTP base
│   │   │   ├── auth.ts       # Endpoints de autenticação
│   │   │   ├── users.ts      # Endpoints de usuários
│   │   │   ├── vehicles.ts   # Endpoints de veículos
│   │   │   ├── maintenances.ts # Endpoints de manutenções
│   │   │   └── preferences.ts  # Endpoints de preferências
│   │   ├── components/       # Componentes reutilizáveis
│   │   │   ├── DashboardLayout.svelte
│   │   │   ├── ProtectedRoute.svelte
│   │   │   ├── UserDropdown.svelte
│   │   │   └── SearchableSelect.svelte
│   │   ├── config/           # Configurações
│   │   │   └── api.ts        # Configuração da API
│   │   └── stores/           # Svelte stores
│   │       └── auth.ts       # Store de autenticação
│   ├── routes/               # Páginas (file-based routing)
│   │   ├── +layout.svelte    # Layout raiz
│   │   ├── +page.svelte      # Página inicial
│   │   ├── login/            # Login
│   │   ├── register/         # Registro
│   │   ├── usuarios/         # Gerenciamento de usuários
│   │   ├── vehicles/         # Gerenciamento de veículos
│   │   ├── maintenances/     # Gerenciamento de manutenções
│   │   └── preferencias/     # Preferências do usuário
│   └── app.html              # Template HTML base
├── static/                   # Arquivos estáticos
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service Worker
│   └── icons/                # Ícones PWA
├── tests/                    # Testes E2E
└── .env                      # Variáveis de ambiente
```

---

## Boas Práticas - SvelteKit/Svelte 5

### 1. Navegação

❌ **NUNCA USE:**
```javascript
window.location.href = '/path';
window.location.replace('/path');
```

✅ **SEMPRE USE:**
```javascript
import { goto } from '$app/navigation';

goto('/path');
```

**Motivo:** `goto()` faz navegação client-side mantendo o estado SPA, enquanto `window.location` força reload completo da página.

### 2. Svelte 5 Runes

✅ **Estado Reativo:**
```javascript
let count = $state(0);
let user = $state({ name: 'John' });
```

✅ **Valores Derivados:**
```javascript
let doubled = $derived(count * 2);
let fullName = $derived(`${user.firstName} ${user.lastName}`);
```

✅ **Efeitos Colaterais:**
```javascript
$effect(() => {
    console.log('Count changed:', count);
    // Cleanup automático quando a dependência muda
});
```

✅ **Props em Componentes:**
```javascript
let { user, onUpdate = () => {} } = $props();
```

### 3. Estrutura de Componentes

```svelte
<script lang="ts">
    // 1. Imports
    import Component from './Component.svelte';
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/auth';

    // 2. Props
    let { data, title = 'Default' } = $props();

    // 3. State
    let isLoading = $state(false);
    let items = $state([]);

    // 4. Derived
    let itemCount = $derived(items.length);

    // 5. Functions
    async function handleSubmit() {
        // ...
    }

    // 6. Effects
    $effect(() => {
        // Side effects
    });
</script>

<!-- Template -->
<div>
    {#if isLoading}
        <p>Loading...</p>
    {:else}
        {#each items as item}
            <div>{item.name}</div>
        {/each}
    {/if}
</div>

<style>
    /* Scoped styles */
</style>
```

### 4. Chamadas de API

✅ **Padrão do Projeto:**
```typescript
import { usersApi } from '$lib/api/users';
import { authStore } from '$lib/stores/auth';

async function loadUsers() {
    try {
        const response = await usersApi.list($authStore.token);
        users = response.data;
    } catch (error) {
        console.error('Erro:', error);
        errorMessage = error.message;
    }
}
```

**Estrutura de Response:**
```typescript
interface Response<T> {
    message: string;
    data: T;
    count?: number;
}
```

### 5. Autenticação e Proteção de Rotas

```svelte
<script>
    import ProtectedRoute from '$lib/components/ProtectedRoute.svelte';
    import { authStore } from '$lib/stores/auth';
</script>

<!-- Rota protegida (qualquer usuário autenticado) -->
<ProtectedRoute>
    <div>Conteúdo protegido</div>
</ProtectedRoute>

<!-- Rota apenas para admins -->
<ProtectedRoute adminOnly={true}>
    <div>Conteúdo administrativo</div>
</ProtectedRoute>
```

### 6. Formulários

```svelte
<script lang="ts">
    let formData = $state({
        name: '',
        email: '',
        password: ''
    });

    let errorMessage = $state('');
    let isLoading = $state(false);

    async function handleSubmit(e: Event) {
        e.preventDefault();
        errorMessage = '';
        isLoading = true;

        try {
            await api.post('/endpoint', formData);
            goto('/success');
        } catch (error: any) {
            errorMessage = error.message;
        } finally {
            isLoading = false;
        }
    }
</script>

<form onsubmit={handleSubmit}>
    <input
        type="text"
        bind:value={formData.name}
        required
    />

    {#if errorMessage}
        <div class="error">{errorMessage}</div>
    {/if}

    <button type="submit" disabled={isLoading}>
        {isLoading ? 'Salvando...' : 'Salvar'}
    </button>
</form>
```

### 7. Stores

```typescript
// src/lib/stores/auth.ts
import { writable } from 'svelte/store';

function createAuthStore() {
    const { subscribe, set, update } = writable(initialState);

    return {
        subscribe,
        login: (user, token) => set({ user, token, isAuthenticated: true }),
        logout: () => set({ user: null, token: null, isAuthenticated: false }),
        initialize: () => { /* ... */ }
    };
}

export const authStore = createAuthStore();

// Uso em componentes
import { authStore } from '$lib/stores/auth';

// Acessar valor reativo
$authStore.user
$authStore.token
```

---

## API Endpoints

### Autenticação (`/api/users`)
- `POST /login` - Login
- `POST /register` - Registro
- `POST /logout` - Logout (requer token)
- `POST /refresh-token` - Renovar token (requer token)
- `PUT /change-password` - Alterar senha (requer token)

### Usuários (`/api/users`)
- `GET /` - Listar usuários (admin)
- `GET /profile` - Perfil do usuário logado
- `GET /:id` - Buscar usuário por ID (admin)
- `PUT /profile` - Atualizar próprio perfil
- `PUT /:id` - Atualizar usuário (admin)
- `PUT /:id/change-password` - Alterar senha de usuário (admin)

### Veículos (`/api/vehicles`)
- `GET /` - Listar veículos do usuário
- `GET /:id` - Buscar veículo por ID
- `POST /` - Criar veículo
- `PUT /:id` - Atualizar veículo
- `DELETE /:id` - Deletar veículo

### Manutenções (`/api/maintenances`)
- `GET /` - Listar manutenções
- `GET /:id` - Buscar manutenção por ID
- `POST /` - Criar manutenção
- `PUT /:id` - Atualizar manutenção
- `DELETE /:id` - Deletar manutenção

### Preferências (`/api/preferences`)
- `GET /` - Obter preferências do usuário
- `PUT /` - Atualizar preferências

---

## Configurações Importantes

### Variáveis de Ambiente (`.env`)
```bash
VITE_API_URL=https://api-tcc-production-80e5.up.railway.app
```

**IMPORTANTE:** Variáveis de ambiente no SvelteKit devem ter prefixo `VITE_` para serem acessíveis no cliente.

### API Client (`src/lib/config/api.ts`)
```typescript
export const API_URL = getAbsoluteApiUrl();

// Função garante URL absoluta
// - Adiciona https:// se não tiver protocolo
// - Remove trailing slash
```

### Service Worker (`static/sw.js`)
- Cache de assets estáticos
- Funcionamento offline
- Página offline customizada

---

## Padrões de Código

### 1. Tipos TypeScript

```typescript
// Sempre defina interfaces para dados da API
interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: 'admin' | 'user';
}

// Use tipos para request/response
interface LoginRequest {
    login: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user: User;
}
```

### 2. Tratamento de Erros

```typescript
try {
    const response = await api.post('/endpoint', data);
    successMessage = 'Operação realizada com sucesso!';
} catch (e: any) {
    console.error('Erro:', e);

    // Tratar erros da API
    if (e.response?.data?.error) {
        errorMessage = e.response.data.error;
    } else if (e.message) {
        errorMessage = e.message;
    } else {
        errorMessage = 'Erro desconhecido';
    }
}
```

### 3. Loading States

```typescript
let isLoading = $state(false);

async function loadData() {
    isLoading = true;
    try {
        data = await api.get('/endpoint');
    } finally {
        isLoading = false; // Sempre no finally
    }
}
```

### 4. Formatação

- **Telefone:** `(XX) XXXXX-XXXX`
- **Data:** `YYYY-MM-DD` (formato ISO no backend)
- **Placa:** `ABC-1234` ou `ABC1D23` (Mercosul)

---

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Inicia dev server (localhost:5173)

# Build
npm run build            # Build de produção
npm run preview          # Preview do build

# Qualidade de Código
npm run check            # Type checking
npm run lint             # ESLint
npm run format           # Prettier

# Testes
npm run test:unit        # Testes unitários (Vitest)
npm run test:e2e         # Testes E2E (Playwright)
npm test                 # Todos os testes
```

---

## Checklist - Ao Adicionar Nova Funcionalidade

- [ ] Usar `$state` para estado reativo (não `let` normal)
- [ ] Usar `goto()` para navegação (não `window.location`)
- [ ] Adicionar tipos TypeScript apropriados
- [ ] Implementar loading states
- [ ] Adicionar tratamento de erros
- [ ] Mostrar mensagens de sucesso/erro ao usuário
- [ ] Verificar autenticação/autorização se necessário
- [ ] Testar em modo produção (`npm run build && npm run preview`)
- [ ] Validar formulários antes de enviar
- [ ] Usar componentes reutilizáveis quando possível

---

## Problemas Comuns e Soluções

### 1. URL da API Errada
**Sintoma:** Requisições vão para `localhost:5173/api-tcc-production...`

**Solução:**
- Verificar `.env` tem `VITE_API_URL` com protocolo (`https://`)
- Reiniciar servidor dev após mudar `.env`
- Limpar cache do navegador

### 2. Estado Não Reatualiza
**Sintoma:** Mudanças no estado não refletem na UI

**Solução:**
- Usar `$state()` ao invés de `let` comum
- Verificar se está mutando objetos corretamente:
  ```typescript
  // ❌ Errado
  user.name = 'New Name';

  // ✅ Correto
  user = { ...user, name: 'New Name' };
  ```

### 3. Redirect Após Ação
**Sintoma:** Página não carrega corretamente após redirect

**Solução:**
- Usar `goto()` ao invés de `window.location.href`
- Esperar timeout antes de redirect se necessário:
  ```typescript
  setTimeout(() => goto('/path'), 1500);
  ```

### 4. Token Não Persistindo
**Sintoma:** Usuário desloga ao recarregar página

**Solução:**
- Chamar `authStore.initialize()` no `+layout.svelte`
- Verificar localStorage/sessionStorage tem os dados
- Verificar cookies estão sendo setados corretamente

---

## Recursos Úteis

- [SvelteKit Docs](https://kit.svelte.dev/docs)
- [Svelte 5 Runes](https://svelte-5-preview.vercel.app/docs/runes)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

**Última Atualização:** 2025-12-13
