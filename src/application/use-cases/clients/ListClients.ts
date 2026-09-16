import type { ClientRepository } from '@/domain/ports/ClientRepository';
import type { Client } from '@/domain/entities/Client';

export class ListClients {
  constructor(private readonly clientRepository: ClientRepository) { }

  async execute(): Promise<Client[]> {
    const clients = await this.clientRepository.getAll();
    return [...clients].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
}