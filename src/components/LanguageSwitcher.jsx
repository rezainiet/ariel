import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useI18n, MESSAGES } from '../i18n/index.jsx'
import { LANGS } from '../i18n/detect.js'

// Drapeaux ronds dessinés en SVG (aucune police emoji : rendu identique sur tous les appareils).
function Flag({ lang, className = 'h-[1.15rem] w-[1.15rem]' }) {
  const clip = useId()
  const stripes = lang === 'de'
    ? [['#000', 0, 0, 24, 8], ['#DD0000', 0, 8, 24, 8], ['#FFCE00', 0, 16, 24, 8]]
    : [['#0055A4', 0, 0, 8, 24], ['#FFFFFF', 8, 0, 8, 24], ['#EF4135', 16, 0, 8, 24]]
  return (
    <svg viewBox="0 0 24 24" className={`flex-none rounded-full shadow-[0_0_0_1px_rgba(11,61,42,0.14)] ${className}`} aria-hidden="true">
      <clipPath id={clip}>
        <circle cx="12" cy="12" r="12" />
      </clipPath>
      <g clipPath={`url(#${CSS.escape(clip)})`}>
        {stripes.map(([fill, x, y, w, h]) => <rect key={fill} x={x} y={y} width={w} height={h} fill={fill} />)}
      </g>
    </svg>
  )
}

// Sélecteur de langue de l'en-tête : pilule compacte (drapeau + code), menu déroulant au clic.
// Le choix est instantané, mémorisé, et prime toujours sur la détection automatique.
export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const root = useRef(null)
  const button = useRef(null)
  const items = useRef([])
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!root.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    items.current[LANGS.indexOf(lang)]?.focus()
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (l) => {
    setLang(l)
    setOpen(false)
    button.current?.focus()
  }
  const onItemKey = (e, k) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    items.current[(k + (e.key === 'ArrowDown' ? 1 : -1) + LANGS.length) % LANGS.length]?.focus()
  }

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${t.lang.choose} — ${t.lang.name}`}
        className={`flex h-11 items-center gap-1.5 rounded-full border bg-white pl-2.5 pr-2 font-jakarta text-[0.8rem] font-bold text-fr-deep transition-[border-color,box-shadow,background-color,transform] duration-base ease-out-soft hover:border-fr-green/40 motion-safe:active:scale-[0.97] lg:gap-2 lg:pl-3 lg:pr-2.5 ${
          open ? 'border-fr-green/50 shadow-[0_0_0_4px_rgba(14,122,71,0.10)]' : 'border-fr-line'
        }`}
      >
        <Flag lang={lang} />
        <span className="tracking-[0.04em] max-[359px]:hidden lg:hidden">{t.lang.short}</span>
        <span className="hidden lg:inline">{t.lang.name}</span>
        <ChevronDown size={15} strokeWidth={2.2} className={`text-fr-muted transition-transform duration-base ease-out-soft ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={t.lang.label}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[11.5rem] origin-top-right animate-reveal-down rounded-2xl border border-fr-line bg-white p-1.5 font-jakarta shadow-[0_18px_44px_rgba(11,61,42,0.16)]"
        >
          {LANGS.map((l, k) => {
            const on = l === lang
            return (
              <button
                key={l}
                ref={(el) => (items.current[k] = el)}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                lang={l}
                onClick={() => choose(l)}
                onKeyDown={(e) => onItemKey(e, k)}
                className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-[0.9rem] font-semibold outline-none transition-colors duration-base focus-visible:ring-2 focus-visible:ring-fr-green/40 ${
                  on ? 'bg-fr-mint text-fr-deep' : 'text-fr-ink hover:bg-fr-soft'
                }`}
              >
                <Flag lang={l} className="h-5 w-5" />
                <span className="flex-1">{MESSAGES[l].lang.name}</span>
                {on && <Check size={16} strokeWidth={2.6} className="text-fr-green" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
