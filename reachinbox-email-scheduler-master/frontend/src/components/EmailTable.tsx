import { Mail } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import type { ScheduledEmail, SentEmail } from '../types/email';

const fmt = (value: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

export function EmailTable({ kind, rows, loading }: { kind: 'scheduled' | 'sent'; rows: (ScheduledEmail | SentEmail)[]; loading: boolean }) {
  if (loading) {
    return <div className="space-y-3 p-6"><div className="h-11 animate-pulse rounded-xl bg-soft" /><div className="h-11 animate-pulse rounded-xl bg-soft" /><div className="h-11 animate-pulse rounded-xl bg-soft" /></div>;
  }

  if (!rows.length) {
    return <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-soft"><Mail size={21} className="text-muted" /></div><div><p className="font-semibold">No {kind} emails</p><p className="mt-1 text-sm text-muted">Your {kind} emails will appear here.</p></div></div>;
  }

  return <div className="overflow-x-auto">
    <table className="min-w-full text-left text-sm">
      <thead className="border-b border-line bg-soft/70 text-xs uppercase tracking-wide text-muted">
        <tr>
          <th className="px-6 py-3.5 font-semibold">Email</th>
          <th className="px-6 py-3.5 font-semibold">Subject</th>
          <th className="px-6 py-3.5 font-semibold">{kind === 'scheduled' ? 'Scheduled time' : 'Sent time'}</th>
          <th className="px-6 py-3.5 font-semibold">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-soft/40">
            <td className="max-w-[280px] truncate px-6 py-4 font-medium text-ink">{row.recipient}</td>
            <td className="max-w-[300px] truncate px-6 py-4 text-zinc-600">{row.subject}</td>
            <td className="whitespace-nowrap px-6 py-4 text-zinc-600">{fmt(kind === 'scheduled' ? (row as ScheduledEmail).scheduledAt : (row as SentEmail).sentAt)}</td>
            <td className="px-6 py-4"><StatusBadge status={row.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>;
}
