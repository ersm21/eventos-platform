'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
import AppNavbar from '../../components/AppNavbar';

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
  user_id?: string | null;
};

type QuoteItem = {
  id: string;
  quote_id: string;
  product_name: string;
  unit_price: number | null;
  quantity: number | null;
  subtotal: number | null;
};

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function calculateTechnicalSupport(value: number | null | undefined) {
  const subtotal = Number(value ?? 0);

  if (subtotal >= 120001) return 35000;
  if (subtotal >= 85000) return 25000;
  if (subtotal >= 35000) return 15000;
  if (subtotal >= 1000) return 5000;

  return 0;
}

function normalizeTransportText(value: string | null | undefined) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function calculateTransport(
  value: number | null | undefined,
  locationText?: string | null
) {
  const subtotal = Number(value ?? 0);
  const location = normalizeTransportText(locationText);

  if (subtotal <= 0) return 0;

  if (location.includes('punta cana')) return 30000;
  if (location.includes('bavaro')) return 30000;
  if (location.includes('la romana')) return 30000;
  if (location.includes('mao')) return 20000;
  if (location.includes('santo domingo')) return 20000;
  if (location.includes('puerto plata')) return 15000;
  if (location.includes('la vega')) return 10000;
  if (location.includes('moca')) return 7000;
  if (location.includes('santiago')) return 7000;

  return 0;
}

function calculateTaxableBase(
  value: number | null | undefined,
  locationText?: string | null
) {
  const subtotal = Number(value ?? 0);



  return (
    subtotal +
    calculateTechnicalSupport(subtotal) +
    calculateTransport(subtotal, locationText)
  );
}

function calculateItbis(
  value: number | null | undefined,
  locationText?: string | null
) {
  return calculateTaxableBase(value, locationText) * 0.18;
}

function calculateTotalWithItbis(
  value: number | null | undefined,
  locationText?: string | null
) {
  return calculateTaxableBase(value, locationText) * 1.18;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
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

function getDepositLabel(status: string | null | undefined) {
  return status === 'paid' ? 'Pagado' : 'Pendiente';
}

function getStatusBadgeStyle(status: string | null | undefined) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 900,
    border: '1px solid',
    whiteSpace: 'nowrap',
  } as const;

  switch (status) {
    case 'approved':
      return {
        ...base,
        background: 'rgba(34,197,94,0.12)',
        color: '#86efac',
        borderColor: 'rgba(34,197,94,0.28)',
      };
    case 'confirmed':
      return {
        ...base,
        background: 'rgba(59,130,246,0.14)',
        color: '#93c5fd',
        borderColor: 'rgba(59,130,246,0.30)',
      };
    case 'review':
      return {
        ...base,
        background: 'rgba(250,204,21,0.12)',
        color: '#fde68a',
        borderColor: 'rgba(250,204,21,0.28)',
      };
    case 'cancelled':
      return {
        ...base,
        background: 'rgba(239,68,68,0.12)',
        color: '#fca5a5',
        borderColor: 'rgba(239,68,68,0.28)',
      };
    default:
      return {
        ...base,
        background: 'rgba(148,163,184,0.10)',
        color: '#cbd5e1',
        borderColor: 'rgba(148,163,184,0.22)',
      };
  }
}

function getDepositBadgeStyle(status: string | null | undefined) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 900,
    border: '1px solid',
    whiteSpace: 'nowrap',
  } as const;

  if (status === 'paid') {
    return {
      ...base,
      background: 'rgba(34,197,94,0.12)',
      color: '#86efac',
      borderColor: 'rgba(34,197,94,0.28)',
    };
  }

  return {
    ...base,
    background: 'rgba(250,204,21,0.12)',
    color: '#fde68a',
    borderColor: 'rgba(250,204,21,0.28)',
  };
}

export default function MyQuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const deleteQuote = async (quoteId: string) => {
    const confirmed = window.confirm(
      '¿Seguro que quieres eliminar esta cotización? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    setDeletingQuoteId(quoteId);
    setError(null);

    const { error: itemsError } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId);

    if (itemsError) {
      setError(itemsError.message);
      setDeletingQuoteId(null);
      return;
    }

    const { error: quoteError } = await supabase
      .from('quotes')
      .delete()
      .eq('id', quoteId);

    if (quoteError) {
      setError(quoteError.message);
      setDeletingQuoteId(null);
      return;
    }

    setQuotes((current) => current.filter((quote) => quote.id !== quoteId));
    setDeletingQuoteId(null);
  };

  const [expandedQuoteId, setExpandedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    const loadQuotes = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError(userError.message);
        setLoading(false);
        return;
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      setUserEmail(user.email ?? null);

      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      const loadedQuotes = (data || []) as Quote[];
      setQuotes(loadedQuotes);

      const quoteIds = loadedQuotes.map((quote) => quote.id);

      if (quoteIds.length === 0) {
        setQuoteItems([]);
        setLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .in('quote_id', quoteIds);

      if (itemsError) {
        setError(itemsError.message);
      } else {
        setQuoteItems((itemsData || []) as QuoteItem[]);
      }

      setLoading(false);
    };

    loadQuotes();
  }, [router]);

  const quoteItemsById = useMemo(() => {
    return quoteItems.reduce<Record<string, QuoteItem[]>>((accumulator, item) => {
      accumulator[item.quote_id] = accumulator[item.quote_id] || [];
      accumulator[item.quote_id].push(item);
      return accumulator;
    }, {});
  }, [quoteItems]);

  const getItemsSubtotalForQuote = (quoteId: string) =>
    (quoteItemsById[quoteId] || []).reduce(
      (sum, item) => sum + Number(item.subtotal ?? 0),
      0
    );

  const getQuoteBaseTotal = (quote: Quote) =>
    Number(
      quote.admin_final_total ?? quote.total ?? getItemsSubtotalForQuote(quote.id)
    );

  const hasQuoteAdminDiscount = (quote: Quote) => {
    const itemsSubtotal = getItemsSubtotalForQuote(quote.id);

    return (
      quote.admin_final_total !== null &&
      quote.admin_final_total !== undefined &&
      itemsSubtotal > 0 &&
      quote.admin_final_total < itemsSubtotal
    );
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/book-meeting" ctaLabel="Solicitar reunión" />

        <section style={heroCardStyle}>
          <p style={eyebrowStyle}>Área de cliente</p>
          <h1 style={heroTitleStyle}>Mis cotizaciones</h1>
          <p style={heroTextStyle}>
            {userEmail
              ? `Sesión iniciada como ${userEmail}. Revisa tus solicitudes, montos y comprobantes.`
              : 'Aquí podrás revisar el estado de tus cotizaciones.'}
          </p>
        </section>

        {loading && <div style={infoBoxStyle}>Cargando cotizaciones...</div>}
        {error && <div style={errorBoxStyle}>{error}</div>}

        {!loading && !error && quotes.length === 0 && (
          <div style={emptyStateStyle}>
            <p style={emptyTitleStyle}>Todavía no has creado cotizaciones.</p>
            <p style={emptyTextStyle}>
              Cuando envíes una solicitud desde Cotizar, aparecerá aquí.
            </p>
            <div style={{ marginTop: 14 }}>
              <Link href="/cotizar" style={primaryLinkStyle}>
                Crear cotización
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && quotes.length > 0 && (
          <div style={quotesListStyle}>
            {quotes.map((quote) => {
              const baseTotal = getQuoteBaseTotal(quote);
              const totalWithItbis = calculateTotalWithItbis(baseTotal);
              const itemsForQuote = quoteItemsById[quote.id] || [];
              const isOpen = expandedQuoteId === quote.id;

              return (
                <article key={quote.id} style={cardStyle}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedQuoteId((current) =>
                        current === quote.id ? null : quote.id
                      )
                    }
                    style={quoteSummaryButtonStyle}
                  >
                    <div style={summaryMainStyle}>
                      <p style={smallLabelStyle}>Cotización</p>
                      <h2 style={cardTitleStyle}>
                        {quote.event_type || 'Evento sin título'}
                      </h2>
                      <p style={mutedTextStyle}>{formatDate(quote.created_at)}</p>
                    </div>

                    <div style={summaryMoneyStyle}>
                      <span style={totalLabelStyle}>Total con ITBIS</span>
                      <strong style={totalValueStyle}>{formatMoney(totalWithItbis)}</strong>
                      <span style={subtotalHintStyle}>
                        Subtotal: {formatMoney(baseTotal)}
                      </span>
                    </div>

                    <div style={summaryBadgesStyle}>
                      <span style={getStatusBadgeStyle(quote.status)}>
                        {getStatusLabel(quote.status)}
                      </span>
                      <span style={getDepositBadgeStyle(quote.deposit_status)}>
                        Depósito {getDepositLabel(quote.deposit_status).toLowerCase()}
                      </span>
                    </div>

                    <span style={chevronStyle}>{isOpen ? '−' : '+'}</span>
                  </button>

                  {isOpen && (
                    <div style={detailsWrapStyle}>
                      <div style={infoGridStyle}>
                        <section style={subCardStyle}>
                          <h3 style={subCardTitleStyle}>Resumen</h3>
                          <p style={rowTextStyle}>
                            <strong>Cliente:</strong> {quote.customer_name || '—'}
                          </p>
                          <p style={rowTextStyle}>
                            <strong>Email:</strong> {quote.customer_email || '—'}
                          </p>
                          <p style={rowTextStyle}>
                            <strong>ID:</strong> {quote.id}
                          </p>
                          <p style={rowTextStyle}>
                            <strong>Notas:</strong> {quote.notes || '—'}
                          </p>
                        </section>

                        <section style={amountCardStyle}>
                          <h3 style={subCardTitleStyle}>Montos</h3>

                          {hasQuoteAdminDiscount(quote) && (
                            <p style={rowTextStyle}>
                              <strong>Subtotal original:</strong>{' '}
                              <span style={quoteItemsOriginalTotalStyle}>
                                {formatMoney(getItemsSubtotalForQuote(quote.id))}
                              </span>
                            </p>
                          )}

                          {hasQuoteAdminDiscount(quote) && (
                            <p style={rowTextStyle}>
                              <strong>Descuento aplicado:</strong>{' '}
                              <span style={quoteItemsDiscountStyle}>
                                -{formatMoney(getItemsSubtotalForQuote(quote.id) - baseTotal)}
                              </span>
                            </p>
                          )}

                          <p style={rowTextStyle}>
                            <strong>Subtotal sin ITBIS:</strong> {formatMoney(baseTotal)}
                          </p>
                          <p style={rowTextStyle}>
                            <strong>ITBIS 18%:</strong> {formatMoney(calculateItbis(baseTotal))}
                          </p>
                          <p style={totalRowStyle}>
                            <strong>Total con ITBIS:</strong>{' '}
                            <span>{formatMoney(totalWithItbis)}</span>
                          </p>
                          <p style={rowTextStyle}>
                            <strong>Depósito:</strong> {formatMoney(quote.deposit_amount)}
                          </p>
                          <p style={rowTextStyle}>
                            <strong>Referencia:</strong> {quote.deposit_reference || '—'}
                          </p>
                        </section>
                      </div>

                      <section style={subCardStyle}>
                        <div style={quoteItemsHeaderStyle}>
                          <div>
                            <p style={smallLabelStyle}>Detalle de servicios</p>
                            <h3 style={subCardTitleStyle}>Artículos de la cotización</h3>
                          </div>
                        </div>

                        {itemsForQuote.length === 0 ? (
                          <p style={mutedTextStyle}>Todavía no hay artículos asociados.</p>
                        ) : (
                          <div style={itemsListStyle}>
                            {itemsForQuote.map((item) => (
                              <div key={item.id} style={itemRowStyle}>
                                <div>
                                  <strong style={quoteItemNameStyle}>{item.product_name}</strong>
                                  <p style={itemMetaStyle}>
                                    {Number(item.quantity ?? 0)} × {formatMoney(item.unit_price)}
                                  </p>
                                </div>
                                <strong style={itemSubtotalStyle}>
                                  {formatMoney(item.subtotal)}
                                </strong>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <section style={subCardStyle}>
                        <h3 style={subCardTitleStyle}>Nota del admin</h3>
                        <p style={notesTextStyle}>
                          {quote.admin_note || 'Sin nota todavía.'}
                        </p>
                      </section>

                      <div style={actionsRowStyle}>
                        <Link href={`/quote/${quote.id}`} style={primaryLinkStyle}>
                          Ver detalle completo
                        </Link>

                        <Link href={`/cotizar?edit=${quote.id}`} style={secondaryLinkStyle}>
                          Editar
                        </Link>

                        <button
                          type="button"
                          onClick={() => deleteQuote(quote.id)}
                          disabled={deletingQuoteId === quote.id}
                          style={{
                            ...dangerButtonStyle,
                            opacity: deletingQuoteId === quote.id ? 0.65 : 1,
                          }}
                        >
                          {deletingQuoteId === quote.id ? 'Eliminando...' : 'Eliminar'}
                        </button>

                        {quote.payment_proof_url && (
                          <a
                            href={quote.payment_proof_url}
                            target="_blank"
                            rel="noreferrer"
                            style={secondaryLinkStyle}
                          >
                            Ver comprobante
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  color: '#f8fafc',
  padding: '24px 14px 64px',
  background:
    'radial-gradient(circle at 12% 18%, rgba(168,85,247,0.20), transparent 28%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #09090f 48%, #111827 100%)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(24,24,37,0.88) 42%, rgba(30,27,75,0.86) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 24,
  padding: 20,
  boxShadow: '0 16px 34px rgba(0,0,0,0.28)',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 36,
  lineHeight: 1.02,
  letterSpacing: '-0.04em',
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.55,
  fontSize: 14,
};

const infoBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '16px',
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  color: '#a7b5c9',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
};

const emptyStateStyle: React.CSSProperties = {
  marginTop: 12,
  padding: 18,
  borderRadius: 18,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(30,27,75,0.38) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 900,
  fontSize: 18,
};

const emptyTextStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
};

const quotesListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  marginTop: 12,
};

const cardStyle: React.CSSProperties = {
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(30,27,75,0.34) 52%, rgba(9,14,28,0.96) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.13)',
  borderRadius: 20,
  boxShadow: '0 14px 26px rgba(0,0,0,0.20)',
};

const quoteSummaryButtonStyle: React.CSSProperties = {
  width: '100%',
  display: 'grid',
  gridTemplateColumns: 'minmax(220px, 1fr) auto auto 32px',
  gap: 14,
  alignItems: 'center',
  padding: 16,
  border: 'none',
  background: 'transparent',
  color: '#f8fafc',
  textAlign: 'left',
  cursor: 'pointer',
};

const summaryMainStyle: React.CSSProperties = {
  minWidth: 0,
};

const smallLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 900,
};

const cardTitleStyle: React.CSSProperties = {
  margin: '6px 0 4px',
  fontSize: 20,
  lineHeight: 1.15,
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 13,
  lineHeight: 1.45,
};

const summaryMoneyStyle: React.CSSProperties = {
  display: 'grid',
  gap: 3,
  textAlign: 'right',
};

const totalLabelStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};

const totalValueStyle: React.CSSProperties = {
  color: '#fbbf24',
  fontSize: 22,
  lineHeight: 1,
};

const subtotalHintStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 700,
};

const summaryBadgesStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
  justifyContent: 'flex-end',
};

const chevronStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  color: '#fbbf24',
  border: '1px solid rgba(250,204,21,0.18)',
  background: 'rgba(2,6,23,0.30)',
  fontSize: 20,
  fontWeight: 900,
};

const detailsWrapStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: '0 16px 16px',
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 10,
};

const subCardStyle: React.CSSProperties = {
  background: 'rgba(2, 6, 23, 0.38)',
  border: '1px solid rgba(250, 204, 21, 0.11)',
  borderRadius: 16,
  padding: 14,
};

const amountCardStyle: React.CSSProperties = {
  ...subCardStyle,
  background:
    'linear-gradient(135deg, rgba(250,204,21,0.07) 0%, rgba(2,6,23,0.42) 100%)',
};

const subCardTitleStyle: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 16,
};

const rowTextStyle: React.CSSProperties = {
  margin: '0 0 7px',
  color: '#d7e2ee',
  fontSize: 13,
  lineHeight: 1.5,
};

const totalRowStyle: React.CSSProperties = {
  margin: '10px 0',
  color: '#fde68a',
  fontSize: 16,
  lineHeight: 1.5,
};

const notesTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#d7e2ee',
  lineHeight: 1.55,
  fontSize: 13,
};

const quoteItemsHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 8,
  flexWrap: 'wrap',
  marginBottom: 10,
};

const quoteItemsOriginalTotalStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontWeight: 800,
  textDecoration: 'line-through',
  textDecorationThickness: 2,
};

const quoteItemsDiscountStyle: React.CSSProperties = {
  color: '#86efac',
  fontWeight: 900,
};

const itemsListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
};

const itemRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'center',
  padding: 10,
  borderRadius: 14,
  background: 'rgba(15,23,42,0.62)',
  border: '1px solid rgba(148,163,184,0.10)',
};

const quoteItemNameStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontWeight: 900,
};

const itemMetaStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: '#94a3b8',
  fontSize: 12,
};

const itemSubtotalStyle: React.CSSProperties = {
  color: '#f8fafc',
  whiteSpace: 'nowrap',
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 13px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  boxShadow: '0 14px 26px rgba(236,72,153,0.20)',
};

const dangerButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 14px',
  borderRadius: 14,
  border: '1px solid rgba(248, 113, 113, 0.32)',
  background: 'rgba(127, 29, 29, 0.28)',
  color: '#fecaca',
  fontWeight: 900,
  cursor: 'pointer',
};

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 13px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'rgba(2, 6, 23, 0.48)',
  color: '#f8fafc',
  fontWeight: 800,
  border: '1px solid rgba(250, 204, 21, 0.18)',
};
