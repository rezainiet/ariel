// Métadonnées SEO par langue — module pur : le serveur les écrit dans la page servie (server/geo.mjs),
// le navigateur les met à jour quand le visiteur change de langue (src/i18n/index.jsx).
// `from` = prix d'entrée déjà formaté dans la devise du visiteur.
export const META = {
  fr: {
    htmlLang: 'fr-CH',
    ogLocale: 'fr_CH',
    title: 'Ariel All-in-1 PODS · Déstockage en Suisse',
    description: (from) => `Déstockage en Suisse : Ariel All-in-1 PODS, sachets de 60 capsules dès ${from}. Livraison offerte en Suisse, retour possible sous 15 jours.`,
    ogDescription: (from) => `Ariel All-in-1 PODS, sachets de 60 capsules dès ${from}. Livraison offerte en Suisse.`,
  },
  de: {
    htmlLang: 'de',
    ogLocale: 'de_DE',
    title: 'Ariel All-in-1 PODS · Lagerabverkauf in der Schweiz',
    description: (from) => `Lagerabverkauf in der Schweiz: Ariel All-in-1 PODS, Beutel mit 60 Kapseln ab ${from}. Kostenlose Lieferung in der Schweiz, Rückgabe innerhalb von 15 Tagen möglich.`,
    ogDescription: (from) => `Ariel All-in-1 PODS, Beutel mit 60 Kapseln ab ${from}. Kostenlose Lieferung in der Schweiz.`,
  },
  en: {
    htmlLang: 'en',
    ogLocale: 'en_GB',
    title: 'Ariel All-in-1 PODS · Clearance sale in Switzerland',
    description: (from) => `Clearance sale in Switzerland: Ariel All-in-1 PODS, pouches of 60 pods from ${from}. Free delivery in Switzerland, returns possible within 15 days.`,
    ogDescription: (from) => `Ariel All-in-1 PODS, pouches of 60 pods from ${from}. Free delivery in Switzerland.`,
  },
}

// Locale des dates par langue (avis, suivi de commande).
export const DATE_LOCALES = { fr: 'fr-CH', de: 'de-CH', en: 'en-CH' }
