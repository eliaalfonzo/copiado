import { useCallback, useEffect, useState } from 'react';
import { container } from '@/infrastructure/container';
import type { Client } from '@/domain/entities/Client';
import type { CreateClientInput } from '@/application/use-cases/clients/CreateClient';
import { DomainError } from '@/domain/errors/DomainError';

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await container.listClients.execute();
    setClients(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createClient = useCallback(
    async (input: CreateClientInput): Promise<Client> => {
      const client = await container.createClient.execute(input);
      await reload();
      return client;
    },
    [reload]
  );

  const updateClient = useCallback(
    async (client: Client): Promise<void> => {
      await container.updateClient.execute(client);
      await reload();
    },
    [reload]
  );

  const searchClients = useCallback(async (query: string): Promise<Client[]> => {
    return container.searchClients.execute(query);
  }, []);

  const deleteClient = useCallback(
    async (clientId: string) => {
      const result = await container.deleteClient.execute(clientId);
      await reload();
      return result;
    },
    [reload]
  );

  return { clients, loading, reload, createClient, updateClient, searchClients, deleteClient };
}

export { DomainError };
