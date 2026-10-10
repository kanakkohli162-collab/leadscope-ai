export default function StatusBadge({ status }) {
  const styles = {
    'New': 'status-new',
    'Contacted': 'status-contacted',
    'Follow-up': 'status-followup',
    'Interested': 'status-interested',
    'Converted': 'status-converted',
    'Not Interested': 'status-notinterested',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[status] || styles.New}`}>
      {status}
    </span>
  )
}
