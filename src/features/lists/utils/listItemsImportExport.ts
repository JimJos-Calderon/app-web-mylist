/** Filas lógicas antes de mapear a columnas de Supabase (JSON o CSV). */
export type ItemImportRow = {
  titulo: string
  tipo: string
  tags: string[]
  sort_index?: number
}

export type ItemInsertPayload = {
  titulo: string
  tipo: 'pelicula' | 'serie'
  list_id: string
  user_id: string
  user_email: string
  poster_url: null
  visto: boolean
  tags: string[]
  sort_index?: number
}

/** RFC 4180: campos entre comillas y comillas duplicadas escapadas. */
export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i++
          continue
        }
        inQuotes = false
      } else {
        cur += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      out.push(cur)
      cur = ''
    } else {
      cur += c
    }
  }
  out.push(cur)
  return out
}

function normalizeHeaderCell(h: string): string {
  return h.replace(/^\ufeff/, '').trim().toLowerCase()
}

export type ParseCsvResult =
  | { ok: true; rows: ItemImportRow[] }
  | { ok: false; reason: 'empty' | 'missing_titulo_column' }

/**
 * CSV con cabecera. Columnas reconocidas (insensible a mayúsculas):
 * - titulo (o title)
 * - tipo (o type): pelicula | serie
 * - tags (o etiquetas): varias etiquetas separadas por `;` o `|`
 * - sort_index (o orden): entero opcional
 */
export function parseItemImportCsv(text: string): ParseCsvResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0)
  if (lines.length === 0) return { ok: false, reason: 'empty' }

  const headerCells = parseCsvLine(lines[0]).map(normalizeHeaderCell)
  const idxTitulo = headerCells.findIndex((c) => c === 'titulo' || c === 'title')
  if (idxTitulo < 0) return { ok: false, reason: 'missing_titulo_column' }

  const idxTipo = headerCells.findIndex((c) => c === 'tipo' || c === 'type')
  const idxTags = headerCells.findIndex((c) => c === 'tags' || c === 'etiquetas')
  const idxSort = headerCells.findIndex((c) => c === 'sort_index' || c === 'orden')

  const rows: ItemImportRow[] = []
  for (let li = 1; li < lines.length; li++) {
    const cells = parseCsvLine(lines[li])
    const titulo = String(cells[idxTitulo] ?? '').trim()
    const tipoRaw = idxTipo >= 0 ? String(cells[idxTipo] ?? '').trim().toLowerCase() : ''
    const tipo =
      tipoRaw === 'serie' || tipoRaw === 'series' || tipoRaw === 'tv' || tipoRaw === 'show'
        ? 'serie'
        : 'pelicula'
    const tagsRaw = idxTags >= 0 ? String(cells[idxTags] ?? '') : ''
    const tags = [...new Set(tagsRaw.split(/[;|]/).map((s) => s.trim().toLowerCase()).filter(Boolean))]
    let sort_index: number | undefined
    if (idxSort >= 0) {
      const s = String(cells[idxSort] ?? '').trim()
      if (s !== '' && Number.isFinite(Number(s))) sort_index = Math.trunc(Number(s))
    }
    rows.push({ titulo, tipo, tags, sort_index })
  }
  return { ok: true, rows }
}

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/** Primera fila cabecera UTF-8 BOM para Excel. */
export function buildItemsCsv(data: Array<Record<string, unknown>>): string {
  const header = 'titulo,tipo,tags,sort_index'
  const lines = [header]
  for (const it of data) {
    const titulo = String(it.titulo ?? '')
    const tipo = String(it.tipo ?? 'pelicula')
    const tagsArr = Array.isArray(it.tags) ? (it.tags as unknown[]) : []
    const tags = tagsArr.map(String).join(';')
    const si =
      it.sort_index !== undefined && it.sort_index !== null && String(it.sort_index).trim() !== ''
        ? String(it.sort_index)
        : ''
    lines.push(
      [escapeCsvField(titulo), escapeCsvField(tipo), escapeCsvField(tags), si].join(','),
    )
  }
  return `\ufeff${lines.join('\n')}`
}

export function itemImportRowsToPayloads(
  rows: ItemImportRow[],
  ctx: { listId: string; userId: string; email: string },
): { payloads: ItemInsertPayload[]; skippedEmpty: number } {
  let skippedEmpty = 0
  const payloads: ItemInsertPayload[] = []
  for (const row of rows) {
    const titulo = row.titulo.trim()
    if (!titulo) {
      skippedEmpty += 1
      continue
    }
    const tipo: 'pelicula' | 'serie' = row.tipo === 'serie' ? 'serie' : 'pelicula'
    const tags = [...new Set((row.tags ?? []).map((x) => String(x).trim().toLowerCase()).filter(Boolean))]
    const sortIdx = row.sort_index
    const sort_index =
      typeof sortIdx === 'number' && Number.isFinite(sortIdx) ? Math.trunc(sortIdx) : undefined
    payloads.push({
      titulo,
      tipo,
      list_id: ctx.listId,
      user_id: ctx.userId,
      user_email: ctx.email,
      poster_url: null,
      visto: false,
      tags,
      ...(sort_index !== undefined ? { sort_index } : {}),
    })
  }
  return { payloads, skippedEmpty }
}
