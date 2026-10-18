import { useState } from 'react'
import { Phone, ShieldAlert, ArrowDown, Check } from 'lucide-react'
import { OFFERS, formatCHF, centsPerWash } from '../../config/store.js'
import { IMAGES } from '../../config/assets.js'
import Reveal from '../../components/ui/Reveal.jsx'
import { Eyebrow, H2 } from './TrustC.jsx'
import { ILLUSTRATIONS } from './Illustrations.jsx'
import { TRIO, TRIO_ALT } from './media.js'
import { LABEL_NOTES, SUITABILITY, STEPS, DOSAGE_NOTE, OPENING_STEPS, SAFETY, EMERGENCY } from './contentC.js'

const W = 'mx-auto max-w-[1320px] px-4 lg:px-8'

// Repères numérotés de haut en bas, dans l'ordre de lecture du sachet.
const NOTES = [...LABEL_NOTES].sort((a, b) => a.y - b.y)

const cents = (offer) => String(centsPerWash(offer)).replace('.', ',')

// A — Le sachet, traduit : la face avant (en allemand) annotée en français, repère par repère.
export function LabelSection() {
  const [active, setActive] = useState(null)
  return (
    <section id="produit" className="scroll-mt-20 overflow-hidden bg-sand/60 py-14 lg:py-24">
      <div className={W}>
        <Reveal className="max-w-3xl">
          <Eyebrow>Le sachet, traduit</Eyebrow>
          <H2>
            Ce que dit l’emballage,
            <span className="block italic text-forest">en français.</span>
          </H2>
          <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-ink/75">
            La face avant de ce sachet est imprimée en allemand. Voici chaque mention, traduite — sans promesse ajoutée.
          </p>
        </Reveal>

        <div className="mt-8 grid items-center gap-8 lg:mt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          {/* Le vrai sachet, repères posés à côté du texte imprimé (jamais dessus) */}
          <Reveal className="relative mx-auto w-full max-w-[25rem] lg:max-w-[34rem]">
            <div className="absolute inset-x-[6%] bottom-[-3%] h-[10%] rounded-[50%] bg-ink/25 blur-2xl" aria-hidden="true" />
            <div className="relative">
              <img
                src={IMAGES.packshotCutout}
                alt="Face avant du sachet Ariel All-in-1 PODS « 60 PODS », imprimée en allemand"
                loading="lazy"
                width="1000"
                height="951"
                className="w-full"
              />
              {NOTES.map((n, k) => (
                <button
                  key={n.de}
                  type="button"
                  onClick={() => setActive(active === k ? null : k)}
                  onMouseEnter={() => setActive(k)}
                  onFocus={() => setActive(k)}
                  aria-label={`Repère ${k + 1} : ${n.fr}`}
                  aria-pressed={active === k}
                  className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[0.72rem] font-extrabold shadow-[0_4px_14px_rgba(10,30,20,0.35)] ring-2 ring-white transition-transform duration-200 lg:h-9 lg:w-9 lg:text-sm ${
                    active === k ? 'scale-110 bg-ink text-white' : 'bg-forest text-white'
                  }`}
                  style={{ left: `${n.x}%`, top: `${n.y}%` }}
                >
                  {k + 1}
                </button>
              ))}
            </div>
          </Reveal>

          <Reveal>
            <ol className="border-t border-ink/15" onMouseLeave={() => setActive(null)}>
              {NOTES.map((n, k) => (
                <li
                  key={n.de}
                  onMouseEnter={() => setActive(k)}
                  className={`grid grid-cols-[2rem_1fr] gap-3 border-b border-ink/15 py-3.5 transition-colors duration-200 lg:grid-cols-[2.5rem_1fr] lg:py-4 ${
                    active === k ? 'bg-white/70' : ''
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[0.7rem] font-extrabold lg:h-7 lg:w-7 ${
                      active === k ? 'bg-ink text-white' : 'bg-forest text-white'
                    }`}
                  >
                    {k + 1}
                  </span>
                  <span className="pr-2">
                    <span className="block text-[1rem] font-bold leading-snug text-ink lg:text-[1.08rem]">{n.fr}</span>
                    <span lang="de" className="mt-0.5 block font-serif text-[0.82rem] italic text-forest/80">
                      « {n.de} »
                    </span>
                    <span className="mt-1 hidden text-[0.84rem] leading-relaxed text-ink/70 sm:block">{n.body}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[0.78rem] leading-relaxed text-muted">
              Traductions de la face avant. Les allégations sont celles du fabricant. Pas pour : {SUITABILITY.notFor.toLowerCase()}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

// B — 60 lavages : la vraie scène des trois sachets + le coût réel d'un lavage pour chaque offre.
// Mobile : photo pleine largeur, titre sur le mur clair. Desktop : photo | texte et chiffres.
export function WashesSection({ sel, setSel }) {
  const choose = (id) => {
    setSel(id)
    document.getElementById('offres')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  return (
    <section id="lavages" aria-label="60 lavages par sachet" className="scroll-mt-20 bg-ivory pb-14 lg:py-24">
      <div className="lg:mx-auto lg:grid lg:max-w-[1320px] lg:grid-cols-[1.3fr_1fr] lg:items-center lg:gap-14 lg:px-8 xl:gap-20">
        <figure className="relative overflow-hidden lg:rounded-[2rem] lg:shadow-[0_30px_60px_rgba(23,42,32,0.14)]">
          <picture>
            <source media="(min-width: 1024px)" type="image/avif" srcSet={TRIO.wide.avif} sizes="(min-width: 1320px) 700px, 55vw" />
            <source media="(min-width: 1024px)" type="image/webp" srcSet={TRIO.wide.webp} sizes="(min-width: 1320px) 700px, 55vw" />
            <source type="image/avif" srcSet={TRIO.tall.avif} sizes="100vw" />
            <source type="image/webp" srcSet={TRIO.tall.webp} sizes="100vw" />
            <img
              src={TRIO.tall.src}
              alt={TRIO_ALT}
              loading="lazy"
              width={TRIO.tall.width}
              height={TRIO.tall.height}
              className="aspect-[4/5] w-full object-cover sm:aspect-[16/11] sm:object-[50%_85%] lg:aspect-[1300/960]"
            />
          </picture>
          {/* Mobile : titre posé sur le mur clair, au-dessus des serviettes */}
          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-ivory/85 via-ivory/45 to-transparent px-4 pb-20 pt-8 lg:hidden">
            <WashesTitle />
          </div>
          <figcaption className="absolute bottom-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[0.7rem] font-semibold text-ink/80 backdrop-blur lg:bottom-5 lg:left-5">
            3 sachets · 180 capsules
          </figcaption>
        </figure>

        <div className="px-4 pt-6 lg:px-0 lg:pt-0">
          <div className="hidden lg:block">
            <WashesTitle />
          </div>
          {/* Trois offres, trois chiffres : lavages, prix, coût d'un lavage */}
          <ol className="grid grid-cols-3 overflow-hidden rounded-2xl bg-white ring-1 ring-hair lg:mt-8">
            {OFFERS.map((o) => {
              const on = o.id === sel
              return (
                <li key={o.id} className="border-l border-hair first:border-l-0">
                  <button
                    type="button"
                    onClick={() => choose(o.id)}
                    aria-pressed={on}
                    aria-label={`Choisir ${o.packs} sachet${o.packs > 1 ? 's' : ''} : ${o.washes} lavages pour ${formatCHF(o.price)}`}
                    className={`flex h-full w-full flex-col items-center px-1 pb-3.5 pt-4 text-center transition-colors lg:pb-5 lg:pt-6 ${
                      on ? 'bg-mint/60' : 'hover:bg-sand/50'
                    }`}
                  >
                    <span className="font-serif text-[2.2rem] font-medium leading-none tabular-nums text-ink min-[400px]:text-[2.5rem] xl:text-[3rem]">
                      {o.washes}
                    </span>
                    <span className="mt-1 text-[0.64rem] font-bold uppercase tracking-[0.14em] text-muted">lavages</span>
                    <span className="mt-3 h-px w-8 bg-hair" />
                    <span className="mt-3 text-[0.74rem] text-ink/70">
                      {o.packs} sachet{o.packs > 1 ? 's' : ''}
                    </span>
                    <span className="whitespace-nowrap text-[0.95rem] font-extrabold tabular-nums text-ink">{formatCHF(o.price)}</span>
                    <span className="mt-0.5 whitespace-nowrap text-[0.72rem] font-semibold text-forest">{cents(o)} ct / lavage</span>
                    <span
                      className={`mt-3 inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[0.7rem] font-bold ${
                        on ? 'bg-forest text-white' : 'text-forest ring-1 ring-forest/30'
                      }`}
                    >
                      {on ? <Check size={12} strokeWidth={3} /> : <ArrowDown size={12} strokeWidth={2.6} />}
                      {on ? 'Choisi' : 'Choisir'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="mt-4 text-[0.76rem] leading-relaxed text-muted">{DOSAGE_NOTE}</p>
        </div>
      </div>
    </section>
  )
}

function WashesTitle() {
  return (
    <>
      <Eyebrow>Ce que vous recevez</Eyebrow>
      <h2
        className="mt-2 font-serif text-[2.2rem] font-medium leading-[1.02] tracking-tight text-ink min-[400px]:text-[2.5rem] lg:text-[3.2rem] xl:text-[3.6rem]"
      >
        60 lavages
        <span className="block italic text-forest">par sachet.</span>
      </h2>
      <p className="mt-3 max-w-[19rem] text-[0.95rem] leading-relaxed text-ink/75 lg:max-w-sm lg:text-[1.02rem]">
        Moins de 7 centimes le lavage, au dosage standard d’une capsule.
      </p>
    </>
  )
}

// C — Le geste : mode d'emploi en quatre temps, puis ouverture du sachet et sécurité.
export function UsageSection() {
  return (
    <section id="utilisation" className="scroll-mt-20 py-14 lg:py-24">
      <div className={W}>
        <Reveal className="grid gap-4 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16">
          <div>
            <Eyebrow>Mode d’emploi</Eyebrow>
            <H2>
              Une capsule,
              <span className="block italic text-forest">c’est tout.</span>
            </H2>
          </div>
          <p className="max-w-md text-[0.95rem] leading-relaxed text-ink/75">
            Rien à mesurer, rien à verser : chaque capsule contient la dose. Elle se pose au fond du tambour — selon Ariel, elle
            se dissout rapidement, même à l’eau froide.
          </p>
        </Reveal>

        <ol className="mt-8 grid border-t border-ink/15 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {STEPS.map((s, k) => {
            const Ill = ILLUSTRATIONS[s.key]
            return (
              <Reveal
                as="li"
                key={s.key}
                delay={k * 60}
                className="grid grid-cols-[4.5rem_1fr] items-center gap-4 border-b border-ink/15 py-4 sm:block sm:border-b-0 sm:py-7 sm:pr-6 lg:border-l lg:px-6 lg:first:border-l-0 lg:first:pl-0"
              >
                <Ill className="h-[4.5rem] w-[4.5rem] text-forest sm:h-24 sm:w-24" />
                <span className="block">
                  <span className="font-serif text-[0.85rem] italic text-forest/70 sm:mt-4 sm:block">Étape {k + 1}</span>
                  <span className="mt-0.5 block text-[1rem] font-bold leading-snug text-ink">{s.title}</span>
                  <span className="mt-1 block text-[0.84rem] leading-relaxed text-ink/70">{s.body}</span>
                </span>
              </Reveal>
            )
          })}
        </ol>

        <div className="mt-8 grid items-start gap-6 lg:mt-10 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
          <div>
            <p className="text-[0.95rem] font-bold text-ink">Ouvrir le sachet</p>
            <p className="text-[0.8rem] text-muted">Fermeture sécurité enfants — 4 gestes, imprimés en haut du sachet</p>
            <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4 lg:grid-cols-2">
              {OPENING_STEPS.map((s, k) => (
                <li key={s} className="flex items-baseline gap-2 border-t border-ink/15 pt-2 text-[0.82rem] text-ink">
                  <span className="font-serif text-base text-forest">{k + 1}</span> {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-[1.25rem] border border-amber-300/70 bg-amber-50/60 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-ink">
              <ShieldAlert size={17} className="text-amber-700" /> Sécurité
            </p>
            {/* Les deux consignes essentielles toujours visibles ; le reste en divulgation progressive */}
            <ul className="mt-3 space-y-1.5 text-[0.82rem] leading-relaxed text-ink/80">
              {SAFETY.slice(0, 2).map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 flex-none rounded-full bg-amber-700" />
                  {s}
                </li>
              ))}
            </ul>
            <details className="group mt-2">
              <summary className="cursor-pointer list-none text-[0.8rem] font-semibold text-amber-800 underline underline-offset-2 [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">Toutes les consignes de sécurité</span>
                <span className="hidden group-open:inline">Masquer les consignes</span>
              </summary>
              <ul className="mt-2 space-y-1.5 text-[0.82rem] leading-relaxed text-ink/80">
                {SAFETY.slice(2).map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="mt-2 h-1 w-1 flex-none rounded-full bg-amber-700" />
                    {s}
                  </li>
                ))}
              </ul>
            </details>
            <a
              href={`tel:${EMERGENCY.number}`}
              className="mt-4 flex items-center gap-3 rounded-xl bg-white p-3 text-sm ring-1 ring-amber-200"
            >
              <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-amber-700 text-white">
                <Phone size={17} />
              </span>
              <span>
                <strong className="block text-ink">
                  {EMERGENCY.label} · {EMERGENCY.number}
                </strong>
                <span className="text-xs text-ink/70">{EMERGENCY.note}</span>
              </span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
