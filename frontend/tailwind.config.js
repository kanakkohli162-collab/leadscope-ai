
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`
const scale = (name, shades) => Object.fromEntries(shades.map((s) => [s, v(`${name}-${s}`)]))

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: scale('primary', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]),
        marigold: scale('marigold', [50, 100, 400, 500, 600, 700]),
        abyss: '#01081A',
        deepsea: v('deepsea'),
        card: v('card'),
        inset: v('inset'),
        line: v('line'),
        aqua: { DEFAULT: v('aqua'), light: v('aqua-light') },
        sidebar: { DEFAULT: '#001C36', light: '#113E62' },
        ink: v('ink'),
        mist: v('mist'),
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
