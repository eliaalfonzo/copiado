import { useState } from 'react';
import { Receipt, FileDown, Ban, Trash2 } from 'lucide-react';
import { MainLayout } from '@/presentation/layouts/MainLayout';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Badge } from '@/presentation/components/Badge';
import { Input } from '@/presentation/components/Input';
import { Modal } from '@/presentation/components/Modal';
import { ConfirmDialog } from '@/presentation/components/ConfirmDialog';
import { EmptyState } from '@/presentation/components/EmptyState';
import { LoadingState } from '@/presentation/components/LoadingState';
import { DataTable, type DataTableColumn } from '@/presentation/components/DataTable';
import { CurrencyDisplay } from '@/presentation/components/CurrencyDisplay';
import { useSales } from '@/presentation/hooks/useSales';
import { useToast } from '@/presentation/components/ToastContext';
import { container } from '@/infrastructure/container';
import { formatDateTime, getMonthlyPeriodLabel } from '@/shared/utils/date';
import { DomainError } from '@/domain/errors/DomainError';
import type { Sale } from '@/domain/entities/Sale';

export function Sales() {
  const { sales, loading, cancelSale, deleteSale } = useSales();
  const { showToast } = useToast();
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const [saleToDelete, setSaleToDelete] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDownloadInvoice(sale: Sale) {
    setGeneratingId(sale.id);
    try {
      const blob = await container.generateInvoicePdf.execute(sale);
      downloadBlob(blob, `comprobante-${sale.id}.pdf`);
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo generar el comprobante.', 'error');
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleConfirmCancel() {
    if (!saleToCancel) return;
    setCancelling(true);
    try {
      await cancelSale(saleToCancel.id, cancelReason);
      showToast('Venta anulada. Se conserva en el historial para auditoria y ya no cuenta en las estadisticas.', 'success');
      setSaleToCancel(null);
      setCancelReason('');
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo anular la venta.', 'error');
    } finally {
      setCancelling(false);
    }
  }

  async function handleConfirmDelete() {
    if (!saleToDelete) return;
    setDeleting(true);
    try {
      await deleteSale(saleToDelete.id);
      showToast('Venta eliminada permanentemente.', 'success');
      setSaleToDelete(null);
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo eliminar la venta.', 'error');
    } finally {
      setDeleting(false);
    }
  }

  const columns: DataTableColumn<Sale>[] = [
    { key: 'date', header: 'Fecha', render: (s) => formatDateTime(s.createdAt) },
    { key: 'client', header: 'Cliente', render: (s) => s.clientNameSnapshot },
    {
      key: 'items',
      header: 'Servicios',
      render: (s) => s.items.map((i) => `${i.quantity} ${i.productNameSnapshot}`).join(', '),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (s) =>
        s.status === 'cancelled' ? (
          <Badge tone="danger">Anulada</Badge>
        ) : (
          <Badge tone="success">Completada</Badge>
        ),
    },
    {
      key: 'total',
      header: 'Total',
      render: (s) => (
        <div style={{ opacity: s.status === 'cancelled' ? 0.5 : 1, textDecoration: s.status === 'cancelled' ? 'line-through' : 'none' }}>
          <CurrencyDisplay usdCents={s.totalUsdCents} bsCents={s.totalBsCents} size="sm" />
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (s) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost" loading={generatingId === s.id} onClick={() => void handleDownloadInvoice(s)}>
            <FileDown size={14} /> PDF
          </Button>
          {s.status !== 'cancelled' && (
            <Button size="sm" variant="ghost" onClick={() => setSaleToCancel(s)}>
              <Ban size={14} color="var(--color-warning)" /> Anular
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setSaleToDelete(s)} aria-label="Eliminar venta">
            <Trash2 size={14} color="var(--color-danger)" />
          </Button>
        </div>
      ),
    },
  ];

  const periodLabel = sales[0] ? getMonthlyPeriodLabel(sales[0].monthlyPeriod) : getMonthlyPeriodLabel(new Date().toISOString().slice(0, 7));

  return (
    <MainLayout title="Ventas" subtitle={periodLabel}>
      <Card padded={false}>
        {loading ? (
          <LoadingState label="Cargando ventas..." />
        ) : sales.length === 0 ? (
          <EmptyState icon={Receipt} title="Aun no hay ventas este periodo" description="Las ventas que registre apareceran aqui." />
        ) : (
          <DataTable columns={columns} data={sales} getRowKey={(s) => s.id} />
        )}
      </Card>

      <Modal
        open={!!saleToCancel}
        onClose={() => setSaleToCancel(null)}
        title="Anular venta"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaleToCancel(null)} disabled={cancelling}>Cancelar</Button>
            <Button variant="danger" onClick={() => void handleConfirmCancel()} loading={cancelling}>Anular venta</Button>
          </>
        }
      >
        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
          La venta de <strong style={{ color: 'var(--color-text)' }}>{saleToCancel?.clientNameSnapshot}</strong> por{' '}
          <strong style={{ color: 'var(--color-text)' }}>{saleToCancel && (saleToCancel.totalUsdCents / 100).toFixed(2)}</strong> USD
          quedara marcada como anulada. Permanecera visible en el historial para auditoria, pero dejara de contar
          en las estadisticas, el dashboard y los reportes.
        </p>
        <Input
          label="Motivo (opcional)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder="Ej: Error en la cantidad capturada"
        />
      </Modal>

      <ConfirmDialog
        open={!!saleToDelete}
        title="Eliminar venta definitivamente"
        message="Esta accion borra la venta por completo del sistema y NO se puede deshacer, ni siquiera para fines de auditoria. Si solo desea corregir un error, es preferible anular la venta en lugar de eliminarla."
        confirmLabel="Eliminar definitivamente"
        danger
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setSaleToDelete(null)}
      />
    </MainLayout>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
