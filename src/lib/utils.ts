import { type ClassValue, clsx } from 'clsx';

/**
 * This is a utility function for merging class names, originally designed for Tailwind.
 * We're keeping the function signature but removing the Tailwind-specific functionality
 * as we've migrated away from Tailwind CSS.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
