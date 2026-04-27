CREATE OR REPLACE FUNCTION buscar_volumetria(
  p_cidade       text,
  p_idprestador  bigint,
  p_servico      text,
  p_ano_inicio   int,
  p_mes_inicio   int,
  p_ano_fim      int,
  p_mes_fim      int
)
RETURNS TABLE (
  nome_prestador      text,
  meses_encontrados   bigint,
  volume_medio_mensal numeric
)
LANGUAGE sql
AS $$
  WITH total_por_mes AS (
    SELECT
      mesn,
      ano,
      SUM(servicos_criados) AS total_no_mes
    FROM prestadores
    WHERE
      cidade       = p_cidade
      AND idprestador  = p_idprestador
      AND nome_servico = p_servico
      AND (ano * 100 + mesn) >= (p_ano_inicio * 100 + p_mes_inicio)
      AND (ano * 100 + mesn) <= (p_ano_fim    * 100 + p_mes_fim)
    GROUP BY mesn, ano
  )
  SELECT
    (SELECT nome_prestador FROM prestadores
     WHERE cidade = p_cidade AND idprestador = p_idprestador
     AND nome_servico = p_servico LIMIT 1)          AS nome_prestador,
    COUNT(*)                                         AS meses_encontrados,
    ROUND(AVG(total_no_mes), 0)                      AS volume_medio_mensal
  FROM total_por_mes
  HAVING COUNT(*) > 0;
$$;
