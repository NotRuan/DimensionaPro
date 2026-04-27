export function Input({ label, name, type = 'text', placeholder, value, onChange, error, required, disabled, suffix, className = '' }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}{required && <span className="text-teal-700 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-500 ${error ? 'border-red-500' : 'border-slate-300'} ${className}`}
        />
        {suffix && <span className="absolute right-3 top-2.5 text-sm text-gray-500">{suffix}</span>}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
