import type { StoragePort } from '@/domain/ports/StoragePort';
import type { ClientRepository } from '@/domain/ports/ClientRepository';
import type { Client } from '@/domain/entities/Client';
import { STORAGE_KEYS } from './storageKeys';

/** Forma cruda que puede existir en localStorage, incluyendo el esquema antiguo. */
interface RawClientRecord {
  id?: string;
  fullName?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  phone?: unknown;
  email?: unknown;
  notes?: unknown;
  createdAt?: unknown;
}

export class LocalStorageClientRepository implements ClientRepository {
  constructor(private readonly storage: StoragePort) { }

  async getAll(): Promise<Client[]> {
    const raw = (await this.storage.getItem<RawClientRecord[]>(STORAGE_KEYS.clients)) ?? [];

    let needsMigration = false;
    const clients = raw.map((item) => {
      const normalized = this.normalize(item);
      if (normalized.migrated) needsMigration = true;
      return normalized.client;
    });

    // Auto-migracion: si se encontraron clientes con el esquema antiguo
    // (firstName/lastName sueltos, sin fullName), se corrigen una vez y
    // se guardan ya normalizados, para que esto no vuelva a ocurrir en
    // cada lectura ni afecte a busquedas u ordenamientos.
    if (needsMigration) {
      await this.storage.setItem(STORAGE_KEYS.clients, clients);
    }

    return clients;
  }

  private normalize(item: RawClientRecord): { client: Client; migrated: boolean } {
    const hasValidFullName = typeof item.fullName === 'string' && item.fullName.trim().length > 0;

    if (hasValidFullName) {
      return {
        client: {
          id: String(item.id ?? ''),
          fullName: item.fullName as string,
          phone: typeof item.phone === 'string' ? item.phone : undefined,
          email: typeof item.email === 'string' ? item.email : undefined,
          notes: typeof item.notes === 'string' ? item.notes : undefined,
          createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
        },
        migrated: false,
      };
    }

    // Esquema antiguo (o registro incompleto): se reconstruye fullName
    // a partir de firstName/lastName si existen.
    const legacyFirst = typeof item.firstName === 'string' ? item.firstName : '';
    const legacyLast = typeof item.lastName === 'string' ? item.lastName : '';
    const rebuiltName = `${legacyFirst} ${legacyLast}`.trim();

    return {
      client: {
        id: String(item.id ?? ''),
        fullName: rebuiltName || 'Cliente sin nombre',
        phone: typeof item.phone === 'string' ? item.phone : undefined,
        email: typeof item.email === 'string' ? item.email : undefined,
        notes: typeof item.notes === 'string' ? item.notes : undefined,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString(),
      },
      migrated: true,
    };
  }

  async getById(id: string): Promise<Client | null> {
    const clients = await this.getAll();
    return clients.find((c) => c.id === id) ?? null;
  }

  async save(client: Client): Promise<void> {
    const clients = await this.getAll();
    const index = clients.findIndex((c) => c.id === client.id);
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    await this.storage.setItem(STORAGE_KEYS.clients, clients);
  }

  async search(query: string): Promise<Client[]> {
    const clients = await this.getAll();
    const normalized = query.toLowerCase();
    return clients.filter((c) =>
      c.fullName.toLowerCase().includes(normalized) ||
      c.phone?.toLowerCase().includes(normalized) ||
      c.email?.toLowerCase().includes(normalized)
    );
  }

  async delete(id: string): Promise<void> {
    const clients = await this.getAll();
    const remaining = clients.filter((c) => c.id !== id);
    await this.storage.setItem(STORAGE_KEYS.clients, remaining);
  }
}