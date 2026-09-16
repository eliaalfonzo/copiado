import type { ClientRepository } from '@/domain/ports/ClientRepository';
import type { Client } from '@/domain/entities/Client';

export class SearchClients {
  constructor(private readonly clientRepository: ClientRepository) {}

  async execute(query: string): Promise<Client[]> {
    if (!query.trim()) {
      return this.clientRepository.getAll();
    }
    return this.clientRepository.search(query.trim());
  }
}
