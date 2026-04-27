export const fmt = {
  numero: (n, casas = 2) =>
    n == null ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }),

  pct: (n) =>
    n == null ? '—' : `${(n * 100).toFixed(1)}%`,

  indice: (n) =>
    n == null ? '—' : Number(n).toFixed(2),

  coef: (n) =>
    n == null ? '—' : Number(n).toFixed(2),
}
