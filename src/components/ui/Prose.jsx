// Mise en page éditoriale sobre pour les pages de contenu / légales.
export function PageHeader({ eyebrow, title, intro }) {
  return (
    <header className="border-b border-line bg-surface">
      <div className="container-edge max-w-3xl py-12 sm:py-16">
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {intro && <p className="mt-4 text-[0.98rem] leading-relaxed text-muted">{intro}</p>}
      </div>
    </header>
  )
}

export function Prose({ children }) {
  return (
    <div className="container-edge max-w-3xl py-12 sm:py-14">
      <div className="space-y-8 text-[0.95rem] leading-relaxed text-ink/85">{children}</div>
    </div>
  )
}

export function Block({ title, children }) {
  return (
    <section>
      <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
      <div className="mt-2 space-y-3 text-muted">{children}</div>
    </section>
  )
}

// Encart « à confirmer par le marchand » — transparence.
export function TodoNote({ children }) {
  return (
    <p className="rounded-xl border border-dashed border-forest/30 bg-sage/25 p-4 text-sm text-ink/75">
      <strong className="font-semibold text-forest">À confirmer avant la mise en ligne&nbsp;:</strong>{' '}
      {children}
    </p>
  )
}
