'use client';

import { signOut } from '@/app/actions/auth';

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Sign Out
      </button>
    </form>
  );
}
