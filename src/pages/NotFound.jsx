import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center font-jakarta">
      <span className="text-6xl font-extrabold tracking-[-0.04em] text-fr-green">404</span>
      <h1 className="mt-4 text-[1.8rem] font-extrabold tracking-[-0.025em] text-fr-ink">Page introuvable</h1>
      <p className="mt-2 max-w-sm text-fr-muted">La page que vous cherchez n’existe pas ou a été déplacée.</p>
      <Link to="/" className="mt-6 flex h-12 items-center rounded-full bg-fr-green px-6 font-bold text-white shadow-[0_12px_26px_rgba(14,122,71,0.28)]">
        Retour à la boutique
      </Link>
    </div>
  )
}
