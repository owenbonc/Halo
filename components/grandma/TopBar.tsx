import Link from 'next/link';

// Grandma's top bar: stays on screen as translucent material while the page scrolls under it.
export function TopBar({ title, link }: { title: string; link: { href: string; label: string } }) {
  return (
    <header className="material sticky top-0 z-10 -mx-4 flex items-center justify-between gap-4 px-4 pt-[max(0.75rem,var(--safe-top))] pb-3">
      <h1 className="text-3xl font-bold">{title}</h1>
      <Link
        href={link.href}
        className="glass inline-flex min-h-12 shrink-0 items-center rounded-full px-5 font-semibold text-ink transition-transform duration-100 ease-out active:scale-[0.97]"
      >
        {link.label}
      </Link>
    </header>
  );
}
