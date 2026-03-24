'use client';

import { signOut } from '@/app/actions/auth';

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 glass-card rounded-xl hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-white/10 transition-all"
      >
        Sign Out
      </button>
    </form>
  );
}
