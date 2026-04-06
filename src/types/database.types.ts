/**
 * Extensión documental de filas `items` tras la migración `17_items_title_es.sql`.
 * El cliente Supabase del proyecto sigue sin tipar el esquema completo; `ListItem` en
 * `@/features/shared` es la fuente principal para la app.
 */
export type ItemsRowTitleEs = {
  title_es: string | null
}
