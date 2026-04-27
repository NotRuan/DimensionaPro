export function ProgressSteps({ current, total = 3 }) {
  const labels = { 1: 'Preenchimento Inicial', 2: 'Metricas de Qualidade', 3: 'Resultado' }
  return (
    <div className="flex items-center gap-2 text-sm">
      {Array.from({ length: total }, (_, i) => i + 1).map(step => (
        <div key={step} className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
            ${step < current ? 'bg-emerald-600 text-white' :
              step === current ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-500'}`}>
            {step < current ? '✓' : step}
          </div>
          <span className={`hidden sm:inline ${step === current ? 'font-semibold text-slate-900' : 'text-slate-400'}`}>
            {labels[step]}
          </span>
          {step < total && <div className="w-8 h-px bg-slate-300" />}
        </div>
      ))}
    </div>
  )
}
