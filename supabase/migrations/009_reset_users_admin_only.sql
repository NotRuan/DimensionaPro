-- Reset operacional de usuarios: mantem apenas o ADM padrao solicitado.
-- Login inicial:
--   email: admin@mawdy.com
--   senha: 123456
--
-- Observacao: os dimensionamentos historicos sao preservados e passam a apontar
-- para o usuario ADM para permitir remover os demais usuarios com seguranca.

DO $$
DECLARE
  admin_id uuid;
BEGIN
  INSERT INTO usuarios (nome, email, senha_hash, perfil, ativo)
  VALUES (
    'admin',
    'admin@mawdy.com',
    '$2b$10$h1Tl5sOdp2aL7UPAvdzWmuOKOPKFFW/87ofcW2JUwWNIdWfyNdNlu',
    'ADM',
    true
  )
  ON CONFLICT (email) DO UPDATE
    SET nome = 'admin',
        senha_hash = EXCLUDED.senha_hash,
        perfil = 'ADM',
        ativo = true,
        updated_at = NOW()
  RETURNING id INTO admin_id;

  UPDATE dimensionamentos
  SET consultor_id = admin_id,
      gerente_revisor_id = NULL,
      updated_at = NOW()
  WHERE consultor_id <> admin_id
     OR gerente_revisor_id IS NOT NULL;

  UPDATE dimensionamento_eventos
  SET usuario_id = admin_id
  WHERE usuario_id IS NOT NULL
    AND usuario_id <> admin_id;

  DELETE FROM notificacoes;

  UPDATE auditoria_sistema
  SET usuario_id = admin_id
  WHERE usuario_id IS NOT NULL
    AND usuario_id <> admin_id;

  UPDATE importacoes_base
  SET usuario_id = admin_id
  WHERE usuario_id IS NOT NULL
    AND usuario_id <> admin_id;

  UPDATE configuracoes_historico
  SET usuario_id = admin_id
  WHERE usuario_id IS NOT NULL
    AND usuario_id <> admin_id;

  DELETE FROM usuarios
  WHERE id <> admin_id;
END $$;
