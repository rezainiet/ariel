// Donnée marchand manquante : RIEN n'est affiché aux clients (ni en production, ni en développement).
// Les informations à fournir sont listées dans LAUNCH-CHECKLIST.md. Jamais de valeur inventée à la place.
export function Pending() {
  return null
}

// Affiche la valeur si elle existe ; sinon rien.
export function Fact({ value }) {
  return value ? <>{value}</> : null
}
