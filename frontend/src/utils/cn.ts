export function cn(...classes: (string | string[] | undefined | null | false)[]): string {
  return classes
    .flat()
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}