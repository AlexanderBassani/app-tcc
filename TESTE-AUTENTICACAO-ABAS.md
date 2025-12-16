# Teste de Autenticação Entre Abas

## Problema Corrigido

O problema estava relacionado ao uso de `sessionStorage`, que **não é compartilhado entre abas** do navegador. Quando o usuário não marcava "lembrar-me", os dados iam para `sessionStorage`, fazendo com que novas abas não tivessem acesso ao token de autenticação.

## Solução Implementada

### Mudanças no `auth.ts`:

1. **Uso exclusivo de localStorage**: Agora SEMPRE usamos `localStorage` (que é compartilhado entre abas), independente da opção "lembrar-me"

2. **Diferenciação por tempo de cookie**:
   - **Com "lembrar-me"**: Cookie expira em 30 dias
   - **Sem "lembrar-me"**: Cookie expira em 1 dia (ao invés de ser sessão)

3. **Sincronização automática entre abas**: Implementado listener de Storage Events que detecta:
   - Login em outra aba → atualiza estado automaticamente
   - Logout em outra aba → faz logout em todas as abas

4. **Tratamento de erros robusto**: Se dados corrompidos no localStorage, limpa tudo automaticamente

## Como Testar

### Teste 1: Login sem "Lembrar-me" + Nova Aba

1. **Limpe o localStorage e cookies**:
   - Abra DevTools (F12)
   - Application → Local Storage → Limpar
   - Application → Cookies → Limpar

2. **Faça login SEM marcar "Lembrar-me"**:
   - Acesse `/login`
   - Insira credenciais
   - **NÃO** marque a opção "Lembrar-me"
   - Clique em "Entrar"

3. **Verifique o estado atual**:
   - DevTools → Console: deve aparecer logs de autenticação
   - DevTools → Application → Local Storage: deve ter `authToken`, `user`, `rememberMe=false`
   - DevTools → Application → Cookies: deve ter cookie `authToken` com expiração de 1 dia

4. **Abra uma NOVA ABA** (Ctrl + T):
   - Navegue para qualquer rota da aplicação (ex: `/vehicles`)
   - **ESPERADO**: Usuário deve estar autenticado
   - **ESPERADO**: Não deve aparecer erro ou redirect para `/login`
   - Verifique no DevTools → Console: deve aparecer logs de inicialização

### Teste 2: Login com "Lembrar-me" + Nova Aba

1. **Faça logout** (se ainda logado)

2. **Faça login COM "Lembrar-me"**:
   - Acesse `/login`
   - Marque "Lembrar-me"
   - Faça login

3. **Verifique localStorage**:
   - `rememberMe` deve estar como `"true"`
   - Cookie deve ter expiração de 30 dias

4. **Abra nova aba**:
   - Deve funcionar normalmente
   - Autenticação deve persistir

### Teste 3: Sincronização Entre Abas (Login)

1. **Prepare o ambiente**:
   - Faça logout
   - Abra 2 abas na página de login lado a lado

2. **Faça login em UMA das abas**:
   - Na Aba 1: faça login
   - **ESPERADO**: Aba 1 redireciona para home

3. **Verifique a Aba 2**:
   - Recarregue a Aba 2 (F5)
   - **ESPERADO**: Deve redirecionar automaticamente para home (está autenticado)

### Teste 4: Sincronização Entre Abas (Logout)

1. **Abra 2 abas** autenticadas em páginas diferentes:
   - Aba 1: `/vehicles`
   - Aba 2: `/maintenances`

2. **Faça logout na Aba 1**

3. **Observe a Aba 2**:
   - Verifique o Console da Aba 2
   - **ESPERADO**: Deve aparecer mensagem "🔄 Auth sincronizada de outra aba (logout)"
   - **ESPERADO**: Ao tentar navegar ou recarregar, será redirecionado para `/login`

### Teste 5: Fechamento e Reabertura do Navegador

**COM "Lembrar-me":**
1. Faça login com "Lembrar-me" marcado
2. **Feche COMPLETAMENTE o navegador**
3. Reabra o navegador
4. Acesse a aplicação
5. **ESPERADO**: Usuário ainda está autenticado (até 30 dias)

**SEM "Lembrar-me":**
1. Faça login sem "Lembrar-me"
2. **Feche COMPLETAMENTE o navegador**
3. Reabra o navegador
4. Acesse a aplicação
5. **ESPERADO**: Usuário ainda está autenticado (até 1 dia)
6. Após 1 dia, será necessário novo login

## Verificações no DevTools

### Console esperado ao abrir nova aba:

```
🔍 Chamando API: https://api-tcc-production-80e5.up.railway.app/...
🔍 [SERVER LOAD]
   URL: /vehicles
   isPublicRoute: false
   hasToken: true
   ✅ ALLOW (has token)
```

### LocalStorage esperado (após login):

```
authToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
user: "{\"id\":1,\"first_name\":\"...\",\"email\":\"...\"}"
rememberMe: "true"  OU  "false"
```

### Cookies esperados:

```
authToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Expires: [data 1 dia ou 30 dias no futuro]
Path: /
SameSite: Strict
```

## Problemas Conhecidos Resolvidos

✅ **Resolvido**: Nova aba não mantinha autenticação
✅ **Resolvido**: sessionStorage não compartilhado entre abas
✅ **Resolvido**: Cookies de sessão não persistindo adequadamente
✅ **Resolvido**: Falta de sincronização entre abas

## Recursos Adicionados

✨ **Sincronização automática**: Logout em uma aba afeta todas
✨ **Melhor UX**: Usuário não precisa fazer login em cada aba
✨ **Recuperação de erros**: Dados corrompidos são limpos automaticamente
✨ **Logs informativos**: Fácil debug no Console

## Notas Importantes

- O localStorage persiste mesmo após fechar o navegador (até ser limpo manualmente ou expirar)
- O cookie é verificado server-side no `+layout.server.ts`
- Events de Storage só disparam em **outras abas**, não na aba que fez a mudança
- Se você limpar cookies/localStorage manualmente, precisará fazer login novamente

## Em Caso de Problemas

Se ainda encontrar problemas de autenticação:

1. **Limpe completamente**:
   - DevTools → Application → Clear storage → Clear site data

2. **Verifique o console** para erros

3. **Verifique se a API está respondendo**:
   - Console deve mostrar: `🔍 Chamando API: https://api-tcc-production-80e5.up.railway.app/...`

4. **Verifique variáveis de ambiente**:
   - `.env` deve ter `VITE_API_URL=https://api-tcc-production-80e5.up.railway.app`
