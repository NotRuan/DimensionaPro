ALTER TABLE IF EXISTS dimensionamentos
  DROP CONSTRAINT IF EXISTS dimensionamentos_tipo_servico_check;

ALTER TABLE IF EXISTS dimensionamentos
  ADD CONSTRAINT dimensionamentos_tipo_servico_check
  CHECK (tipo_servico IN ('ELETRICISTA', 'ENCANADOR', 'ELETRICISTA_ENCANADOR'));
