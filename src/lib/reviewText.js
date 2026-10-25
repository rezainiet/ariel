// Texte d'un avis dans la langue affichée : la traduction enregistrée si elle existe, sinon l'original.
// Aucun texte n'est jamais produit dans le navigateur. `original: true` force la version d'origine.
export function reviewText(review, lang, { original = false } = {}) {
  const source = review.lang || 'fr'
  const translation = source !== lang ? review.translations?.[lang] : null
  const usable = Boolean(translation?.body && (!review.title || translation.title))
  if (usable && !original) return { title: translation.title || '', body: translation.body, lang, source, translated: true, canToggle: true }
  return { title: review.title || '', body: review.body, lang: source, source, translated: false, canToggle: usable }
}
