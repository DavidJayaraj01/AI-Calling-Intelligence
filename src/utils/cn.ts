/**
 * Utility function to combine class names
 * Similar to clsx but simplified for our needs
 */

type ClassValue = string | number | boolean | undefined | null;

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .filter((x): x is string | number => Boolean(x) && typeof x !== 'boolean')
    .join(' ')
    .trim();
}
