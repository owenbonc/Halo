import type { ComponentProps } from 'react';

const VARIANT = {
  primary: 'bg-accent text-white hover:bg-accent-strong',
  secondary: 'border-2 border-ink/70 bg-surface text-ink hover:bg-paper',
};
export type ButtonVariant = keyof typeof VARIANT;

// Shared by <Button> and by links that should look like one.
export function buttonClass(variant: ButtonVariant = 'primary') {
  return `inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl px-5 py-3 text-center text-xl font-semibold transition-[transform,background-color] duration-150 ease-out active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${VARIANT[variant]}`;
}

export function Button({
  variant,
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant }) {
  return <button type="button" {...props} className={`${buttonClass(variant)} ${className}`} />;
}
