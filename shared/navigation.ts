export const conductEntries = {
  header: 'header-conduct',
  footer: 'footer-conduct',
  notes: 'conduct-entry',
} as const

export type ConductEntry = keyof typeof conductEntries

export function conductReturnId(entry: unknown, hasNotes: boolean): string {
  return typeof entry === 'string' && Object.hasOwn(conductEntries, entry)
    ? conductEntries[entry as ConductEntry]
    : hasNotes ? conductEntries.notes : 'page-title'
}
