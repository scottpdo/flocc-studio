/**
 * NextAuth.js API Route
 * 
 * TODO: Configure with actual providers and database adapter
 * See: https://authjs.dev/getting-started/installation
 */

import { NextResponse } from 'next/server';

// Placeholder until NextAuth is fully configured
export async function GET() {
  return NextResponse.json({ 
    message: 'Auth not configured. Set up NextAuth.js with your providers.',
    docs: 'https://authjs.dev/getting-started/installation'
  });
}

export async function POST() {
  return NextResponse.json({ 
    message: 'Auth not configured. Set up NextAuth.js with your providers.',
    docs: 'https://authjs.dev/getting-started/installation'
  });
}

/*
// Full implementation (uncomment when ready):

import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db/client';

const handler = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
*/
