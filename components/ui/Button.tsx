import type { ComponentProps } from 'react';

const VARIANT = {
  primary: 'accent-outline text-on-accent',
  secondary: 'glass text-ink',
};
// lg: the loved one's big targets. md: a standard iPhone button, for the caregiver.
const SIZE = {
  lg: 'min-h-14 gap-3 px-6 py-3 text-xl font-bold',
  md: 'min-h-12 gap-2 px-5 py-2.5 text-[1.0625rem] font-semibold',
};
export type ButtonVariant = keyof typeof VARIANT;
export type ButtonSize = keyof typeof SIZE;

// Shared by <Button> and by links that should look like one.
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'lg') {
  return `inline-flex w-full items-center justify-center rounded-full text-center transition-[transform,background-color] duration-100 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 ${SIZE[size]} ${VARIANT[variant]}`;
}

export function Button({
  variant,
  size,
  className = '',
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button type="button" {...props} className={`${buttonClass(variant, size)} ${className}`} />
  );
}
