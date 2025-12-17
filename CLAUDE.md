# Mudanças Pendentes - Dashboard

## 🐛 PROBLEMA IDENTIFICADO: Dados não estão sendo exibidos no gráfico

### Diagnóstico
O console mostra `"No monthly expenses data"`, indicando que `monthlyExpenses` está vazio quando `calculateCategoryDistribution()` é chamado.

**Possíveis causas:**
1. A função reativa é executada antes do `onMount` carregar os dados
2. A API pode estar retornando dados em formato diferente do esperado
3. Os campos `fuel` e `maintenance` podem estar com valor 0

**Próximos passos:**
1. ✅ Adicionar log para ver os dados retornados pela API
2. ⏳ Verificar estrutura dos dados no console
3. ⏳ Ajustar lógica se necessário

---

## fix: corrigir estrutura e exibição do gráfico de Distribuição por Categoria

### Descrição
Corrige a estrutura HTML do gráfico donut (rosca) de Distribuição por Categoria que não estava sendo exibido corretamente. O problema era que o texto central estava fora do container relativo.

### Mudanças realizadas

**Arquivo:** `src/routes/+page.svelte`

1. **Estrutura HTML corrigida**
   - O container do gráfico agora tem `relative mx-auto h-48 w-48` para posicionar corretamente
   - O texto central (`absolute inset-0`) agora está dentro do container relativo do SVG
   - Removido container desnecessário que causava problemas de layout

2. **Melhorias de formatação**
   - Substituído `toLocaleString('pt-BR')` por `formatCurrency()` para consistência
   - Aplicado em ambos: valor total central e valores da legenda

3. **Layout otimizado**
   - Container principal alterado de `flex flex-col items-center justify-center gap-6` para `space-y-6`
   - Adicionado `mx-auto` no container do SVG para centralização
   - Removido `w-full` desnecessário da legenda

### Detalhes técnicos

Antes:
```html
<div class="flex flex-col items-center justify-center gap-6">
    <div class="relative h-48 w-48 shrink-0">
        <svg>...</svg>
    </div>
    <!-- Texto central estava FORA do container relativo -->
    <div class="absolute inset-0 flex items-center justify-center">
        ...
    </div>
</div>
```

Depois:
```html
<div class="space-y-6">
    <div class="relative mx-auto h-48 w-48">
        <svg>...</svg>
        <!-- Texto central agora está DENTRO do container relativo -->
        <div class="absolute inset-0 flex items-center justify-center">
            ...
        </div>
    </div>
</div>
```

### Impacto
- ✅ Gráfico de rosca agora é exibido corretamente
- ✅ Texto central mostra o valor total formatado
- ✅ Legenda abaixo do gráfico funciona normalmente
- ✅ Layout responsivo mantido

### Arquivos modificados
- `src/routes/+page.svelte` (linhas 404-472)

---

_Última atualização: 2025-12-17_
