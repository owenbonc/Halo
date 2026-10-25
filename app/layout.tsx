import type { Metadata, Viewport } from 'next';
import {
  Atkinson_Hyperlegible_Next,
  Barlow_Semi_Condensed,
  Bricolage_Grotesque,
  Gabarito,
  Young_Serif,
} from 'next/font/google';
import type { ReactNode } from 'react';
import { DeviceFrame } from '@/components/ui/DeviceFrame';
import './globals.css';

// Designed for low-vision readers: letters like I, l and 1 can't be confused.
const atkinson = Atkinson_Hyperlegible_Next({
  subsets: ['latin'],
  variable: '--font-atkinson',
  // next/font has no metrics for this font yet, so a fallback can't be generated.
  adjustFontFallback: false,
});
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  axes: ['opsz'],
});
// Theme trial display faces (globals.css data-theme blocks); unused ones go after the pick.
const youngSerif = Young_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-young-serif',
});
const gabarito = Gabarito({ subsets: ['latin'], variable: '--font-gabarito' });
const barlow = Barlow_Semi_Condensed({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-barlow',
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
    <html
      lang="en-GB"
      className={`${atkinson.variable} ${bricolage.variable} ${youngSerif.variable} ${gabarito.variable} ${barlow.variable}`}
    >
      <body className="text-xl">
        {/* Full screen on a phone; a phone frame on the laptop, so the demo looks like the loved one's phone. */}
        <DeviceFrame>
          <main className="mx-auto max-w-md px-4 pt-[max(2rem,var(--safe-top))] pb-[max(2rem,var(--safe-bottom))]">
            {children}
          </main>
        </DeviceFrame>
      </body>
    </html>
  );
}
