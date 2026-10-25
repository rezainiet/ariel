import { useI18n } from '../../i18n/index.jsx'

export default function MissingInfo({ children, className = '' }) {
  const { t } = useI18n()
  return (
    <span className={`inline-flex rounded-md bg-red-50 px-2 py-0.5 font-semibold text-red-700 ring-1 ring-inset ring-red-300 ${className}`}>
      {children ?? t.common.missing}
    </span>
  )
}
