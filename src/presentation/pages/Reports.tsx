import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FileDown, FileSpreadsheet, FolderClock, CheckCircle2 } from 'lucide-react';
import { MainLayout } from '@/presentation/layouts/MainLayout';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { StatCard } from '@/presentation/components/StatCard';
import { EmptyState } from '@/presentation/components/EmptyState';
import { ConfirmDialog } from '@/presentation/components/ConfirmDialog';
import { useSales } from '@/presentation/hooks/useSales';
import { useMonthlyPeriod } from '@/presentation/hooks/useMonthlyPeriod';
import { useToast } from '@/presentation/components/ToastContext';
import { container } from '@/infrastructure/container';
import { formatUsd } from '@/shared/utils/money';
import { getMonthlyPeriodLabel } from '@/shared/utils/date';
import { DomainError } from '@/domain/errors/DomainError';
import type { Sale } from '@/domain/entities/Sale';
import { DollarSign, Users, Package } from 'lucide-react';

const PIE_COLORS = ['#FF1493', '#FF4DB8', '#35D07F', '#FFB84D', '#8A5CF5', '#4DB8FF'];

export function Reports() {
  const { sales: currentPeriodSales, summary: currentPeriodSummary } = useSales();
  const { check, closeAndAdvance } = useMonthlyPeriod();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<'pdf' | 'excel' | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);
  const [pendingSales, setPendingSales] = useState<Sale[]>([]);

  // Si hay un cierre pendiente, el reporte y la exportacion deben
  // referirse al periodo ANTERIOR (el que aun no se ha cerrado), no al
  // periodo actual (que puede no tener ventas todavia).
  useEffect(() => {
    if (check?.needsClosing && check.previousPeriod) {
      void container.listSales.executeByPeriod(check.previousPeriod.key).then(setPendingSales);
    }
  }, [check]);

  const reportSales = check?.needsClosing ? pendingSales : currentPeriodSales;
  const summary = check?.needsClosing
    ? container.getMonthlySummary.execute(pendingSales)
    : currentPeriodSummary;
  const reportPeriodKey = check?.needsClosing
    ? check.previousPeriod?.key ?? check.currentPeriodKey
    : check?.currentPeriodKey ?? new Date().toISOString().slice(0, 7);

  async function handleGeneratePdf() {
    setBusy('pdf');
    try {
      const blob = await container.generateMonthlyReportPdf.execute(reportPeriodKey, reportSales);
      downloadBlob(blob, `reporte-mensual-${reportPeriodKey}.pdf`);
      showToast('Reporte PDF generado correctamente.', 'success');
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo generar el reporte PDF.', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function handleExportExcel() {
    setBusy('excel');
    try {
      const blob = await container.exportSalesToExcel.execute(reportSales);
      downloadBlob(blob, `ventas-${reportPeriodKey}.xlsx`);
      showToast('Archivo Excel generado correctamente.', 'success');
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo exportar a Excel.', 'error');
    } finally {
      setBusy(null);
    }
  }

  async function handleClosePeriod() {
    if (!check?.previousPeriod) return;
    await closeAndAdvance(check.previousPeriod.key, check.currentPeriodKey);
    setConfirmClose(false);
    showToast('Periodo cerrado. Se inicio un nuevo periodo mensual.', 'success');
  }

  const periodLabel = getMonthlyPeriodLabel(check?.currentPeriodKey ?? new Date().toISOString().slice(0, 7));

  return (
    <MainLayout title="Reportes" subtitle={periodLabel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {check?.needsClosing && (
          <Card style={{ borderColor: 'var(--color-warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <FolderClock size={22} color="var(--color-warning)" />
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                  El periodo {check.previousPeriod?.label} esta listo para cerrarse
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
                  Genere y descargue el reporte final antes de cerrar. Los clientes, productos y
                  configuraciones NO se eliminan al cerrar el periodo.
                </p>
              </div>
              <Button variant="secondary" onClick={() => setConfirmClose(true)} disabled={!check.hasPendingSales}>
                Cerrar periodo anterior
              </Button>
            </div>
          </Card>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Button onClick={() => void handleGeneratePdf()} loading={busy === 'pdf'}>
            <FileDown size={16} /> Generar reporte mensual PDF
          </Button>
          <Button variant="secondary" onClick={() => void handleExportExcel()} loading={busy === 'excel'}>
            <FileSpreadsheet size={16} /> Exportar Excel
          </Button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <StatCard icon={DollarSign} tone="brand" label="Total del periodo" value={formatUsd(summary.totalUsdCents)} />
          <StatCard icon={Users} label="Clientes atendidos" value={String(summary.clientsAttended)} />
          <StatCard icon={Package} label="Servicios vendidos" value={String(summary.servicesSold)} />
          <StatCard icon={CheckCircle2} tone="success" label="Cantidad de ventas" value={String(summary.salesCount)} />
        </div>

        {reportSales.length === 0 ? (
          <Card>
            <EmptyState icon={FileDown} title="No hay datos para graficar" description="Cuando existan ventas en este periodo, aqui vera los graficos de categoria y productos." />
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
            <Card>
              <h3 style={{ fontSize: 14, margin: '0 0 12px' }}>Ventas por categoria</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={summary.salesByCategory}
                      dataKey="totalUsdCents"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={(entry) => entry.category}
                    >
                      {summary.salesByCategory.map((entry, index) => (
                        <Cell key={entry.category} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatUsd(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: 14, margin: '0 0 12px' }}>Productos mas vendidos</h3>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={summary.topProducts} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis type="number" stroke="var(--color-text-muted)" fontSize={11} />
                    <YAxis type="category" dataKey="name" width={140} stroke="var(--color-text-muted)" fontSize={11} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#FF4DB8" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmClose}
        title="Cerrar periodo mensual"
        message={`Esta a punto de cerrar el periodo ${check?.previousPeriod?.label}. Asegurese de haber descargado el reporte PDF y el Excel antes de continuar. Los clientes y productos no se veran afectados.`}
        confirmLabel="Cerrar periodo"
        onConfirm={() => void handleClosePeriod()}
        onCancel={() => setConfirmClose(false)}
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
