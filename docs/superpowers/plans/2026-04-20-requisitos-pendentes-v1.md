# DimensionaPro — Requisitos Pendentes v1.0 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar 6 requisitos ausentes no sistema: submissão para revisão, painel ADM, exportação PDF/Excel, tooltips de métricas, histórico por cidade e coeficientes configuráveis.

**Architecture:** Backend Express + Supabase; Frontend React 19 + Zustand + TanStack Query + Recharts. Novos recursos de configuração usam tabela `configuracoes` no Supabase com chave/valor JSON. Coeficientes lidos do store Zustand com fallback para valores hardcoded em `coeficientes.js`.

**Tech Stack:** React 19, Zustand, TanStack Query, Recharts (já instalado), jsPDF + xlsx (já instalados), Express, Supabase JS, TailwindCSS.

---

## Mapa de Arquivos

### Novos arquivos
| Arquivo | Responsabilidade |
|---|---|
| `supabase/migrations/003_configuracoes.sql` | Tabela `configuracoes` com seed dos valores padrão |
| `backend/src/routes/configuracoes.routes.js` | GET `/api/configuracoes`, PUT `/api/configuracoes/:chave` |
| `backend/src/services/configuracoes.service.js` | Leitura e escrita de configs no Supabase |
| `frontend/src/store/configuracoesStore.js` | Zustand store: tabela, coefSeguranca, janelaMeses |
| `frontend/src/services/configuracoes.service.js` | `buscar()` e `salvar(chave, valor)` |
| `frontend/src/components/ui/Tooltip.jsx` | Ícone `?` com balão hover |
| `frontend/src/components/dashboard/AdminStats.jsx` | 3 cards KPI visíveis só para ADM |
| `frontend/src/pages/Historico.jsx` | Gráfico + tabela de histórico por cidade |
| `frontend/src/pages/admin/Configuracoes.jsx` | Tabela editável de coeficientes para ADM |

### Arquivos modificados
| Arquivo | O que muda |
|---|---|
| `backend/src/services/dimensionamentos.service.js` | `listar()` aceita param `cidade` |
| `backend/src/routes/dimensionamentos.routes.js` | Passa `req.query.cidade` ao service |
| `backend/src/app.js` | Monta rota `/api/configuracoes` |
| `frontend/src/utils/coeficientes.js` | Adiciona `getCoeficienteFromTabela(metrica, valor, tabela)` |
| `frontend/src/utils/calculos.js` | `calcularPrestador(dados, config?)` aceita tabela e coefSeguranca opcionais |
| `frontend/src/store/dimensionamentoStore.js` | Passa config do store para `calcularPrestador` |
| `frontend/src/components/dimensionamento/MetricasQualidade.jsx` | Usa `Tooltip`, lê tabela do configuracoesStore |
| `frontend/src/components/dashboard/PainelLateral.jsx` | Botão "Ver Histórico" |
| `frontend/src/pages/Dashboard.jsx` | Adiciona `<AdminStats>` condicional |
| `frontend/src/pages/Resultado.jsx` | 4 ações: Salvar Rascunho, Submeter, PDF, Excel |
| `frontend/src/router/index.jsx` | Rotas `/historico/:cidade` e `/admin/configuracoes` |
| `frontend/src/components/layout/Sidebar.jsx` | Link "Configurações" no menu ADM |
| `frontend/src/App.jsx` | Carrega configs do backend ao iniciar |
| `frontend/src/services/dimensionamentos.service.js` | Adiciona `listarPorCidade(cidade)` |

---

## Task 1: Migração do banco — tabela `configuracoes`

**Files:**
- Create: `supabase/migrations/003_configuracoes.sql`

- [ ] **Criar o arquivo de migração com seed dos valores padrão**

```sql
-- supabase/migrations/003_configuracoes.sql

CREATE TABLE IF NOT EXISTS configuracoes (
  chave      TEXT PRIMARY KEY,
  valor      JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO configuracoes (chave, valor) VALUES
('coeficientes', '{
  "recusas":      [{"min":0,"max":15,"coef":1.00},{"min":15.01,"max":25,"coef":0.90},{"min":25.01,"max":31,"coef":0.75},{"min":31.01,"max":40,"coef":0.50},{"min":40.01,"max":999999,"coef":0.10}],
  "reclamacoes":  [{"min":0,"max":0.40,"coef":1.00},{"min":0.41,"max":1.00,"coef":0.75},{"min":1.01,"max":1.60,"coef":0.50},{"min":1.61,"max":999999,"coef":0.10}],
  "tempoChegada": [{"min":0,"max":30,"coef":1.00},{"min":31,"max":60,"coef":0.90},{"min":61,"max":90,"coef":0.75},{"min":91,"max":120,"coef":0.50},{"min":121,"max":999999,"coef":0.10}],
  "deslocamento": [{"min":0,"max":0,"coef":1.00},{"min":0.01,"max":10,"coef":0.90},{"min":10.01,"max":25,"coef":0.75},{"min":25.01,"max":50,"coef":0.50},{"min":50.01,"max":999999,"coef":0.10}],
  "reembolso":    [{"min":0,"max":0,"coef":1.00},{"min":0.01,"max":10,"coef":0.90},{"min":10.01,"max":25,"coef":0.75},{"min":25.01,"max":50,"coef":0.50},{"min":50.01,"max":999999,"coef":0.10}],
  "nps":          [{"min":70,"max":100,"coef":1.00},{"min":60,"max":69.99,"coef":0.90},{"min":50,"max":59.99,"coef":0.75},{"min":-100,"max":49.99,"coef":0.10}]
}'),
('parametros_gerais', '{"coef_seguranca":{"ELETRICISTA":0.85,"ENCANADOR":0.85},"janela_meses":6}')
ON CONFLICT (chave) DO NOTHING;
```

- [ ] **Executar a migração no Supabase**

Acesse o Supabase Dashboard → SQL Editor → cole o conteúdo do arquivo → Run.

Verificar: `SELECT chave, updated_at FROM configuracoes;` deve retornar 2 linhas.

- [ ] **Commit**

```bash
git add supabase/migrations/003_configuracoes.sql
git commit -m "feat: add configuracoes table with default coefficient seed"
```

---

## Task 2: Backend — API de configurações

**Files:**
- Create: `backend/src/services/configuracoes.service.js`
- Create: `backend/src/routes/configuracoes.routes.js`
- Modify: `backend/src/app.js`

- [ ] **Criar `backend/src/services/configuracoes.service.js`**

```js
const supabase = require('../config/supabase')

async function buscarTodas() {
  const { data, error } = await supabase.from('configuracoes').select('chave, valor')
  if (error) throw error
  return data.reduce((acc, row) => ({ ...acc, [row.chave]: row.valor }), {})
}

async function salvar(chave, valor) {
  const { data, error } = await supabase
    .from('configuracoes')
    .upsert({ chave, valor, updated_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

module.exports = { buscarTodas, salvar }
```

- [ ] **Criar `backend/src/routes/configuracoes.routes.js`**

```js
const router = require('express').Router()
const svc = require('../services/configuracoes.service')
const authMiddleware = require('../middlewares/auth.middleware')
const roleMiddleware = require('../middlewares/role.middleware')

// GET é público: configs não são sensíveis e precisam ser lidas antes do login (ConfigLoader no App.jsx)
router.get('/', async (req, res, next) => {
  try { res.json({ success: true, data: await svc.buscarTodas() }) }
  catch (err) { next(err) }
})

// PUT exige auth e perfil ADM
router.put('/:chave', authMiddleware, roleMiddleware(['ADM']), async (req, res, next) => {
  try {
    const { valor } = req.body
    if (!valor) return res.status(422).json({ success: false, error: { message: 'valor é obrigatório' } })
    res.json({ success: true, data: await svc.salvar(req.params.chave, valor) })
  } catch (err) { next(err) }
})

module.exports = router
```

- [ ] **Montar a rota em `backend/src/app.js`**

Encontre o bloco onde as outras rotas são montadas (ex: `app.use('/api/users', ...)`) e adicione:

```js
const configuracoesRouter = require('./routes/configuracoes.routes')
// junto das outras linhas app.use:
app.use('/api/configuracoes', configuracoesRouter)
```

- [ ] **Verificar manualmente**

Com o backend rodando (`cd backend && npm run dev`), testar:
```bash
curl -H "Authorization: Bearer <token_adm>" http://localhost:3001/api/configuracoes
```
Deve retornar JSON com as duas chaves (`coeficientes` e `parametros_gerais`).

- [ ] **Commit**

```bash
git add backend/src/services/configuracoes.service.js backend/src/routes/configuracoes.routes.js backend/src/app.js
git commit -m "feat: add configuracoes API (GET all, PUT by key, ADM only write)"
```

---

## Task 3: Backend — filtro por cidade na listagem de dimensionamentos

**Files:**
- Modify: `backend/src/services/dimensionamentos.service.js:5-17`
- Modify: `backend/src/routes/dimensionamentos.routes.js:13-16`

- [ ] **Modificar `listar()` em `dimensionamentos.service.js`**

Substitua a função `listar` atual (linhas 5-17) por:

```js
async function listar(usuario, filtros = {}) {
  let query = supabase
    .from('dimensionamentos')
    .select('*, consultor:usuarios!consultor_id(nome, email)')
    .order('created_at', { ascending: false })

  if (usuario.perfil === 'CONSULTOR') {
    query = query.eq('consultor_id', usuario.id)
  }

  if (filtros.cidade) {
    query = query.eq('cidade', filtros.cidade)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
```

- [ ] **Modificar a rota GET `/` em `dimensionamentos.routes.js`**

Substitua a linha atual:
```js
// de:
try { res.json({ success: true, data: await svc.listar(req.user) }) }
// para:
try {
  const filtros = {}
  if (req.query.cidade) filtros.cidade = req.query.cidade
  res.json({ success: true, data: await svc.listar(req.user, filtros) })
}
```

- [ ] **Verificar manualmente**

```bash
curl -H "Authorization: Bearer <token>" "http://localhost:3001/api/dimensionamentos?cidade=BELÉM"
```
Deve retornar apenas dimensionamentos da cidade BELÉM.

- [ ] **Commit**

```bash
git add backend/src/services/dimensionamentos.service.js backend/src/routes/dimensionamentos.routes.js
git commit -m "feat: add cidade filter param to dimensionamentos list endpoint"
```

---

## Task 4: Frontend — configuracoesStore + service

**Files:**
- Create: `frontend/src/store/configuracoesStore.js`
- Create: `frontend/src/services/configuracoes.service.js`

- [ ] **Criar `frontend/src/store/configuracoesStore.js`**

```js
import { create } from 'zustand'
import { TABELA_COEFICIENTES, COEF_SEGURANCA } from '../utils/coeficientes'

export const useConfiguracoesStore = create((set) => ({
  tabela:       TABELA_COEFICIENTES,
  coefSeguranca: COEF_SEGURANCA,
  janelaMeses:  6,
  carregado:    false,

  setConfiguracoes: (configs) => set({
    tabela:        configs.coeficientes      ?? TABELA_COEFICIENTES,
    coefSeguranca: configs.parametros_gerais?.coef_seguranca ?? COEF_SEGURANCA,
    janelaMeses:   configs.parametros_gerais?.janela_meses   ?? 6,
    carregado:     true,
  }),
}))
```

- [ ] **Criar `frontend/src/services/configuracoes.service.js`**

```js
import api from './api'

export const configuracoesService = {
  buscar:  ()             => api.get('/configuracoes'),
  salvar:  (chave, valor) => api.put(`/configuracoes/${chave}`, { valor }),
}
```

- [ ] **Commit**

```bash
git add frontend/src/store/configuracoesStore.js frontend/src/services/configuracoes.service.js
git commit -m "feat: add configuracoesStore and configuracoes service"
```

---

## Task 5: Frontend — carregar configs ao iniciar + coeficientes dinâmicos

**Files:**
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/utils/coeficientes.js`
- Modify: `frontend/src/utils/calculos.js`
- Modify: `frontend/src/store/dimensionamentoStore.js`

- [ ] **Modificar `App.jsx` para carregar configs ao iniciar**

Substitua o conteúdo de `frontend/src/App.jsx` por:

```jsx
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { ToastProvider } from './components/ui/Toast'
import { router } from './router'
import { configuracoesService } from './services/configuracoes.service'
import { useConfiguracoesStore } from './store/configuracoesStore'

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })

function ConfigLoader() {
  const setConfiguracoes = useConfiguracoesStore(s => s.setConfiguracoes)
  useEffect(() => {
    configuracoesService.buscar()
      .then(r => setConfiguracoes(r.data.data))
      .catch(() => {}) // fallback: store mantém defaults hardcoded
  }, [])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ConfigLoader />
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}
```

- [ ] **Adicionar `getCoeficienteFromTabela` em `coeficientes.js`**

Adicione no final de `frontend/src/utils/coeficientes.js` (após o export existente de `getCoeficiente`):

```js
export function getCoeficienteFromTabela(metrica, valor, tabela) {
  if (valor === null || valor === undefined || valor === '') return null
  const num = parseFloat(valor)
  if (isNaN(num)) return null
  const range = tabela[metrica]?.find(r => num >= r.min && num <= r.max)
  return range?.coef ?? null
}
```

- [ ] **Modificar `calculos.js` para aceitar config opcional**

Substitua o conteúdo de `frontend/src/utils/calculos.js` por:

```js
import { getCoeficiente, getCoeficienteFromTabela, COEF_SEGURANCA } from './coeficientes'

export function calcularPrestador(dados, config = {}) {
  const {
    qtd_profissionais, servicos_por_dia = 6,
    volume_mawdy, volumetria_total, tipo_servico,
    pct_recusas, reclamacoes_ratio, tempo_chegada_min,
    pct_deslocamento, pct_reembolso, nps,
  } = dados

  const qp  = parseFloat(qtd_profissionais) || 0
  const spd = parseFloat(servicos_por_dia)  || 6
  const vm  = parseFloat(volume_mawdy)      || 0
  const vt  = parseFloat(volumetria_total)  || 0

  const servicos_diarios      = qp * spd
  const capacidade_mensal     = servicos_diarios * 30
  const dedicacao_mawdy       = vt > 0 ? vm / vt : 0
  const total_recursos_mapfre = qp * dedicacao_mawdy
  const cap_teorica           = total_recursos_mapfre * spd * 30
  const pct_mawdy_capacidade  = capacidade_mensal > 0 ? vm / capacidade_mensal : 0

  const obterCoef = config.tabela
    ? (m, v) => getCoeficienteFromTabela(m, v, config.tabela)
    : (m, v) => getCoeficiente(m, v)

  const segurancaConfig = config.coefSeguranca ?? COEF_SEGURANCA

  const cf_recusas       = obterCoef('recusas',      pct_recusas)
  const cf_reclamacoes   = obterCoef('reclamacoes',  reclamacoes_ratio)
  const cf_tempo_chegada = obterCoef('tempoChegada', tempo_chegada_min)
  const cf_deslocamento  = obterCoef('deslocamento', pct_deslocamento)
  const cf_reembolso     = obterCoef('reembolso',    pct_reembolso)
  const cf_nps           = obterCoef('nps',          nps)
  const cf_seguranca     = segurancaConfig[tipo_servico] ?? 0.85

  const coefs = [cf_recusas, cf_reclamacoes, cf_tempo_chegada, cf_deslocamento, cf_reembolso, cf_nps]
  const todosPreenchidos = coefs.every(c => c !== null)

  const capacidade_real = todosPreenchidos
    ? coefs.reduce((acc, c) => acc * c, cap_teorica) * cf_seguranca
    : null

  return {
    servicos_diarios, capacidade_mensal, dedicacao_mawdy,
    pct_mawdy_capacidade, cap_teorica,
    cf_recusas, cf_reclamacoes, cf_tempo_chegada,
    cf_deslocamento, cf_reembolso, cf_nps, cf_seguranca,
    capacidade_real,
  }
}

export function calcularIndiceCidade(prestadores, demanda) {
  const cap_total = prestadores.reduce((s, p) => s + (p.capacidade_real ?? 0), 0)
  const dem = parseFloat(demanda) || 0
  const indice = dem > 0 ? cap_total / dem : null

  const status =
    indice === null  ? null              :
    indice >= 1.0    ? 'ADEQUADO'        :
    indice >= 0.9    ? 'ATENCAO'         :
                       'SUBDIMENSIONADO'

  return { cap_total, indice, status }
}
```

- [ ] **Modificar `dimensionamentoStore.js` para usar config do store**

Na função `atualizarPrestador`, substitua a linha `const calc = calcularPrestador(atualizado)` por:

```js
// Adicione este import no topo do arquivo:
import { useConfiguracoesStore } from './configuracoesStore'

// Dentro de atualizarPrestador, troque:
// const calc = calcularPrestador(atualizado)
// por:
const { tabela, coefSeguranca } = useConfiguracoesStore.getState()
const calc = calcularPrestador(atualizado, { tabela, coefSeguranca })
```

O topo do arquivo fica:
```js
import { create } from 'zustand'
import { calcularPrestador, calcularIndiceCidade } from '../utils/calculos'
import { calcularJanela6Meses } from '../utils/janelaReferencia'
import { useConfiguracoesStore } from './configuracoesStore'
```

E a linha dentro de `atualizarPrestador` (após `if (hasVolume && hasProfissionais && hasVolumetria) {`):
```js
const { tabela, coefSeguranca } = useConfiguracoesStore.getState()
const calc = calcularPrestador(atualizado, { tabela, coefSeguranca })
```

- [ ] **Verificar no browser**

Inicie frontend e backend. Abra o console do browser → aba Network → filtre por `configuracoes`. Deve aparecer uma request `GET /api/configuracoes` com status 200 ao carregar a app.

- [ ] **Commit**

```bash
git add frontend/src/App.jsx frontend/src/utils/coeficientes.js frontend/src/utils/calculos.js frontend/src/store/dimensionamentoStore.js
git commit -m "feat: load configuracoes from API on startup, support dynamic coefficient tables"
```

---

## Task 6: Frontend — página /admin/configuracoes

**Files:**
- Create: `frontend/src/pages/admin/Configuracoes.jsx`
- Modify: `frontend/src/router/index.jsx`
- Modify: `frontend/src/components/layout/Sidebar.jsx`

- [ ] **Criar `frontend/src/pages/admin/Configuracoes.jsx`**

```jsx
import { useState } from 'react'
import { useConfiguracoesStore } from '../../store/configuracoesStore'
import { configuracoesService } from '../../services/configuracoes.service'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/Toast'

const LABELS = {
  recusas:      '% Recusas',
  reclamacoes:  'Reclamações (ratio)',
  tempoChegada: 'Tempo de Chegada (min)',
  deslocamento: '% Deslocamento',
  reembolso:    '% Reembolso',
  nps:          'NPS',
}
const COEF_COLS = [1.0, 0.9, 0.75, 0.5, 0.1]

function rangeLabel(faixa) {
  if (!faixa) return '—'
  const maxStr = faixa.max >= 999999 ? '∞' : String(faixa.max)
  return `${faixa.min}–${maxStr}`
}

export default function Configuracoes() {
  const store = useConfiguracoesStore()
  const toast = useToast()
  const [tabela, setTabela] = useState(() => JSON.parse(JSON.stringify(store.tabela)))
  const [coefSeg, setCoefSeg] = useState(() => ({ ...store.coefSeguranca }))
  const [janela, setJanela] = useState(store.janelaMeses)
  const [salvando, setSalvando] = useState(false)

  const updateMax = (metrica, faixaIdx, valor) => {
    setTabela(prev => {
      const nova = JSON.parse(JSON.stringify(prev))
      nova[metrica][faixaIdx].max = parseFloat(valor) || 0
      return nova
    })
  }

  const handleSalvar = async () => {
    setSalvando(true)
    try {
      await configuracoesService.salvar('coeficientes', tabela)
      await configuracoesService.salvar('parametros_gerais', {
        coef_seguranca: coefSeg,
        janela_meses: parseInt(janela) || 6,
      })
      store.setConfiguracoes({ coeficientes: tabela, parametros_gerais: { coef_seguranca: coefSeg, janela_meses: parseInt(janela) || 6 } })
      toast('Configurações salvas!', 'success')
    } catch {
      toast('Erro ao salvar configurações', 'error')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900">Configurações do Sistema</h1>

      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-800">Parâmetros Gerais</h2>
        <div className="flex gap-6 flex-wrap">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Coeficiente de Segurança — Eletricista</label>
            <input type="number" step="0.01" min="0" max="1"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-mapfre-red"
              value={coefSeg.ELETRICISTA ?? 0.85}
              onChange={e => setCoefSeg(prev => ({ ...prev, ELETRICISTA: parseFloat(e.target.value) || 0.85 }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Coeficiente de Segurança — Encanador</label>
            <input type="number" step="0.01" min="0" max="1"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-mapfre-red"
              value={coefSeg.ENCANADOR ?? 0.85}
              onChange={e => setCoefSeg(prev => ({ ...prev, ENCANADOR: parseFloat(e.target.value) || 0.85 }))}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Janela de Referência (meses)</label>
            <input type="number" min="1" max="24"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-24 focus:outline-none focus:ring-2 focus:ring-mapfre-red"
              value={janela}
              onChange={e => setJanela(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
        <h2 className="font-semibold text-gray-800">Coeficientes de Qualidade</h2>
        <p className="text-sm text-gray-500">Edite o limite máximo de cada faixa. O sistema interpreta os valores como intervalos contínuos entre linhas consecutivas.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Métrica</th>
                {COEF_COLS.map(c => (
                  <th key={c} className="px-3 py-2 text-xs font-semibold text-gray-600">Coef. {c.toFixed(2)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(tabela).map(([metrica, faixas]) => (
                <tr key={metrica} className="border-t border-gray-100">
                  <td className="px-3 py-2 font-medium text-gray-700">{LABELS[metrica] ?? metrica}</td>
                  {COEF_COLS.map((coef, colIdx) => {
                    const faixaIdx = faixas.findIndex(f => f.coef === coef)
                    const faixa = faixas[faixaIdx]
                    if (!faixa) return <td key={colIdx} className="px-3 py-2 text-gray-300 text-center">—</td>
                    return (
                      <td key={colIdx} className="px-3 py-2">
                        <div className="text-xs text-gray-400 mb-1">max:</div>
                        {faixa.max >= 999999
                          ? <span className="text-xs text-gray-400">∞ (fixo)</span>
                          : <input
                              type="number"
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-mapfre-red"
                              value={faixa.max}
                              onChange={e => updateMax(metrica, faixaIdx, e.target.value)}
                            />
                        }
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar Configurações'}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Adicionar rota em `router/index.jsx`**

No topo, adicione o import:
```js
import Configuracoes from '../pages/admin/Configuracoes'
```

Dentro do bloco `perfis={['ADM']}`, adicione após a rota existente de `/admin/base`:
```js
{ path: '/admin/configuracoes', element: <Configuracoes /> },
```

- [ ] **Adicionar link na `Sidebar.jsx`**

No bloco `{perfil === PERFIS.ADM && (...)}`, adicione após o link de `/admin/base`:
```jsx
<NavLink to="/admin/configuracoes" className={({ isActive }) => `${link} ${isActive ? active : ''}`}>⚙️ Configurações</NavLink>
```

- [ ] **Verificar no browser**

Logar como ADM → sidebar deve mostrar "Configurações" → clicar → página deve carregar com os valores atuais da tabela. Editar um valor → clicar "Salvar" → toast de sucesso → verificar no Supabase Dashboard que o valor foi atualizado.

- [ ] **Commit**

```bash
git add frontend/src/pages/admin/Configuracoes.jsx frontend/src/router/index.jsx frontend/src/components/layout/Sidebar.jsx
git commit -m "feat: admin configuracoes page — editable coefficient table and general params"
```

---

## Task 7: RF-21 — Tooltip component + MetricasQualidade

**Files:**
- Create: `frontend/src/components/ui/Tooltip.jsx`
- Modify: `frontend/src/components/dimensionamento/MetricasQualidade.jsx`

- [ ] **Criar `frontend/src/components/ui/Tooltip.jsx`**

```jsx
export function Tooltip({ content }) {
  return (
    <span className="relative inline-flex items-center group/tip ml-1">
      <span className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] inline-flex items-center justify-center cursor-help select-none">
        ?
      </span>
      <div className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover/tip:block z-50 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 w-64 whitespace-normal shadow-lg">
        {content}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
      </div>
    </span>
  )
}
```

- [ ] **Atualizar `MetricasQualidade.jsx`**

Substitua o conteúdo completo do arquivo por:

```jsx
import { Input } from '../ui/Input'
import { Tooltip } from '../ui/Tooltip'
import { CoeficienteDisplay } from './CoeficienteDisplay'
import { getCoeficienteFromTabela, getCoeficiente, TOOLTIPS, COEF_SEGURANCA } from '../../utils/coeficientes'
import { useConfiguracoesStore } from '../../store/configuracoesStore'
import { fmt } from '../../utils/formatters'

const METRICAS = [
  { key: 'pct_recusas',       label: '% Recusas',          suffix: '%',   coefKey: 'recusas' },
  { key: 'reclamacoes_ratio', label: 'Reclamações (ratio)', suffix: '',    coefKey: 'reclamacoes' },
  { key: 'tempo_chegada_min', label: 'Tempo de Chegada',    suffix: 'min', coefKey: 'tempoChegada' },
  { key: 'pct_deslocamento',  label: '% Deslocamento',      suffix: '%',   coefKey: 'deslocamento' },
  { key: 'pct_reembolso',     label: '% Reembolso',         suffix: '%',   coefKey: 'reembolso' },
  { key: 'nps',               label: 'NPS',                  suffix: '',   coefKey: 'nps' },
]

export function MetricasQualidade({ prestador, onUpdate }) {
  const tabela = useConfiguracoesStore(s => s.tabela)
  const coefSeguranca = useConfiguracoesStore(s => s.coefSeguranca)
  const { cap_teorica, capacidade_real, tipo_servico } = prestador

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
      <div className="mb-3">
        <p className="font-semibold text-gray-900">{prestador.nome_prestador} — {tipo_servico === 'ELETRICISTA' ? 'Eletricista' : 'Encanador'}</p>
        <p className="text-sm text-gray-500">Volume MAWDY: {prestador.volume_mawdy} serv/mês · Cap. Teórica: {fmt.numero(cap_teorica, 1)}</p>
      </div>

      <div className="flex flex-col gap-2">
        {METRICAS.map(m => {
          const val = prestador[m.key]
          const coef = getCoeficienteFromTabela(m.coefKey, val, tabela)
          return (
            <div key={m.key} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">{m.label}</span>
                  <Tooltip content={TOOLTIPS[m.coefKey]} />
                </div>
                <Input
                  type="number"
                  value={prestador[m.key] ?? ''}
                  onChange={e => onUpdate(prestador._id, { [m.key]: e.target.value })}
                  suffix={m.suffix}
                  required
                />
              </div>
              <div className="mt-2 w-14 text-center">
                <CoeficienteDisplay valor={coef} />
              </div>
            </div>
          )
        })}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-sm text-gray-500">Coeficiente de Segurança (automático)</span>
          <CoeficienteDisplay valor={coefSeguranca[tipo_servico] ?? COEF_SEGURANCA[tipo_servico]} />
        </div>

        <div className={`flex items-center justify-between px-3 py-2 rounded-lg ${capacidade_real != null ? 'bg-blue-50' : 'bg-gray-50'}`}>
          <span className="text-sm font-semibold text-gray-700">Capacidade Real</span>
          <span className="text-sm font-bold text-blue-700">{fmt.numero(capacidade_real, 1)} serv/mês</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Verificar no browser**

Ir até `/dimensionamento/qualidade` → preencher ao menos um prestador no passo 1 → na tela de métricas, passar o mouse sobre o `?` ao lado de "% Recusas" → balão escuro deve aparecer com os ranges.

- [ ] **Commit**

```bash
git add frontend/src/components/ui/Tooltip.jsx frontend/src/components/dimensionamento/MetricasQualidade.jsx
git commit -m "feat: add Tooltip component and ? icons to quality metric fields (RF-21)"
```

---

## Task 8: RF-11 — AdminStats no Dashboard

**Files:**
- Create: `frontend/src/components/dashboard/AdminStats.jsx`
- Modify: `frontend/src/pages/Dashboard.jsx`

- [ ] **Criar `frontend/src/components/dashboard/AdminStats.jsx`**

```jsx
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

function StatCard({ label, value, cor }) {
  const cores = {
    blue:   'bg-blue-50 border-blue-200 text-blue-700',
    red:    'bg-red-50 border-red-200 text-red-700',
    green:  'bg-green-50 border-green-200 text-green-700',
  }
  return (
    <div className={`border rounded-xl p-4 flex flex-col gap-1 ${cores[cor] ?? cores.blue}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-3xl font-bold">{value ?? '—'}</p>
    </div>
  )
}

export function AdminStats({ dimensionamentos }) {
  const { data: usuarios } = useQuery({
    queryKey: ['usuarios-stats'],
    queryFn: () => api.get('/users').then(r => r.data.data),
  })

  const agora = new Date()
  const mesAtual = agora.getMonth()
  const anoAtual = agora.getFullYear()

  const totalAtivos = (usuarios || []).filter(u => u.ativo).length

  const dimsMes = (dimensionamentos || []).filter(d => {
    const criado = new Date(d.created_at)
    return criado.getMonth() === mesAtual && criado.getFullYear() === anoAtual
  }).length

  const pendentes = (dimensionamentos || []).filter(d => d.status_revisao === 'PENDENTE').length

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="Usuários Ativos"         value={totalAtivos} cor="blue"  />
      <StatCard label="Dimensionamentos no Mês" value={dimsMes}     cor="green" />
      <StatCard label="Pendentes de Revisão"    value={pendentes}   cor="red"   />
    </div>
  )
}
```

- [ ] **Adicionar `<AdminStats>` no `Dashboard.jsx`**

No topo de `Dashboard.jsx`, adicione o import:
```js
import { AdminStats } from '../components/dashboard/AdminStats'
import { PERFIS } from '../constants'
```

(Se `PERFIS` já está importado, não duplique.)

Dentro do JSX retornado, logo após a `<div className="flex items-center justify-between">` que contém o título "Dashboard" e o botão de novo dimensionamento, adicione um bloco condicional:

```jsx
{perfil === PERFIS.ADM && listaData && (
  <AdminStats dimensionamentos={listaData} />
)}
```

- [ ] **Verificar no browser**

Logar como ADM → Dashboard deve mostrar 3 cards acima do mapa. Logar como CONSULTOR ou GERENTE → cards não devem aparecer.

- [ ] **Commit**

```bash
git add frontend/src/components/dashboard/AdminStats.jsx frontend/src/pages/Dashboard.jsx
git commit -m "feat: add admin KPI stats panel to dashboard (RF-11)"
```

---

## Task 9: RF-31 — Página de Histórico por Cidade

**Files:**
- Create: `frontend/src/pages/Historico.jsx`
- Modify: `frontend/src/services/dimensionamentos.service.js`
- Modify: `frontend/src/router/index.jsx`
- Modify: `frontend/src/components/dashboard/PainelLateral.jsx`

- [ ] **Adicionar `listarPorCidade` no service de dimensionamentos**

Em `frontend/src/services/dimensionamentos.service.js`, adicione uma linha:
```js
listarPorCidade: (cidade) => api.get(`/dimensionamentos?cidade=${encodeURIComponent(cidade)}`),
```

O arquivo completo fica:
```js
import api from './api'

export const dimensionamentosService = {
  listar:         ()          => api.get('/dimensionamentos'),
  listarPorCidade:(cidade)    => api.get(`/dimensionamentos?cidade=${encodeURIComponent(cidade)}`),
  criar:          (body)      => api.post('/dimensionamentos', body),
  buscarPorId:    (id)        => api.get(`/dimensionamentos/${id}`),
  excluir:        (id)        => api.delete(`/dimensionamentos/${id}`),
  submeter:       (id)        => api.patch(`/dimensionamentos/${id}/submeter`),
  revisar:        (id)        => api.patch(`/dimensionamentos/${id}/revisar`),
  ajuste:         (id, comentario) => api.patch(`/dimensionamentos/${id}/ajuste`, { comentario }),
  mapa:           ()          => api.get('/dimensionamentos/mapa'),
}
```

- [ ] **Criar `frontend/src/pages/Historico.jsx`**

```jsx
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts'
import { dimensionamentosService } from '../services/dimensionamentos.service'
import { StatusBadge, RevisaoBadge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Spinner } from '../components/ui/Spinner'
import { fmt } from '../utils/formatters'

const FILTROS = ['TODOS', 'ELETRICISTA', 'ENCANADOR']
const COR = { ELETRICISTA: '#CC0000', ENCANADOR: '#2563eb' }

export default function Historico() {
  const { cidade } = useParams()
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('TODOS')

  const { data, isLoading } = useQuery({
    queryKey: ['historico', cidade],
    queryFn: () => dimensionamentosService.listarPorCidade(cidade).then(r => r.data.data),
    enabled: !!cidade,
  })

  const lista = (data || []).filter(d => filtro === 'TODOS' || d.tipo_servico === filtro)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const dadosGrafico = lista.map(d => ({
    data: new Date(d.created_at).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
    servico: d.tipo_servico,
    indice: d.indice_capacidade ? parseFloat(d.indice_capacidade.toFixed(2)) : null,
  }))

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Histórico — {cidade}</h1>
          <p className="text-sm text-gray-500">Evolução do índice de capacidade ao longo do tempo</p>
        </div>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>← Voltar ao Dashboard</Button>
      </div>

      <div className="flex gap-2">
        {FILTROS.map(f => (
          <button key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${filtro === f ? 'bg-mapfre-red text-white border-mapfre-red' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
          >
            {f === 'TODOS' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : lista.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          Nenhum dimensionamento encontrado para {cidade}{filtro !== 'TODOS' ? ` — ${filtro}` : ''}.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Índice de Capacidade ao longo do tempo</p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dadosGrafico} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 'auto']} />
                <Tooltip formatter={(v) => [fmt.indice(v), 'Índice']} />
                <ReferenceLine y={1.0} stroke="#dc2626" strokeDasharray="4 4" label={{ value: '1,0 Subdim.', position: 'right', fontSize: 10, fill: '#dc2626' }} />
                <ReferenceLine y={0.9} stroke="#ca8a04" strokeDasharray="4 4" label={{ value: '0,9 Atenção', position: 'right', fontSize: 10, fill: '#ca8a04' }} />
                <Line type="monotone" dataKey="indice" stroke="#CC0000" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Data', 'Serviço', 'Índice', 'Status', 'Prestadores', 'Consultor', 'Revisão'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map(d => (
                  <tr key={d.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(d.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium" style={{ color: COR[d.tipo_servico] }}>{d.tipo_servico}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{fmt.indice(d.indice_capacidade)}</td>
                    <td className="px-4 py-3"><StatusBadge status={d.status_resultado} /></td>
                    <td className="px-4 py-3 text-gray-500">{d.prestadores_dim?.length ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{d.consultor?.nome ?? '—'}</td>
                    <td className="px-4 py-3"><RevisaoBadge status={d.status_revisao} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Adicionar rota em `router/index.jsx`**

No topo, adicione o import:
```js
import Historico from '../pages/Historico'
```

Dentro do bloco `perfis={['ADM','CONSULTOR','GERENTE']}` (o bloco que contém `/dashboard`), adicione:
```js
{ path: '/historico/:cidade', element: <Historico /> },
```

- [ ] **Adicionar botão "Ver Histórico" no `PainelLateral.jsx`**

No topo de `PainelLateral.jsx`, adicione o import de `useNavigate`:
```js
import { useNavigate } from 'react-router-dom'
```

Dentro do componente, logo após as declarações de estado existentes, adicione:
```js
const navigate = useNavigate()
```

No JSX, logo antes do botão `x` de fechar (na linha `<button onClick={onFechar} ...>`), adicione um botão:
```jsx
<button
  onClick={() => navigate(`/historico/${cidade}`)}
  className="text-xs text-mapfre-red hover:underline"
>
  Ver Histórico
</button>
```

- [ ] **Verificar no browser**

Abrir Dashboard → clicar em uma cidade no mapa → painel lateral deve exibir "Ver Histórico" → clicar → página `/historico/NOMECIDADE` deve abrir com gráfico e tabela. Testar filtros Eletricista / Encanador / Todos.

- [ ] **Commit**

```bash
git add frontend/src/pages/Historico.jsx frontend/src/services/dimensionamentos.service.js frontend/src/router/index.jsx frontend/src/components/dashboard/PainelLateral.jsx
git commit -m "feat: city history page with line chart and dimensionamento table (RF-31)"
```

---

## Task 10: RF-27/28 + RF-29/30 — Resultado: submeter, PDF e Excel

**Files:**
- Modify: `frontend/src/pages/Resultado.jsx`

- [ ] **Substituir o conteúdo de `Resultado.jsx`**

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDimensionamentoStore } from '../store/dimensionamentoStore'
import { dimensionamentosService } from '../services/dimensionamentos.service'
import { GraficoCapacidade } from '../components/dimensionamento/ResultadoFinal'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { ProgressSteps } from '../components/layout/ProgressSteps'
import { fmt } from '../utils/formatters'
import { clearAutoSave } from '../hooks/useAutoSave'
import { exportarPDF } from '../utils/exportPDF'
import { exportarExcel } from '../utils/exportExcel'

const AUTO_SAVE_KEY = 'dimensionamento-rascunho'

const STATUS_CONFIG = {
  ADEQUADO:        { label: 'Adequado',         bg: 'bg-green-50',  border: 'border-green-300', text: 'text-green-800' },
  ATENCAO:         { label: 'Atenção',           bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-800' },
  SUBDIMENSIONADO: { label: 'Subdimensionado',   bg: 'bg-red-50',    border: 'border-red-300',    text: 'text-red-800' },
}

export default function Resultado() {
  const store = useDimensionamentoStore()
  const navigate = useNavigate()
  const [salvando, setSalvando] = useState(false)
  const [submetendo, setSubmetendo] = useState(false)
  const [erro, setErro] = useState('')

  const resultado = store.resultado
  const prestadores = store.prestadores.filter(p => p.status === 'completo')

  const handleCalcular = () => {
    if (!store.demanda) return
    store.calcularResultado()
  }

  const buildPayload = () => ({
    cidade:            store.cidade,
    uf:                store.uf,
    tipo_servico:      store.tipoServico,
    demanda_cidade:    parseFloat(store.demanda),
    indice_capacidade: resultado.indice,
    status_resultado:  resultado.status,
    janela_inicio:     `${store.janela.inicio.ano}-${String(store.janela.inicio.mesn).padStart(2,'0')}-01`,
    janela_fim:        `${store.janela.fim.ano}-${String(store.janela.fim.mesn).padStart(2,'0')}-01`,
    prestadores: prestadores.map(p => ({
      idprestador:          p.idprestador,
      nome_prestador:       p.nome_prestador,
      tipo_servico:         p.tipo_servico,
      volume_mawdy:         p.volume_mawdy,
      qtd_profissionais:    p.qtd_profissionais,
      servicos_por_dia:     p.servicos_por_dia,
      volumetria_total:     p.volumetria_total,
      servicos_diarios:     p.servicos_diarios,
      capacidade_mensal:    p.capacidade_mensal,
      dedicacao_mawdy:      p.dedicacao_mawdy,
      pct_mawdy_capacidade: p.pct_mawdy_capacidade,
      cap_teorica:          p.cap_teorica,
      pct_recusas:          p.pct_recusas,
      reclamacoes_ratio:    p.reclamacoes_ratio,
      tempo_chegada_min:    p.tempo_chegada_min,
      pct_deslocamento:     p.pct_deslocamento,
      pct_reembolso:        p.pct_reembolso,
      nps:                  p.nps,
      cf_recusas:           p.cf_recusas,
      cf_reclamacoes:       p.cf_reclamacoes,
      cf_tempo_chegada:     p.cf_tempo_chegada,
      cf_deslocamento:      p.cf_deslocamento,
      cf_reembolso:         p.cf_reembolso,
      cf_nps:               p.cf_nps,
      cf_seguranca:         p.cf_seguranca,
      capacidade_real:      p.capacidade_real,
    })),
  })

  const concluir = () => {
    clearAutoSave(AUTO_SAVE_KEY)
    store.resetar()
    navigate('/dashboard')
  }

  const handleSalvar = async () => {
    if (!resultado) return
    setSalvando(true)
    setErro('')
    try {
      await dimensionamentosService.criar(buildPayload())
      concluir()
    } catch (e) {
      setErro(e.response?.data?.error?.message || 'Erro ao salvar dimensionamento')
    } finally {
      setSalvando(false)
    }
  }

  const handleSubmeter = async () => {
    if (!resultado) return
    setSubmetendo(true)
    setErro('')
    try {
      const { data: res } = await dimensionamentosService.criar(buildPayload())
      await dimensionamentosService.submeter(res.data.id)
      concluir()
    } catch (e) {
      setErro(e.response?.data?.error?.message || 'Erro ao submeter dimensionamento')
    } finally {
      setSubmetendo(false)
    }
  }

  const cfg = resultado?.status ? STATUS_CONFIG[resultado.status] : null

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <ProgressSteps current={3} />
        <h1 className="text-xl font-bold text-gray-900 mt-4">Resultado do Dimensionamento</h1>
        <p className="text-gray-500 text-sm">{store.cidade} — {store.tipoServico === 'ELETRICISTA' ? 'Eletricista' : 'Encanador'} · {store.janela.label}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
        <Input
          label="Demanda da Cidade (serviços/mês)"
          type="number"
          required
          value={store.demanda}
          onChange={e => store.setDemanda(e.target.value)}
          placeholder="Ex: 450"
        />
        <Button onClick={handleCalcular} disabled={!store.demanda} variant="secondary">
          Calcular Índice de Capacidade
        </Button>
      </div>

      {resultado && cfg && (
        <>
          <div className={`rounded-xl border p-5 flex flex-col gap-1 ${cfg.bg} ${cfg.border}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${cfg.text}`}>Status</p>
            <p className={`text-2xl font-bold ${cfg.text}`}>{cfg.label}</p>
            <div className="flex gap-6 mt-2">
              <div>
                <p className="text-xs text-gray-500">Índice de Capacidade</p>
                <p className={`text-xl font-bold ${cfg.text}`}>{fmt.indice(resultado.indice)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Capacidade Total</p>
                <p className="text-xl font-bold text-gray-800">{fmt.numero(resultado.cap_total, 0)} serv/mês</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Demanda</p>
                <p className="text-xl font-bold text-gray-800">{fmt.numero(parseFloat(store.demanda), 0)} serv/mês</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Capacidade por Prestador</p>
            <GraficoCapacidade prestadores={prestadores} demanda={store.demanda} />
          </div>

          {erro && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erro}</p>
          )}
        </>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={() => navigate('/dimensionamento/qualidade')}>
          ← Voltar
        </Button>

        {resultado && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => exportarPDF(store)} disabled={!resultado}>
              📄 PDF
            </Button>
            <Button variant="secondary" onClick={() => exportarExcel(store)} disabled={!resultado}>
              📊 Excel
            </Button>
            <Button variant="secondary" onClick={handleSalvar} disabled={salvando || submetendo}>
              {salvando ? 'Salvando…' : 'Salvar Rascunho'}
            </Button>
            <Button onClick={handleSubmeter} disabled={salvando || submetendo}>
              {submetendo ? 'Submetendo…' : 'Salvar e Submeter →'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Verificar no browser — fluxo completo**

1. Criar um dimensionamento completo (cidade, tipo, prestador, métricas, demanda, calcular).
2. Clicar "📄 PDF" → arquivo PDF deve baixar com o nome da cidade.
3. Clicar "📊 Excel" → arquivo `.xlsx` deve baixar.
4. Clicar "Salvar Rascunho" → redireciona ao dashboard; dimensionamento aparece sem badge de pendente.
5. Criar outro dimensionamento → clicar "Salvar e Submeter" → redireciona ao dashboard; logar como GERENTE → deve ter notificação não lida.

- [ ] **Commit**

```bash
git add frontend/src/pages/Resultado.jsx
git commit -m "feat: add submit for review, PDF/Excel export buttons to Resultado page (RF-27/28, RF-29/30)"
```

---

## Verificação Final

Após todas as tasks, verificar:

- [ ] ADM vê 3 cards no dashboard (usuários ativos, dimensionamentos do mês, pendentes)
- [ ] CONSULTOR e GERENTE não veem os cards
- [ ] Métricas de qualidade têm ícone `?` com tooltip funcional em todas as 6 métricas
- [ ] PDF e Excel baixam corretamente após calcular o índice
- [ ] "Salvar Rascunho" salva sem notificar gerente; "Salvar e Submeter" notifica
- [ ] Gerente recebe notificação e pode marcar como revisado ou solicitar ajuste
- [ ] PainelLateral tem botão "Ver Histórico" funcionando
- [ ] Página `/historico/:cidade` exibe gráfico de linha e tabela filtrada por serviço
- [ ] ADM consegue acessar `/admin/configuracoes` e editar coeficientes
- [ ] Após salvar coeficientes, cálculos usam os novos valores (testar mudando um range drasticamente)
- [ ] `GET /api/dimensionamentos?cidade=X` retorna apenas dimensionamentos daquela cidade

```bash
git log --oneline -10
```
