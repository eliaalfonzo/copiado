import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, UserPlus, Phone, Mail, Trash2 } from 'lucide-react';
import { MainLayout } from '@/presentation/layouts/MainLayout';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Input } from '@/presentation/components/Input';
import { Modal } from '@/presentation/components/Modal';
import { ConfirmDialog } from '@/presentation/components/ConfirmDialog';
import { EmptyState } from '@/presentation/components/EmptyState';
import { LoadingState } from '@/presentation/components/LoadingState';
import { DataTable, type DataTableColumn } from '@/presentation/components/DataTable';
import { useClients } from '@/presentation/hooks/useClients';
import { useToast } from '@/presentation/components/ToastContext';
import type { Client } from '@/domain/entities/Client';
import { DomainError } from '@/domain/errors/DomainError';
import { isValidFullName } from '@/domain/services/validateFullName';

export function Clients() {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(searchParams.get('nuevo') === '1');
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', notes: '' });
  const [nameError, setNameError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = clients.filter((c) =>
    `${c.fullName} ${c.phone ?? ''} ${c.email ?? ''}`.toLowerCase().includes(query.toLowerCase())
  );

  function openCreate() {
    setEditing(null);
    setForm({ fullName: '', phone: '', email: '', notes: '' });
    setNameError(undefined);
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      fullName: client.fullName,
      phone: client.phone ?? '',
      email: client.email ?? '',
      notes: client.notes ?? '',
    });
    setNameError(undefined);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    if (searchParams.get('nuevo')) {
      searchParams.delete('nuevo');
      setSearchParams(searchParams, { replace: true });
    }
  }

  function handleNameChange(value: string) {
    setForm({ ...form, fullName: value });
    if (nameError && (isValidFullName(value) || value.trim() === '')) {
      setNameError(undefined);
    }
  }

  async function handleSubmit() {
    if (!isValidFullName(form.fullName)) {
      setNameError('Ingrese un nombre y apellido validos: solo letras, minimo 3 caracteres, sin numeros ni simbolos.');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await updateClient({ ...editing, ...form });
        showToast('Cliente actualizado correctamente.', 'success');
      } else {
        await createClient(form);
        showToast('Cliente registrado correctamente.', 'success');
      }
      closeModal();
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo guardar el cliente.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!clientToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteClient(clientToDelete.id);
      showToast(
        result.hadSalesInHistory
          ? 'Cliente eliminado. Sus ventas historicas se conservan para auditoria.'
          : 'Cliente eliminado correctamente.',
        'success'
      );
      setClientToDelete(null);
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo eliminar el cliente.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataTableColumn<Client>[] = [
    { key: 'name', header: 'Nombre y Apellido', render: (c) => c.fullName },
    {
      key: 'contact',
      header: 'Contacto',
      render: (c) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
          {c.phone && <span><Phone size={11} style={{ marginRight: 4 }} />{c.phone}</span>}
          {c.email && <span><Mail size={11} style={{ marginRight: 4 }} />{c.email}</span>}
          {!c.phone && !c.email && '—'}
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      render: (c) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
          <Button size="sm" variant="ghost" onClick={() => openEdit(c)}>
            Editar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setClientToDelete(c)} aria-label={`Eliminar a ${c.fullName}`}>
            <Trash2 size={14} color="var(--color-danger)" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="Clientes" subtitle="Gestione los clientes de Copiado Alfonzo">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--color-text-muted)' }} />
            <Input placeholder="Buscar cliente..." value={query} onChange={(e) => setQuery(e.target.value)} style={{ paddingLeft: 36 }} />
          </div>
          <Button onClick={openCreate}>
            <UserPlus size={16} /> Nuevo cliente
          </Button>
        </div>

        <Card padded={false}>
          {loading ? (
            <LoadingState label="Cargando clientes..." />
          ) : filtered.length === 0 ? (
            <EmptyState icon={UserPlus} title="No hay clientes registrados" description="Registre su primer cliente para comenzar a vender." action={<Button onClick={openCreate}>Nuevo cliente</Button>} />
          ) : (
            <DataTable columns={columns} data={filtered} getRowKey={(c) => c.id} />
          )}
        </Card>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar cliente' : 'Nuevo cliente'}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button onClick={() => void handleSubmit()} loading={submitting}>Guardar</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Nombre y Apellido"
            value={form.fullName}
            onChange={(e) => handleNameChange(e.target.value)}
            error={nameError}
            placeholder="Ej: Maria Gonzalez"
          />
          <Input label="Telefono (opcional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Correo (opcional)" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Observacion (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!clientToDelete}
        title="Eliminar cliente"
        message={`¿Esta seguro de eliminar a ${clientToDelete?.fullName}? Esta accion no se puede deshacer. Sus ventas historicas (si tiene) se conservaran para auditoria, pero el cliente ya no aparecera en el catalogo activo.`}
        confirmLabel="Eliminar"
        danger
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setClientToDelete(null)}
      />
    </MainLayout>
  );
}