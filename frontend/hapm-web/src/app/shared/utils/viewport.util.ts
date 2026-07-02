/** Tailwind breakpoints used across the shell layout. */
export const VIEWPORT = {
  md: 768,
  lg: 1024,
} as const;

export function isViewportBelowMd(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < VIEWPORT.md;
}

export function isViewportBelowLg(): boolean {
  return typeof window !== 'undefined' && window.innerWidth < VIEWPORT.lg;
}
