import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { UIProvider } from '@/contexts/UIContext';
import { SessionProvider } from '@/components/auth/SessionProvider';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Flocc Studio',
  description: 'Visual agent-based modeling in the browser',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <UIProvider>{children}</UIProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
