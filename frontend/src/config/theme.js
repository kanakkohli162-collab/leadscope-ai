/**
 * LeadScope AI theme: the one place for brand colours and fonts.
 * Approved design: landing page "deep ocean" palette (14 Oct 2026).
 * Source of truth: the `C` object in features/landing/pages/LandingPage.jsx.
 */
export const THEME = {
  colors: {
    abyss: '#01081A',     // page background
    deepSea: '#001C36',   // sidebar, topbar, panels
    card: '#113E62',      // cards, tables, inputs, menus, modals
    inset: '#0B3354',     // boxes inside cards
    azure: '#0497F6',     // main buttons, links
    azureHover: '#0080DD', // button hover
    aqua: '#4EB9E5',      // glow, accents, active states
    glow: '#75DFFF',      // light aqua glow / gradient end
    ink: '#E6F1F7',       // headings + main text
    muted: '#9DB8CF',     // secondary text
    placeholder: '#6F8FAA', // placeholder text
    line: '#1B4C74',      // borders, dividers, chart grid
    hot: '#F5A524',       // ONLY for hot lead scores (70+)
  },
  fonts: {
    heading: "'Bricolage Grotesque', Figtree, system-ui, sans-serif",
    body: "Figtree, system-ui, sans-serif",
  },
  gradients: {
    hero: 'radial-gradient(80% 70% at 75% 30%, #113E62 0%, #01081A 60%)',
    button: 'linear-gradient(135deg, #0497F6 0%, #4EB9E5 100%)',
    ring: 'linear-gradient(200deg, #0497F6 0%, #4EB9E5 55%, transparent 80%)',
  },
}
