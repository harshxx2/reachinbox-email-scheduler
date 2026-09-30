import type { EmailStatus } from '../types/email';

export function StatusBadge({ status }: { status: EmailStatus }) {
  const classes: Record<EmailStatus, string> = {
    SCHEDULED: 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200',
    PROCESSING: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200',
    SENT: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
    FAILED: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200',
  };

  const label = status.charAt(0) + status.slice(1).toLowerCase();

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[status]}`}>{label}</span>;
}
