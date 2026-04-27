CREATE TABLE IF NOT EXISTS dimensionamento_eventos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dimensionamento_id  uuid NOT NULL REFERENCES dimensionamentos(id) ON DELETE CASCADE,
  usuario_id          uuid REFERENCES usuarios(id),
  tipo                text NOT NULL CHECK (tipo IN ('CRIADO', 'EDITADO', 'SUBMETIDO', 'REVISADO', 'AJUSTE_SOLICITADO', 'EXCLUIDO')),
  comentario          text,
  metadata            jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dim_eventos_dimensionamento
  ON dimensionamento_eventos (dimensionamento_id, created_at DESC);
