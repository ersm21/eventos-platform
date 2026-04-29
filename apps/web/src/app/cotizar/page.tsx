

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppNavbar from '../../components/AppNavbar';
import { supabase } from '../../lib/supabase/client';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  is_active: boolean | null;
};

type QuoteItem = Product & {
  quantity: number;
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


export default function CotizarPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        setError(productsError.message);
      } else {
        setProducts((data || []) as Product[]);
      }

      setLoading(false);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);
      setSessionEmail(user?.email ?? null);
      setCustomerEmail(user?.email ?? '');
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      setSessionEmail(session?.user?.email ?? null);
      setCustomerEmail(session?.user?.email ?? '');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addToQuote = (product: Product) => {
    setQuoteItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const increaseQuantity = (productId: string) => {
    setQuoteItems((prev) =>
      prev.map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const decreaseQuantity = (productId: string) => {
    setQuoteItems((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = useMemo(
    () =>
      quoteItems.reduce(
        (sum, item) => sum + Number(item.price ?? 0) * item.quantity,
        0
      ),
    [quoteItems]
  );

  const itemCount = useMemo(
    () => quoteItems.reduce((sum, item) => sum + item.quantity, 0),
    [quoteItems]
  );

  const saveQuote = async () => {
    if (!isLoggedIn) {
      setError('Debes iniciar sesión para guardar tu cotización.');
      return;
    }

    if (!customerName.trim()) {
      setError('Debes escribir tu nombre.');
      return;
    }

    if (!customerEmail.trim()) {
      setError('Debes escribir tu email.');
      return;
    }

    if (!eventType.trim()) {
      setError('Debes indicar el tipo de evento.');
      return;
    }

    if (quoteItems.length === 0) {
      setError('No hay servicios en la cotización.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Tu sesión no está disponible. Vuelve a iniciar sesión.');
      setSaving(false);
      return;
    }

    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .insert([
        {
          customer_name: customerName,
          customer_email: customerEmail,
          event_type: eventType,
          notes,
          status: 'draft',
          total,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (quoteError) {
      setError(quoteError.message);
      setSaving(false);
      return;
    }

    const itemsToInsert = quoteItems.map((item) => ({
      quote_id: quoteData.id,
      product_id: item.id,
      product_name: item.name,
      unit_price: item.price ?? 0,
      quantity: item.quantity,
      subtotal: Number(item.price ?? 0) * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from('quote_items')
      .insert(itemsToInsert);

    if (itemsError) {
      setError(itemsError.message);
      setSaving(false);
      return;
    }

    try {
      await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quote_created',
          quoteId: quoteData.id,
          customerName,
          customerEmail,
          eventType,
          notes,
          total,
          items: quoteItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price ?? 0,
            subtotal: Number(item.price ?? 0) * item.quantity,
          })),
        }),
      });
    } catch {
      // no bloqueamos al usuario si el correo falla
    }

    setSuccessMessage(
      `Tu cotización fue enviada correctamente. ID: ${quoteData.id}`
    );

    setQuoteItems([]);
    setCustomerName('');
    setEventType('');
    setNotes('');
    setSaving(false);

    setTimeout(() => {
      router.push('/my-quotes');
    }, 900);
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/book-meeting" ctaLabel="Hablar con nosotros" />

        <section style={heroCardStyle}>
          <p style={eyebrowStyle}>Cotizar</p>
          <h1 style={heroTitleStyle}>Arma tu cotización</h1>
          <p style={heroTextStyle}>
            Selecciona los servicios que necesitas, cuéntanos sobre tu evento y
            envíanos la solicitud para revisarla con claridad.
          </p>
        </section>

        {!isLoggedIn && (
          <section style={sessionBoxStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Tu cuenta</p>
              <h2 style={sessionTitleStyle}>Inicia sesión para cotizar</h2>
              <p style={sessionTextStyle}>
                Para guardar tu cotización y darle seguimiento necesitas entrar
                con tu cuenta.
              </p>
            </div>

            <Link href="/login" style={primaryLinkButtonStyle}>
              Iniciar sesión
            </Link>
          </section>
        )}

        {isLoggedIn && sessionEmail && (
          <section style={sessionBoxStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Sesión activa</p>
              <h2 style={sessionTitleStyle}>Cotizando como cliente</h2>
              <p style={sessionTextStyle}>
                Entraste como {sessionEmail}. Esta cotización quedará vinculada
                a tu cuenta.
              </p>
            </div>
          </section>
        )}

        {error && <div style={errorBoxStyle}>{error}</div>}
        {successMessage && <div style={successBoxStyle}>{successMessage}</div>}

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Servicios</p>
              <h2 style={sectionTitleStyle}>Selecciona lo que necesitas</h2>
              <p style={sectionTextStyle}>
                Agrega servicios a tu cotización y ajusta las cantidades antes
                de enviarla.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={panelStyle}>
              <p style={mutedTextStyle}>Cargando servicios...</p>
            </div>
          ) : products.length === 0 ? (
            <div style={panelStyle}>
              <p style={mutedTextStyle}>Todavía no hay servicios disponibles.</p>
            </div>
          ) : (
            <div style={productGridStyle}>
              {products.map((product) => (
                <article key={product.id} style={productCardStyle}>
                  <div>
                    <span style={categoryBadgeStyle}>
                      {product.category || 'General'}
                    </span>
                    <h3 style={productNameStyle}>{product.name}</h3>
                    <p style={productDescriptionStyle}>
                      {product.description || 'Servicio disponible para cotización.'}
                    </p>
                  </div>

                  <div style={productFooterStyle}>
                    <div>
                      <p style={priceLabelStyle}>Desde</p>
                      <p style={priceStyle}>{formatMoney(product.price)}</p>
                    </div>
                    <button
                      onClick={() => addToQuote(product)}
                      style={primaryButtonStyle}
                    >
                      Agregar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div style={twoColumnLayoutStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <p style={sectionEyebrowStyle}>Datos del cliente</p>
                <h2 style={panelTitleStyle}>Cuéntanos sobre tu evento</h2>
                <p style={panelTextStyle}>
                  Completa tus datos para revisar tu solicitud y responderte con claridad.
                </p>
              </div>
            </div>

            <div style={formGridStyle}>
              <div>
                <label style={labelStyle}>Nombre</label>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  placeholder="Tu email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Tipo de evento</label>
                <input
                  type="text"
                  placeholder="Boda, concierto, corporativo, DJ set, cumpleaños..."
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Notas adicionales</label>
                <textarea
                  placeholder="Fecha, lugar, duración, montaje, luces, sonido, pantalla o cualquier detalle importante"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={textareaStyle}
                />
              </div>
            </div>
          </section>

          <section style={quotePanelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <p style={sectionEyebrowStyle}>Mi cotización</p>
                <h2 style={panelTitleStyle}>Resumen de tu selección</h2>
                <p style={panelTextStyle}>
                  Revisa tu selección antes de enviarla.
                </p>
              </div>
            </div>

            {quoteItems.length === 0 ? (
              <div style={emptyStateStyle}>
                <p style={emptyTitleStyle}>Todavía no has agregado servicios</p>
                <p style={emptyTextStyle}>
                  Empieza eligiendo servicios para construir tu cotización.
                </p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {quoteItems.map((item) => (
                  <div key={item.id} style={quoteItemCardStyle}>
                    <div style={quoteItemHeaderStyle}>
                      <div>
                        <p style={quoteItemNameStyle}>{item.name}</p>
                        <p style={quoteItemMetaStyle}>
                          Unitario: {formatMoney(item.price)}
                        </p>
                      </div>

                      <div style={quoteItemActionsStyle}>
                        <button
                          onClick={() => decreaseQuantity(item.id)}
                          style={qtyButtonStyle}
                        >
                          −
                        </button>
                        <span style={qtyValueStyle}>{item.quantity}</span>
                        <button
                          onClick={() => increaseQuantity(item.id)}
                          style={qtyButtonStyle}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <p style={quoteSubtotalStyle}>
                      Subtotal: {formatMoney(Number(item.price ?? 0) * item.quantity)}
                    </p>
                  </div>
                ))}

                <div style={quoteSummaryBoxStyle}>
                  <div style={quoteSummaryRowStyle}>
                    <span>Total de items</span>
                    <strong>{itemCount}</strong>
                  </div>
                  <div style={quoteSummaryRowStyle}>
                    <span>Subtotal sin ITBIS</span>
                    <strong>{formatMoney(total)}</strong>
                  </div>
                  <div style={quoteSummaryRowStyle}>
                    <span>ITBIS 18%</span>
                    <strong>{formatMoney(calculateItbis(total))}</strong>
                  </div>
                  <div style={quoteSummaryRowStyle}>
                    <span>Total con ITBIS</span>
                    <strong>{formatMoney(calculateTotalWithItbis(total))}</strong>
                  </div>
                </div>

                {!isLoggedIn ? (
                  <Link
                    href="/login"
                    style={{
                      ...primaryLinkButtonStyle,
                      width: '100%',
                      justifyContent: 'center',
                    }}
                  >
                    Inicia sesión para guardar tu cotización
                  </Link>
                ) : (
                  <button
                    onClick={saveQuote}
                    disabled={saving}
                    style={{
                      ...primaryButtonStyle,
                      width: '100%',
                      justifyContent: 'center',
                      opacity: saving ? 0.72 : 1,
                      cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {saving ? 'Enviando...' : 'Enviar cotización'}
                  </button>
                )}
              </div>
            )}
          </section>
        </div>
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
  fontSize: 14,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '12px 0 10px',
  fontSize: 48,
  lineHeight: 1.04,
  letterSpacing: '-0.04em',
  textShadow: '0 18px 60px rgba(0,0,0,0.42)',
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#9fb1c8',
  fontSize: 17,
  lineHeight: 1.65,
  maxWidth: 760,
};

const sectionStyle: React.CSSProperties = {
  marginTop: 32,
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: 16,
};

const sectionEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '8px 0 8px',
  fontSize: 32,
  letterSpacing: '-0.02em',
};

const sectionTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.6,
};

const sessionBoxStyle: React.CSSProperties = {
  marginTop: 24,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.82) 0%, rgba(30,27,75,0.38) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
};

const sessionTitleStyle: React.CSSProperties = {
  margin: '8px 0 8px',
  fontSize: 30,
};

const sessionTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  maxWidth: 760,
  lineHeight: 1.6,
};

const primaryLinkButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  boxShadow: '0 18px 34px rgba(236,72,153,0.26)',
};

const panelStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 26,
  padding: 22,
  boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
};

const quotePanelStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.88) 0%, rgba(30,27,75,0.46) 52%, rgba(7,12,24,0.92) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 26,
  padding: 22,
  boxShadow: '0 22px 44px rgba(0,0,0,0.26)',
};

const panelHeaderStyle: React.CSSProperties = {
  marginBottom: 16,
};

const panelTitleStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 25,
};

const panelTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.6,
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
};

const productGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 16,
};

const productCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(30,27,75,0.42) 52%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 22,
  padding: 18,
  boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: 230,
};

const categoryBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: '999px',
  background: 'rgba(245, 158, 11, 0.12)',
  color: '#fbbf24',
  border: '1px solid rgba(250, 204, 21, 0.24)',
  fontSize: 12,
  fontWeight: 900,
};

const productNameStyle: React.CSSProperties = {
  margin: '14px 0 8px',
  fontSize: 21,
};

const productDescriptionStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.55,
};

const productFooterStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-end',
  gap: 12,
  marginTop: 20,
};

const priceLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const priceStyle: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: 24,
  fontWeight: 900,
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  border: 'none',
  borderRadius: 14,
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 18px 34px rgba(236,72,153,0.24)',
};

const twoColumnLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: 20,
  marginTop: 32,
};

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 7,
  color: '#a5b4c7',
  fontSize: 13,
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: 14,
  border: '1px solid rgba(250, 204, 21, 0.14)',
  background: 'rgba(2, 6, 23, 0.68)',
  color: '#f8fafc',
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 120,
  resize: 'vertical',
};

const emptyStateStyle: React.CSSProperties = {
  padding: '22px 18px',
  borderRadius: 18,
  background: 'rgba(2, 6, 23, 0.42)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 800,
  fontSize: 18,
};

const emptyTextStyle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#94a3b8',
  lineHeight: 1.55,
};

const quoteItemCardStyle: React.CSSProperties = {
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 18,
  padding: 14,
  background: 'rgba(2, 6, 23, 0.42)',
};

const quoteItemHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 12,
};

const quoteItemNameStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 800,
  fontSize: 16,
};

const quoteItemMetaStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#94a3b8',
};

const quoteItemActionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const qtyButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: '1px solid rgba(250, 204, 21, 0.18)',
  background: 'rgba(15, 23, 42, 0.86)',
  color: '#f8fafc',
  fontWeight: 900,
  cursor: 'pointer',
};

const qtyValueStyle: React.CSSProperties = {
  minWidth: 22,
  textAlign: 'center',
  fontWeight: 800,
};

const quoteSubtotalStyle: React.CSSProperties = {
  margin: '12px 0 0',
  fontWeight: 700,
  color: '#dbe7f5',
};

const quoteSummaryBoxStyle: React.CSSProperties = {
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 18,
  padding: 16,
  background:
    'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(168,85,247,0.12) 48%, rgba(2,6,23,0.38) 100%)',
};

const quoteSummaryRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  marginBottom: 8,
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
};

const successBoxStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(20, 83, 45, 0.35)',
  border: '1px solid rgba(74, 222, 128, 0.28)',
  color: '#bbf7d0',
};