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
      },
      fontFamily: {
        sans: ['"Manrope Variable"', 'Manrope', 'system-ui', 'sans-serif'],
        serif: ['"Fraunces Variable"', 'Georgia', 'serif'],
        grotesk: ['"Space Grotesk Variable"', '"Manrope Variable"', 'system-ui', 'sans-serif'],
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
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'drawer-in': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        'drawer-in': 'drawer-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
