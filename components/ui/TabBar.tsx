'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Bell } from './icons';

export type Tab = {
  href: string;
  label: string;
  Icon: typeof Bell;
  badge?: number;
  // Other routes that belong to this tab (a call opened from Past calls keeps Past calls selected).
  match?: string[];
};

const SIZE = {
  // Grows with the loved one's text size up to 20px, then stops, so three labels always fit on one line.
  lg: {
    tab: 'min-h-16 gap-0.5 whitespace-nowrap text-[min(1.125rem,20px)] font-bold',
    icon: 'size-[min(1.75rem,30px)]',
    badge: 'min-w-6 text-sm',
  },
  md: {
    tab: 'min-h-12 gap-0 text-[0.6875rem] font-semibold',
    icon: 'size-6',
    badge: 'min-w-5 text-xs',
  },
};

// Floating layers that sit above the tab bar use these bottom offsets (bar height plus its gap).
export const ABOVE_TAB_BAR = {
  lg: 'bottom-[calc(max(0.75rem,var(--safe-bottom))+5.5rem)]',
  md: 'bottom-[calc(max(0.75rem,var(--safe-bottom))+4.5rem)]',
};

/*
 * A floating clear-glass capsule of tabs (after bulk's floating controls), in thumb reach above the home
 * indicator. The selected tab sits on solid navy. Every tab keeps its word, never icon-only.
 */
export function TabBar({ tabs, size = 'lg' }: { tabs: Tab[]; size?: keyof typeof SIZE }) {
  const pathname = usePathname();
  const s = SIZE[size];
  return (
    <nav
      aria-label="Sections"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4 pb-[max(0.75rem,var(--safe-bottom))]"
    >
      <ul className="glass pointer-events-auto flex gap-1 rounded-full p-1.5">
        {tabs.map(({ href, label, Icon, badge, match = [] }) => {
          const active = pathname === href || match.some((m) => pathname.startsWith(m));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center justify-center rounded-full px-1 leading-tight transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.96] ${s.tab} ${active ? 'glass-accent text-on-accent' : 'text-ink-2'}`}
              >
                <span className="relative">
                  <Icon className={s.icon} />
                  {badge ? (
                    <span
                      className={`absolute -top-1.5 -right-3 flex items-center justify-center rounded-full bg-danger px-1.5 leading-5 font-bold text-surface tabular-nums ${s.badge}`}
                    >
                      {badge}
                      <span className="sr-only"> new</span>
                    </span>
                  ) : null}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
