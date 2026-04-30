export function calcularJanela6Meses() {
  const meses = Array.from({ length: 12 }, (_, i) => ({ mesn: i + 1, ano: 2026 }))
  return {
    meses,
    inicio: { mesn: 1, ano: 2026 },
    fim:    { mesn: 12, ano: 2026 },
    label:  'Apenas os dados de 2026',
  }
}
