-- Migration 003: tabela de configurações globais do sistema
CREATE TABLE IF NOT EXISTS configuracoes (
  chave TEXT PRIMARY KEY,
  valor JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed: coeficientes de qualidade (mesmos valores de utils/coeficientes.js)
INSERT INTO configuracoes (chave, valor) VALUES
(
  'coeficientes',
  '{
    "recusas": [
      {"min": 0,     "max": 15,    "coef": 1.0},
      {"min": 15.01, "max": 25,    "coef": 0.9},
      {"min": 25.01, "max": 31,    "coef": 0.75},
      {"min": 31.01, "max": 40,    "coef": 0.5},
      {"min": 40.01, "max": null,  "coef": 0.1}
    ],
    "reclamacoes": [
      {"min": 0,    "max": 0.40,  "coef": 1.0},
      {"min": 0.41, "max": 1.00,  "coef": 0.75},
      {"min": 1.01, "max": 1.60,  "coef": 0.5},
      {"min": 1.61, "max": null,  "coef": 0.1}
    ],
    "tempoChegada": [
      {"min": 0,   "max": 30,    "coef": 1.0},
      {"min": 31,  "max": 60,    "coef": 0.9},
      {"min": 61,  "max": 90,    "coef": 0.75},
      {"min": 91,  "max": 120,   "coef": 0.5},
      {"min": 121, "max": null,  "coef": 0.1}
    ],
    "deslocamento": [
      {"min": 0,     "max": 0,     "coef": 1.0},
      {"min": 0.01,  "max": 10,    "coef": 0.9},
      {"min": 10.01, "max": 25,    "coef": 0.75},
      {"min": 25.01, "max": 50,    "coef": 0.5},
      {"min": 50.01, "max": null,  "coef": 0.1}
    ],
    "reembolso": [
      {"min": 0,     "max": 0,     "coef": 1.0},
      {"min": 0.01,  "max": 10,    "coef": 0.9},
      {"min": 10.01, "max": 25,    "coef": 0.75},
      {"min": 25.01, "max": 50,    "coef": 0.5},
      {"min": 50.01, "max": null,  "coef": 0.1}
    ],
    "nps": [
      {"min": 70,   "max": 100,   "coef": 1.0},
      {"min": 60,   "max": 69.99, "coef": 0.9},
      {"min": 50,   "max": 59.99, "coef": 0.75},
      {"min": -100, "max": 49.99, "coef": 0.1}
    ]
  }'::jsonb
),
(
  'parametros_gerais',
  '{
    "coef_seguranca": {
      "ELETRICISTA": 0.85,
      "ENCANADOR": 0.85
    },
    "janela_meses": 6
  }'::jsonb
)
ON CONFLICT (chave) DO NOTHING;
