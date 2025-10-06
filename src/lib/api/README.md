# API Client

Módulos de integração com a API do backend.

## Estrutura

- `client.ts` - Cliente HTTP base com suporte a autenticação
- `auth.ts` - Endpoints de autenticação
- `users.ts` - Endpoints de usuários
- `index.ts` - Exportações centralizadas

## Uso

### Autenticação

```typescript
import { authApi } from '$lib/api/auth';

// Login
const response = await authApi.login({
  username: 'admin',
  password: 'senha123'
});

// Registro
const newUser = await authApi.register({
  first_name: 'João',
  last_name: 'Silva',
  username: 'joaosilva',
  email: 'joao@email.com',
  password: 'senha123'
});

// Logout
await authApi.logout(token);

// Refresh Token
const { token } = await authApi.refreshToken(currentToken);

// Trocar senha
await authApi.changePassword({
  current_password: 'senha_atual',
  new_password: 'nova_senha'
}, token);
```

### Recuperação de Senha

```typescript
import { authApi } from '$lib/api/auth';

// Solicitar reset
await authApi.requestPasswordReset({
  email: 'usuario@email.com'
});

// Validar token
await authApi.validateResetToken({
  token: 'token_recebido_por_email'
});

// Redefinir senha
await authApi.resetPassword({
  token: 'token_recebido_por_email',
  new_password: 'nova_senha'
});
```

### Usuários

```typescript
import { usersApi } from '$lib/api/users';

// Listar todos os usuários
const { data, count } = await usersApi.list(token);

// Obter perfil atual
const { user } = await usersApi.getProfile(token);

// Buscar por ID
const { user } = await usersApi.getById(1, token);

// Criar usuário (admin)
const newUser = await usersApi.create({
  first_name: 'Maria',
  last_name: 'Santos',
  username: 'mariasantos',
  email: 'maria@email.com',
  password: 'senha123',
  role: 'user'
}, token);

// Atualizar perfil
await usersApi.updateProfile({
  first_name: 'João',
  last_name: 'Silva',
  bio: 'Desenvolvedor Full Stack',
  phone: '+5511999999999'
}, token);

// Trocar senha de outro usuário (admin)
await usersApi.changeUserPassword(userId, {
  new_password: 'nova_senha'
}, token);
```

## Endpoints Disponíveis

### Básicos
- `GET /` - Mensagem de boas-vindas
- `GET /health` - Status da API

### Autenticação
- `POST /api/users/register` - Registrar novo usuário
- `POST /api/users/login` - Login
- `POST /api/users/logout` - Logout (autenticado)
- `POST /api/users/refresh-token` - Renovar token

### Usuários (Autenticados)
- `GET /api/users` - Lista todos os usuários
- `GET /api/users/profile` - Perfil do usuário atual
- `GET /api/users/:id` - Busca usuário por ID
- `POST /api/users` - Cria novo usuário
- `PUT /api/users/profile` - Atualizar perfil
- `PUT /api/users/change-password` - Trocar própria senha
- `PUT /api/users/:id/change-password` - Trocar senha de outro usuário (admin)

### Recuperação de Senha
- `POST /api/password-reset/request` - Solicitar reset de senha
- `POST /api/password-reset/validate-token` - Validar token de reset
- `POST /api/password-reset/reset` - Redefinir senha

## Tratamento de Erros

Todos os métodos lançam exceções em caso de erro:

```typescript
try {
  await authApi.login({ username, password });
} catch (error) {
  if (error instanceof Error) {
    console.error('Erro:', error.message);
  }
}
```

## Configuração

A URL base da API é configurada em `src/lib/config/api.ts`:

```typescript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

Use variáveis de ambiente para diferentes ambientes:

```env
# .env.development
VITE_API_URL=http://localhost:3001

# .env.production
VITE_API_URL=https://api.seudominio.com
```
