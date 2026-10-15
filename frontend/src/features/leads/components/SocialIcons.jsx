import { Instagram, Facebook, Linkedin, Twitter, Youtube, MessageCircle } from 'lucide-react'

const NETWORKS = [
  { key: 'instagramUrl', label: 'Instagram', icon: Instagram },
  { key: 'facebookUrl', label: 'Facebook', icon: Facebook },
  { key: 'linkedinUrl', label: 'LinkedIn', icon: Linkedin },
  { key: 'twitterUrl', label: 'X (Twitter)', icon: Twitter },
  { key: 'youtubeUrl', label: 'YouTube', icon: Youtube },
  { key: 'whatsappUrl', label: 'WhatsApp', icon: MessageCircle },
]

/**
 * Small social icons for a lead after "Find contacts": green = found (opens the profile), grey = not found.
 * Only links the business shows on its own website.
 */
export default function SocialIcons({ lead, size = 14 }) {
  return (
    <ul className="flex flex-wrap items-center gap-1.5" aria-label="Social profiles">
      {NETWORKS.map(({ key, label, icon: Icon }) => {
        const url = lead[key]
        return (
          <li key={key}>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title={`${label}: found`}
                aria-label={`${label} (found, opens in a new tab)`}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-green-500/15 border border-green-500/40 text-green-300 hover:bg-green-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua"
              >
                <Icon size={size} aria-hidden="true" />
              </a>
            ) : (
              <span
                title={`${label}: not found`}
                aria-label={`${label} (not found)`}
                role="img"
                className="flex items-center justify-center w-7 h-7 rounded-full bg-inset border border-line text-slate-400/60"
              >
                <Icon size={size} aria-hidden="true" />
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
