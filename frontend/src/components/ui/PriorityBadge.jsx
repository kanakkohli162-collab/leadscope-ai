export default function PriorityBadge({ priority }) {
  const styles = {
    High: 'badge-high',
    Medium: 'badge-medium',
    Low: 'badge-low',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  )
}
