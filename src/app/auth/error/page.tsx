'use client';

/**
 * Auth Error Page
 */

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The verification token has expired or has already been used.',
    OAuthSignin: 'Error constructing an authorization URL.',
    OAuthCallback: 'Error handling the response from the OAuth provider.',
    OAuthCreateAccount: 'Could not create user account.',
    EmailCreateAccount: 'Could not create user account.',
    Callback: 'Error in the OAuth callback handler.',
    OAuthAccountNotLinked: 'This email is already linked to another account.',
    EmailSignin: 'Error sending the verification email.',
    CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
    SessionRequired: 'You must be signed in to access this page.',
    Default: 'An error occurred during authentication.',
  };

  const message = error ? errorMessages[error] ?? errorMessages.Default : errorMessages.Default;

  return (
    <>
      <div className="text-6xl mb-6">😕</div>
      <h1 className="text-2xl font-bold mb-4">Authentication Error</h1>
      <p className="text-gray-400 mb-8">{message}</p>
      <div className="flex gap-4 justify-center">
        <Link
          href="/auth/signin"
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition"
        >
          Try Again
        </Link>
        <Link
          href="/"
          className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition"
        >
          Go Home
        </Link>
      </div>
    </>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <div className="max-w-md w-full mx-4 text-center">
        <Suspense fallback={<div>Loading...</div>}>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  );
}
