import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  DollarSign,
  Users,
  Package,
  Receipt,
  RefreshCw,
  ShoppingCart,
  UserPlus,
  PackagePlus,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { MainLayout } from '@/presentation/layouts/MainLayout';
import { Card } from '@/presentation/components/Card';
import { StatCard } from '@/presentation/components/StatCard';
import { Button } from '@/presentation/components/Button';
import { Badge } from '@/presentation/components/Badge';
import { EmptyState } from '@/presentation/components/EmptyState';
import { useExchangeRate } from '@/presentation/hooks/useExchangeRate';
import { useSales } from '@/presentation/hooks/useSales';
import { useMonthlyPeriod } from '@/presentation/hooks/useMonthlyPeriod';
import { formatUsd, formatBs } from '@/shared/utils/money';
import { formatDate, formatDateTime, getMonthlyPeriodLabel, isSameCalendarDay } from '@/shared/utils/date';

export function Dashboard() {
  const navigate = useNavigate();
  const { rate, status, errorMessage, refresh } = useExchangeRate();
  const { sales, summary, loading } = useSales();
  const { check } = useMonthlyPeriod();

  const chartData = useMemo(
    () => summary.salesByDay.map((d) => ({ day: d.day.slice(5), total: d.totalUsdCents / 100 })),
    [summary.salesByDay]
  );

  const currentPeriodLabel = check?.currentPeriodKey ? getMonthlyPeriodLabel(check.currentPeriodKey) : '';

  return (
    <MainLayout title="Copiado Alfonzo" subtitle="Gestion de ventas y servicios">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {check?.needsClosing && (
          <Card style={{ borderColor: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <AlertTriangle size={20} color="var(--color-warning)" />
            <div style={{ flex: 1, minWidth: 200 }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 14 }}>Comenzo un nuevo periodo mensual</p>
              <p style={{ margin: 0, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
                El periodo anterior ({check.previousPeriod?.label}) tiene ventas pendientes de cierre. Vaya a
                Reportes para exportarlas antes de cerrar el mes.
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => navigate('/reportes')}>
              Ir a Reportes
            </Button>
          </Card>
        )}

        {/* Tasa de cambio */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>TASA ACTUAL</span>
                {status === 'updated' && (
                  <Badge tone="success">
                    <CheckCircle2 size={12} /> Conectado en vivo
                  </Badge>
                )}
                {status === 'loading' && <Badge tone="neutral">Consultando...</Badge>}
                {status === 'stale' && <Badge tone="warning">Ultima tasa valida (sin conexion)</Badge>}
                {status === 'manual' && <Badge tone="brand">Tasa manual activa</Badge>}
                {status === 'error' && <Badge tone="danger">Error de conexion</Badge>}
              </div>
              {rate ? (
                <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color: 'var(--color-brand-secondary)' }}>
                  $1 = {rate.rate.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
                </p>
              ) : (
                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Sin datos aun</p>
              )}

              {rate && !rate.isManual && (
                <div style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-text-muted)', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span>
                    Ultima verificacion en vivo: <strong style={{ color: 'var(--color-text)' }}>{formatDateTime(rate.fetchedAt)}</strong>
                  </span>
                  <span>
                    Tasa vigente segun el BCV desde: <strong style={{ color: 'var(--color-text)' }}>{formatDate(rate.officialDate)}</strong>
                  </span>
                </div>
              )}
              {rate && rate.isManual && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Tasa fijada manualmente. Puede administrarla desde Configuracion.
                </p>
              )}

              {rate && !rate.isManual && !isSameCalendarDay(rate.officialDate, new Date()) && (
                <p style={{ margin: '6px 0 0', fontSize: 11.5, color: 'var(--color-warning)', display: 'flex', alignItems: 'flex-start', gap: 5, maxWidth: 420 }}>
                  <Info size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  El BCV aun no ha publicado una tasa nueva hoy (no publica todos los dias, especialmente fines
                  de semana y feriados). Esta es la ultima oficialmente vigente; la app ya verifico en vivo y se
                  actualizara sola en cuanto el BCV publique una nueva.
                </p>
              )}
              {!rate && errorMessage && (
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{errorMessage}</p>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={() => void refresh()} loading={status === 'loading'}>
              <RefreshCw size={15} /> Verificar ahora
            </Button>
          </div>
        </Card>

        {/* Acciones rapidas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <QuickAction icon={ShoppingCart} label="Nueva venta" onClick={() => navigate('/nueva-venta')} />
          <QuickAction icon={UserPlus} label="Nuevo cliente" onClick={() => navigate('/clientes?nuevo=1')} />
          <QuickAction icon={PackagePlus} label="Nuevo producto" onClick={() => navigate('/productos?nuevo=1')} />
          <QuickAction icon={Receipt} label="Ver ventas" onClick={() => navigate('/ventas')} />
        </div>

        {/* Resumen del periodo */}
        <div>
          <h2 style={{ fontSize: 15, margin: '0 0 10px', color: 'var(--color-text-secondary)' }}>
            Resumen de {currentPeriodLabel || 'este mes'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <StatCard icon={DollarSign} tone="brand" label="Ventas del mes" value={formatUsd(summary.totalUsdCents)} hint={formatBs(summary.totalBsCents)} />
            <StatCard icon={Users} label="Clientes atendidos" value={String(summary.clientsAttended)} />
            <StatCard icon={Package} label="Servicios vendidos" value={String(summary.servicesSold)} />
            <StatCard icon={Receipt} tone="success" label="Ticket promedio" value={formatUsd(summary.averageTicketCents)} />
          </div>
        </div>

        {/* Grafico */}
        <Card>
          <h2 style={{ fontSize: 15, margin: '0 0 14px' }}>Evolucion de ventas</h2>
          {loading ? (
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>Cargando...</p>
          ) : sales.length === 0 ? (
            <EmptyState icon={Receipt} title="Aun no hay ventas este mes" description="Cuando registre ventas, aqui vera su evolucion diaria." />
          ) : (
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="day" stroke="var(--color-text-muted)" fontSize={12} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Total']}
                  />
                  <Line type="monotone" dataKey="total" stroke="#FF1493" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </MainLayout>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof ShoppingCart; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        padding: '16px 10px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
        cursor: 'pointer',
        color: 'var(--color-text)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, var(--color-brand), var(--color-brand-secondary))',
          color: '#fff',
        }}
      >
        <Icon size={19} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
    </button>
  );
}