import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible_Next, Bricolage_Grotesque } from 'next/font/google';
import type { ReactNode } from 'react';
import { DeviceFrame } from '@/components/ui/DeviceFrame';
import './globals.css';

// Designed for low-vision readers: letters like I, l and 1 can't be confused.
const atkinson = Atkinson_Hyperlegible_Next({ subsets: ['latin'], variable: '--font-atkinson' });
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  axes: ['opsz'],
});

export const metadata: Metadata = {
  title: 'Halo',
  description:
    'An AI call screener that helps older people spot phone scams and loops in their person.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: '#f7f2ea',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={`${atkinson.variable} ${bricolage.variable}`}>
      <body className="text-xl">
        {/* Full screen on a phone; a phone frame on the laptop, so the demo looks like Grandma's phone. */}
        <DeviceFrame>
          <main className="mx-auto max-w-md px-4 pt-[max(2rem,var(--safe-top))] pb-[max(2rem,var(--safe-bottom))]">
            {children}
          </main>
        </DeviceFrame>
      </body>
    </html>
  );
}
