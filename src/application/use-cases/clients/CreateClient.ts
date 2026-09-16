import type { ClientRepository } from '@/domain/ports/ClientRepository';
import type { Client } from '@/domain/entities/Client';
import { generateId } from '@/shared/utils/id';
import { DomainError } from '@/domain/errors/DomainError';
import { isValidFullName, normalizeFullName } from '@/domain/services/validateFullName';

export interface CreateClientInput {
  fullName: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export class CreateClient {
  constructor(private readonly clientRepository: ClientRepository) { }

  async execute(input: CreateClientInput): Promise<Client> {
    if (!isValidFullName(input.fullName)) {
      throw new DomainError(
        'Ingrese un nombre y apellido validos (solo letras, minimo 3 caracteres, sin numeros ni simbolos).'
      );
    }

    const client: Client = {
      id: generateId('client'),
      fullName: normalizeFullName(input.fullName),
      phone: input.phone?.trim() || undefined,
      email: input.email?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    await this.clientRepository.save(client);
    return client;
  }
}