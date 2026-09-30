import { MailPlus } from 'lucide-react';

export function Login() {
  return <main className="min-h-screen bg-[#fbfbfc] px-6 py-10">
    <div className="mx-auto flex min-h-[80vh] max-w-md items-center justify-center">
      <div className="w-full rounded-3xl border border-line bg-white p-8 text-center shadow-soft sm:p-10">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink text-white"><MailPlus size={24} /></div>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight">Welcome to ReachInbox</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">Schedule reliable email sends with durable queues, rate limits and restart-safe workers.</p>
        <a href="/api/auth/google" className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-line px-4 py-3.5 text-sm font-semibold hover:bg-soft"><img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="h-5 w-5" alt="Google" />Continue with Google</a>
        <p className="mt-6 text-xs text-muted">Google OAuth is required for dashboard access.</p>
      </div>
    </div>
  </main>;
}
