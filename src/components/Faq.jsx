import Accordion from './ui/Accordion.jsx'
import Reveal from './ui/Reveal.jsx'
import { DELIVERY, PRODUCT } from '../config/store.js'

const items = [
  {
    q: 'Combien de lavages contient un pack ?',
    a: `Chaque pack d'Ariel All-in-1 PODS correspond à ${PRODUCT.washesPerPack} lavages. L'offre 2 packs totalise 120 lavages et l'offre 3 packs 180 lavages.`,
  },
  {
    q: 'La livraison est-elle gratuite ?',
    a: 'Oui. La livraison est offerte sur toutes les commandes en Suisse, quelle que soit l’offre choisie.',
  },
  {
    q: 'Quel est le délai de livraison ?',
    a: `La préparation se fait depuis notre stock en ${DELIVERY.dispatchLocation}. La livraison prend généralement environ ${DELIVERY.estimateDays} jours ouvrables. Ce délai est une estimation et sera confirmé par le marchand.`,
  },
  {
    q: 'Puis-je retourner ma commande ?',
    a: `Un retour est possible sous ${DELIVERY.returnWindowDays} jours après réception. Contactez le service client avec votre numéro de commande pour obtenir les instructions. Voir la page Retours & remboursements.`,
  },
  {
    q: 'Comment suivre ma commande ?',
    a: 'Vous recevez une confirmation de commande puis une confirmation d’expédition par e-mail. Un lien de suivi vous est transmis lorsqu’il est disponible.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous ?',
    a: 'L’interface de paiement est prévue pour les cartes bancaires, Apple Pay, Google Pay et TWINT. Les moyens de paiement seront activés une fois le prestataire de paiement officiellement connecté.',
  },
]

export default function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 py-16 sm:py-20">
      <div className="container-edge max-w-3xl">
        <Reveal className="text-center">
          <span className="eyebrow">Questions fréquentes</span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            Tout ce qu'il faut savoir
          </h2>
        </Reveal>
        <Reveal className="mt-10">
          <Accordion items={items} />
        </Reveal>
      </div>
    </section>
  )
}
