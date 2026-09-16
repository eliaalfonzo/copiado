import type { ClientRepository } from '@/domain/ports/ClientRepository';
import type { Client } from '@/domain/entities/Client';
import { DomainError } from '@/domain/errors/DomainError';
import { isValidFullName, normalizeFullName } from '@/domain/services/validateFullName';

export class UpdateClient {
  constructor(private readonly clientRepository: ClientRepository) { }

  async execute(client: Client): Promise<void> {
    const existing = await this.clientRepository.getById(client.id);
    if (!existing) {
      throw new DomainError('El cliente que intenta editar no existe.');
    }
    if (!isValidFullName(client.fullName)) {
      throw new DomainError(
        'Ingrese un nombre y apellido validos (solo letras, minimo 3 caracteres, sin numeros ni simbolos).'
      );
    }
    await this.clientRepository.save({ ...client, fullName: normalizeFullName(client.fullName) });
  }
}