import { useEffect, useMemo, useState } from 'react'
import { LockKeyhole, LogOut, Plus, Trash2, Loader2, Check, AlertCircle, ExternalLink, RotateCcw } from 'lucide-react'
import { OFFERS, formatCHF } from '../config/offers.js'
import { FIELDS, DEFAULT_PARAMS, validateConfig, buildRedirectUrl, normalizeDomain } from '../lib/redirectPayment.js'
import { Logo } from '../concepts/frais/ChromeF.jsx'

// ─────────────────────────────────────────────────────────────
// Administration — paiement par redirection externe.
// Accès protégé côté serveur (mot de passe ADMIN_PASSWORD, cookie de session httpOnly).
// Page non liée publiquement et non indexée.
// ─────────────────────────────────────────────────────────────

const SAMPLE = { prenom: 'Léa', nom: 'Muller', email: 'lea.muller@exemple.ch', tel: '079 123 45 67', adresse: 'Rue du Lac 4', complement: 'App. 12', npa: '1003', ville: 'Lausanne' }

async function call(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

const input =
  'h-11 w-full rounded-xl border border-fr-line bg-white px-3.5 text-[0.95rem] text-fr-ink outline-none transition focus:border-fr-green focus:shadow-[0_0_0_4px_rgba(14,122,71,0.12)]'

function Login({ onDone, configured }) {
  const [password, setPassword] = useState('')
  const [state, setState] = useState({ busy: false, error: '' })
  const submit = async (e) => {
    e.preventDefault()
    setState({ busy: true, error: '' })
    const r = await call('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
    if (r.status === 200) return onDone()
    setState({
      busy: false,
      error: r.status === 429 ? 'Trop de tentatives. Réessayez dans 10 minutes.' : r.status === 503 ? 'Administration désactivée sur ce serveur.' : 'Mot de passe incorrect.',
    })
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-fr-soft px-4 font-jakarta">
      <form onSubmit={submit} className="w-full max-w-sm rounded-[1.6rem] bg-white p-7 ring-1 ring-fr-line">
        <Logo />
        <h1 className="mt-6 text-[1.4rem] font-extrabold tracking-[-0.02em] text-fr-ink">Administration</h1>
        <p className="mt-1 text-sm text-fr-muted">Accès réservé à l’exploitant de la boutique.</p>
        {!configured ? (
          <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            L’accès administrateur n’est pas activé : définissez la variable ADMIN_PASSWORD (12 caractères minimum) sur le serveur.
          </p>
        ) : (
          <>
            <label htmlFor="pw" className="mt-5 block text-sm font-bold text-fr-ink">
              Mot de passe
            </label>
            <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} mt-1.5`} />
            {state.error && (
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-red-600">
                <AlertCircle size={15} /> {state.error}
              </p>
            )}
            <button disabled={state.busy || !password} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-fr-green font-bold text-white disabled:opacity-60">
              {state.busy ? <Loader2 size={18} className="animate-spin" /> : <LockKeyhole size={17} />} Se connecter
            </button>
          </>
        )}
      </form>
    </div>
  )
}

function Card({ title, desc, children, aside }) {
  return (
    <section className="rounded-[1.6rem] bg-white p-5 ring-1 ring-fr-line lg:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[1.1rem] font-extrabold tracking-[-0.015em] text-fr-ink">{title}</h2>
          {desc && <p className="mt-1 max-w-2xl text-[0.86rem] text-fr-muted">{desc}</p>}
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

const Err = ({ msg }) =>
  msg ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-[0.8rem] font-semibold text-red-600">
      <AlertCircle size={14} /> {msg}
    </p>
  ) : null

function Editor({ initial, onLogout }) {
  const [cfg, setCfg] = useState(initial.externalRedirect)
  const [savedAt, setSavedAt] = useState(initial.updatedAt)
  const [status, setStatus] = useState({ busy: false, msg: '', errors: {} })
  const [previewOffer, setPreviewOffer] = useState(OFFERS[1].id)
  const set = (patch) => setCfg((c) => ({ ...c, ...patch }))
  const setPkg = (id, patch) => setCfg((c) => ({ ...c, packages: { ...c.packages, [id]: { ...c.packages[id], ...patch } } }))
  const setParam = (i, patch) => setCfg((c) => ({ ...c, params: c.params.map((p, k) => (k === i ? { ...p, ...patch } : p)) }))

  const check = useMemo(() => validateConfig({ externalRedirect: cfg }), [cfg])
  const preview = useMemo(() => {
    const domain = normalizeDomain(cfg.domain)
    if (!domain || !check.ok) return ''
    try {
      return buildRedirectUrl({ externalRedirect: { ...check.config.externalRedirect, enabled: true } }, OFFERS.find((o) => o.id === previewOffer), SAMPLE, { origin: window.location.origin })
    } catch {
      return ''
    }
  }, [cfg, check, previewOffer])
  const errors = { ...status.errors, ...(check.ok ? {} : check.errors) }

  const save = async () => {
    setStatus({ busy: true, msg: '', errors: {} })
    const r = await call('/api/admin/config', { method: 'PUT', body: JSON.stringify({ externalRedirect: cfg }) })
    if (r.status === 200) {
      setCfg(r.data.externalRedirect)
      setSavedAt(r.data.updatedAt)
      setStatus({ busy: false, msg: 'Configuration enregistrée.', errors: {} })
    } else if (r.status === 401) onLogout()
    else setStatus({ busy: false, msg: '', errors: r.data.errors || { form: 'Enregistrement impossible.' } })
  }

  return (
    <div className="min-h-screen bg-fr-soft font-jakarta text-fr-ink">
      <header className="border-b border-fr-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="rounded-full bg-fr-deep px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-[0.1em] text-white">Admin</span>
          </div>
          <button onClick={onLogout} className="flex items-center gap-1.5 text-sm font-semibold text-fr-muted hover:text-fr-green">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8 lg:px-8">
        <div>
          <h1 className="text-[1.8rem] font-extrabold tracking-[-0.025em]">Paiement</h1>
          <p className="mt-1 text-[0.9rem] text-fr-muted">
            Redirection vers une page de paiement externe après validation de la commande.
            {savedAt && ` Dernier enregistrement : ${new Date(savedAt).toLocaleString('fr-CH')}.`}
          </p>
        </div>

        <Card
          title="Paiement par redirection externe"
          desc="Activé : le bouton « Acheter » de la commande envoie le client vers l’URL ci-dessous, avec ses coordonnées dans les paramètres. Désactivé : aucune commande ne peut être passée."
          aside={
            <button
              type="button"
              role="switch"
              aria-checked={cfg.enabled}
              onClick={() => set({ enabled: !cfg.enabled })}
              className={`flex h-10 items-center gap-3 rounded-full text-sm font-bold transition-colors ${cfg.enabled ? 'flex-row-reverse bg-fr-green pl-4 pr-1.5 text-white' : 'bg-fr-line pl-1.5 pr-4 text-fr-muted'}`}
            >
              <span className="h-7 w-7 rounded-full bg-white shadow" />
              {cfg.enabled ? 'Activé' : 'Désactivé'}
            </button>
          }
        >
          <div className="grid gap-4 sm:grid-cols-[1.4fr_1fr]">
            <div>
              <label htmlFor="domain" className="block text-sm font-bold">
                Domaine de paiement
              </label>
              <div className="mt-1.5 flex items-center rounded-xl border border-fr-line bg-fr-soft pl-3.5 text-sm text-fr-muted focus-within:border-fr-green">
                https://
                <input id="domain" value={cfg.domain} onChange={(e) => set({ domain: e.target.value })} placeholder="paiement.exemple.ch" className="h-11 w-full bg-transparent px-1 text-[0.95rem] text-fr-ink outline-none" />
              </div>
              <Err msg={errors.domain} />
            </div>
            <div>
              <label htmlFor="path" className="block text-sm font-bold">
                Chemin <span className="font-normal text-fr-muted">({'{code}'} = code de l’offre)</span>
              </label>
              <input id="path" value={cfg.pathTemplate} onChange={(e) => set({ pathTemplate: e.target.value })} className={`${input} mt-1.5`} />
              <Err msg={errors.pathTemplate} />
            </div>
          </div>
        </Card>

        <Card title="Codes par offre" desc="Un code par offre, inséré dans le chemin. Le nom et la photo peuvent être transmis en paramètres.">
          <div className="space-y-3">
            {OFFERS.map((o) => {
              const p = cfg.packages[o.id] || {}
              return (
                <div key={o.id} className="grid gap-3 rounded-2xl bg-fr-soft p-4 lg:grid-cols-[9rem_1fr_1.4fr_1.4fr] lg:items-start">
                  <p className="pt-1 font-extrabold">
                    {o.packs} sachet{o.packs > 1 ? 's' : ''}
                    <span className="block text-sm font-semibold text-fr-green">{formatCHF(o.price)}</span>
                  </p>
                  <div>
                    <label className="block text-[0.8rem] font-bold" htmlFor={`code-${o.id}`}>
                      Code
                    </label>
                    <input id={`code-${o.id}`} value={p.code || ''} onChange={(e) => setPkg(o.id, { code: e.target.value })} className={`${input} mt-1`} />
                    <Err msg={errors[`code_${o.id}`]} />
                  </div>
                  <div>
                    <label className="block text-[0.8rem] font-bold" htmlFor={`name-${o.id}`}>
                      Nom du produit / de l’offre
                    </label>
                    <input id={`name-${o.id}`} value={p.productName || ''} onChange={(e) => setPkg(o.id, { productName: e.target.value })} className={`${input} mt-1`} />
                  </div>
                  <div>
                    <label className="block text-[0.8rem] font-bold" htmlFor={`photo-${o.id}`}>
                      URL de la photo <span className="font-normal text-fr-muted">(vide = photo de la boutique)</span>
                    </label>
                    <input id={`photo-${o.id}`} value={p.photoUrl || ''} onChange={(e) => setPkg(o.id, { photoUrl: e.target.value })} placeholder="https://…" className={`${input} mt-1`} />
                    <Err msg={errors[`photo_${o.id}`]} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card
          title="Paramètres ajoutés à l’URL"
          desc="Chaque paramètre reçoit une donnée de la commande. Ces données personnelles sont transmises au domaine de paiement : il doit être de confiance et figurer dans la politique de confidentialité."
          aside={
            <button type="button" onClick={() => set({ params: DEFAULT_PARAMS })} className="flex items-center gap-1.5 text-sm font-semibold text-fr-green hover:underline">
              <RotateCcw size={14} /> Valeurs par défaut
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <thead>
                <tr className="text-[0.76rem] uppercase tracking-[0.08em] text-fr-muted">
                  <th className="pb-2 font-bold">Paramètre</th>
                  <th className="pb-2 font-bold">Donnée transmise</th>
                  <th className="w-12 pb-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-fr-line">
                {cfg.params.map((row, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-3">
                      <input aria-label={`Nom du paramètre ${i + 1}`} value={row.param} onChange={(e) => setParam(i, { param: e.target.value })} className={`${input} font-mono`} />
                    </td>
                    <td className="py-2 pr-3">
                      <select aria-label={`Donnée du paramètre ${i + 1}`} value={row.field} onChange={(e) => setParam(i, { field: e.target.value })} className={input}>
                        {Object.entries(FIELDS).map(([k, label]) => (
                          <option key={k} value={k}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        aria-label={`Supprimer le paramètre ${row.param || i + 1}`}
                        onClick={() => setCfg((c) => ({ ...c, params: c.params.filter((_, k) => k !== i) }))}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-fr-muted hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Err msg={errors.params} />
          <button
            type="button"
            onClick={() => setCfg((c) => ({ ...c, params: [...c.params, { param: '', field: 'prenom' }] }))}
            className="mt-3 flex items-center gap-1.5 rounded-full bg-fr-mint px-4 py-2 text-sm font-bold text-fr-green hover:bg-fr-mint2"
          >
            <Plus size={15} /> Ajouter un paramètre
          </button>
        </Card>

        <Card
          title="Aperçu de l’URL"
          desc="Avec des coordonnées d’essai, pour vérifier le format avant d’activer."
          aside={
            <select value={previewOffer} onChange={(e) => setPreviewOffer(e.target.value)} className={`${input} !h-10 !w-auto`} aria-label="Offre de l’aperçu">
              {OFFERS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.packs} sachet{o.packs > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          }
        >
          {preview ? (
            <div className="rounded-xl bg-fr-deep p-4">
              <code className="block break-all font-mono text-[0.8rem] leading-relaxed text-fr-mint">{preview}</code>
              <a href={preview} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-[0.8rem] font-semibold text-fr-leaf hover:underline">
                Ouvrir dans un nouvel onglet <ExternalLink size={13} />
              </a>
            </div>
          ) : (
            <p className="text-sm text-fr-muted">Renseignez un domaine valide pour voir l’aperçu.</p>
          )}
        </Card>

        <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-fr-line bg-fr-soft/95 px-4 py-4 backdrop-blur lg:mx-0 lg:rounded-2xl lg:border lg:bg-white">
          {status.msg && (
            <p className="mr-auto flex items-center gap-1.5 text-sm font-semibold text-fr-green" role="status">
              <Check size={16} /> {status.msg}
            </p>
          )}
          {status.errors.form && <p className="mr-auto text-sm font-semibold text-red-600">{status.errors.form}</p>}
          <button
            onClick={save}
            disabled={status.busy || !check.ok}
            className="flex h-12 items-center gap-2 rounded-full bg-fr-green px-7 font-bold text-white shadow-[0_12px_26px_rgba(14,122,71,0.25)] disabled:opacity-50"
          >
            {status.busy && <Loader2 size={17} className="animate-spin" />} Enregistrer
          </button>
        </div>
      </main>
    </div>
  )
}

export default function Admin() {
  const [state, setState] = useState({ phase: 'loading' })

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  const load = async () => {
    const s = await call('/api/admin/session')
    if (s.status !== 200) return setState({ phase: 'offline' })
    if (!s.data.authenticated) return setState({ phase: 'login', configured: s.data.configured })
    const c = await call('/api/admin/config')
    if (c.status === 200) setState({ phase: 'ready', config: c.data })
    else setState({ phase: 'login', configured: true })
  }
  useEffect(() => {
    load()
  }, [])

  const logout = async () => {
    await call('/api/admin/logout', { method: 'POST' })
    setState({ phase: 'login', configured: true })
  }

  if (state.phase === 'loading')
    return (
      <div className="flex min-h-screen items-center justify-center bg-fr-soft">
        <Loader2 className="animate-spin text-fr-green" />
      </div>
    )
  if (state.phase === 'offline')
    return (
      <div className="flex min-h-screen items-center justify-center bg-fr-soft px-4 text-center font-jakarta text-fr-ink">
        <p>Le serveur d’administration est injoignable. Démarrez-le avec « npm run server ».</p>
      </div>
    )
  if (state.phase === 'login') return <Login configured={state.configured} onDone={load} />
  return <Editor initial={state.config} onLogout={logout} />
}
