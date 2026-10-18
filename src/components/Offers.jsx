import { Check, Star } from 'lucide-react'
import { OFFERS, formatCHF } from '../config/store.js'
import { useCart } from '../context/CartContext.jsx'
import ProductImage from './ui/ProductImage.jsx'
import Reveal from './ui/Reveal.jsx'
import { DELIVERY } from '../config/store.js'

function OfferCard({ offer, selected, onSelect, index }) {
  const { featured, badge } = offer
  return (
    <Reveal
      as="div"
      delay={index * 80}
      className={`relative flex h-full flex-col rounded-xl2 border bg-surface p-6 transition-all duration-300 ${
        selected
          ? 'border-forest ring-1 ring-forest'
          : featured
            ? 'border-forest/35'
            : 'border-line hover:border-forest/30'
      }`}
    >
      {badge && (
        <span
          className={`absolute -top-3 left-6 rounded-full px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.1em] ${
            featured ? 'bg-forest text-white' : 'bg-sage text-forest'
          }`}
        >
          {featured && <Star size={11} className="mr-1 inline -translate-y-px fill-current" />}
          {badge}
        </span>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-ink">{offer.label}</h3>
          <p className="mt-0.5 text-sm text-muted">{offer.washes} lavages</p>
        </div>
        <ProductImage
          src={offer.image}
          fit="contain"
          alt={`${offer.label} — Ariel All-in-1 PODS`}
          ratio="1 / 1"
          className="h-16 w-16 flex-none bg-white"
        />
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-extrabold tracking-tight text-forest">
          {formatCHF(offer.price)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted">Livraison offerte en Suisse</p>

      <button
        onClick={() => onSelect(offer.id)}
        aria-pressed={selected}
        className={`mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-full text-[0.9rem] font-semibold tracking-tight transition-all duration-200 active:scale-[0.985] ${
          selected
            ? 'bg-forest text-white'
            : featured
              ? 'bg-forest text-white hover:bg-forest-700'
              : 'border border-forest/25 text-forest hover:bg-sage/50'
        }`}
      >
        {selected ? (
          <>
            <Check size={17} strokeWidth={2.4} /> SÉLECTIONNÉ
          </>
        ) : (
          'CHOISIR CETTE OFFRE'
        )}
      </button>
    </Reveal>
  )
}

export default function Offers() {
  const { offerId, selectOffer } = useCart()

  return (
    <section id="offres" className="scroll-mt-20 py-16 sm:py-20">
      <div className="container-edge">
        <Reveal className="mx-auto max-w-xl text-center">
          <span className="eyebrow">Nos offres</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Choisissez votre offre
          </h2>
          <p className="mt-3 text-[0.98rem] text-muted">
            Le même soin du linge, à prix déstockage.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {OFFERS.map((offer, i) => (
            <div key={offer.id} className={offer.featured ? 'sm:-mt-0 lg:-my-2' : ''}>
              <OfferCard
                offer={offer}
                index={i}
                selected={offerId === offer.id}
                onSelect={selectOffer}
              />
            </div>
          ))}
        </div>

        <p className="mx-auto mt-8 max-w-md text-center text-sm text-muted">
          Retour possible sous {DELIVERY.returnWindowDays} jours après réception.
        </p>
      </div>
    </section>
  )
}
