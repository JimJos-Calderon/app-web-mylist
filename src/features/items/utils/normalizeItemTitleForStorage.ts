/** Normaliza el título antes de persistir (coincide con trim en índice único). */
export function normalizeItemTitleForStorage(titulo: string): string {
  return titulo.trim()
}
