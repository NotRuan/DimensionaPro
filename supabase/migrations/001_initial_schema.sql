-- ─────────────────────────────────────────
-- Tabela: usuarios
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  email       text NOT NULL UNIQUE,
  senha_hash  text NOT NULL,
  perfil      text NOT NULL CHECK (perfil IN ('ADM', 'CONSULTOR', 'GERENTE')),
  ativo       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- Tabela: prestadores (volumetria mensal — leitura)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestadores (
  id                bigserial PRIMARY KEY,
  uf                text,
  cidade            text,
  idprestador       bigint,
  nome_prestador    text,
  nome_servico      text,
  assistencia       text,
  servicos_criados  integer,
  mesn              integer,
  mes               text,
  ano               integer
);

CREATE INDEX IF NOT EXISTS idx_prestadores_cidade_id_servico
  ON prestadores (cidade, idprestador, nome_servico);

CREATE INDEX IF NOT EXISTS idx_prestadores_periodo
  ON prestadores (ano, mesn);

-- ─────────────────────────────────────────
-- Tabela: dimensionamentos
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dimensionamentos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade              text NOT NULL,
  uf                  text,
  tipo_servico        text NOT NULL CHECK (tipo_servico IN ('ELETRICISTA', 'ENCANADOR')),
  consultor_id        uuid NOT NULL REFERENCES usuarios(id),
  demanda_cidade      numeric,
  indice_capacidade   numeric,
  status_resultado    text CHECK (status_resultado IN ('SUBDIMENSIONADO', 'ATENCAO', 'ADEQUADO')),
  janela_inicio       text,
  janela_fim          text,
  status_revisao      text NOT NULL DEFAULT 'PENDENTE'
                        CHECK (status_revisao IN ('PENDENTE', 'REVISADO', 'AJUSTE_SOLICITADO')),
  gerente_revisor_id  uuid REFERENCES usuarios(id),
  comentario_revisao  text,
  data_revisao        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dim_consultor ON dimensionamentos (consultor_id);
CREATE INDEX IF NOT EXISTS idx_dim_cidade    ON dimensionamentos (cidade, tipo_servico);
CREATE INDEX IF NOT EXISTS idx_dim_revisao   ON dimensionamentos (status_revisao);

-- ─────────────────────────────────────────
-- Tabela: prestadores_dim (prestadores dentro de um dimensionamento)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS prestadores_dim (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimensionamento_id   uuid NOT NULL REFERENCES dimensionamentos(id) ON DELETE CASCADE,
  idprestador          bigint,
  nome_prestador       text,
  tipo_servico         text,
  qtd_profissionais    integer,
  servicos_por_dia     integer DEFAULT 6,
  volumetria_total     numeric,
  volume_mawdy         numeric,
  dedicacao_mawdy      numeric,
  servicos_diarios     numeric,
  capacidade_mensal    numeric,
  pct_mawdy_capacidade numeric,
  pct_recusas          numeric,
  reclamacoes_ratio    numeric,
  tempo_chegada_min    numeric,
  pct_deslocamento     numeric,
  pct_reembolso        numeric,
  nps                  numeric,
  cf_recusas           numeric,
  cf_reclamacoes       numeric,
  cf_tempo_chegada     numeric,
  cf_deslocamento      numeric,
  cf_reembolso         numeric,
  cf_nps               numeric,
  cf_seguranca         numeric,
  capacidade_real      numeric,
  created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pd_dimensionamento
  ON prestadores_dim (dimensionamento_id);

-- ─────────────────────────────────────────
-- Tabela: notificacoes
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificacoes (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario_id     uuid NOT NULL REFERENCES usuarios(id),
  remetente_id        uuid REFERENCES usuarios(id),
  dimensionamento_id  uuid REFERENCES dimensionamentos(id) ON DELETE CASCADE,
  mensagem            text NOT NULL,
  lida                boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_destinatario
  ON notificacoes (destinatario_id, lida);
