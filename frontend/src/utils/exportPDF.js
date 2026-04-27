import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { fmt } from './formatters'

export function exportarPDF(store) {
  const doc = new jsPDF()
  const { cidade, tipoServico, janela, prestadores, resultado } = store

  doc.setFillColor(15, 118, 110)
  doc.rect(0, 0, 210, 25, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.text('DimensionaPro', 14, 16)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(11)
  doc.text(`Cidade: ${cidade}`, 14, 35)
  doc.text(`Serviço: ${tipoServico}`, 14, 42)
  doc.text(`Período de referência: ${janela.label}`, 14, 49)
  doc.text(`Índice de Capacidade: ${fmt.indice(resultado?.indice)}  |  Status: ${resultado?.status}`, 14, 56)

  autoTable(doc, {
    startY: 65,
    head: [['Nome', 'Cap. Teórica', 'Cap. Real', '% MAWDY', 'Coef. Seg.']],
    body: prestadores.map(p => [
      p.nome_prestador,
      fmt.numero(p.cap_teorica, 1),
      fmt.numero(p.capacidade_real, 1),
      fmt.pct(p.pct_mawdy_capacidade),
      fmt.coef(p.cf_seguranca),
    ]),
    headStyles: { fillColor: [15, 118, 110] },
  })

  const y = doc.lastAutoTable.finalY + 10
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} — Documento confidencial de uso interno`, 14, y)

  doc.save(`Dimensionamento_${cidade}_${tipoServico}.pdf`)
}

