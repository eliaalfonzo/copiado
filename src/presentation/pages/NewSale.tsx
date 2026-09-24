import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Search,
  UserPlus,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileDown,
  RefreshCw,
  Percent,
} from 'lucide-react';
import { MainLayout } from '@/presentation/layouts/MainLayout';
import { Card } from '@/presentation/components/Card';
import { Button } from '@/presentation/components/Button';
import { Input } from '@/presentation/components/Input';
import { Modal } from '@/presentation/components/Modal';
import { Badge } from '@/presentation/components/Badge';
import { Switch } from '@/presentation/components/Switch';
import { StepIndicator } from '@/presentation/components/StepIndicator';
import { CurrencyDisplay } from '@/presentation/components/CurrencyDisplay';
import { EmptyState } from '@/presentation/components/EmptyState';
import { useClients } from '@/presentation/hooks/useClients';
import { useProducts } from '@/presentation/hooks/useProducts';
import { useSales } from '@/presentation/hooks/useSales';
import { useExchangeRate } from '@/presentation/hooks/useExchangeRate';
import { useToast } from '@/presentation/components/ToastContext';
import { container } from '@/infrastructure/container';
import { CalculateSale } from '@/application/use-cases/sales/CalculateSale';
import { formatUsd } from '@/shared/utils/money';
import { DomainError } from '@/domain/errors/DomainError';
import { isValidFullName } from '@/domain/services/validateFullName';

import type { Client } from '@/domain/entities/Client';
import type { Product } from '@/domain/entities/Product';
import type { SaleItem } from '@/domain/entities/SaleItem';
import type { Sale } from '@/domain/entities/Sale';

const calculateSale = new CalculateSale();

const STEPS = [
  { label: 'Cliente' },
  { label: 'Servicios' },
  { label: 'Confirmacion' },
];

type SaleMode = 'individual' | 'promotion';

const DEFAULT_DISCOUNT_PERCENTAGE = '10';

export function NewSale() {
  const { clients, createClient } = useClients();
  const { activeProducts } = useProducts();
  const { createSale } = useSales();

  const {
    rate,
    status: rateStatus,
    refresh,
  } = useExchangeRate();

  const { showToast } = useToast();

  const [stepIndex, setStepIndex] = useState(0);

  const [selectedClient, setSelectedClient] =
    useState<Client | null>(null);

  const [clientQuery, setClientQuery] =
    useState('');

  const [newClientModalOpen, setNewClientModalOpen] =
    useState(false);

  const [newClientForm, setNewClientForm] = useState({
    fullName: '',
    phone: '',
    email: '',
  });

  const [newClientNameError, setNewClientNameError] =
    useState<string | undefined>(undefined);

  const [items, setItems] =
    useState<SaleItem[]>([]);

  const [activeProduct, setActiveProduct] =
    useState<Product | null>(null);

  const [activeVariantId, setActiveVariantId] =
    useState<string>('');

  const [saleMode, setSaleMode] =
    useState<SaleMode>('individual');

  const [quantityInput, setQuantityInput] =
    useState('1');

  // =========================================================
  // DESCUENTO POR VENTA
  // =========================================================

  // Desactivado por defecto.
  // Al activarlo, comienza mostrando 10%, pero el trabajador
  // puede modificar libremente el porcentaje entre 0 y 100.
  const [discountEnabled, setDiscountEnabled] =
    useState(false);

  const [discountPercentageInput, setDiscountPercentageInput] =
    useState(DEFAULT_DISCOUNT_PERCENTAGE);

  const [discountError, setDiscountError] =
    useState<string | undefined>(undefined);

  // =========================================================
  // ESTADO DE LA VENTA
  // =========================================================

  const [submitting, setSubmitting] =
    useState(false);

  const [completedSale, setCompletedSale] =
    useState<Sale | null>(null);

  const [downloadingPdf, setDownloadingPdf] =
    useState(false);

  const exchangeRate = rate?.rate ?? 0;

  // =========================================================
  // DESCUENTO EFECTIVO
  // =========================================================

  const effectiveDiscountPercentage = useMemo(() => {
    if (!discountEnabled) return 0;

    const parsed = parseFloat(
      discountPercentageInput.replace(',', '.')
    );

    if (Number.isNaN(parsed) || parsed < 0) {
      return 0;
    }

    return Math.min(parsed, 100);
  }, [
    discountEnabled,
    discountPercentageInput,
  ]);

  // =========================================================
  // TOTALES
  // =========================================================

  const totals = useMemo(
    () =>
      calculateSale.totals(
        items,
        exchangeRate,
        effectiveDiscountPercentage
      ),
    [
      items,
      exchangeRate,
      effectiveDiscountPercentage,
    ]
  );

  const filteredClients = clients.filter((c) =>
    c.fullName
      .toLowerCase()
      .includes(
        clientQuery.toLowerCase()
      )
  );

  function goToStep(index: number) {
    setStepIndex(index);
  }

  // =========================================================
  // CLIENTE
  // =========================================================

  async function handleCreateClient() {
    if (
      !isValidFullName(
        newClientForm.fullName
      )
    ) {
      setNewClientNameError(
        'Ingrese un nombre y apellido validos: solo letras, minimo 3 caracteres, sin numeros ni simbolos.'
      );

      return;
    }

    try {
      const client =
        await createClient(
          newClientForm
        );

      setSelectedClient(client);

      setNewClientModalOpen(false);

      setNewClientForm({
        fullName: '',
        phone: '',
        email: '',
      });

      setNewClientNameError(undefined);

      showToast(
        'Cliente creado y seleccionado.',
        'success'
      );
    } catch (error) {
      showToast(
        error instanceof DomainError
          ? error.userMessage
          : 'No se pudo crear el cliente.',
        'error'
      );
    }
  }

  // =========================================================
  // PRODUCTOS
  // =========================================================

  function openProduct(
    product: Product
  ) {
    setActiveProduct(product);

    const firstActiveVariant =
      product.variants.find(
        (v) => v.active
      );

    setActiveVariantId(
      firstActiveVariant?.id ?? ''
    );

    setSaleMode('individual');
    setQuantityInput('1');
  }

  function handleSaleModeChange(
    mode: SaleMode
  ) {
    setSaleMode(mode);
    setQuantityInput('1');
  }

  function handleAddLine() {
    if (!activeProduct) return;

    const quantity = parseInt(
      quantityInput,
      10
    );

    if (!quantity || quantity <= 0) {
      showToast(
        'Ingrese una cantidad valida.',
        'error'
      );

      return;
    }

    try {
      const updated =
        calculateSale.addLine(
          activeProduct,
          activeVariantId,
          quantity,
          items,
          saleMode === 'promotion'
        );

      setItems(updated);
      setActiveProduct(null);
      setQuantityInput('1');
      setSaleMode('individual');
    } catch (error) {
      showToast(
        error instanceof DomainError
          ? error.userMessage
          : 'No se pudo agregar el servicio. Verifique la modalidad seleccionada.',
        'error'
      );
    }
  }

  function updateLineQuantity(
    item: SaleItem,
    delta: number
  ) {
    const product =
      activeProducts.find(
        (p) => p.id === item.productId
      );

    if (!product) return;

    const newQuantity =
      item.quantity + delta;

    if (newQuantity <= 0) {
      setItems(
        calculateSale.removeLine(
          item.id,
          items
        )
      );

      return;
    }

    try {
      const updated =
        calculateSale.recalculateLine(
          product,
          item.variantId,
          newQuantity,
          item.id,
          items
        );

      setItems(updated);
    } catch {
      showToast(
        'No se pudo actualizar la cantidad.',
        'error'
      );
    }
  }

  function removeLine(
    item: SaleItem
  ) {
    setItems(
      calculateSale.removeLine(
        item.id,
        items
      )
    );
  }

  // =========================================================
  // DESCUENTO
  // =========================================================

  function handleToggleDiscount(
    checked: boolean
  ) {
    setDiscountEnabled(checked);
    setDiscountError(undefined);

    if (
      checked &&
      !discountPercentageInput.trim()
    ) {
      setDiscountPercentageInput(
        DEFAULT_DISCOUNT_PERCENTAGE
      );
    }
  }

  function handleDiscountInputChange(
    value: string
  ) {
    setDiscountPercentageInput(value);

    const parsed = parseFloat(
      value.replace(',', '.')
    );

    if (
      value.trim() === '' ||
      Number.isNaN(parsed) ||
      parsed < 0 ||
      parsed > 100
    ) {
      setDiscountError(
        'Ingrese un porcentaje entre 0 y 100.'
      );
    } else {
      setDiscountError(undefined);
    }
  }

  // =========================================================
  // FINALIZAR VENTA
  // =========================================================

  async function handleFinalizeSale() {
    if (!selectedClient) return;

    if (
      discountEnabled &&
      discountError
    ) {
      showToast(
        'Revise el porcentaje de descuento antes de continuar.',
        'error'
      );

      return;
    }

    setSubmitting(true);

    try {
      const sale =
        await createSale(
          selectedClient.id,
          items,
          exchangeRate,
          effectiveDiscountPercentage
        );

      setCompletedSale(sale);

      showToast(
        'Venta registrada correctamente.',
        'success'
      );
    } catch (error) {
      showToast(
        error instanceof DomainError
          ? error.userMessage
          : 'No se pudo registrar la venta.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =========================================================
  // PDF
  // =========================================================

  async function handleDownloadInvoice() {
    if (!completedSale) return;

    setDownloadingPdf(true);

    try {
      const blob =
        await container.generateInvoicePdf.execute(
          completedSale
        );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement('a');

      link.href = url;

      link.download =
        `comprobante-${completedSale.id}.pdf`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(
        error instanceof DomainError
          ? error.userMessage
          : 'No se pudo generar el comprobante.',
        'error'
      );
    } finally {
      setDownloadingPdf(false);
    }
  }

  // =========================================================
  // NUEVA VENTA
  // =========================================================

  function startNewSale() {
    setStepIndex(0);
    setSelectedClient(null);
    setClientQuery('');
    setItems([]);
    setCompletedSale(null);
    setActiveProduct(null);
    setActiveVariantId('');
    setSaleMode('individual');
    setQuantityInput('1');

    // Reiniciar descuento
    setDiscountEnabled(false);
    setDiscountPercentageInput(
      DEFAULT_DISCOUNT_PERCENTAGE
    );
    setDiscountError(undefined);
  }

  // =========================================================
  // VENTA COMPLETADA
  // =========================================================

  if (completedSale) {
    return (
      <MainLayout
        title="Nueva venta"
        subtitle="Venta finalizada"
      >
        <Card
          style={{
            maxWidth: 480,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <CheckCircle2
            size={48}
            color="var(--color-success)"
            style={{
              marginBottom: 12,
            }}
          />

          <h2
            style={{
              margin: '0 0 6px',
            }}
          >
            Venta registrada
          </h2>

          <p
            style={{
              color:
                'var(--color-text-secondary)',
              fontSize: 14,
              marginBottom: 18,
            }}
          >
            Cliente:{' '}
            {
              completedSale.clientNameSnapshot
            }
          </p>

          {completedSale.discountAmountCents >
            0 && (
              <p
                style={{
                  margin:
                    '0 0 6px',
                  fontSize: 12.5,
                  color:
                    'var(--color-brand-secondary)',
                  fontWeight: 600,
                }}
              >
                Descuento aplicado:{' '}
                {
                  completedSale.discountPercentage
                }
                % (-
                {formatUsd(
                  completedSale.discountAmountCents
                )}
                )
              </p>
            )}

          <CurrencyDisplay
            usdCents={
              completedSale.totalUsdCents
            }
            bsCents={
              completedSale.totalBsCents
            }
            size="lg"
            align="center"
          />

          <div
            style={{
              display: 'flex',
              gap: 10,
              justifyContent: 'center',
              marginTop: 22,
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="secondary"
              onClick={() =>
                void handleDownloadInvoice()
              }
              loading={downloadingPdf}
            >
              <FileDown size={16} />
              Descargar comprobante
            </Button>

            <Button
              onClick={startNewSale}
            >
              Nueva venta
            </Button>
          </div>
        </Card>
      </MainLayout>
    );
  }

  // =========================================================
  // VISTA PRINCIPAL
  // =========================================================

  return (
    <MainLayout
      title="Nueva venta"
      subtitle="Registre una venta paso a paso"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          paddingBottom: 90,
        }}
      >
        <StepIndicator
          steps={STEPS}
          currentIndex={stepIndex}
        />

        {/* =====================================================
            PASO 1 — CLIENTE
        ===================================================== */}

        {stepIndex === 0 && (
          <Card>
            <h2
              style={{
                fontSize: 15,
                marginTop: 0,
              }}
            >
              Paso 1 — Cliente
            </h2>

            <div
              style={{
                display: 'flex',
                gap: 10,
                marginBottom: 14,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  flex: 1,
                  minWidth: 200,
                  position: 'relative',
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: 12,
                    color:
                      'var(--color-text-muted)',
                  }}
                />

                <Input
                  placeholder="Buscar cliente..."
                  value={clientQuery}
                  onChange={(e) =>
                    setClientQuery(
                      e.target.value
                    )
                  }
                  style={{
                    paddingLeft: 36,
                  }}
                />
              </div>

              <Button
                variant="secondary"
                onClick={() =>
                  setNewClientModalOpen(
                    true
                  )
                }
              >
                <UserPlus size={16} />
                Nuevo cliente
              </Button>
            </div>

            {selectedClient ? (
              <div
                style={{
                  padding: 14,
                  borderRadius:
                    'var(--radius-md)',
                  background:
                    'var(--color-surface-alt)',
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      color:
                        'var(--color-text-secondary)',
                    }}
                  >
                    Cliente:
                  </p>

                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    {
                      selectedClient.fullName
                    }
                  </p>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setSelectedClient(null)
                  }
                >
                  Cambiar
                </Button>
              </div>
            ) : (
              <div
                style={{
                  maxHeight: 260,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection:
                    'column',
                  gap: 6,
                }}
              >
                {filteredClients.length ===
                  0 && (
                    <EmptyState
                      icon={UserPlus}
                      title="No se encontraron clientes"
                      description="Cree un nuevo cliente para continuar."
                    />
                  )}

                {filteredClients.map(
                  (client) => (
                    <button
                      key={client.id}
                      onClick={() =>
                        setSelectedClient(
                          client
                        )
                      }
                      style={{
                        textAlign: 'left',
                        padding:
                          '10px 14px',
                        borderRadius:
                          'var(--radius-sm)',
                        border:
                          '1px solid var(--color-border)',
                        background:
                          'var(--color-surface-alt)',
                        cursor: 'pointer',
                        color:
                          'var(--color-text)',
                      }}
                    >
                      {client.fullName}
                    </button>
                  )
                )}
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                marginTop: 18,
              }}
            >
              <Button
                onClick={() =>
                  goToStep(1)
                }
                disabled={
                  !selectedClient
                }
              >
                Continuar{' '}
                <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        )}

        {/* =====================================================
            PASO 2 — SERVICIOS
        ===================================================== */}

        {stepIndex === 1 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <Card>
              <h2
                style={{
                  fontSize: 15,
                  marginTop: 0,
                }}
              >
                Paso 2 — Servicios
              </h2>

              {rateStatus === 'error' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                    color:
                      'var(--color-danger)',
                    fontSize: 13,
                  }}
                >
                  No pudimos obtener la
                  tasa de cambio.

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void refresh()
                    }
                  >
                    <RefreshCw size={13} />
                    Reintentar
                  </Button>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: 10,
                }}
              >
                {activeProducts.map(
                  (product) => (
                    <button
                      key={product.id}
                      onClick={() =>
                        openProduct(
                          product
                        )
                      }
                      style={{
                        padding: 14,
                        borderRadius:
                          'var(--radius-md)',
                        border:
                          '1px solid var(--color-border)',
                        background:
                          'var(--color-surface-alt)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        color:
                          'var(--color-text)',
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 700,
                        }}
                      >
                        {product.name}
                      </p>

                      {product.promotion ? (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection:
                              'column',
                            gap: 3,
                            marginTop: 4,
                          }}
                        >
                          <span
                            style={{
                              display:
                                'inline-flex',
                              width:
                                'fit-content',
                            }}
                          >
                            <Badge tone="brand">
                              PROMOCION
                            </Badge>
                          </span>

                          <span
                            style={{
                              fontSize: 12,
                              color:
                                'var(--color-text-secondary)',
                            }}
                          >
                            Individual desde{' '}
                            {formatUsd(
                              Math.min(
                                ...product.variants.map(
                                  (v) =>
                                    v.unitPriceCents
                                )
                              )
                            )}
                          </span>
                        </div>
                      ) : (
                        <span
                          style={{
                            fontSize: 12,
                            color:
                              'var(--color-text-secondary)',
                          }}
                        >
                          Desde{' '}
                          {formatUsd(
                            Math.min(
                              ...product.variants.map(
                                (v) =>
                                  v.unitPriceCents
                              )
                            )
                          )}
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </Card>

            {/* =================================================
                CARRITO
            ================================================= */}

            <Card>
              <h2
                style={{
                  fontSize: 15,
                  marginTop: 0,
                }}
              >
                Carrito
              </h2>

              {items.length === 0 ? (
                <EmptyState
                  icon={Plus}
                  title="Aun no ha agregado servicios"
                  description="Seleccione un servicio arriba para comenzar."
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection:
                      'column',
                    gap: 10,
                  }}
                >
                  {items.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent:
                          'space-between',
                        alignItems: 'center',
                        padding:
                          '10px 12px',
                        borderRadius:
                          'var(--radius-sm)',
                        background:
                          'var(--color-surface-alt)',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div
                        style={{
                          minWidth: 140,
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: 14,
                          }}
                        >
                          {
                            item.productNameSnapshot
                          }{' '}
                          {item.appliedPromotionLabel && (
                            <Badge tone="brand">
                              Promo
                            </Badge>
                          )}
                        </p>

                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            color:
                              'var(--color-text-secondary)',
                          }}
                        >
                          {
                            item.variantNameSnapshot
                          }
                        </p>

                        <p
                          style={{
                            margin:
                              '2px 0 0',
                            fontSize: 12,
                            color:
                              'var(--color-text-muted)',
                          }}
                        >
                          {item.quantity} ×{' '}
                          {formatUsd(
                            item.unitPriceCents
                          )}{' '}
                          ={' '}
                          <strong
                            style={{
                              color:
                                'var(--color-brand-secondary)',
                            }}
                          >
                            {formatUsd(
                              item.subtotalCents
                            )}
                          </strong>
                        </p>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          gap: 6,
                        }}
                      >
                        <IconButton
                          onClick={() =>
                            updateLineQuantity(
                              item,
                              -1
                            )
                          }
                        >
                          <Minus size={14} />
                        </IconButton>

                        <span
                          style={{
                            minWidth: 24,
                            textAlign:
                              'center',
                            fontWeight: 700,
                          }}
                        >
                          {item.quantity}
                        </span>

                        <IconButton
                          onClick={() =>
                            updateLineQuantity(
                              item,
                              1
                            )
                          }
                        >
                          <Plus size={14} />
                        </IconButton>

                        <IconButton
                          onClick={() =>
                            removeLine(item)
                          }
                          danger
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* =================================================
                DESCUENTO DE LA VENTA
            ================================================= */}

            <Card>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'space-between',
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <Switch
                  checked={discountEnabled}
                  onChange={
                    handleToggleDiscount
                  }
                  label="Aplicar descuento a esta venta"
                />

                {discountEnabled && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems:
                        'center',
                      gap: 8,
                    }}
                  >
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step="0.5"
                      value={
                        discountPercentageInput
                      }
                      onChange={(e) =>
                        handleDiscountInputChange(
                          e.target.value
                        )
                      }
                      error={discountError}
                      style={{
                        maxWidth: 90,
                        textAlign:
                          'center',
                      }}
                      aria-label="Porcentaje de descuento"
                    />

                    <Percent
                      size={16}
                      color="var(--color-text-secondary)"
                    />
                  </div>
                )}
              </div>

              {discountEnabled &&
                !discountError &&
                totals.discountAmount
                  .valueInCents > 0 && (
                  <p
                    style={{
                      margin:
                        '10px 0 0',
                      fontSize: 12.5,
                      color:
                        'var(--color-text-secondary)',
                    }}
                  >
                    Descuento:{' '}
                    <strong
                      style={{
                        color:
                          'var(--color-brand-secondary)',
                      }}
                    >
                      -
                      {formatUsd(
                        totals.discountAmount
                          .valueInCents
                      )}
                    </strong>{' '}
                    sobre un subtotal de{' '}
                    {formatUsd(
                      totals.subtotalUsd
                        .valueInCents
                    )}
                    .
                  </p>
                )}
            </Card>

            {/* =================================================
                NAVEGACION
            ================================================= */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
              }}
            >
              <Button
                variant="ghost"
                onClick={() =>
                  goToStep(0)
                }
              >
                <ArrowLeft size={16} />
                Atras
              </Button>

              <Button
                onClick={() =>
                  goToStep(2)
                }
                disabled={
                  items.length === 0
                }
              >
                Continuar{' '}
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {/* =====================================================
            PASO 3 — CONFIRMACION
        ===================================================== */}

        {stepIndex === 2 && (
          <Card>
            <h2
              style={{
                fontSize: 15,
                marginTop: 0,
              }}
            >
              Paso 3 — Confirmacion
            </h2>

            <p
              style={{
                fontSize: 12,
                color:
                  'var(--color-text-secondary)',
                margin: '0 0 4px',
              }}
            >
              CLIENTE
            </p>

            <p
              style={{
                margin: '0 0 14px',
                fontWeight: 700,
              }}
            >
              {selectedClient?.fullName}
            </p>

            <p
              style={{
                fontSize: 12,
                color:
                  'var(--color-text-secondary)',
                margin: '0 0 6px',
              }}
            >
              PRODUCTOS
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection:
                  'column',
                gap: 6,
                marginBottom: 16,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    fontSize: 14,
                  }}
                >
                  <span>
                    {item.quantity}{' '}
                    {
                      item.productNameSnapshot
                    }{' '}
                    {
                      item.variantNameSnapshot
                    }
                    {item.appliedPromotionLabel
                      ? ' — Promocion'
                      : ''}
                  </span>

                  <span
                    style={{
                      fontWeight: 700,
                    }}
                  >
                    {formatUsd(
                      item.subtotalCents
                    )}
                  </span>
                </div>
              ))}
            </div>

            <hr
              style={{
                border: 'none',
                borderTop:
                  '1px solid var(--color-border)',
                margin: '14px 0',
              }}
            />

            {/* =================================================
                RESUMEN DEL DESCUENTO
            ================================================= */}

            {totals.discountAmount
              .valueInCents > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection:
                      'column',
                    gap: 4,
                    marginBottom: 10,
                    fontSize: 13.5,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      color:
                        'var(--color-text-secondary)',
                    }}
                  >
                    <span>
                      Subtotal
                    </span>

                    <span>
                      {formatUsd(
                        totals.subtotalUsd
                          .valueInCents
                      )}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent:
                        'space-between',
                      color:
                        'var(--color-brand-secondary)',
                      fontWeight: 600,
                    }}
                  >
                    <span>
                      Descuento (
                      {
                        totals.discountPercentage
                      }
                      %)
                    </span>

                    <span>
                      -
                      {formatUsd(
                        totals.discountAmount
                          .valueInCents
                      )}
                    </span>
                  </div>
                </div>
              )}

            {/* =================================================
                TOTAL
            ================================================= */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color:
                      'var(--color-text-secondary)',
                  }}
                >
                  TOTAL USD / Bs
                </p>

                <CurrencyDisplay
                  usdCents={
                    totals.totalUsd
                      .valueInCents
                  }
                  bsCents={
                    totals.totalBs
                      .valueInCents
                  }
                  size="lg"
                />
              </div>

              <div
                style={{
                  textAlign: 'right',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color:
                      'var(--color-text-muted)',
                  }}
                >
                  Tasa utilizada: Bs.{' '}
                  {exchangeRate.toLocaleString(
                    'es-VE',
                    {
                      minimumFractionDigits: 2,
                    }
                  )}
                  /USD
                </p>

                {rate &&
                  !rate.isManual &&
                  rate.isNextDayRate && (
                    <p
                      style={{
                        margin:
                          '2px 0 0',
                        fontSize: 11,
                        color:
                          'var(--color-brand-secondary)',
                        fontWeight: 600,
                      }}
                    >
                      Tasa del proximo dia
                      habil ya en vigencia
                    </p>
                  )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                marginTop: 24,
              }}
            >
              <Button
                variant="ghost"
                onClick={() =>
                  goToStep(1)
                }
              >
                <ArrowLeft size={16} />
                Atras
              </Button>

              <Button
                onClick={() =>
                  void handleFinalizeSale()
                }
                loading={submitting}
                disabled={!exchangeRate}
              >
                Finalizar venta
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* =======================================================
          TOTAL FLOTANTE
      ======================================================= */}

      {stepIndex < 2 &&
        items.length > 0 && (
          <div
            style={{
              position: 'fixed',
              bottom:
                'calc(var(--bottom-nav-height, 0px) + 12px)',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent:
                'center',
              padding: '0 16px',
              zIndex: 400,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                pointerEvents: 'auto',
                background:
                  'var(--color-surface)',
                border:
                  '1px solid var(--color-border)',
                boxShadow:
                  'var(--shadow-elevated)',
                borderRadius:
                  'var(--radius-lg)',
                padding:
                  '10px 20px',
                display: 'flex',
                alignItems:
                  'center',
                gap: 16,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color:
                    'var(--color-text-secondary)',
                  fontWeight: 600,
                }}
              >
                TOTAL
              </span>

              <CurrencyDisplay
                usdCents={
                  totals.totalUsd
                    .valueInCents
                }
                bsCents={
                  totals.totalBs
                    .valueInCents
                }
                size="md"
              />
            </div>
          </div>
        )}

      {/* =======================================================
          MODAL PRODUCTO
      ======================================================= */}

      <Modal
        open={!!activeProduct}
        onClose={() =>
          setActiveProduct(null)
        }
        title={
          activeProduct?.name ?? ''
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                setActiveProduct(null)
              }
            >
              Cancelar
            </Button>

            <Button
              onClick={handleAddLine}
            >
              Agregar al carrito
            </Button>
          </>
        }
      >
        {activeProduct && (
          <div
            style={{
              display: 'flex',
              flexDirection:
                'column',
              gap: 14,
            }}
          >
            {/* =================================================
                SELECCION DE MODALIDAD
            ================================================= */}

            {activeProduct.promotion ? (
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color:
                      'var(--color-text-secondary)',
                    marginBottom: 8,
                  }}
                >
                  Modalidad
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 10,
                  }}
                >
                  {/* VENTA INDIVIDUAL */}

                  <button
                    type="button"
                    onClick={() =>
                      handleSaleModeChange(
                        'individual'
                      )
                    }
                    style={{
                      padding: 14,
                      borderRadius:
                        'var(--radius-md)',
                      border:
                        saleMode ===
                          'individual'
                          ? '2px solid var(--color-brand)'
                          : '1px solid var(--color-border)',
                      background:
                        saleMode ===
                          'individual'
                          ? 'rgba(255,20,147,0.12)'
                          : 'var(--color-surface-alt)',
                      cursor: 'pointer',
                      color:
                        'var(--color-text)',
                      textAlign: 'left',
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                      }}
                    >
                      Fotografia
                      individual
                    </p>

                    <p
                      style={{
                        margin:
                          '5px 0 0',
                        fontSize: 13,
                        color:
                          'var(--color-text-secondary)',
                      }}
                    >
                      {formatUsd(
                        getFirstActiveVariantPrice(
                          activeProduct
                        )
                      )}{' '}
                      cada una
                    </p>
                  </button>

                  {/* PROMOCION */}

                  <button
                    type="button"
                    onClick={() =>
                      handleSaleModeChange(
                        'promotion'
                      )
                    }
                    style={{
                      padding: 14,
                      borderRadius:
                        'var(--radius-md)',
                      border:
                        saleMode ===
                          'promotion'
                          ? '2px solid var(--color-brand)'
                          : '1px solid var(--color-border)',
                      background:
                        saleMode ===
                          'promotion'
                          ? 'rgba(255,20,147,0.12)'
                          : 'var(--color-surface-alt)',
                      cursor: 'pointer',
                      color:
                        'var(--color-text)',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: 7,
                        marginBottom: 4,
                      }}
                    >
                      <Badge tone="brand">
                        PROMOCION
                      </Badge>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                      }}
                    >
                      {
                        activeProduct
                          .promotion
                          .label
                      }
                    </p>

                    <p
                      style={{
                        margin:
                          '5px 0 0',
                        fontSize: 13,
                        color:
                          'var(--color-text-secondary)',
                      }}
                    >
                      {formatUsd(
                        activeProduct
                          .promotion
                          .totalPriceCents
                      )}{' '}
                      por paquete
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              /* PRODUCTOS SIN PROMOCION */

              activeProduct.variants.length >
              1 && (
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        'var(--color-text-secondary)',
                      marginBottom: 8,
                    }}
                  >
                    Modalidad
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    {activeProduct.variants
                      .filter(
                        (v) => v.active
                      )
                      .map((variant) => (
                        <button
                          type="button"
                          key={variant.id}
                          onClick={() =>
                            setActiveVariantId(
                              variant.id
                            )
                          }
                          style={{
                            padding:
                              '8px 14px',
                            borderRadius:
                              'var(--radius-sm)',
                            border:
                              activeVariantId ===
                                variant.id
                                ? '2px solid var(--color-brand)'
                                : '1px solid var(--color-border)',
                            background:
                              activeVariantId ===
                                variant.id
                                ? 'rgba(255,20,147,0.12)'
                                : 'var(--color-surface-alt)',
                            cursor:
                              'pointer',
                            color:
                              'var(--color-text)',
                            fontWeight: 600,
                          }}
                        >
                          {
                            variant.name
                          }{' '}
                          —{' '}
                          {formatUsd(
                            variant.unitPriceCents
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )
            )}

            {/* =================================================
                INFORMACION DEL PAQUETE
            ================================================= */}

            {activeProduct.promotion &&
              saleMode ===
              'promotion' && (
                <div
                  style={{
                    padding: 10,
                    borderRadius:
                      'var(--radius-sm)',
                    background:
                      'rgba(255,20,147,0.1)',
                    border:
                      '1px dashed var(--color-brand)',
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    Paquete de{' '}
                    {
                      activeProduct
                        .promotion
                        .requiredQuantity
                    }{' '}
                    fotografias
                  </p>

                  <p
                    style={{
                      margin:
                        '4px 0 0',
                      fontSize: 12,
                      color:
                        'var(--color-text-secondary)',
                    }}
                  >
                    La cantidad indica
                    cuantos paquetes se
                    venderan.
                  </p>
                </div>
              )}

            {/* =================================================
                VARIANTE PARA PRODUCTOS CON PROMOCION
            ================================================= */}

            {activeProduct.promotion &&
              activeProduct.variants.length >
              1 && (
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        'var(--color-text-secondary)',
                      marginBottom: 8,
                    }}
                  >
                    Tipo de servicio
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      flexWrap: 'wrap',
                    }}
                  >
                    {activeProduct.variants
                      .filter(
                        (v) => v.active
                      )
                      .map((variant) => (
                        <button
                          type="button"
                          key={variant.id}
                          onClick={() =>
                            setActiveVariantId(
                              variant.id
                            )
                          }
                          style={{
                            padding:
                              '8px 14px',
                            borderRadius:
                              'var(--radius-sm)',
                            border:
                              activeVariantId ===
                                variant.id
                                ? '2px solid var(--color-brand)'
                                : '1px solid var(--color-border)',
                            background:
                              activeVariantId ===
                                variant.id
                                ? 'rgba(255,20,147,0.12)'
                                : 'var(--color-surface-alt)',
                            cursor:
                              'pointer',
                            color:
                              'var(--color-text)',
                            fontWeight: 600,
                          }}
                        >
                          {
                            variant.name
                          }{' '}
                          —{' '}
                          {formatUsd(
                            variant.unitPriceCents
                          )}
                        </button>
                      ))}
                  </div>
                </div>
              )}

            {/* =================================================
                CANTIDAD
            ================================================= */}

            <div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color:
                    'var(--color-text-secondary)',
                  marginBottom: 8,
                }}
              >
                {saleMode ===
                  'promotion'
                  ? 'Cantidad de paquetes'
                  : 'Cantidad'}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: 10,
                }}
              >
                <IconButton
                  onClick={() =>
                    setQuantityInput(
                      String(
                        Math.max(
                          1,
                          (parseInt(
                            quantityInput ||
                            '1',
                            10
                          ) || 1) - 1
                        )
                      )
                    )
                  }
                >
                  <Minus size={16} />
                </IconButton>

                <Input
                  type="number"
                  min={1}
                  value={
                    quantityInput
                  }
                  onChange={(e) =>
                    setQuantityInput(
                      e.target.value
                    )
                  }
                  style={{
                    textAlign:
                      'center',
                    maxWidth: 90,
                  }}
                />

                <IconButton
                  onClick={() =>
                    setQuantityInput(
                      String(
                        (parseInt(
                          quantityInput ||
                          '0',
                          10
                        ) || 0) + 1
                      )
                    )
                  }
                >
                  <Plus size={16} />
                </IconButton>
              </div>
            </div>

            {/* =================================================
                VISTA PREVIA
            ================================================= */}

            <CalculationPreview
              product={activeProduct}
              variantId={activeVariantId}
              quantity={parseInt(
                quantityInput ||
                '0',
                10
              )}
              saleMode={saleMode}
            />
          </div>
        )}
      </Modal>

      {/* =======================================================
          MODAL NUEVO CLIENTE
      ======================================================= */}

      <Modal
        open={newClientModalOpen}
        onClose={() =>
          setNewClientModalOpen(
            false
          )
        }
        title="Nuevo cliente"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                setNewClientModalOpen(
                  false
                )
              }
            >
              Cancelar
            </Button>

            <Button
              onClick={() =>
                void handleCreateClient()
              }
            >
              Guardar y seleccionar
            </Button>
          </>
        }
      >
        <div
          style={{
            display: 'flex',
            flexDirection:
              'column',
            gap: 12,
          }}
        >
          <Input
            label="Nombre y Apellido"
            value={
              newClientForm.fullName
            }
            onChange={(e) => {
              setNewClientForm({
                ...newClientForm,
                fullName:
                  e.target.value,
              });

              if (
                newClientNameError &&
                (
                  isValidFullName(
                    e.target.value
                  ) ||
                  e.target.value.trim() ===
                  ''
                )
              ) {
                setNewClientNameError(
                  undefined
                );
              }
            }}
            error={
              newClientNameError
            }
            placeholder="Ej: Maria Gonzalez"
          />

          <Input
            label="Telefono (opcional)"
            value={
              newClientForm.phone
            }
            onChange={(e) =>
              setNewClientForm({
                ...newClientForm,
                phone:
                  e.target.value,
              })
            }
          />

          <Input
            label="Correo (opcional)"
            value={
              newClientForm.email
            }
            onChange={(e) =>
              setNewClientForm({
                ...newClientForm,
                email:
                  e.target.value,
              })
            }
          />
        </div>
      </Modal>
    </MainLayout>
  );
}

// =============================================================
// BOTON DE ICONO
// =============================================================

function IconButton({
  children,
  onClick,
  danger,
}: {
  children: ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        border:
          '1px solid var(--color-border)',
        background:
          'var(--color-surface)',
        color: danger
          ? 'var(--color-danger)'
          : 'var(--color-text)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

// =============================================================
// PRECIO DE LA PRIMERA VARIANTE ACTIVA
// =============================================================

function getFirstActiveVariantPrice(
  product: Product
): number {
  const variant =
    product.variants.find(
      (v) => v.active
    );

  return (
    variant?.unitPriceCents ?? 0
  );
}

// =============================================================
// VISTA PREVIA DEL CALCULO
// =============================================================

function CalculationPreview({
  product,
  variantId,
  quantity,
  saleMode,
}: {
  product: Product;
  variantId: string;
  quantity: number;
  saleMode: SaleMode;
}) {
  const variant =
    product.variants.find(
      (v) => v.id === variantId
    );

  if (
    !quantity ||
    quantity <= 0
  ) {
    return null;
  }

  // =========================================================
  // PROMOCION COMO PAQUETE FIJO
  // =========================================================

  if (
    saleMode === 'promotion' &&
    product.promotion
  ) {
    const subtotal =
      quantity *
      product.promotion
        .totalPriceCents;

    return (
      <div
        style={{
          padding: 12,
          borderRadius:
            'var(--radius-sm)',
          background:
            'var(--color-surface-alt)',
          fontSize: 13,
        }}
      >
        <p
          style={{
            margin: 0,
          }}
        >
          {quantity}{' '}
          {quantity === 1
            ? 'paquete'
            : 'paquetes'}{' '}
          ×{' '}
          {formatUsd(
            product.promotion
              .totalPriceCents
          )}
        </p>

        <p
          style={{
            margin:
              '4px 0 0',
            fontWeight: 700,
            color:
              'var(--color-brand-secondary)',
          }}
        >
          = {formatUsd(subtotal)}
        </p>
      </div>
    );
  }

  // =========================================================
  // VENTA INDIVIDUAL
  // =========================================================

  if (!variant) {
    return null;
  }

  const subtotal =
    quantity *
    variant.unitPriceCents;

  return (
    <div
      style={{
        padding: 12,
        borderRadius:
          'var(--radius-sm)',
        background:
          'var(--color-surface-alt)',
        fontSize: 13,
      }}
    >
      <p
        style={{
          margin: 0,
        }}
      >
        {quantity} ×{' '}
        {formatUsd(
          variant.unitPriceCents
        )}
      </p>

      <p
        style={{
          margin:
            '4px 0 0',
          fontWeight: 700,
          color:
            'var(--color-brand-secondary)',
        }}
      >
        = {formatUsd(subtotal)}
      </p>
    </div>
  );
}
