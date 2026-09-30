import { Plus, RefreshCcw } from 'lucide-react';
import { useState } from 'react';
import { Header } from '../components/Header';
import { EmailTable } from '../components/EmailTable';
import { ComposeModal } from '../components/ComposeModal';
import { useEmails } from '../hooks/useEmails';
import type { User } from '../types/email';

export function Dashboard({ user }: { user: User }) {
  const [tab, setTab] = useState<'scheduled' | 'sent'>('scheduled');
  const [composeOpen, setComposeOpen] = useState(false);
  const { scheduled, sent, loading, refresh } = useEmails();

  const count = tab === 'scheduled' ? scheduled.length : sent.length;

  return <div className="min-h-screen bg-[#fbfbfc]">
    <Header user={user} onCompose={() => setComposeOpen(true)} />
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-purple">Workspace</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight">Your email outbox</h1><p className="mt-2 text-sm text-muted">Schedule, monitor and verify every email send.</p></div>
        <button onClick={() => setComposeOpen(true)} className="button-primary sm:hidden"><Plus size={16} />Compose new email</button>
      </div>

      <div className="mt-8 rounded-3xl border border-line bg-white shadow-soft">
        <div className="flex flex-col gap-4 border-b border-line px-5 pt-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex gap-6"><button onClick={() => setTab('scheduled')} className={`pb-4 text-sm font-semibold ${tab === 'scheduled' ? 'border-b-2 border-ink text-ink' : 'text-muted'}`}>Scheduled</button><button onClick={() => setTab('sent')} className={`pb-4 text-sm font-semibold ${tab === 'sent' ? 'border-b-2 border-ink text-ink' : 'text-muted'}`}>Sent</button></div>
          <button onClick={() => void refresh()} className="mb-3 inline-flex items-center gap-2 self-start rounded-xl px-3 py-2 text-sm font-medium text-muted hover:bg-soft sm:self-auto"><RefreshCcw size={14} />Refresh <span className="rounded-full bg-soft px-2 py-0.5 text-xs text-ink">{count}</span></button>
        </div>
        <EmailTable kind={tab} rows={tab === 'scheduled' ? scheduled : sent} loading={loading} />
      </div>
    </main>
    {composeOpen && <ComposeModal onClose={() => setComposeOpen(false)} onScheduled={refresh} />}
  </div>;
}
