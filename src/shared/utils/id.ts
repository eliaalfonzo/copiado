/**
 * Generador de identificadores unicos para entidades del dominio.
 * Encapsulado en un unico lugar para poder cambiar la estrategia
 * (uuid, nanoid, etc.) sin tocar el resto de la aplicacion.
 */
export function generateId(prefix = ''): string {
  const random = Math.random().toString(36).slice(2, 10);
  const timestamp = Date.now().toString(36);
  return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
}
