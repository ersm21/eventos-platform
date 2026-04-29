'use client';

import { useEffect, useState } from 'react';
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
    padding: '7px 11px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid',
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
    padding: '7px 11px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 800,
    border: '1px solid',
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

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/book-meeting" ctaLabel="Solicitar reunión" />

        <section style={heroCardStyle}>
          <p style={eyebrowStyle}>Área de cliente</p>
          <h1 style={heroTitleStyle}>Mis cotizaciones</h1>
          <p style={heroTextStyle}>
            {userEmail
              ? `Sesión iniciada como ${userEmail}. Aquí puedes revisar cada cotización y su estado.`
              : 'Aquí podrás revisar el estado de tus cotizaciones.'}
          </p>
        </section>

        {loading && <div style={infoBoxStyle}>Cargando cotizaciones...</div>}
        {error && <div style={errorBoxStyle}>{error}</div>}

        {!loading && !error && quotes.length === 0 && (
          <div style={emptyStateStyle}>
            <p style={emptyTitleStyle}>Todavía no has creado cotizaciones.</p>
            <p style={emptyTextStyle}>
              Cuando envíes una cotización desde la home, aparecerá aquí.
            </p>
            <div style={{ marginTop: 14 }}>
              <Link href="/" style={primaryLinkStyle}>
                Ir a cotizar
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && quotes.length > 0 && (
          <div style={{ display: 'grid', gap: 18, marginTop: 22 }}>
            {quotes.map((quote) => (
              <article key={quote.id} style={cardStyle}>
                <div style={cardHeaderStyle}>
                  <div>
                    <p style={smallLabelStyle}>Cotización</p>
                    <h2 style={cardTitleStyle}>
                      {quote.event_type || 'Evento sin título'}
                    </h2>
                    <p style={mutedTextStyle}>ID: {quote.id}</p>
                  </div>

                  <div style={badgeWrapStyle}>
                    <span style={getStatusBadgeStyle(quote.status)}>
                      {getStatusLabel(quote.status)}
                    </span>
                    <span style={getDepositBadgeStyle(quote.deposit_status)}>
                      Depósito {quote.deposit_status === 'paid' ? 'pagado' : 'pendiente'}
                    </span>
                  </div>
                </div>

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
                      <strong>Creada:</strong> {formatDate(quote.created_at)}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Notas:</strong> {quote.notes || '—'}
                    </p>
                  </section>

                  <section style={subCardStyle}>
                    <h3 style={subCardTitleStyle}>Montos</h3>
                    <p style={rowTextStyle}>
                      <strong>Total inicial:</strong> {formatMoney(quote.total)}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Total final:</strong>{' '}
                      {formatMoney(quote.admin_final_total)}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Depósito:</strong>{' '}
                      {formatMoney(quote.deposit_amount)}
                    </p>
                    <p style={rowTextStyle}>
                      <strong>Referencia:</strong>{' '}
                      {quote.deposit_reference || '—'}
                    </p>
                  </section>
                </div>

                <section style={{ ...subCardStyle, marginTop: 16 }}>
                  <div style={quoteItemsHeaderStyle}>
                    <div>
                      <p style={smallLabelStyle}>Detalle de servicios</p>
                      <h3 style={subCardTitleStyle}>Artículos de la cotización</h3>
                    </div>
                    <strong style={quoteItemsTotalStyle}>
                      {formatMoney(
                        quoteItems
                          .filter((item) => item.quote_id === quote.id)
                          .reduce(
                            (sum, item) => sum + Number(item.subtotal ?? 0),
                            0
                          )
                      )}
                    </strong>
                  </div>

                  {quoteItems.filter((item) => item.quote_id === quote.id).length === 0 ? (
                    <p style={mutedTextStyle}>Todavía no hay artículos asociados.</p>
                  ) : (
                    <div style={quoteItemsTableWrapStyle}>
                      <div style={quoteItemsTableHeaderStyle}>
                        <span>Artículo</span>
                        <span>Cantidad</span>
                        <span>Unitario</span>
                        <span>Subtotal</span>
                      </div>

                      {quoteItems
                        .filter((item) => item.quote_id === quote.id)
                        .map((item) => (
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

                <section style={{ ...subCardStyle, marginTop: 16 }}>
                  <h3 style={subCardTitleStyle}>Nota del admin</h3>
                  <p style={notesTextStyle}>{quote.admin_note || 'Sin nota todavía.'}</p>
                </section>

                <div style={actionsRowStyle}>
                  <Link href={`/quote/${quote.id}`} style={primaryLinkStyle}>
                    Ver detalle
                  </Link>

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
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  color: '#f8fafc',
  padding: '34px 20px 80px',
  background:
    'radial-gradient(circle at 12% 18%, rgba(168,85,247,0.20), transparent 28%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #09090f 48%, #111827 100%)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(24,24,37,0.88) 42%, rgba(30,27,75,0.86) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 34,
  padding: 32,
  boxShadow: '0 30px 80px rgba(0,0,0,0.34)',
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
  margin: '10px 0 8px',
  fontSize: 44,
  lineHeight: 1.04,
  letterSpacing: '-0.04em',
  textShadow: '0 18px 60px rgba(0,0,0,0.42)',
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.6,
};

const infoBoxStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '18px 16px',
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  color: '#a7b5c9',
  boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
  boxShadow: '0 14px 28px rgba(0,0,0,0.18)',
};

const emptyStateStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '22px 18px',
  borderRadius: 18,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(30,27,75,0.38) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 800,
  fontSize: 20,
};

const emptyTextStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
};

const cardStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(30,27,75,0.42) 52%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 22px 48px rgba(0,0,0,0.24)',
};

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  flexWrap: 'wrap',
  marginBottom: 18,
};

const smallLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 900,
};

const cardTitleStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 24,
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 14,
};

const badgeWrapStyle: React.CSSProperties = {
  display: 'flex',
  gap: 8,
  flexWrap: 'wrap',
};

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 16,
};

const subCardStyle: React.CSSProperties = {
  background: 'rgba(2, 6, 23, 0.42)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 18,
  padding: 16,
};

const subCardTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 12,
  fontSize: 16,
};

const rowTextStyle: React.CSSProperties = {
  margin: '0 0 8px',
  color: '#d7e2ee',
};

const notesTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#d7e2ee',
  lineHeight: 1.6,
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
  fontSize: 18,
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
  padding: '12px 14px',
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
  padding: '13px 14px',
  borderTop: '1px solid rgba(250, 204, 21, 0.10)',
  background: 'rgba(2, 6, 23, 0.28)',
  color: '#d7e2ee',
  alignItems: 'center',
};

const quoteItemNameStyle: React.CSSProperties = {
  color: '#f8fafc',
  fontWeight: 800,
};

const actionsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 18,
};

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 15px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  boxShadow: '0 18px 34px rgba(236,72,153,0.24)',
};

const secondaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 15px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'rgba(2, 6, 23, 0.48)',
  color: '#f8fafc',
  fontWeight: 800,
  border: '1px solid rgba(250, 204, 21, 0.18)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
};