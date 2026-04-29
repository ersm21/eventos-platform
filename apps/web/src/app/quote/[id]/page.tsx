'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import AppNavbar from '../../../components/AppNavbar';

type Quote = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  event_type: string | null;
  notes: string | null;
  status: string | null;
  total: number | null;
  admin_final_total: number | null;
  admin_note: string | null;
  deposit_amount: number | null;
  deposit_status: string | null;
  deposit_reference: string | null;
  payment_proof_url: string | null;
  payment_proof_name: string | null;
  created_at: string | null;
};

type QuoteItem = {
  id: string;
  quote_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function calculateItbis(value: number | null | undefined) {
  return Number(value ?? 0) * 0.18;
}

function calculateTotalWithItbis(value: number | null | undefined) {
  return Number(value ?? 0) * 1.18;
}


function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function getStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'review':
      return 'En revisión';
    case 'approved':
      return 'Aprobada';
    case 'sent':
      return 'Enviada';
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status || '—';
  }
}

function getStatusBadgeStyle(status: string | null | undefined) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    border: '1px solid',
  } as const;

  switch (status) {
    case 'approved':
      return {
        ...base,
        background: 'rgba(34, 197, 94, 0.12)',
        color: '#86efac',
        borderColor: 'rgba(34, 197, 94, 0.3)',
      };
    case 'confirmed':
      return {
        ...base,
        background: 'rgba(59, 130, 246, 0.14)',
        color: '#93c5fd',
        borderColor: 'rgba(59, 130, 246, 0.32)',
      };
    case 'review':
      return {
        ...base,
        background: 'rgba(250, 204, 21, 0.12)',
        color: '#fde68a',
        borderColor: 'rgba(250, 204, 21, 0.28)',
      };
    case 'cancelled':
      return {
        ...base,
        background: 'rgba(239, 68, 68, 0.12)',
        color: '#fca5a5',
        borderColor: 'rgba(239, 68, 68, 0.28)',
      };
    default:
      return {
        ...base,
        background: 'rgba(148, 163, 184, 0.10)',
        color: '#cbd5e1',
        borderColor: 'rgba(148, 163, 184, 0.24)',
      };
  }
}

function getDepositBadgeStyle(status: string | null | undefined) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 700,
    border: '1px solid',
  } as const;

  if (status === 'paid') {
    return {
      ...base,
      background: 'rgba(34, 197, 94, 0.12)',
      color: '#86efac',
      borderColor: 'rgba(34, 197, 94, 0.3)',
    };
  }

  return {
    ...base,
    background: 'rgba(250, 204, 21, 0.12)',
    color: '#fde68a',
    borderColor: 'rgba(250, 204, 21, 0.28)',
  };
}

export default function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadQuote = async () => {
      const resolvedParams = await params;
      const id = resolvedParams.id;

      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (quoteError || !quoteData) {
        setError('No pudimos cargar esta cotización.');
        setLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', id)
        .order('created_at', { ascending: true });

      if (itemsError) {
        setError(itemsError.message);
        setLoading(false);
        return;
      }

      setQuote(quoteData as Quote);
      setItems((itemsData || []) as QuoteItem[]);
      setLoading(false);
    };

    loadQuote();
  }, [params]);

  const confirmQuote = async () => {
    if (!quote) return;

    setConfirming(true);
    setError(null);
    setSuccessMessage(null);

    const { error } = await supabase
      .from('quotes')
      .update({ status: 'confirmed' })
      .eq('id', quote.id);

    if (error) {
      setError(error.message);
      setConfirming(false);
      return;
    }

    setQuote({ ...quote, status: 'confirmed' });
    setSuccessMessage('Tu cotización fue confirmada correctamente.');
    setConfirming(false);
  };

  const uploadPaymentProof = async () => {
    if (!quote || !selectedFile) return;

    setUploading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('quoteId', quote.id);

      const response = await fetch('/api/upload-payment-proof', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || 'No se pudo subir el comprobante.');
        setUploading(false);
        return;
      }

      setQuote({
        ...quote,
        payment_proof_url: result.publicUrl,
        payment_proof_name: result.fileName,
      });

      setSelectedFile(null);
      setSuccessMessage('Comprobante subido correctamente.');
      setUploading(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error inesperado subiendo comprobante.';
      setError(message);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />
          <div style={heroCardStyle}>
            <p style={eyebrowStyle}>Cotización</p>
            <h1 style={heroTitleStyle}>Cargando tu propuesta...</h1>
            <p style={heroTextStyle}>
              Un momento. Estamos preparando los detalles de tu evento.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !quote) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />
          <div style={heroCardStyle}>
            <p style={eyebrowStyle}>Error</p>
            <h1 style={heroTitleStyle}>Cotización no encontrada</h1>
            <p style={heroTextStyle}>{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!quote) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />
          <div style={heroCardStyle}>
            <p style={eyebrowStyle}>Error</p>
            <h1 style={heroTitleStyle}>Cotización no encontrada</h1>
            <p style={heroTextStyle}>No pudimos cargar esta cotización.</p>
          </div>
        </div>
      </main>
    );
  }

  const finalTotal = quote.admin_final_total ?? quote.total ?? 0;

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />

        <section style={heroCardStyle}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <p style={eyebrowStyle}>Tu propuesta</p>
              <h1 style={heroTitleStyle}>Cotización para tu evento</h1>
              <p style={heroTextStyle}>
                Revisa los detalles, confirma si ya está lista y sube tu
                comprobante de pago cuando corresponda.
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <span style={getStatusBadgeStyle(quote.status)}>
                {getStatusLabel(quote.status)}
              </span>
              <span style={getDepositBadgeStyle(quote.deposit_status)}>
                Depósito {quote.deposit_status === 'paid' ? 'pagado' : 'pendiente'}
              </span>
            </div>
          </div>

          {error && <div style={errorBoxStyle}>{error}</div>}
          {successMessage && <div style={successBoxStyle}>{successMessage}</div>}
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
            marginTop: 22,
          }}
        >
          {[
            {
              label: 'Subtotal sin ITBIS',
              value: formatMoney(finalTotal),
              hint: 'Monto base aprobado',
            },
            {
              label: 'ITBIS 18%',
              value: formatMoney(calculateItbis(finalTotal)),
              hint: 'Impuesto aplicado al subtotal',
            },
            {
              label: 'Total con ITBIS',
              value: formatMoney(calculateTotalWithItbis(finalTotal)),
              hint: 'Total final a pagar',
            },
            {
              label: 'Depósito requerido',
              value: formatMoney(quote.deposit_amount),
              hint: 'Monto para asegurar fecha',
            },
            {
              label: 'Estado actual',
              value: getStatusLabel(quote.status),
              hint: 'Seguimiento de tu cotización',
            },
          ].map((card) => (
            <div key={card.label} style={statCardStyle}>
              <p style={statLabelStyle}>{card.label}</p>
              <p style={statValueStyle}>{card.value}</p>
              <p style={statHintStyle}>{card.hint}</p>
            </div>
          ))}
        </section>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 14,
            marginTop: 22,
          }}
        >
          <section style={panelStyle}>
            <h2 style={panelTitleStyle}>Datos del cliente</h2>
            <div style={detailGridStyle}>
              <p style={detailRowStyle}>
                <strong>Cliente:</strong> {quote.customer_name || '—'}
              </p>
              <p style={detailRowStyle}>
                <strong>Email:</strong> {quote.customer_email || '—'}
              </p>
              <p style={detailRowStyle}>
                <strong>Evento:</strong> {quote.event_type || '—'}
              </p>
              <p style={detailRowStyle}>
                <strong>Fecha:</strong> {formatDate(quote.created_at)}
              </p>
              <p style={detailRowStyle}>
                <strong>Notas:</strong> {quote.notes || '—'}
              </p>
            </div>
          </section>

          <section style={panelStyle}>
            <h2 style={panelTitleStyle}>Revisión final</h2>
            <div style={detailGridStyle}>
              <p style={detailRowStyle}>
                <strong>Nota del admin:</strong> {quote.admin_note || '—'}
              </p>
              <p style={detailRowStyle}>
                <strong>Referencia de depósito:</strong>{' '}
                {quote.deposit_reference || '—'}
              </p>
              <p style={detailRowStyle}>
                <strong>ID:</strong> {quote.id}
              </p>
            </div>

            <div style={{ marginTop: 14 }}>
              {quote.status === 'approved' ? (
                <button
                  onClick={confirmQuote}
                  disabled={confirming}
                  style={primaryButtonStyle}
                >
                  {confirming ? 'Confirmando...' : 'Confirmar cotización'}
                </button>
              ) : quote.status === 'confirmed' ? (
                <div style={successMiniBoxStyle}>
                  Esta cotización ya fue confirmada.
                </div>
              ) : (
                <div style={infoMiniBoxStyle}>
                  Esta cotización todavía no está lista para confirmar.
                </div>
              )}
            </div>
          </section>
        </div>

        <section style={{ ...panelStyle, marginTop: 14 }}>
          <h2 style={panelTitleStyle}>Comprobante de pago</h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 14,
            }}
          >
            <div>
              <p style={detailRowStyle}>
                <strong>Archivo actual:</strong>{' '}
                {quote.payment_proof_name || 'No subido todavía'}
              </p>

              {quote.payment_proof_url && (
                <a
                  href={quote.payment_proof_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background:
                      'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
                    color: '#fff',
                    fontWeight: 700,
                    textDecoration: 'none',
                    marginTop: 10,
                    boxShadow: '0 12px 24px rgba(236,72,153,0.22)',
                  }}
                >
                  Abrir comprobante
                </a>
              )}
            </div>

            <div>
              <p style={{ margin: '0 0 10px', color: '#94a3b8' }}>
                Sube una imagen o PDF de tu depósito para que el admin pueda
                validarlo.
              </p>

              <div style={{ display: 'grid', gap: 10 }}>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setSelectedFile(file);
                  }}
                  style={fileInputStyle}
                />

                <button
                  onClick={uploadPaymentProof}
                  disabled={!selectedFile || uploading}
                  style={{
                    ...primaryButtonStyle,
                    opacity: !selectedFile || uploading ? 0.6 : 1,
                    cursor:
                      !selectedFile || uploading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {uploading ? 'Subiendo...' : 'Subir comprobante'}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section style={{ ...panelStyle, marginTop: 14 }}>
          <div style={quoteItemsHeaderStyle}>
            <div>
              <p style={eyebrowStyle}>Detalle de servicios</p>
              <h2 style={panelTitleStyle}>Productos de tu cotización</h2>
            </div>
            <div style={quoteItemsTotalsStackStyle}>
              <strong style={quoteItemsTotalStyle}>
                Subtotal sin ITBIS:{' '}
                {formatMoney(
                  items.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0)
                )}
              </strong>
              <span style={quoteItemsTaxStyle}>
                ITBIS 18%:{' '}
                {formatMoney(
                  calculateItbis(
                    items.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0)
                  )
                )}
              </span>
              <strong style={quoteItemsTotalStyle}>
                Total con ITBIS:{' '}
                {formatMoney(
                  calculateTotalWithItbis(
                    items.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0)
                  )
                )}
              </strong>
            </div>
          </div>

          {items.length === 0 ? (
            <p style={{ margin: 0, color: '#94a3b8' }}>
              No hay productos en esta cotización.
            </p>
          ) : (
            <div style={quoteItemsTableWrapStyle}>
              <div style={quoteItemsTableHeaderStyle}>
                <span>Artículo</span>
                <span>Cantidad</span>
                <span>Unitario</span>
                <span>Subtotal</span>
              </div>

              {items.map((item) => (
                <div key={item.id} style={quoteItemsTableRowStyle}>
                  <span style={quoteItemNameStyle}>{item.product_name}</span>
                  <span>{Number(item.quantity ?? 0)}</span>
                  <span>{formatMoney(item.unit_price)}</span>
                  <strong>{formatMoney(item.subtotal)}</strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background:
    'radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 26%), radial-gradient(circle at top right, rgba(236, 72, 153, 0.16), transparent 24%), linear-gradient(180deg, #09090f 0%, #11101c 52%, #070711 100%)',
  color: '#e5e7eb',
  padding: '40px 20px 80px',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.86) 0%, rgba(24,24,37,0.82) 48%, rgba(30,27,75,0.72) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 20,
  padding: 14,
  boxShadow: '0 14px 30px rgba(0,0,0,0.24)',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '10px 0 8px',
  fontSize: 38,
  lineHeight: 1.1,
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  maxWidth: 760,
};

const statCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(9,14,28,0.82) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 14,
  padding: 14,
  boxShadow: '0 12px 30px rgba(0,0,0,0.20)',
};

const statLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 13,
};

const statValueStyle: React.CSSProperties = {
  margin: '10px 0 6px',
  fontSize: 28,
  fontWeight: 800,
};

const statHintStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 13,
};

const panelStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.82) 0%, rgba(9,14,28,0.86) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 20,
  padding: 12,
  boxShadow: '0 14px 30px rgba(0,0,0,0.22)',
};

const panelTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 16,
  fontSize: 16,
};

const detailGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const detailRowStyle: React.CSSProperties = {
  margin: 0,
  color: '#e5e7eb',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
};

const successBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(20, 83, 45, 0.35)',
  border: '1px solid rgba(74, 222, 128, 0.28)',
  color: '#bbf7d0',
};

const successMiniBoxStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  background: 'rgba(20, 83, 45, 0.35)',
  border: '1px solid rgba(74, 222, 128, 0.28)',
  color: '#bbf7d0',
  fontWeight: 700,
};

const infoMiniBoxStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 12,
  background: 'rgba(30, 41, 59, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.18)',
  color: '#cbd5e1',
  fontWeight: 600,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 800,
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  boxShadow: '0 14px 26px rgba(236,72,153,0.24)',
};

const quoteItemsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 14,
  flexWrap: 'wrap',
  marginBottom: 14,
};

const quoteItemsTotalStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontSize: 16,
};

const quoteItemsTotalsStackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  textAlign: 'right',
};

const quoteItemsTaxStyle: React.CSSProperties = {
  color: '#fbbf24',
  fontWeight: 800,
};

const quoteItemsTableWrapStyle: React.CSSProperties = {
  overflowX: 'auto',
  borderRadius: 16,
  border: '1px solid rgba(250, 204, 21, 0.12)',
};

const quoteItemsTableHeaderStyle: React.CSSProperties = {
  minWidth: 680,
  display: 'grid',
  gridTemplateColumns: 'minmax(240px, 1.6fr) 110px 130px 130px',
  gap: 12,
  padding: '10px 12px',
  background: 'rgba(250, 204, 21, 0.08)',
  color: '#fbbf24',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
};

const quoteItemsTableRowStyle: React.CSSProperties = {
  minWidth: 680,
  display: 'grid',
  gridTemplateColumns: 'minmax(240px, 1.6fr) 110px 130px 130px',
  gap: 12,
  padding: '10px 12px',
  borderTop: '1px solid rgba(250, 204, 21, 0.10)',
  background: 'rgba(2, 6, 23, 0.28)',
  color: '#d7e2ee',
  alignItems: 'center',
};

const quoteItemNameStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontWeight: 800,
};

const fileInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 12,
  border: '1px solid rgba(250, 204, 21, 0.16)',
  background: 'rgba(2, 6, 23, 0.58)',
  color: '#e5e7eb',
};