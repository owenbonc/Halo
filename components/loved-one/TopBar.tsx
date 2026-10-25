'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from '@/components/ui/icons';

const BACK =
  'glass inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full px-5 font-semibold text-ink transition-transform duration-100 ease-out active:scale-[0.97]';

// The loved one's top bar: stays on screen as translucent material while the page scrolls under it.
// It owns the status-bar gap, so it cancels the page's own top padding, like the caregiver's header.
export function TopBar({
  title,
  count,
  back,
}: {
  title: string;
  /** Shown after the title in lighter ink: a count, or where she is in the deck. */
  count?: number | string;
  /** Shows a Back button that returns to the screen she came from (Alerts when opened directly). */
  back?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="material sticky top-0 z-10 -mx-4 -mt-[max(2rem,var(--safe-top))] space-y-3 px-4 pt-[max(0.75rem,var(--safe-top))] pb-3">
      {back && (
        <button
          type="button"
          className={BACK}
          onClick={() => (window.history.length > 1 ? router.back() : router.push('/loved-one'))}
        >
          <ArrowLeft />
          Back
        </button>
      )}
      <h1 className="flex min-h-12 items-center text-3xl font-bold">
        <span>
          {title}
          {count ? <span className="font-semibold text-ink-2 tabular-nums"> · {count}</span> : null}
        </span>
      </h1>
    </header>
  );
}
