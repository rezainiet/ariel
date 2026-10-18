// Mise en page des pages de service et légales — style Frais.
export function PageHeader({ eyebrow, title, intro }) {
  return (
    <header className="border-b border-fr-line bg-fr-mint/45 font-jakarta">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:px-8">
        {eyebrow && <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-fr-green">{eyebrow}</p>}
        <h1 className="mt-3 text-[2rem] font-extrabold leading-tight tracking-[-0.025em] text-fr-ink sm:text-[2.6rem]">{title}</h1>
        {intro && <p className="mt-4 text-[1rem] leading-relaxed text-fr-muted">{intro}</p>}
      </div>
    </header>
  )
}

export function Prose({ children }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 font-jakarta sm:py-14 lg:px-8">
      <div className="space-y-9 text-[0.95rem] leading-relaxed text-fr-ink/85">{children}</div>
    </div>
  )
}

export function Block({ title, children }) {
  return (
    <section>
      <h2 className="text-[1.15rem] font-extrabold tracking-[-0.015em] text-fr-ink">{title}</h2>
      <div className="mt-2.5 space-y-3 text-fr-muted">{children}</div>
    </section>
  )
}
