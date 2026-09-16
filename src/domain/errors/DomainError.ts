/**
 * Error de dominio con mensaje amigable para el usuario final.
 * La capa de presentacion puede mostrar `userMessage` directamente
 * sin exponer detalles tecnicos.
 */
export class DomainError extends Error {
  public readonly userMessage: string;

  constructor(userMessage: string, technicalMessage?: string) {
    super(technicalMessage ?? userMessage);
    this.userMessage = userMessage;
    this.name = 'DomainError';
  }
}
