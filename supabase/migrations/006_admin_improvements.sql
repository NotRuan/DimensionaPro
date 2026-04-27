CREATE TABLE IF NOT EXISTS auditoria_sistema (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES usuarios(id),
  acao        text NOT NULL,
  entidade    text,
  entidade_id text,
  detalhes    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditoria_sistema_created_at
  ON auditoria_sistema (created_at DESC);

CREATE TABLE IF NOT EXISTS importacoes_base (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id         uuid REFERENCES usuarios(id),
  arquivo_nome       text,
  total_linhas       integer NOT NULL DEFAULT 0,
  importados         integer NOT NULL DEFAULT 0,
  erros              integer NOT NULL DEFAULT 0,
  periodo_importado  text,
  detalhes_erros     jsonb,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_importacoes_base_created_at
  ON importacoes_base (created_at DESC);

CREATE TABLE IF NOT EXISTS configuracoes_historico (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave       text NOT NULL,
  valor_antigo jsonb,
  valor_novo   jsonb NOT NULL,
  usuario_id uuid REFERENCES usuarios(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_configuracoes_historico_chave
  ON configuracoes_historico (chave, created_at DESC);

ALTER TABLE cidades
  ADD COLUMN IF NOT EXISTS ativo boolean NOT NULL DEFAULT true;
