import type { Client } from '@/domain/entities/Client';

export interface ClientRepository {
  getAll(): Promise<Client[]>;
  getById(id: string): Promise<Client | null>;
  save(client: Client): Promise<void>;
  search(query: string): Promise<Client[]>;
  delete(id: string): Promise<void>;
}
