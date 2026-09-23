import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Trash2, Sun, Moon, Gauge, XCircle } from 'lucide-react';
import { MainLayout } from '@/presentation/layouts/MainLayout';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Input } from '@/presentation/components/Input';
import { Badge } from '@/presentation/components/Badge';
import { LoadingState } from '@/presentation/components/LoadingState';
import { useSettings } from '@/presentation/hooks/useSettings';
import { useToast } from '@/presentation/components/ToastContext';
import { useTheme } from '@/presentation/theme/ThemeContext';
import { useExchangeRate } from '@/presentation/hooks/useExchangeRate';
import { DomainError } from '@/domain/errors/DomainError';
import { APP_CONFIG } from '@/shared/constants/config';
import { formatDate, formatDateTime } from '@/shared/utils/date';

export function Settings() {
  const { settings, loading, updateSettings } = useSettings();
  const { showToast } = useToast();
  const { mode, setMode } = useTheme();
  const { rate, status, setManualRate, clearManualRate, savingManualRate } = useExchangeRate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [manualRateInput, setManualRateInput] = useState('');

  useEffect(() => {
    if (settings) {
      setName(settings.name);
      setEmail(settings.email);
      setAdditionalInfo(settings.additionalInfo ?? '');
      setLogoDataUrl(settings.logoDataUrl);
    }
  }, [settings]);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1_500_000) {
      showToast('La imagen es muy pesada. Utilice una imagen de menos de 1.5 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings({ name, email, additionalInfo, logoDataUrl });
      showToast('Configuracion guardada correctamente.', 'success');
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo guardar la configuracion.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetManualRate() {
    const value = parseFloat(manualRateInput.replace(',', '.'));
    if (Number.isNaN(value) || value <= 0) {
      showToast('Ingrese una tasa manual valida (mayor a cero).', 'error');
      return;
    }
    try {
      await setManualRate(value);
      showToast('Tasa manual fijada. Se usara en todas las ventas hasta que la quite.', 'success');
      setManualRateInput('');
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo fijar la tasa manual.', 'error');
    }
  }

  async function handleClearManualRate() {
    try {
      await clearManualRate();
      showToast('Tasa manual eliminada. Se volvera a usar la API automatica.', 'success');
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo quitar la tasa manual.', 'error');
    }
  }

  if (loading || !settings) {
    return (
      <MainLayout title="Configuracion">
        <LoadingState label="Cargando configuracion..." />
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Configuracion" subtitle="Personalice los datos del negocio y la aplicacion">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
        <Card>
          <h2 style={{ fontSize: 15, margin: '0 0 14px' }}>Negocio</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input label="Nombre del negocio" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Informacion adicional" value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} />

            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Logo</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    background: 'var(--color-surface-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {logoDataUrl ? (
                    <img src={logoDataUrl} alt="Logo de Copiado Alfonzo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <ImageIcon size={22} color="var(--color-text-muted)" />
                  )}
                </div>
                <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Subir imagen
                </Button>
                {logoDataUrl && (
                  <Button variant="ghost" size="sm" onClick={() => setLogoDataUrl(null)}>
                    <Trash2 size={14} /> Quitar
                  </Button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="visually-hidden"
                  aria-label="Subir logo del negocio"
                />
              </div>
            </div>

            <div>
              <Button onClick={handleSave} loading={saving}>Guardar cambios</Button>
            </div>
          </div>
        </Card>

        <Card>
          <h2 style={{ fontSize: 15, margin: '0 0 14px' }}>Apariencia</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <Button variant={mode === 'dark' ? 'primary' : 'secondary'} onClick={() => setMode('dark')}>
              <Moon size={16} /> Oscuro
            </Button>
            <Button variant={mode === 'light' ? 'primary' : 'secondary'} onClick={() => setMode('light')}>
              <Sun size={16} /> Claro
            </Button>
          </div>
        </Card>

        <Card>
          <h2 style={{ fontSize: 15, margin: '0 0 14px' }}>Tasa de cambio</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13.5, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            <span>
              Estado: <strong style={{ color: 'var(--color-text)' }}>{translateStatus(status)}</strong>
              {status === 'manual' && <Badge tone="brand">Manual</Badge>}
            </span>
            <span>
              Tasa activa: <strong style={{ color: 'var(--color-text)' }}>{rate ? `${rate.rate.toLocaleString('es-VE', { minimumFractionDigits: 4 })} Bs.` : '—'}</strong>
            </span>
            {rate && typeof rate.previousRate === 'number' && (
              <span>
                Tasa anterior: <strong style={{ color: 'var(--color-text)' }}>{rate.previousRate.toLocaleString('es-VE', { minimumFractionDigits: 4 })} Bs.</strong>
                {typeof rate.changePercentage === 'number' && (
                  <span style={{ color: (rate.changeAmount ?? 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 700 }}>
                    {' '}
                    ({(rate.changeAmount ?? 0) >= 0 ? '+' : ''}
                    {rate.changePercentage.toLocaleString('es-VE', { maximumFractionDigits: 2 })}%)
                  </span>
                )}
              </span>
            )}
            <span>
              {rate?.isManual ? 'Fijada el' : 'Fecha valor BCV'}:{' '}
              <strong style={{ color: 'var(--color-text)' }}>
                {rate ? (rate.isManual ? formatDateTime(rate.fetchedAt) : formatDate(rate.officialDate)) : '—'}
              </strong>
              {rate && !rate.isManual && rate.isNextDayRate && <Badge tone="brand">Proximo dia habil</Badge>}
            </span>
            {rate && !rate.isManual && rate.isNextDayRate && (
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                El BCV publico esta tasa para el siguiente dia habil, pero ya esta en vigencia comercial desde
                hoy y esta app ya la esta usando en todos los calculos, sin esperar al cambio de fecha.
              </span>
            )}
            <span>Proveedor: <strong style={{ color: 'var(--color-text)' }}>{rate?.source ?? '—'}</strong></span>
            <span>Frecuencia de actualizacion automatica: <strong style={{ color: 'var(--color-text)' }}>cada {APP_CONFIG.exchangeRateRefreshMinutes} minutos, y al abrir la app</strong></span>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>
              <Gauge size={14} style={{ verticalAlign: -2, marginRight: 4 }} />
              Tasa manual personalizada
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: '0 0 10px' }}>
              Utilice esta opcion unicamente si la API publica presenta demoras o esta fuera de linea. Mientras
              este activa, todas las ventas usaran este valor en lugar de la tasa automatica.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Input
                placeholder="Ej: 107.50"
                type="number"
                step="0.01"
                value={manualRateInput}
                onChange={(e) => setManualRateInput(e.target.value)}
                style={{ maxWidth: 160 }}
              />
              <Button variant="secondary" onClick={() => void handleSetManualRate()} loading={savingManualRate}>
                Fijar tasa manual
              </Button>
              {rate?.isManual && (
                <Button variant="ghost" onClick={() => void handleClearManualRate()} loading={savingManualRate}>
                  <XCircle size={15} /> Quitar tasa manual
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}

function translateStatus(status: string): string {
  switch (status) {
    case 'updated':
      return 'Actualizada';
    case 'loading':
      return 'Actualizando...';
    case 'stale':
      return 'Ultima tasa valida (sin conexion)';
    case 'manual':
      return 'Tasa manual activa';
    case 'error':
      return 'Error de conexion';
    default:
      return 'Sin datos';
  }
}