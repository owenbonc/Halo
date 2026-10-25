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

// Floating layers that sit above the tab bar use this bottom offset (bar height plus its gap).
export const ABOVE_TAB_BAR = 'bottom-[calc(max(0.75rem,var(--safe-bottom))+6.25rem)]';

/*
 * A floating clear-glass capsule of tabs (after bulk's floating controls), in thumb reach above the home
 * indicator. The selected tab is white with an umber outline. Every tab keeps its word, never icon-only.
 * Both phones share one size; labels grow with the loved one's text size up to 20px so three fit.
 */
export function TabBar({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
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
                className={`flex flex-col items-center justify-center rounded-full px-1 leading-tight transition-[transform,background-color,color] duration-150 ease-out active:scale-[0.96] min-h-16 gap-0.5 whitespace-nowrap text-[min(1.125rem,20px)] font-bold ${active ? 'accent-outline text-on-accent' : 'text-ink-2'}`}
              >
                <span className="relative">
                  <Icon className="size-[min(1.75rem,30px)]" />
                  {badge ? (
                    <span className="absolute -top-1.5 -right-3 flex min-w-6 items-center justify-center rounded-full bg-danger px-1.5 text-sm leading-5 font-bold text-surface tabular-nums">
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
