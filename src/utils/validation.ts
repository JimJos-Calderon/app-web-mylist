export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'La contraseña debe tener al menos 6 caracteres' }
  }
  return { valid: true }
}

export const validateTitle = (title: string): { valid: boolean; message?: string } => {
  const trimmed = title.trim()
  if (trimmed.length === 0) {
    return { valid: false, message: 'El título no puede estar vacío' }
  }
  if (trimmed.length > 200) {
    return { valid: false, message: 'El título es demasiado largo (máximo 200 caracteres)' }
  }
  return { valid: true }
}

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '')
}

export const validateFormInput = (
  value: string,
  minLength: number = 1,
  maxLength: number = 500
): { valid: boolean; message?: string } => {
  if (value.trim().length < minLength) {
    return { valid: false, message: `Debe tener al menos ${minLength} caracteres` }
  }
  if (value.length > maxLength) {
    return { valid: false, message: `No puede exceder ${maxLength} caracteres` }
  }
  return { valid: true }
}
