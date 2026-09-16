import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackagePlus, Trash2, Plus, Power, RotateCcw } from 'lucide-react';
import { MainLayout } from '@/presentation/layouts/MainLayout';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Input } from '@/presentation/components/Input';
import { Modal } from '@/presentation/components/Modal';
import { ConfirmDialog } from '@/presentation/components/ConfirmDialog';
import { Badge } from '@/presentation/components/Badge';
import { EmptyState } from '@/presentation/components/EmptyState';
import { LoadingState } from '@/presentation/components/LoadingState';
import { useProducts } from '@/presentation/hooks/useProducts';
import { useToast } from '@/presentation/components/ToastContext';
import { formatUsd } from '@/shared/utils/money';
import { DomainError } from '@/domain/errors/DomainError';
import type { Product } from '@/domain/entities/Product';

interface VariantForm {
  name: string;
  price: string;
}

export function Products() {
  const { products, loading, createProduct, updateProduct, updatePrice, toggleActive, resetToDefaults } = useProducts();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(searchParams.get('nuevo') === '1');
  const [editing, setEditing] = useState<Product | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [variants, setVariants] = useState<VariantForm[]>([{ name: 'Estandar', price: '' }]);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoLabel, setPromoLabel] = useState('');
  const [promoQty, setPromoQty] = useState('');
  const [promoPrice, setPromoPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  function resetForm() {
    setEditing(null);
    setName('');
    setCategory('');
    setVariants([{ name: 'Estandar', price: '' }]);
    setPromoEnabled(false);
    setPromoLabel('');
    setPromoQty('');
    setPromoPrice('');
  }

  function openCreate() {
    resetForm();
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setName(product.name);
    setCategory(product.category);
    setVariants(product.variants.map((v) => ({ name: v.name, price: (v.unitPriceCents / 100).toString() })));
    setPromoEnabled(!!product.promotion);
    setPromoLabel(product.promotion?.label ?? '');
    setPromoQty(product.promotion ? String(product.promotion.requiredQuantity) : '');
    setPromoPrice(product.promotion ? (product.promotion.totalPriceCents / 100).toString() : '');
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    if (searchParams.get('nuevo')) {
      searchParams.delete('nuevo');
      setSearchParams(searchParams, { replace: true });
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const parsedVariants = variants.map((v) => ({
        name: v.name.trim(),
        unitPriceCents: Math.round(parseFloat(v.price || '0') * 100),
      }));
      const promotion = promoEnabled
        ? {
          label: promoLabel.trim(),
          requiredQuantity: parseInt(promoQty || '0', 10),
          totalPriceCents: Math.round(parseFloat(promoPrice || '0') * 100),
        }
        : null;

      if (editing) {
        await updateProduct({
          ...editing,
          name: name.trim(),
          category: category.trim() || 'general',
          variants: editing.variants.map((v, i) => ({
            ...v,
            name: parsedVariants[i]?.name ?? v.name,
            unitPriceCents: parsedVariants[i]?.unitPriceCents ?? v.unitPriceCents,
          })),
          promotion: promotion ? { id: editing.promotion?.id ?? `promo_${Date.now()}`, ...promotion } : null,
        });
        showToast('Producto actualizado correctamente.', 'success');
      } else {
        await createProduct({ name, category, variants: parsedVariants, promotion });
        showToast('Producto creado correctamente.', 'success');
      }
      closeModal();
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo guardar el producto.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePriceEdit(product: Product, variantId: string, currentCents: number) {
    const input = window.prompt('Nuevo precio (USD):', (currentCents / 100).toFixed(2));
    if (input === null) return;
    const value = parseFloat(input);
    if (Number.isNaN(value) || value < 0) {
      showToast('Ingrese un precio valido.', 'error');
      return;
    }
    try {
      await updatePrice(product.id, variantId, Math.round(value * 100));
      showToast('Precio actualizado.', 'success');
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudo actualizar el precio.', 'error');
    }
  }

  async function handleConfirmReset() {
    setResetting(true);
    try {
      await resetToDefaults();
      showToast('Productos restablecidos a los valores por defecto de Copiado Alfonzo.', 'success');
      setConfirmResetOpen(false);
    } catch (error) {
      showToast(error instanceof DomainError ? error.userMessage : 'No se pudieron restablecer los productos.', 'error');
    } finally {
      setResetting(false);
    }
  }

  return (
    <MainLayout title="Productos" subtitle="Catalogo de servicios y precios">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Button variant="ghost" onClick={() => setConfirmResetOpen(true)}>
          <RotateCcw size={16} /> Restablecer por defecto
        </Button>
        <Button onClick={openCreate}>
          <PackagePlus size={16} /> Nuevo producto
        </Button>
      </div>

      {loading ? (
        <LoadingState label="Cargando productos..." />
      ) : products.length === 0 ? (
        <EmptyState icon={PackagePlus} title="No hay productos" description="Cree su primer producto o servicio." />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {products.map((product) => (
            <Card key={product.id} style={{ opacity: product.active ? 1 : 0.55 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{product.name}</h3>
                  <Badge tone="neutral">{product.category}</Badge>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(product)}>Editar</Button>
                  <Button size="sm" variant="ghost" onClick={() => void toggleActive(product.id)} aria-label={product.active ? 'Desactivar' : 'Activar'}>
                    <Power size={15} color={product.active ? 'var(--color-success)' : 'var(--color-text-muted)'} />
                  </Button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {product.variants.map((variant) => (
                  <div
                    key={variant.id}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}
                  >
                    <span style={{ color: 'var(--color-text-secondary)' }}>{variant.name}</span>
                    <button
                      onClick={() => void handlePriceEdit(product, variant.id, variant.unitPriceCents)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, color: 'var(--color-brand-secondary)' }}
                    >
                      {formatUsd(variant.unitPriceCents)}
                    </button>
                  </div>
                ))}
              </div>

              {product.promotion && (
                <div
                  style={{
                    marginTop: 12,
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 20, 147, 0.1)',
                    border: '1px dashed var(--color-brand)',
                  }}
                >
                  <Badge tone="brand">PROMOCION</Badge>
                  <p style={{ margin: '6px 0 0', fontSize: 13, fontWeight: 600 }}>
                    {product.promotion.label} — {formatUsd(product.promotion.totalPriceCents)}
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar producto' : 'Nuevo producto'}
        maxWidth={520}
        footer={
          <>
            <Button variant="ghost" onClick={closeModal}>Cancelar</Button>
            <Button onClick={handleSubmit} loading={submitting}>Guardar</Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Nombre del producto" value={name} onChange={(e) => setName(e.target.value)} />
          <Input label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} hint="Ej: copias, impresiones, plastificado..." />

          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', margin: '4px 0 8px' }}>
              Modalidades y precios (USD)
            </p>
            {variants.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <Input
                  placeholder="Nombre (ej: A Color)"
                  value={v.name}
                  onChange={(e) => setVariants(variants.map((vv, ii) => (ii === i ? { ...vv, name: e.target.value } : vv)))}
                />
                <Input
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  value={v.price}
                  onChange={(e) => setVariants(variants.map((vv, ii) => (ii === i ? { ...vv, price: e.target.value } : vv)))}
                  style={{ maxWidth: 100 }}
                />
                {variants.length > 1 && !editing && (
                  <Button variant="ghost" size="sm" onClick={() => setVariants(variants.filter((_, ii) => ii !== i))}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
            {!editing && (
              <Button variant="ghost" size="sm" onClick={() => setVariants([...variants, { name: '', price: '' }])}>
                <Plus size={14} /> Agregar modalidad
              </Button>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 4 }}>
            <input type="checkbox" checked={promoEnabled} onChange={(e) => setPromoEnabled(e.target.checked)} />
            Este producto tiene una promocion
          </label>

          {promoEnabled && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)' }}>
              <Input label="Descripcion de la promocion" value={promoLabel} onChange={(e) => setPromoLabel(e.target.value)} placeholder="Ej: 9 fotografias" />
              <div style={{ display: 'flex', gap: 8 }}>
                <Input label="Cantidad requerida" type="number" value={promoQty} onChange={(e) => setPromoQty(e.target.value)} />
                <Input label="Precio total (USD)" type="number" step="0.01" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Restablecer productos por defecto"
        message="Esto reemplazara TODO el catalogo actual (incluyendo productos agregados manualmente, duplicados y precios modificados) por los 4 productos originales de Copiado Alfonzo: Copias, Impresiones, Escaneos y Fotografias con su promocion. Esta accion no se puede deshacer. Las ventas ya registradas no se ven afectadas, porque conservan su propio precio y nombre guardados al momento de la venta."
        confirmLabel="Restablecer"
        danger
        loading={resetting}
        onConfirm={() => void handleConfirmReset()}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </MainLayout>
  );
}