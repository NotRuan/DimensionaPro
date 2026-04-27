export function Tooltip({ content }) {
  return (
    <span className="relative inline-flex items-center group/tip ml-1">
      <span className="w-4 h-4 rounded-full bg-gray-200 text-[10px] text-gray-500 flex items-center justify-center cursor-help font-bold select-none">
        ?
      </span>
      <div className="hidden group-hover/tip:block absolute left-6 top-0 z-50 bg-gray-800 text-white text-xs rounded-lg p-3 w-64 shadow-xl pointer-events-none">
        {content}
        <div className="absolute left-[-4px] top-2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-800" />
      </div>
    </span>
  )
}
