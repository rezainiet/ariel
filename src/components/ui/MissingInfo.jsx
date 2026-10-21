export default function MissingInfo({ children = 'À renseigner', className = '' }) {
  return (
    <span className={`inline-flex rounded-md bg-red-50 px-2 py-0.5 font-semibold text-red-700 ring-1 ring-inset ring-red-300 ${className}`}>
      {children}
    </span>
  )
}
