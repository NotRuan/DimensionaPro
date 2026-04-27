ALTER TABLE dimensionamentos
  DROP CONSTRAINT IF EXISTS dimensionamentos_status_revisao_check;

ALTER TABLE dimensionamentos
  ADD CONSTRAINT dimensionamentos_status_revisao_check
  CHECK (status_revisao IN ('RASCUNHO', 'PENDENTE', 'REVISADO', 'AJUSTE_SOLICITADO'));
