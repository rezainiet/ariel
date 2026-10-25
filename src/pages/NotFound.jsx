import { Link } from 'react-router-dom'
import { useI18n } from '../i18n/index.jsx'

export default function NotFound() {
  const { t } = useI18n()
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center font-jakarta">
      <span className="text-6xl font-extrabold tracking-[-0.04em] text-fr-green">404</span>
      <h1 className="mt-4 text-[1.8rem] font-extrabold tracking-[-0.025em] text-fr-ink">{t.pages.notFound.title}</h1>
      <p className="mt-2 max-w-sm text-fr-muted">{t.pages.notFound.text}</p>
      <Link to="/" className="mt-6 flex h-12 items-center rounded-full bg-fr-green px-6 font-bold text-white shadow-[0_12px_26px_rgba(14,122,71,0.28)]">
        {t.common.backToShop}
      </Link>
    </div>
  )
}
