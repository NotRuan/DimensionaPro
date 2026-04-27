# DimensionaPro

Sistema web para dimensionamento, acompanhamento e revisao operacional de prestadores, com frontend em React, backend em Node.js/Express e persistencia no Supabase.

## Visao geral

O DimensionaPro centraliza o fluxo de analise de prestadores e cidades, permitindo consultar dados, calcular indicadores, acompanhar historico, gerenciar configuracoes e exportar resultados. O projeto esta organizado como uma aplicacao full stack:

- `frontend`: interface React com Vite, Tailwind CSS, React Router, Zustand e React Query.
- `backend`: API Express com autenticacao JWT, cookies, middlewares de permissao e integracao com Supabase.
- `supabase`: migrations SQL e instrucoes para preparar o banco.
- `docs`: documentos de planejamento e especificacao do projeto.

## Funcionalidades

- Autenticacao de usuarios com token JWT e refresh token.
- Controle de acesso por perfil para rotas administrativas.
- Dashboard com indicadores, mapa e tabela de cidades.
- Fluxo de dimensionamento com etapas de prestador, metricas de qualidade e resultado.
- Historico por cidade.
- Notificacoes e revisoes.
- Administracao de usuarios, base de prestadores, cidades e configuracoes.
- Upload e validacao de arquivos CSV.
- Exportacao de resultados em PDF e Excel.

## Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- React Router
- Zustand
- TanStack React Query
- Axios
- Recharts
- jsPDF
- XLSX

### Backend

- Node.js
- Express
- Supabase JS
- JWT
- bcryptjs
- multer
- csv-parse
- cookie-parser
- cors

### Banco

- Supabase/PostgreSQL
- Migrations SQL em `supabase/migrations`

## Estrutura

```text
DimensionaPro/
  backend/
    src/
      config/
      middlewares/
      routes/
      services/
      utils/
    server.js
  frontend/
    src/
      components/
      hooks/
      pages/
      router/
      services/
      store/
      utils/
  supabase/
    migrations/
  docs/
```

## Requisitos

- Node.js 20 ou superior recomendado
- npm
- Conta/projeto no Supabase

## Configuracao do ambiente

Crie os arquivos de ambiente localmente. Eles nao devem ser versionados.

### Backend

Arquivo: `backend/.env`

```env
PORT=3001
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SECRET_KEY=sua-service-role-key
JWT_SECRET=troque-por-um-segredo-forte
JWT_EXPIRES_IN=8h
JWT_REFRESH_EXPIRES_IN=7d
NODE_ENV=development
```

### Frontend

Arquivo: `frontend/.env`

```env
VITE_API_URL=http://localhost:3001/api
```

## Instalar e executar

### Backend

```bash
cd backend
npm install
npm run dev
```

A API sobe por padrao em `http://localhost:3001`.

Health check:

```bash
GET http://localhost:3001/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

A aplicacao sobe por padrao em `http://localhost:5173`.

## Supabase

1. Crie um projeto no Supabase.
2. Execute os arquivos em `supabase/migrations` na ordem numerica.
3. Configure as chaves no `backend/.env`.
4. Crie um usuario administrador conforme orientacao em `supabase/README.md`.

## Scripts principais

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Rotas principais da API

- `GET /health`
- `/api/auth`
- `/api/users`
- `/api/prestadores`
- `/api/dimensionamentos`
- `/api/upload`
- `/api/notificacoes`
- `/api/configuracoes`
- `/api/admin`

## Deploy

O frontend possui configuracao para Vercel em `frontend/vercel.json`. O backend inclui `backend/Procfile`, podendo ser adaptado para provedores Node.js que suportem `npm start`.

Antes de publicar:

- Configure as variaveis de ambiente no provedor.
- Use a `SUPABASE_SECRET_KEY` apenas no backend.
- Ajuste `FRONTEND_URL` no backend para a URL final do frontend.
- Ajuste `VITE_API_URL` no frontend para a URL final da API.

## Status

Projeto em desenvolvimento. O README descreve a estrutura atual e pode ser expandido com exemplos de uso, arquitetura, regras de negocio e capturas de tela.
