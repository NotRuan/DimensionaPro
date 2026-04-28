-- Remove REEMBOLSO da configuracao ativa de coeficientes de qualidade.
-- As colunas antigas em prestadores_dim permanecem para compatibilidade historica.
UPDATE configuracoes
SET valor = valor - 'reembolso',
    updated_at = NOW()
WHERE chave = 'coeficientes'
  AND valor ? 'reembolso';
