/**
 * LeadScope AI theme: the one place for brand colours and fonts.
 * Approved design: landing page (14 Oct 2026).
 */
export const THEME = {
  colors: {
    night: '#160524',     // darkest background (hero, dark sections)
    plum: '#310E50',      // dark cards / gradients
    magenta: '#B526E8',   // main buttons, links, highlights
    magentaHover: '#9A1CC7', // button hover
    glow: '#FF5CD2',      // glow / gradient end
    violet: '#D63AF0',    // glowing ring (end), gradients
    lavender: '#FAF4FF',  // light sections, inputs
    ink: '#200B33',       // main text on light
    muted: '#715A86',     // secondary text
    line: '#F0E3FB',      // borders
    hot: '#F5A524',       // ONLY for hot lead scores (70+)
  },
  fonts: {
    heading: "'Bricolage Grotesque', Figtree, system-ui, sans-serif",
    body: "Figtree, system-ui, sans-serif",
  },
  gradients: {
    hero: 'radial-gradient(80% 70% at 75% 30%, #511B80 0%, #160524 60%)',
    button: 'linear-gradient(135deg, #B526E8 0%, #FF5CD2 100%)',
    ring: 'linear-gradient(200deg, #B526E8 0%, #FF5CD2 55%, transparent 80%)',
  },
}