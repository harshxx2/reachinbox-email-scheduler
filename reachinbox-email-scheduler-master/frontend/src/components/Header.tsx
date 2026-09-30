import { ChevronDown, LogOut, MailPlus } from 'lucide-react';
import { useState } from 'react';
import type { User } from '../types/email';
import { logout } from '../services/api';
import { toast } from 'sonner';

export function Header({ user, onCompose }: { user: User; onCompose: () => void }) {
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      window.location.assign('/');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Logout failed');
    }
  };

  return <header className="border-b border-line bg-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
      <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-white"><MailPlus size={19} /></div><div><div className="text-[15px] font-extrabold tracking-tight">ReachInbox</div><div className="text-xs text-muted">Email scheduler</div></div></div>
      <div className="flex items-center gap-3">
        <button onClick={onCompose} className="button-primary hidden sm:inline-flex">Compose new email</button>
        <div className="relative">
          <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 rounded-2xl px-2 py-1.5 hover:bg-soft">
            {user.avatarUrl ? <img src={user.avatarUrl} className="h-9 w-9 rounded-xl object-cover" alt="" /> : <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-200 font-semibold">{user.name.slice(0, 1).toUpperCase()}</div>}
            <div className="hidden text-left md:block"><p className="text-sm font-semibold leading-tight">{user.name}</p><p className="mt-0.5 max-w-48 truncate text-xs text-muted">{user.email}</p></div><ChevronDown size={16} className="text-muted" />
          </button>
          {open && <div className="absolute right-0 top-12 w-44 overflow-hidden rounded-2xl border border-line bg-white p-1.5 shadow-soft"><button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50"><LogOut size={15} />Log out</button></div>}
        </div>
      </div>
    </div>
  </header>;
}
