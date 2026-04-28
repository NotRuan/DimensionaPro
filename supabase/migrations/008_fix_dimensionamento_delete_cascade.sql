-- Garante exclusao em cascata dos dados vinculados a um dimensionamento.
-- Necessario para bases criadas antes das migrations mais recentes ou com FKs sem ON DELETE CASCADE.

ALTER TABLE IF EXISTS prestadores_dim
  DROP CONSTRAINT IF EXISTS prestadores_dim_dimensionamento_id_fkey;

ALTER TABLE IF EXISTS prestadores_dim
  ADD CONSTRAINT prestadores_dim_dimensionamento_id_fkey
  FOREIGN KEY (dimensionamento_id)
  REFERENCES dimensionamentos(id)
  ON DELETE CASCADE;

ALTER TABLE IF EXISTS notificacoes
  DROP CONSTRAINT IF EXISTS notificacoes_dimensionamento_id_fkey;

ALTER TABLE IF EXISTS notificacoes
  ADD CONSTRAINT notificacoes_dimensionamento_id_fkey
  FOREIGN KEY (dimensionamento_id)
  REFERENCES dimensionamentos(id)
  ON DELETE CASCADE;

ALTER TABLE IF EXISTS dimensionamento_eventos
  DROP CONSTRAINT IF EXISTS dimensionamento_eventos_dimensionamento_id_fkey;

ALTER TABLE IF EXISTS dimensionamento_eventos
  ADD CONSTRAINT dimensionamento_eventos_dimensionamento_id_fkey
  FOREIGN KEY (dimensionamento_id)
  REFERENCES dimensionamentos(id)
  ON DELETE CASCADE;
