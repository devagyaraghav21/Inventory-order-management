export default function StatusBadge({ status }) {
  const cls = {
    pending:   'badge-pending',
    confirmed: 'badge-confirmed',
    shipped:   'badge-shipped',
    delivered: 'badge-delivered',
    cancelled: 'badge-cancelled',
  }
  return (
    <span className={cls[status] || 'badge-pending'}>
      {status}
    </span>
  )
}
