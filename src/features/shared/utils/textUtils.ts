export const removeRetroAccents = (text: string | null | undefined, theme: string): string => {
  if (!text) return ''

  if (!theme.includes('retro')) {
    return text
  }

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export const formatRetroHeading = (text: string | null | undefined, theme: string): string => {
  return removeRetroAccents(text, theme).toUpperCase()
}

