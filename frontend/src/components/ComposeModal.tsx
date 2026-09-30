import { useMemo, useState } from 'react';
import { Upload, X } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';
import { scheduleEmails } from '../services/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function ComposeModal({ onClose, onScheduled }: { onClose: () => void; onScheduled: () => Promise<void> }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [startTime, setStartTime] = useState(() => new Date(Date.now() + 60_000).toISOString().slice(0, 16));
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(100);
  const [saving, setSaving] = useState(false);
  const [fileName, setFileName] = useState('');
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  const recipientCount = useMemo(() => recipients.length, [recipients]);

  const parseFile = (file: File) => {
    setFileName(file.name);
    Papa.parse<string[]>(file, {
      skipEmptyLines: true,
      complete: (result) => {
        const flat = (result.data as string[][]).flat().map((value) => value.trim()).filter((value) => EMAIL_RE.test(value));
        const unique = [...new Set(flat)];
        setRecipients(unique);
        toast.success(`${unique.length} email addresses detected`);
      },
      error: () => toast.error('Could not parse the file'),
    });
  };

  const submit = async () => {
    if (!subject.trim()) return toast.error('Add a subject');
    if (!body.trim()) return toast.error('Add an email body');
    if (!recipients.length) return toast.error('Upload a CSV or TXT file with email addresses');

    setSaving(true);
    try {
      await scheduleEmails({ subject, body, recipients, startTime: new Date(startTime).toISOString(), delayMs: delaySeconds * 1000, hourlyLimit, idempotencyKey });
      toast.success(`Scheduled ${recipients.length} emails`);
      await onScheduled();
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to schedule emails');
    } finally {
      setSaving(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8 backdrop-blur-sm">
    <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-5">
        <div><h2 className="text-lg font-bold">Compose new email</h2><p className="mt-1 text-sm text-muted">Create a durable scheduled batch.</p></div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl hover:bg-soft"><X size={18} /></button>
      </div>

      <div className="space-y-5 p-6">
        <label className="block"><span className="mb-2 block text-sm font-semibold">Subject</span><input value={subject} onChange={(e) => setSubject(e.target.value)} className="field" placeholder="Welcome to ReachInbox" /></label>
        <label className="block"><span className="mb-2 block text-sm font-semibold">Body</span><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} className="field resize-y" placeholder="Write your email body..." /></label>

        <div>
          <span className="mb-2 block text-sm font-semibold">Email leads</span>
          <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-zinc-300 bg-soft px-4 py-4 hover:border-purple">
            <div><p className="font-medium">{fileName || 'Upload CSV or TXT'}</p><p className="mt-1 text-xs text-muted">One or more email addresses; headers are ignored automatically.</p></div>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white shadow-sm"><Upload size={18} /></div>
            <input type="file" accept=".csv,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && parseFile(e.target.files[0])} />
          </label>
          <p className="mt-2 text-sm text-muted"><span className="font-semibold text-ink">{recipientCount}</span> email addresses detected</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block"><span className="mb-2 block text-sm font-semibold">Start time</span><input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="field" /></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">Delay / email</span><input type="number" min={0} value={delaySeconds} onChange={(e) => setDelaySeconds(Number(e.target.value))} className="field" /><span className="mt-1 block text-xs text-muted">seconds</span></label>
          <label className="block"><span className="mb-2 block text-sm font-semibold">Hourly limit</span><input type="number" min={1} value={hourlyLimit} onChange={(e) => setHourlyLimit(Number(e.target.value))} className="field" /><span className="mt-1 block text-xs text-muted">per sender</span></label>
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-line bg-white px-6 py-4">
        <button onClick={onClose} className="button-secondary">Cancel</button>
        <button onClick={submit} disabled={saving} className="button-primary">{saving ? 'Scheduling…' : 'Schedule emails'}</button>
      </div>
    </div>
  </div>;
}
