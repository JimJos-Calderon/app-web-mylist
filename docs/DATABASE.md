# Base de datos (Supabase / PostgreSQL)

El modelo de datos vive en **`supabase/migrations/`**. No uses esquemas antiguos copiados del README histórico: los IDs de ítems son **bigint**, hay comentarios, visto por miembro, etiquetas, cola, etc.

---

## Aplicar migraciones

```bash
supabase db push
```

O ejecutar cada `.sql` en orden numérico en el SQL Editor.

---

## Tablas principales (conceptual)

| Tabla | Propósito |
|-------|-----------|
| `lists` | Listas compartidas, `invite_code`, webhook Discord, tema de avisos, `next_queue_item_id`, etiquetas de lista |
| `list_members` | Membresía (`owner` / `admin` / `member`) |
| `items` | Películas/series por lista (`tipo`, `titulo`, `title_es`, `tags`, `sort_index`, soft delete) |
| `item_user_watch` | Estado visto **por usuario** en un ítem |
| `item_ratings` | Estrellas y me gusta / no me gusta por usuario |
| `item_comments` | Comentarios / reseñas |
| `user_profiles` | Username, bio, avatar, `theme_preference` |
| `push_subscriptions` | Web Push y FCM |
| `audit_logs` | Auditoría de cambios (Activity Feed) |

---

## Migraciones (orden)

| # | Archivo | Resumen |
|---|---------|---------|
| 04 | `04_security_rls_and_constraints.sql` | RLS base, constraints, índices |
| 05 | `05_soft_delete_and_join_rpc.sql` | Soft delete, RPC unirse a lista |
| 06 | `06_audit_logs_triggers.sql` | Triggers de auditoría |
| 07 | `07_0_push_subscriptions.sql` | Suscripciones push |
| 08 | `08_dispatch_push_record_id_text_match.sql` | Dispatch push (text id) |
| 09–13 | `09` … `13` | Borrado ítems, fixes soft delete |
| 10 | `10_activity_feed_and_member_deletion.sql` | Activity feed |
| 11 | `11_fix_collab_visto_rls.sql` | Colaboradores y `visto` |
| 14 | `14_item_comments.sql` | Comentarios |
| 15 | `15_require_comment_before_watch.sql` | Reseña/crítica antes de visto |
| 16 | `16_fix_join_list_with_code_ambiguity.sql` | Fix RPC join |
| 17 | `17_items_title_es.sql` | Título en español |
| 18 | `18_lists_discord_webhook.sql` | Webhook por lista |
| 19 | `19_lists_theme.sql` | Tema de notificaciones por lista |
| 20–22 | `20` … `22` | RPC `save_quick_critique` |
| 23 | `23_push_subscriptions_fcm_android.sql` | FCM Android |
| 24 | `24_push_subscriptions_unique_for_upsert.sql` | Unicidad upsert push |
| 25 | `25_notify_discord_trigger_items.sql` | Trigger Discord al insertar ítem |
| 26 | `26_push_orchestrator_edge_function_rename.sql` | Rename orchestrator |
| 27 | `27_activity_feed_view_social.sql` | Vista activity social |
| 28 | `28_item_user_watch_per_member.sql` | Visto por miembro |
| 29 | `29_list_members_select_shared_lists.sql` | RLS listas compartidas |
| 30 | `30_items_unique_list_tipo_title.sql` | Unicidad título por lista/tipo |
| 31 | `31_list_items_tags_sort_queue_import.sql` | Tags, sort, cola, import |
| 32–33 | `32`, `33` | Repair bigint cola, trigger coherencia |
| 34 | `34_activity_feed_actor_display.sql` | Nombre actor en feed |
| 35 | `35_activity_feed_effective_actor.sql` | `effective_actor_user_id` |
| 36 | `36_audit_logs_user_id_row_fallback.sql` | `user_id` en audit desde fila |

---

## Row Level Security (RLS)

Principio: un usuario solo accede a filas de listas donde es **miembro** (o dueño según política).

Ejemplos documentados en el README principal:

- `items` — visibles si perteneces a la lista
- `item_ratings` — solo las tuyas para escribir; lectura según membresía
- `lists` — propias o donde eres miembro

Los checks (`tipo`, `rating` 0–5, longitudes) están en constraints SQL además de validación en cliente.

---

## RPC y funciones útiles

| RPC / función | Uso |
|---------------|-----|
| Join con código | Unirse a lista por `invite_code` |
| `save_quick_critique` | Marcar visto + rating + comentario opcional en un paso |
| Activity feed | Vista/funciones alimentadas por `audit_logs` |

Consulta el cuerpo exacto en las migraciones `05`, `20`–`22` y `27`–`35`.

---

## Migración desde esquema antiguo

Si vienes de `lista_items` u otro modelo previo, usa [`migration-to-shared-lists.sql`](../migration-to-shared-lists.sql) en la raíz del repo (caso legacy).

---

## Relacionado

- [INTEGRATIONS.md](./INTEGRATIONS.md) — triggers que llaman Edge Functions
- [DISCORD_WEBHOOK.md](./DISCORD_WEBHOOK.md) — columna `lists.discord_webhook_url`
