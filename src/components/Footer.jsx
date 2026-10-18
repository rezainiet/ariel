import { Link } from 'react-router-dom'
import { STORE, DELIVERY } from '../config/store.js'

const columns = [
  {
    title: 'Boutique',
    links: [
      { label: 'Les offres', to: '/#offres' },
      { label: 'Le produit', to: '/#produit' },
      { label: 'Livraison', to: '/#livraison' },
      { label: 'FAQ', to: '/#faq' },
    ],
  },
  {
    title: 'Aide',
    links: [
      { label: 'Contact', to: '/contact' },
      { label: 'Retours & remboursements', to: '/retours-remboursements' },
      { label: 'Suivi de commande', to: '/contact' },
    ],
  },
  {
    title: 'Informations légales',
    links: [
      { label: 'Conditions générales de vente', to: '/conditions-generales-de-vente' },
      { label: 'Politique de confidentialité', to: '/politique-de-confidentialite' },
      { label: 'Mentions légales', to: '/mentions-legales' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="container-edge py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-forest text-white">
                <svg viewBox="0 0 32 32" className="h-4 w-4" aria-hidden="true">
                  <path d="M16 6c4.4 3.6 7 7.2 7 10.8A7 7 0 0 1 9 16.8C9 13.2 11.6 9.6 16 6Z" fill="#DDE8D8" />
                </svg>
              </span>
              <span className="text-[0.95rem] font-extrabold uppercase tracking-[0.12em] text-forest">
                {STORE.name}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Déstockage en Suisse sur une sélection de packs Ariel All-in-1 PODS.
              Expédition depuis {DELIVERY.dispatchLocation}.
            </p>
            {STORE.supportEmail && (
              <a
                href={`mailto:${STORE.supportEmail}`}
                className="mt-4 inline-block text-sm font-semibold text-forest hover:underline"
              >
                {STORE.supportEmail}
              </a>
            )}
          </div>

          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-ink/80 transition-colors hover:text-forest"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-line pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {STORE.name}. Tous droits réservés.
          </p>
          <p className="text-muted/80">
            Les mentions de stock, de livraison et de prix sont à confirmer par le
            marchand avant mise en ligne.
          </p>
        </div>
      </div>
    </footer>
  )
}
