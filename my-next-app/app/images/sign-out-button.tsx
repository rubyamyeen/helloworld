'use client';

import { signOut } from '@/app/actions/auth';

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 glass-card rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
      >
        Sign Out
      </button>
    </form>
  );
}
