/**
 * Valida el campo unico "Nombre y Apellido" de un cliente.
 *
 * Reglas:
 * - No puede estar vacio.
 * - Minimo 3 caracteres (tras recortar espacios).
 * - Maximo 80 caracteres.
 * - Solo letras (incluye acentos y enye), espacios, apostrofes y
 *   guiones. No se permiten numeros ni simbolos, para evitar que se
 *   capturen datos claramente invalidos (telefonos, cedulas, etc. en
 *   el campo de nombre).
 */
const FULL_NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ'’\-\s]+$/;

export function isValidFullName(value: string): boolean {
    const trimmed = value.trim();
    if (trimmed.length < 3 || trimmed.length > 80) return false;
    return FULL_NAME_PATTERN.test(trimmed);
}

/** Recorta y normaliza espacios multiples en el nombre. */
export function normalizeFullName(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
}