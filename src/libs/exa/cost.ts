/** Reads Exa's request-specific dollar estimate, including requested content types. */
export function readExaCost(value: unknown): number | undefined {
  if (!value || typeof value !== 'object' || !('total' in value)) return
  const total = value.total
  return typeof total === 'number' && Number.isFinite(total) && total >= 0 ? total : undefined
}
