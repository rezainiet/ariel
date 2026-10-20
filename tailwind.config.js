/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Swiss Editorial Commerce palette
        canvas: '#F8F9F5', // primary background
        surface: '#FFFFFF', // secondary background
        forest: {
          DEFAULT: '#123F2D', // primary dark green
          700: '#194A36',
          600: '#1F5A42',
        },
        sage: '#DDE8D8', // accent sage
        ink: '#172A20', // primary text
        muted: '#6B746D', // secondary text
        line: '#E6E9E3', // subtle borders
        // Concept A — Swiss Luxury
        ivory: '#FAF8F3',
        sand: '#F1ECE1',
        hair: '#E4DFD3',
        // Concept B — Modern Product (jaune repris du bandeau « 60 PODS »)
        night: { DEFAULT: '#0C1310', 800: '#141D19', 700: '#1C2722' },
        mist: '#EEF2EE',
        pollen: '#F2D94E',
        // Concept C — Conversion
        cloud: '#F4F6F3',
        mint: '#E4F2E9',
        // Concept 2 — Frais (boutique approuvée)
        fr: {
          green: '#0E7A47', // vert Ariel adouci : actions, prix
          deep: '#0B3D2A', // vert profond : bandeau, titres forts
          leaf: '#19A463', // dégradés, accents lumineux
          mint: '#E9F6EF', // fonds menthe
          mint2: '#D4EEDF', // menthe soutenue
          ink: '#14201A', // texte
          muted: '#66756D', // texte secondaire
          line: '#E4ECE7', // filets
          soft: '#F6F8F7', // fonds neutres
        },
      },
      fontFamily: {
        sans: ['"Manrope Variable"', 'Manrope', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces Variable"', 'Georgia', 'serif'],
        grotesk: ['"Space Grotesk Variable"', '"Manrope Variable"', 'system-ui', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      maxWidth: {
        content: '1200px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(23, 42, 32, 0.04)',
        card: '0 2px 10px rgba(23, 42, 32, 0.05)',
      },
      // Système de mouvement : valeurs définies une seule fois dans src/index.css (:root),
      // réduites sur mobile et neutralisées si l'utilisateur réduit les animations.
      transitionTimingFunction: {
        'out-soft': 'var(--ease-out)', // entrées, sélections, retours d'état
        'in-soft': 'var(--ease-in)', // sorties
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        base: 'var(--dur-base)',
        slow: 'var(--dur-slow)',
        enter: 'var(--dur-enter)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translate3d(0, var(--motion-rise), 0)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'drawer-in': {
          '0%': { transform: 'translate3d(100%, 0, 0)' },
          '100%': { transform: 'none' },
        },
        'drawer-out': {
          '0%': { transform: 'none' },
          '100%': { transform: 'translate3d(100%, 0, 0)' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translate3d(0, calc(var(--motion-rise) * -1), 0)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'toast-out': {
          '0%': { opacity: '1', transform: 'none' },
          '100%': { opacity: '0', transform: 'translate3d(0, calc(var(--motion-rise) * -0.6), 0)' },
        },
        // Message, erreur ou avis qui apparaît sous un champ : glisse de quelques pixels vers le bas.
        'reveal-down': {
          '0%': { opacity: '0', transform: 'translate3d(0, -4px, 0)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        // Valeur qui change (prix, quantité) : jamais invisible, seulement un léger fondu.
        'swap-in': {
          '0%': { opacity: '0.55', transform: 'translate3d(0, 2px, 0)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        // Coche de validation, pastille du panier : mise à l'échelle sans rebond.
        pop: {
          '0%': { opacity: '0.3', transform: 'scale(0.7)' },
          '100%': { opacity: '1', transform: 'none' },
        },
        'msg-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '.45' },
        },
      },
      animation: {
        'fade-up': 'fade-up var(--dur-enter) var(--ease-out) both',
        'fade-in': 'fade-in var(--dur-base) ease-out both',
        'fade-out': 'fade-out var(--dur-exit) var(--ease-in) both',
        'drawer-in': 'drawer-in var(--dur-drawer) var(--ease-out) both',
        'drawer-out': 'drawer-out var(--dur-exit) var(--ease-in) both',
        'toast-in': 'toast-in var(--dur-slow) var(--ease-out) both',
        'toast-out': 'toast-out var(--dur-exit) var(--ease-in) both',
        'reveal-down': 'reveal-down var(--dur-base) var(--ease-out) both',
        'swap-in': 'swap-in var(--dur-base) var(--ease-out) both',
        pop: 'pop var(--dur-base) var(--ease-out) both',
        'panel-in': 'fade-up var(--dur-slow) var(--ease-out) both',
        'msg-in': 'msg-in 0.45s var(--ease-out) both',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [
    // « can-hover: » : effets de survol (soulèvement) réservés aux souris, jamais collés après un toucher.
    ({ addVariant }) => addVariant('can-hover', '@media (hover: hover) and (pointer: fine)'),
  ],
}
