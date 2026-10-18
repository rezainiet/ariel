import { useEffect } from 'react'
import { Droplets, PackageOpen, AlertTriangle, Archive } from 'lucide-react'
import ProductImage from './ui/ProductImage.jsx'
import Reveal from './ui/Reveal.jsx'
import { PRODUCT } from '../config/store.js'
import { IMAGES } from '../config/assets.js'
import { trackViewContent } from '../lib/pixel.js'

// Caractéristiques telles qu'indiquées sur l'emballage et les visuels fournis.
const features = [
  'Élimine les taches',
  'Efficace dès 20°C',
  'Se dissout rapidement',
  'Fraîcheur longue durée',
]

const details = [
  {
    Icon: PackageOpen,
    title: 'Conditionnement',
    body: `Pack de ${PRODUCT.washesPerPack} lavages en capsules Ariel All-in-1 PODS. Disponible en 1, 2 ou 3 packs selon l'offre choisie.`,
  },
  {
    Icon: Droplets,
    title: 'Utilisation',
    body: "Placez une capsule au fond du tambour, avant le linge. Ne pas percer ni ouvrir la capsule. Suivez le dosage indiqué sur l'emballage selon la charge et la dureté de l'eau.",
  },
  {
    Icon: AlertTriangle,
    title: 'Sécurité',
    body: "Tenir hors de portée des enfants. Garder la capsule au sec et avec les mains sèches jusqu'à utilisation. En cas de contact avec les yeux, rincer abondamment. Respectez les consignes figurant sur l'emballage.",
  },
  {
    Icon: Archive,
    title: 'Conservation',
    body: 'Conserver le sachet fermé, à l’abri de l’humidité et de la chaleur. Refermez l’emballage après chaque usage.',
  },
]

export default function ProductInfo() {
  useEffect(() => {
    trackViewContent({ item_ids: [PRODUCT.id], item_category: 'detergent', currency: 'CHF' })
  }, [])

  return (
    <section id="produit" className="scroll-mt-20 py-16 sm:py-20">
      <div className="container-edge">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-14">
          {/* Galerie */}
          <Reveal className="lg:sticky lg:top-24">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <ProductImage
                src={IMAGES.packshot}
                fit="contain"
                alt="Pack Ariel All-in-1 PODS 60 lavages"
                ratio="3 / 4"
                className="col-span-2 bg-white"
              />
              <ProductImage
                src={IMAGES.podWater}
                alt="Capsule Ariel en gros plan dans l'eau"
                ratio="1 / 1"
              />
              <ProductImage
                src={IMAGES.towels}
                alt="Linge frais plié avec fleurs"
                ratio="1 / 1"
              />
              <ProductImage
                src={IMAGES.basket}
                alt="Pack Ariel 60 lavages sur un panier"
                ratio="16 / 10"
                className="col-span-2"
              />
            </div>
          </Reveal>

          {/* Informations */}
          <div className="mt-10 lg:mt-0">
            <Reveal>
              <span className="eyebrow">Le produit</span>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                Ariel — Le soin du linge au quotidien
              </h2>
              <p className="mt-4 text-[0.98rem] leading-relaxed text-muted">
                Les capsules Ariel All-in-1 PODS réunissent la lessive dans un format
                pratique et pré-dosé. Les informations ci-dessous reprennent les
                consignes générales d'usage et de sécurité&nbsp;; référez-vous toujours
                à l'emballage pour le détail.
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {features.map((f) => (
                  <li
                    key={f}
                    className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink/80"
                  >
                    {f}
                  </li>
                ))}
              </ul>
            </Reveal>

            <div className="mt-8 space-y-6">
              {details.map((d, i) => (
                <Reveal key={d.title} delay={i * 60} className="flex gap-4">
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-sage/60 text-forest">
                    <d.Icon size={19} strokeWidth={1.8} />
                  </span>
                  <div>
                    <h3 className="text-[0.98rem] font-semibold text-ink">{d.title}</h3>
                    <p className="mt-1 text-[0.9rem] leading-relaxed text-muted">{d.body}</p>
                  </div>
                </Reveal>
              ))}
            </div>

            <p className="mt-8 rounded-xl border border-line bg-surface p-4 text-xs leading-relaxed text-muted">
              Les caractéristiques techniques, la composition et les éventuelles
              certifications ne sont pas reproduites ici&nbsp;: elles doivent être
              confirmées à partir de l'emballage réel du produit avant publication.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
