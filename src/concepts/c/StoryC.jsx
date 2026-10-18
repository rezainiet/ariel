import { Check, X, Phone, ShieldAlert, Info } from 'lucide-react'
import { OFFERS, formatCHF } from '../../config/store.js'
import { IMAGES } from '../../config/assets.js'
import Reveal from '../../components/ui/Reveal.jsx'
import { Eyebrow, H2 } from './TrustC.jsx'
import { PackStack } from './BuyBoxC.jsx'
import { ILLUSTRATIONS } from './Illustrations.jsx'
import {
  FORMAT_POINTS,
  CLAIMS,
  SUITABILITY,
  STEPS,
  DOSAGE_NOTE,
  OPENING_STEPS,
  SAFETY,
  EMERGENCY,
} from './contentC.js'

const W = 'mx-auto max-w-[1320px] px-4 lg:px-8'

// Tirage encadré pour les visuels basse résolution (jamais agrandis au-delà du raisonnable).
function Print({ src, alt, className = '' }) {
  return (
    <figure className={`overflow-hidden rounded-xl bg-white p-1.5 shadow-[0_24px_50px_rgba(23,42,32,0.16)] ${className}`}>
      <img src={src} alt={alt} loading="lazy" className="h-full w-full rounded-lg object-cover" />
    </figure>
  )
}

// A — Un format pratique pour votre quotidien
export function FormatSection() {
  return (
    <section id="produit" className="scroll-mt-20 bg-sand/60 py-12 lg:py-20">
      <div className={`${W} grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16`}>
        <Reveal className="relative mx-auto w-full max-w-[13rem] sm:max-w-[17rem] lg:max-w-sm">
          <Print src={IMAGES.podWater} alt="Capsule Ariel en gros plan" className="aspect-[4/5]" />
          <span className="absolute -bottom-4 -right-3 rounded-full bg-forest px-4 py-2 text-xs font-bold text-white shadow-lg">
            1 capsule = 1 dose
          </span>
        </Reveal>
        <Reveal>
          <Eyebrow>Le format capsule</Eyebrow>
          <H2>Un format pratique pour votre quotidien</H2>
          <ol className="mt-6 space-y-5">
            {FORMAT_POINTS.map((p, k) => (
              <li key={p.title} className="grid grid-cols-[2.25rem_1fr] gap-3">
                <span className="font-serif text-2xl leading-none text-forest/60">0{k + 1}</span>
                <span>
                  <span className="block text-[1.02rem] font-bold text-ink">{p.title}</span>
                  <span className="mt-1 block text-[0.92rem] leading-relaxed text-ink/75">{p.body}</span>
                  {p.source && <span className="mt-1 block text-xs italic text-muted">{p.source}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  )
}

// B — 60 lavages dans un sachet
export function WashesSection() {
  return (
    <section className="py-12 lg:py-20">
      <div className={`${W} grid items-center gap-8 lg:grid-cols-[1fr_1fr] lg:gap-16`}>
        <Reveal className="order-2 lg:order-1">
          <Eyebrow>Ce que vous recevez</Eyebrow>
          <H2>60 lavages dans un sachet</H2>
          <p className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-ink/75">
            Chaque pack est un sachet de 60 capsules — 60 lavages au dosage standard d’une capsule.
          </p>
          <ul className="mt-6 divide-y divide-hair border-y border-hair">
            {OFFERS.map((o) => (
              <li key={o.id} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 py-3.5">
                <PackStack packs={o.packs} />
                <span>
                  <span className="block font-bold text-ink">
                    {o.packs} pack{o.packs > 1 ? 's' : ''} = {o.washes} lavages
                  </span>
                  <span className="block text-xs text-muted">{o.washes} capsules</span>
                </span>
                <span className="font-serif text-xl tabular-nums text-forest">{formatCHF(o.price)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex gap-2.5 rounded-xl bg-mint/70 p-3.5 text-[0.82rem] leading-relaxed text-ink/80">
            <Info size={16} className="mt-0.5 flex-none text-forest" />
            {DOSAGE_NOTE}
          </p>
        </Reveal>
        {/* Grand packshot : desktop uniquement (sur mobile, les lignes montrent déjà les sachets réels) */}
        <Reveal className="order-1 hidden lg:order-2 lg:block">
          <div className="relative mx-auto flex aspect-square max-w-[22rem] items-center justify-center rounded-full bg-gradient-to-b from-sand to-ivory lg:max-w-md">
            <img src={IMAGES.packshotCutout} alt="Sachet Ariel All-in-1 PODS « 60 PODS »" loading="lazy" className="w-[82%] drop-shadow-[0_28px_30px_rgba(23,42,32,0.22)]" />
            <span className="absolute -right-1 top-6 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-forest text-white shadow-lg lg:h-24 lg:w-24">
              <span className="font-serif text-2xl leading-none lg:text-3xl">60</span>
              <span className="text-[0.62rem] font-bold uppercase tracking-wider">lavages</span>
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// C — Découvrez Ariel All-in-1 PODS
export function ClaimsSection() {
  return (
    <section className="bg-forest py-12 text-white lg:py-20">
      <div className={`${W} grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16`}>
        <Reveal className="relative mx-auto w-full max-w-[14rem] sm:max-w-[18rem] lg:max-w-sm">
          <Print src={IMAGES.handpod} alt="Une capsule déposée dans le tambour" className="aspect-[3/4]" />
          <Print
            src={IMAGES.stacked}
            alt="Sachets de 60 capsules"
            className="absolute -bottom-6 -left-5 hidden aspect-square w-[46%] sm:block lg:-left-10"
          />
        </Reveal>
        <Reveal>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-sage">Le produit</p>
          <h2 className="mt-2 font-serif text-[1.9rem] font-medium leading-[1.08] tracking-tight lg:text-[2.6rem]">
            Découvrez Ariel All-in-1 PODS
          </h2>
          <p className="mt-3 text-[0.92rem] text-white/70">
            Ce qu’indiquent le fabricant et l’emballage (version germanophone) — sans promesse ajoutée.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/15">
            {CLAIMS.map((c) => (
              <div key={c.title} className="bg-forest p-3.5 lg:p-5">
                <p className="text-[0.88rem] font-bold leading-snug lg:text-base">{c.title}</p>
                <p className="mt-1 hidden text-[0.82rem] text-white/70 sm:block">{c.body}</p>
                <p className="mt-1.5 font-serif text-[0.8rem] italic leading-snug text-sage lg:text-sm">{c.quote}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-2 text-[0.85rem] sm:grid-cols-2">
            <p className="flex gap-2 rounded-xl bg-white/10 p-3">
              <Check size={16} className="mt-0.5 flex-none text-sage" /> <span><strong>Pour :</strong> {SUITABILITY.for}</span>
            </p>
            <p className="flex gap-2 rounded-xl bg-white/10 p-3">
              <X size={16} className="mt-0.5 flex-none text-sage" /> <span><strong>Pas pour :</strong> {SUITABILITY.notFor}</span>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

// D — Comment utiliser les capsules ?
export function UsageSection() {
  return (
    <section id="utilisation" className="scroll-mt-20 py-12 lg:py-20">
      <div className={W}>
        <Reveal className="max-w-2xl">
          <Eyebrow>Mode d’emploi</Eyebrow>
          <H2>Comment utiliser les capsules&nbsp;?</H2>
        </Reveal>
        <ol className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {STEPS.map((s, k) => {
            const Ill = ILLUSTRATIONS[s.key]
            return (
              <Reveal as="li" key={s.key} delay={k * 60} className="flex flex-col rounded-[1.25rem] bg-sand/60 p-4 lg:p-6">
                <span className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">{k + 1}</span>
                </span>
                <Ill className="mx-auto mt-2 h-20 w-20 text-forest lg:h-28 lg:w-28" />
                <span className="mt-3 text-[0.92rem] font-bold leading-snug text-ink">{s.title}</span>
                <span className="mt-1 text-[0.8rem] leading-relaxed text-ink/70">{s.body}</span>
              </Reveal>
            )
          })}
        </ol>

        <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-[1.25rem] border border-hair p-5">
            <p className="text-sm font-bold text-ink">Ouvrir le sachet (fermeture sécurité enfants)</p>
            <ol className="mt-3 grid grid-cols-2 gap-2">
              {OPENING_STEPS.map((s, k) => (
                <li key={s} className="rounded-lg bg-sand/60 px-3 py-2 text-xs text-ink">
                  <strong className="text-forest">{k + 1}.</strong> {s}
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
