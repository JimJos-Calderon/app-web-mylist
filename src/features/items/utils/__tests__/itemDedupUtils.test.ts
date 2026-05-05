import { describe, expect, it } from 'vitest'
import { isDuplicateItemConstraintError } from '../isDuplicateItemConstraintError'
import { normalizeItemTitleForStorage } from '../normalizeItemTitleForStorage'

describe('normalizeItemTitleForStorage', () => {
  it('recorta espacios', () => {
    expect(normalizeItemTitleForStorage('  Matrix  ')).toBe('Matrix')
  })
})

describe('isDuplicateItemConstraintError', () => {
  it('detecta código 23505', () => {
    expect(isDuplicateItemConstraintError({ code: '23505' })).toBe(true)
  })

  it('rechaza otros errores', () => {
    expect(isDuplicateItemConstraintError({ code: '42P01' })).toBe(false)
    expect(isDuplicateItemConstraintError(null)).toBe(false)
  })
})
