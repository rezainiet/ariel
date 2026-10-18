import Button from '../components/ui/Button.jsx'

export default function NotFound() {
  return (
    <div className="container-edge flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="text-5xl font-extrabold text-forest">404</span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-ink">
        Page introuvable
      </h1>
      <p className="mt-2 max-w-sm text-muted">
        La page que vous cherchez n'existe pas ou a été déplacée.
      </p>
      <Button to="/" className="mt-6">
        Retour à l'accueil
      </Button>
    </div>
  )
}
