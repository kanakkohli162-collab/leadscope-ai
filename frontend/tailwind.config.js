/** @type {import('tailwindcss').Config} */

/*
 * Theme colours are CSS variables (set in src/styles/index.css):
 *   :root      -> the dark "deep ocean" values (unchanged look everywhere)
 *   .ls-light  -> light values, used inside white panels (components/ui/WhitePanel.jsx)
 * So the same classes (text-slate-800, bg-card, border-line …) read correctly on dark AND on white.
 * Format "R G B" keeps opacity modifiers working, e.g. bg-primary-600/15.
 */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`
const scale = (name, shades) => Object.fromEntries(shades.map((s) => [s, v(`${name}-${s}`)]))

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Azure (matches the landing page "deep ocean" theme); #447EFC family inside white panels
        primary: scale('primary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        // Remapped for a DARK UI: low numbers = dark surfaces, high numbers = light text (flipped in .ls-light)
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        marigold: scale('marigold', [50, 100, 400, 500, 600, 700]),
        abyss: '#01081A',   // page background
        deepsea: v('deepsea'), // sidebar, topbar, panels, dropdown lists
        card: v('card'),    // cards, tables, inputs, menus, modals
        inset: v('inset'),  // boxes inside cards
        line: v('line'),    // borders, dividers, chart grid
        aqua: { DEFAULT: v('aqua'), light: v('aqua-light') }, // glow, accents, active states
        sidebar: { DEFAULT: '#001C36', light: '#113E62' },
        ink: v('ink'),
        mist: v('mist'),
        // Only the light text shades of these change inside white panels (for contrast); the rest stay Tailwind's
        red: scale('red', [200, 300, 400]),
        green: scale('green', [300, 400]),
        emerald: scale('emerald', [300, 400]),
        amber: scale('amber', [300, 400]),
        orange: scale('orange', [300]),
        teal: scale('teal', [300]),
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Figtree', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'chat-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: { 'chat-in': 'chat-in 180ms ease-out', 'fade-up': 'fade-up 450ms ease-out backwards' },
    },
  },
  plugins: [],
}
