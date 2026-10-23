import type { ComponentProps } from 'react';

const VARIANT = {
  primary: 'glass-accent text-on-accent',
  secondary: 'glass text-ink',
};
export type ButtonVariant = keyof typeof VARIANT;

// Shared by <Button> and by links that should look like one.
export function buttonClass(variant: ButtonVariant = 'primary') {
  return `inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-full px-6 py-3 text-center text-xl font-bold transition-[transform,background-color] duration-100 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${VARIANT[variant]}`;
}

export function Button({
  variant,
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant }) {
  return <button type="button" {...props} className={`${buttonClass(variant)} ${className}`} />;
}
