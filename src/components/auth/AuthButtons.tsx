'use client';

/**
 * AuthButtons — Sign in/out buttons with user avatar
 */

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <Link 
          href="/dashboard"
          className="text-sm text-gray-300 hover:text-white transition"
        >
          My Models
        </Link>
        <button
          onClick={() => signOut()}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Sign Out
        </button>
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name ?? 'User'}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
            {session.user.name?.[0] ?? session.user.email?.[0] ?? '?'}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn()}
      className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition"
    >
      Sign In
    </button>
  );
}
