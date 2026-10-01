export const passwordMeetsClientMinimum = (password: string) =>
  password.length >= 8 && password.length <= 128

export const normalizeEmail = (email: string) => email.trim().toLocaleLowerCase().slice(0, 254)
