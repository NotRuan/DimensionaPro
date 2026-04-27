# DimensionaPro — Requisitos Pendentes v1.0 — Design Spec
**Data:** 2026-04-20  
**Status:** Aprovado

---

## Escopo

Implementação de 6 requisitos do PRD que estão ausentes no código atual:

| # | Requisito | Prioridade PRD |
|---|---|---|
| RF-27/28 | Submeter dimensionamento para revisão do gerente | ALTA |
| RF-11 | Painel de resumo do ADM no Dashboard | ALTA |
| RF-29/30 | Exportar PDF e Excel na tela Resultado | MÉDIA |
| RF-21 | Tooltips com ranges nas métricas de qualidade | MÉDIA |
| RF-31 | Histórico por cidade (página dedicada) | MÉDIA |
| RNF-10.5 | Coeficientes configuráveis pelo ADM via painel | MÉDIA |

---

## 1. RF-27/28 — Submeter para Revisão

### O que muda

`frontend/src/pages/Resultado.jsx` substitui o botão único "Salvar e Concluir" por três ações no rodapé:

```
[← Voltar]   [📄 PDF]  [📊 Excel]          [Salvar Rascunho]  [Salvar e Submeter →]
```

### Fluxo "Salvar Rascunho"
1. Chama `dimensionamentosService.criar(payload)` → `POST /api/dimensionamentos`
2. Limpa auto-save e reseta store
3. Redireciona para `/dashboard`
4. Dimensionamento fica com `status_revisao: null`

### Fluxo "Salvar e Submeter para Revisão"
1. Chama `dimensionamentosService.criar(payload)` → obtém `id` do novo registro
2. Chama `dimensionamentosService.submeter(id)` → `PATCH /api/dimensionamentos/:id/submeter`
3. Backend muda `status_revisao` para `PENDENTE` e cria notificações para todos os GERENTEs
4. Limpa auto-save e reseta store
5. Redireciona para `/dashboard`

### Regras
- Ambos os botões só ficam habilitados após `resultado !== null`
- Botões de export (PDF/Excel) ficam à esquerda do rodapé — independentes do salvar
- Nenhuma mudança no backend necessária (endpoint `/submeter` já existe)

---

## 2. RF-11 — Painel de Resumo do ADM

### O que muda

`frontend/src/pages/Dashboard.jsx` exibe faixa de 3 KPI cards **visível apenas quando `perfil === 'ADM'`**, posicionada acima do mapa.

### Cards

| Card | Label | Fonte dos dados |
|---|---|---|
| 1 | Usuários Ativos | `GET /api/users` → `filter(u => u.ativo).length` |
| 2 | Dimensionamentos do Mês | `GET /api/dimensionamentos` → filtrar `created_at` no mês corrente |
| 3 | Pendentes de Revisão | `GET /api/dimensionamentos` → filtrar `status_revisao === 'PENDENTE'` |

### Implementação
- Novo componente `frontend/src/components/dashboard/AdminStats.jsx`
- Usa `useQuery` separado para `/api/users` (só executa quando `perfil === 'ADM'`)
- Reutiliza a query de dimensionamentos já existente no Dashboard (`listaData`) para os outros dois cards
- Nenhuma mudança no backend necessária

---

## 3. RF-29/30 — Exportar PDF e Excel

### O que muda

`frontend/src/pages/Resultado.jsx` — após calcular o índice, botões aparecem no rodapé (esquerda):

- `📄 Exportar PDF` → chama `exportarPDF(store)` — função já aceita o objeto inteiro do store
- `📊 Exportar Excel` → chama `exportarExcel(store)` — mesma assinatura

### Implementação
- `utils/exportPDF.js` e `utils/exportExcel.js` **já existem com lógica completa**
- Só adicionar os botões e passar `useDimensionamentoStore()` diretamente para cada função
- Botões ficam desabilitados até `resultado !== null`
- Nenhuma mudança no backend necessária

---

## 4. RF-21 — Tooltips nas Métricas de Qualidade

### O que muda

`frontend/src/components/dimensionamento/MetricasQualidade.jsx` — cada campo ganha ícone `?` com tooltip.

### Novo componente `Tooltip.jsx`

```
frontend/src/components/ui/Tooltip.jsx
```

- Props: `children` (conteúdo do balão), `label` (texto do campo)
- Implementação: CSS puro com `position: relative` + `:hover` no `?` exibe `position: absolute` escuro
- Sem dependência de biblioteca externa

### Conteúdo dos tooltips

Cada métrica exibe sua tabela de ranges buscada de `utils/coeficientes.js`:

| Métrica | Dados exibidos no tooltip |
|---|---|
| % Recusas | 0–15% → 1,0 / 16–25% → 0,9 / 26–31% → 0,75 / 32–40% → 0,5 / >40% → 0,1 |
| Reclamações (ratio) | 0–0,4 → 1,0 / 0,5–1,0 → 0,75 / 1,1–1,6 → 0,5 / >1,6 → 0,1 |
| Tempo de Chegada | 0–30min → 1,0 / 31–60min → 0,9 / 61–90min → 0,75 / 91–120min → 0,5 / >120min → 0,1 |
| % Deslocamento | 0% → 1,0 / 1–10% → 0,9 / 11–25% → 0,75 / 26–50% → 0,5 / 51–100% → 0,1 |
| % Reembolso | 0% → 1,0 / 1–10% → 0,9 / 11–25% → 0,75 / 26–50% → 0,5 / 51–100% → 0,1 |
| NPS | 70–100 → 1,0 / 60–69 → 0,9 / 50–59 → 0,75 / <50 → 0,1 |

---

## 5. RF-31 — Histórico por Cidade

### Nova rota

```
/historico/:cidade
```

### Nova página `Historico.jsx`

```
frontend/src/pages/Historico.jsx
```

**Estrutura da página:**
1. Header: nome da cidade + botão "← Voltar ao Dashboard"
2. Filtro de tipo de serviço: `[Todos] [Eletricista] [Encanador]`
3. Gráfico de linha (Recharts — já instalado): eixo X = data do dimensionamento, eixo Y = índice de capacidade. Linha vermelha em 1,0 (subdimensionado), verde em 0,9 (adequado).
4. Tabela: data, serviço, índice, status (badge colorido), nº prestadores, consultor, status revisão

**Acesso:**
- Botão "Ver Histórico" no `PainelLateral.jsx` → `navigate('/historico/' + cidade)`

### Backend

`GET /api/dimensionamentos?cidade=BELÉM` — o endpoint **ainda não suporta** filtro por cidade. A função `listar()` em `dimensionamentos.service.js` precisa receber e aplicar o param `cidade` na query Supabase (`.eq('cidade', cidade)` quando presente). A rota em `dimensionamentos.routes.js` precisa extrair `req.query.cidade` e repassar para o service.

---

## 6. RNF-10.5 — Coeficientes Configuráveis pelo ADM

### Nova tabela no Supabase: `configuracoes`

```sql
CREATE TABLE configuracoes (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

Duas chaves iniciais:
- `coeficientes` → JSON com os 6 objetos de ranges (mesmo formato de `utils/coeficientes.js`)
- `parametros_gerais` → `{ coef_seguranca: 0.85, janela_meses: 6 }`

### Novo backend

```
GET  /api/configuracoes         → retorna todas as configs (público autenticado)
PUT  /api/configuracoes/:chave  → atualiza uma chave (ADM only)
```

### Novo service no frontend

```
frontend/src/services/configuracoes.service.js
```

- `buscar()` → `GET /api/configuracoes`
- `salvar(chave, valor)` → `PUT /api/configuracoes/:chave`
- Resultado armazenado em `configuracoes.store.js` (Zustand) ao iniciar o app (`App.jsx`)
- `utils/coeficientes.js` passa a ler do store; fallback para valores hardcoded se store vazio

### Nova página `/admin/configuracoes`

```
frontend/src/pages/admin/Configuracoes.jsx
```

**Estrutura:**
1. Seção "Parâmetros Gerais": inputs para coeficiente de segurança e janela de meses
2. Seção "Coeficientes de Qualidade": tabela com 6 linhas (métricas) × 5 colunas (coeficientes). Cada célula é um input de texto editável com o range (ex: "0–15%")
3. Botão "Salvar Configurações" → chama `configuracoes.service.salvar()` para cada chave
4. Toast de confirmação ou erro

**Sidebar admin** ganha link "Configurações" para `/admin/configuracoes`.

---

## Arquivos Afetados

### Novos arquivos
| Arquivo | Descrição |
|---|---|
| `frontend/src/components/ui/Tooltip.jsx` | Componente tooltip reutilizável |
| `frontend/src/components/dashboard/AdminStats.jsx` | Faixa de KPIs do ADM |
| `frontend/src/pages/Historico.jsx` | Página de histórico por cidade |
| `frontend/src/pages/admin/Configuracoes.jsx` | Página de config de coeficientes |
| `frontend/src/services/configuracoes.service.js` | Service para leitura/escrita de configs |
| `frontend/src/store/configuracoesStore.js` | Zustand store para configs globais |
| `backend/src/routes/configuracoes.routes.js` | Endpoints GET e PUT |
| `backend/src/services/configuracoes.service.js` | Lógica de leitura/escrita no Supabase |
| `supabase/migrations/003_configuracoes.sql` | Migração: tabela `configuracoes` com seed |

### Arquivos modificados
| Arquivo | O que muda |
|---|---|
| `frontend/src/pages/Resultado.jsx` | Substituir "Salvar e Concluir" por 4 ações (rascunho, submeter, PDF, Excel) |
| `frontend/src/pages/Dashboard.jsx` | Adicionar `<AdminStats>` condicional para ADM |
| `frontend/src/components/dimensionamento/MetricasQualidade.jsx` | Adicionar `<Tooltip>` em cada campo |
| `frontend/src/components/dashboard/PainelLateral.jsx` | Adicionar botão "Ver Histórico" |
| `frontend/src/utils/coeficientes.js` | Ler do configuracoesStore com fallback hardcoded |
| `frontend/src/App.jsx` | Carregar configs ao iniciar |
| `frontend/src/router/index.jsx` | Adicionar rotas `/historico/:cidade` e `/admin/configuracoes` |
| `frontend/src/components/layout/Sidebar.jsx` | Adicionar link "Configurações" no menu admin |
| `backend/src/app.js` | Montar rota `/api/configuracoes` |
| `backend/src/services/dimensionamentos.service.js` | Suporte ao param `cidade` na listagem |

---

## Dependências e Ordem de Implementação

```
[003_configuracoes.sql]
        ↓
[backend: configuracoes routes + service]
        ↓
[frontend: configuracoesStore + service + App.jsx carrega]
        ↓
[coeficientes.js lê do store]          [Historico.jsx + rota]
        ↓                                      ↓
[/admin/configuracoes page]        [PainelLateral: btn histórico]
        ↓
[Tooltip.jsx] → [MetricasQualidade.jsx]
        ↓
[AdminStats.jsx] → [Dashboard.jsx]
        ↓
[Resultado.jsx: 4 ações (rascunho / submeter / PDF / Excel)]
```

Items sem dependência entre si (podem ser feitos em paralelo após o backend de configs):
- RF-21 (Tooltips)
- RF-11 (AdminStats)
- RF-29/30 (Export no Resultado)
- RF-31 (Histórico)

---

## Não está no escopo deste spec

- RF-09/RF-12: Atribuição de cidades por consultor (separado)
- RF-17: Drag-and-drop para reordenar prestadores (separado)
- Drag-and-drop de CSV, bulk import de usuários
- Notificação por e-mail
- Mobile responsiveness
