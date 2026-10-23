import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hang Up & Check',
  description:
    'An AI call screener that helps older people spot phone scams and loops in their person.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB">
      <body className="min-h-dvh text-xl leading-relaxed antialiased">
        <main className="mx-auto max-w-md px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
