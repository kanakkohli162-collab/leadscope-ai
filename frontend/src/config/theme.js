/**
 * LeadScope AI theme: the one place for brand colours and fonts.
 * Approved design: landing page (14 Oct 2026).
 */
export const THEME = {
  colors: {
    night: '#050A24',     // darkest background (hero, dark sections)
    indigo: '#0E1550',    // dark cards / gradients
    blue: '#2F6BFF',      // main buttons, links, highlights
    blueHover: '#1F55E6', // button hover
    glow: '#5B8CFF',      // glowing ring (start)
    violet: '#7B5CFF',    // glowing ring (end), gradients
    lavender: '#F4F6FF',  // light sections, inputs
    ink: '#0B1033',       // main text on light
    muted: '#5A6386',     // secondary text
    line: '#E3E7FB',      // borders
    hot: '#F5A524',       // ONLY for hot lead scores (70+)
  },
  fonts: {
    heading: "'Bricolage Grotesque', Figtree, system-ui, sans-serif",
    body: "Figtree, system-ui, sans-serif",
  },
  gradients: {
    hero: 'radial-gradient(80% 70% at 75% 30%, #1A1F7A 0%, #050A24 60%)',
    button: 'linear-gradient(135deg, #2F6BFF 0%, #1F55E6 100%)',
    ring: 'linear-gradient(200deg, #5B8CFF 0%, #7B5CFF 55%, transparent 80%)',
  },
}