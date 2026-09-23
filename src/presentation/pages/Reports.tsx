import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { FileDown, FileSpreadsheet, FolderClock, CheckCircle2, DollarSign, Users, Package } from 'lucide-react';
import { MainLayout } from '@/presentation/layouts/MainLayout';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { StatCard } from '@/presentation/components/StatCard';
import { EmptyState } from '@/presentation/components/EmptyState';
import { ConfirmDialog } from '@/presentation/components/ConfirmDialog';
import { LoadingState } from '@/presentation/components/LoadingState';
import { useMonthlyPeriod } from '@/presentation/hooks/useMonthlyPeriod';
import { useToast } from '@/presentation/components/ToastContext';
import { container } from '@/infrastructure/container';
import { formatUsd } from '@/shared/utils/money';
import { getMonthlyPeriodLabel, getPreviousPeriodKey } from '@/shared/utils/date';
import { DomainError } from '@/domain/errors/DomainError';
import type { Sale } from '@/domain/entities/Sale';
import type { MonthlySummary } from '@/application/use-cases/sales/GetMonthlySummary';

const PIE_COLORS = ['#FF1493', '#FF4DB8', '#35D07F', '#FFB84D', '#8A5CF5', '#4DB8FF'];

type PeriodTab = 'current' | 'previous';

/**
 * Muestra el reporte del MES ACTUAL y del MES ANTERIOR, como dos
 * pestanas independientes. Cuando comienza un nuevo mes, lo que hoy es
 * "actual" pasa automaticamente a ser "anterior" la proxima vez que se
 * entra (el calculo es siempre relativo a la fecha de hoy, no requiere
 * ninguna accion manual). Si el mes anterior no tiene ventas
 * registradas (por ejemplo, es el primer mes usando la aplicacion, o
 * ya se cerro/archivo ese periodo), se muestra un mensaje claro en vez
 * de un reporte vacio o un error.
 */
export function Reports() {
  const { check, closeAndAdvance } = useMonthlyPeriod();
  const { showToast } = useToast();
  const [busy, setBusy] = useState<'pdf' | 'excel' | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  const [activeTab, setActiveTab] = useState<PeriodTab>('current');
  const [loadingSales, setLoadingSales] = useState(true);
  const [currentSales, setCurrentSales] = useState<Sale[]>([]);
  const [previousSales, setPreviousSales] = useState<Sale[]>([]);

  const currentPeriodKey = check?.currentPeriodKey ?? new Date().toISOString().slice(0, 7);
  const previousPeriodKey = getPreviousPeriodKey(currentPeriodKey);

  useEffect(() => {
    let active = true;
    setLoadingSales(true);
    Promise.all([
      container.listSales.executeByPeriod(currentPeriodKey),
      container.listSales.executeByPeriod(previousPeriodKey),
    ]).then(([current, previous]) => {
      if (!active) return;
      setCurrentSales(current);
      setPreviousSales(previous);
      setLoadingSales(false);
    });
    return () => {
      active = false;
    };
  }, [currentPeriodKey, previousPeriodKey]);

  const reportPeriodKey = activeTab === 'current' ? currentPeriodKey : previousPeriodKey;
  const reportSales = activeTab === 'current' ? currentSales : previousSales;
  const summary: MonthlySummary = container.getMonthlySummary.execute(reportSales);
  const hasNoDataForTab = !loadingSales && reportSales.length === 0;

  async function handleGeneratePdf() {
    if (hasNoDataForTab) {
      showToast(
        activeTab === 'previous'
          ? 'No existe un reporte del mes anterior disponible: no hay ventas registradas en ese periodo.'
          : 'No hay ventas registradas en el mes actual todavia.',
        'error'
      );
      return;
    }
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
    if (hasNoDataForTab) {
      showToast(
        activeTab === 'previous'
          ? 'No existe un reporte del mes anterior disponible: no hay ventas registradas en ese periodo.'
          : 'No hay ventas registradas en el mes actual todavia.',
        'error'
      );
      return;
    }
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
    showToast('Periodo archivado correctamente.', 'success');
  }

  return (
    <MainLayout title="Reportes" subtitle={getMonthlyPeriodLabel(currentPeriodKey)}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {check?.needsClosing && (
          <Card style={{ borderColor: 'var(--color-warning)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <FolderClock size={22} color="var(--color-warning)" />
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>
                  Hay datos antiguos de {check.previousPeriod?.label} ocupando espacio
                </p>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
                  Ya puede ver y exportar los reportes del mes actual y del mes anterior sin hacer nada mas.
                  Este boton es solo para liberar espacio archivando datos de meses mas viejos; los clientes,
                  productos y configuraciones nunca se eliminan.
                </p>
              </div>
              <Button variant="secondary" onClick={() => setConfirmClose(true)} disabled={!check.hasPendingSales}>
                Archivar datos antiguos
              </Button>
            </div>
          </Card>
        )}

        {/* Pestanas: Mes actual / Mes anterior */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border)' }}>
          <PeriodTabButton
            active={activeTab === 'current'}
            label={`Mes actual (${getMonthlyPeriodLabel(currentPeriodKey)})`}
            onClick={() => setActiveTab('current')}
          />
          <PeriodTabButton
            active={activeTab === 'previous'}
            label={`Mes anterior (${getMonthlyPeriodLabel(previousPeriodKey)})`}
            onClick={() => setActiveTab('previous')}
          />
        </div>

        {loadingSales ? (
          <LoadingState label="Cargando reportes..." />
        ) : hasNoDataForTab ? (
          <Card>
            <EmptyState
              icon={FileDown}
              title={
                activeTab === 'previous'
                  ? 'No existe un reporte del mes anterior'
                  : 'Aun no hay ventas este mes'
              }
              description={
                activeTab === 'previous'
                  ? 'No se encontraron ventas registradas para ese periodo (puede ser el primer mes usando la aplicacion, o ese periodo ya fue archivado).'
                  : 'Cuando registre ventas este mes, aqui vera su reporte completo.'
              }
            />
          </Card>
        ) : (
          <>
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
          </>
        )}
      </div>

      <ConfirmDialog
        open={confirmClose}
        title="Archivar datos antiguos"
        message={`Esta a punto de archivar permanentemente las ventas de ${check?.previousPeriod?.label}. Asegurese de haber descargado su reporte PDF/Excel antes de continuar (puede hacerlo desde la pestana correspondiente arriba). Los clientes y productos no se veran afectados.`}
        confirmLabel="Archivar"
        danger
        onConfirm={() => void handleClosePeriod()}
        onCancel={() => setConfirmClose(false)}
      />
    </MainLayout>
  );
}

function PeriodTabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 16px',
        border: 'none',
        borderBottom: active ? '2px solid var(--color-brand)' : '2px solid transparent',
        background: 'none',
        cursor: 'pointer',
        fontSize: 13.5,
        fontWeight: active ? 700 : 500,
        color: active ? 'var(--color-text)' : 'var(--color-text-secondary)',
        marginBottom: -1,
      }}
    >
      {label}
    </button>
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