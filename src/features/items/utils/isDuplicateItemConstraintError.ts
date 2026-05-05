/** Error de Postgres por violación de unicidad (p. ej. índice ux_items_active_list_tipo_title_norm). */
export function isDuplicateItemConstraintError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = (error as { code?: string }).code
  return code === '23505'
}
