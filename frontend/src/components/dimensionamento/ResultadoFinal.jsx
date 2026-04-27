import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'

export function GraficoCapacidade({ prestadores, demanda }) {
  const dados = prestadores.map(p => ({
    name: `${p.nome_prestador.split(' ')[0]} (${p.tipo_servico === 'ELETRICISTA' ? 'El' : 'En'})`,
    'Cap. Real': parseFloat(p.capacidade_real?.toFixed(1) ?? 0),
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dados} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar dataKey="Cap. Real" fill="#0F766E" />
        <ReferenceLine y={parseFloat(demanda)} label="Demanda" stroke="#f59e0b" strokeDasharray="4 4" />
      </BarChart>
    </ResponsiveContainer>
  )
}
