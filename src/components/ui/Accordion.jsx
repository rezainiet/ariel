import { useState, useId } from 'react'
import { Plus } from 'lucide-react'

export default function Accordion({ items }) {
  const [open, setOpen] = useState(null)
  const base = useId()

  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item, i) => {
        const isOpen = open === i
        const panelId = `${base}-panel-${i}`
        const btnId = `${base}-btn-${i}`
        return (
          <div key={i}>
            <h3>
              <button
                id={btnId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <span className="text-[0.98rem] font-semibold text-ink">{item.q}</span>
                <span
                  className={`flex h-7 w-7 flex-none items-center justify-center rounded-full bg-sage/60 text-forest transition-transform duration-300 ${
                    isOpen ? 'rotate-45' : ''
                  }`}
                >
                  <Plus size={16} strokeWidth={2} />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="pb-5 pr-10 text-[0.92rem] leading-relaxed text-muted"
            >
              {item.a}
            </div>
          </div>
        )
      })}
    </div>
  )
}
