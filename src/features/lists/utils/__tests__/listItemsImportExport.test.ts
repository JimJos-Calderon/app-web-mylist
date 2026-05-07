import { describe, it, expect } from 'vitest'
import { parseCsvLine, parseItemImportCsv, buildItemsCsv, itemImportRowsToPayloads } from '../listItemsImportExport'

describe('listItemsImportExport', () => {
  it('parseCsvLine respeta comillas', () => {
    expect(parseCsvLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd'])
    expect(parseCsvLine('"say ""hi"""')).toEqual(['say "hi"'])
  })

  it('parseItemImportCsv lee cabecera y tags con ;', () => {
    const csv = 'titulo,tipo,tags,sort_index\nMatrix,pelicula,"sci-fi;culto",0'
    const r = parseItemImportCsv(csv)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.rows).toHaveLength(1)
    expect(r.rows[0].titulo).toBe('Matrix')
    expect(r.rows[0].tipo).toBe('pelicula')
    expect(r.rows[0].tags).toEqual(['sci-fi', 'culto'])
    expect(r.rows[0].sort_index).toBe(0)
  })

  it('buildItemsCsv incluye BOM y escapa', () => {
    const s = buildItemsCsv([
      { titulo: 'A,B', tipo: 'serie', tags: ['x', 'y'], sort_index: 2 },
    ])
    expect(s.startsWith('\ufeff')).toBe(true)
    expect(s).toContain('"A,B"')
    expect(s).toContain('serie')
    expect(s).toContain('x;y')
  })

  it('itemImportRowsToPayloads omite título vacío', () => {
    const { payloads, skippedEmpty } = itemImportRowsToPayloads(
      [{ titulo: '  ', tipo: 'pelicula', tags: [] }, { titulo: 'Ok', tipo: 'pelicula', tags: ['a'] }],
      { listId: 'l1', userId: 'u1', email: 'e@e.com' },
    )
    expect(skippedEmpty).toBe(1)
    expect(payloads).toHaveLength(1)
    expect(payloads[0].titulo).toBe('Ok')
  })
})
