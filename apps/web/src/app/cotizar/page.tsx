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

function calculateTechnicalSupport(value: number | null | undefined) {
  const subtotal = Number(value ?? 0);

  if (subtotal >= 120001) return 35000;
  if (subtotal >= 85000) return 25000;
  if (subtotal >= 35000) return 15000;
  if (subtotal >= 1000) return 5000;

  return 0;
}

function calculateTaxableBase(value: number | null | undefined) {
  const subtotal = Number(value ?? 0);
  return subtotal + calculateTechnicalSupport(subtotal);
}

function calculateItbis(value: number | null | undefined) {
  return calculateTaxableBase(value) * 0.18;
}

function calculateTotalWithItbis(value: number | null | undefined) {
  return calculateTaxableBase(value) * 1.18;
}

export default function CotizarPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
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
        .order('category', { ascending: true })
        .order('price', { ascending: true });

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

  const productsByCategory = useMemo(() => {
    return products.reduce<Record<string, Product[]>>((accumulator, product) => {
      const category = product.category || 'General';

      if (!accumulator[category]) {
        accumulator[category] = [];
      }

      accumulator[category].push(product);
      return accumulator;
    }, {});
  }, [products]);

  const productCategories = useMemo(
    () => Object.keys(productsByCategory),
    [productsByCategory]
  );

  useEffect(() => {
    if (productCategories.length === 0) return;

    setExpandedCategories((prev) => {
      if (Object.keys(prev).length > 0) return prev;

      return {
        [productCategories[0]]: true,
      };
    });
  }, [productCategories]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

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
      // No bloqueamos al usuario si el correo falla.
    }

    setSuccessMessage(`Tu cotización fue enviada correctamente. ID: ${quoteData.id}`);

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
            Selecciona servicios por categoría y envíanos los detalles de tu evento.
          </p>
        </section>

        {!isLoggedIn && (
          <section style={sessionBoxStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Tu cuenta</p>
              <h2 style={sessionTitleStyle}>Inicia sesión para cotizar</h2>
              <p style={sessionTextStyle}>
                Para guardar tu cotización y darle seguimiento necesitas entrar con tu cuenta.
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
                Entraste como {sessionEmail}. Esta cotización quedará vinculada a tu cuenta.
              </p>
            </div>
          </section>
        )}

        {error && <div style={errorBoxStyle}>{error}</div>}
        {successMessage && <div style={successBoxStyle}>{successMessage}</div>}

        <div style={mainGridStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <p style={sectionEyebrowStyle}>Servicios</p>
              <h2 style={panelTitleStyle}>Selecciona lo que necesitas</h2>
              <p style={panelTextStyle}>
                Abre una categoría, agrega servicios y ajusta cantidades en el resumen.
              </p>
            </div>

            {loading ? (
              <div style={softBoxStyle}>
                <p style={mutedTextStyle}>Cargando servicios...</p>
              </div>
            ) : products.length === 0 ? (
              <div style={softBoxStyle}>
                <p style={mutedTextStyle}>Todavía no hay servicios disponibles.</p>
              </div>
            ) : (
              <div style={categoryListStyle}>
                {productCategories.map((category) => {
                  const isOpen = !!expandedCategories[category];
                  const categoryProducts = productsByCategory[category] || [];

                  return (
                    <section key={category} style={categorySectionStyle}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        style={categoryHeaderStyle}
                      >
                        <div>
                          <h3 style={categoryTitleStyle}>{category}</h3>
                          <p style={categoryCountStyle}>
                            {categoryProducts.length} servicio{categoryProducts.length === 1 ? '' : 's'}
                          </p>
                        </div>

                        <span style={categoryChevronStyle}>{isOpen ? '−' : '+'}</span>
                      </button>

                      {isOpen && (
                        <div style={productListStyle}>
                          {categoryProducts.map((product) => (
                            <article key={product.id} style={productCardStyle}>
                              <div>
                                <h4 style={productNameStyle}>{product.name}</h4>
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
                                  type="button"
                                  onClick={() => addToQuote(product)}
                                  style={smallButtonStyle}
                                >
                                  Agregar
                                </button>
                              </div>
                            </article>
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </section>

          <aside style={quotePanelStyle}>
            <div style={panelHeaderStyle}>
              <p style={sectionEyebrowStyle}>Mi cotización</p>
              <h2 style={panelTitleStyle}>Resumen</h2>
              <p style={panelTextStyle}>Revisa tu selección antes de enviarla.</p>
            </div>

            {quoteItems.length === 0 ? (
              <div style={emptyStateStyle}>
                <p style={emptyTitleStyle}>No has agregado servicios</p>
                <p style={emptyTextStyle}>Elige una categoría y agrega servicios.</p>
              </div>
            ) : (
              <div style={quoteStackStyle}>
                {quoteItems.map((item) => (
                  <div key={item.id} style={quoteItemCardStyle}>
                    <div style={quoteItemHeaderStyle}>
                      <div>
                        <p style={quoteItemNameStyle}>{item.name}</p>
                        <p style={quoteItemMetaStyle}>
                          {formatMoney(item.price)} por unidad
                        </p>
                      </div>

                      <div style={quoteItemActionsStyle}>
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.id)}
                          style={qtyButtonStyle}
                        >
                          −
                        </button>
                        <span style={qtyValueStyle}>{item.quantity}</span>
                        <button
                          type="button"
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
                    <span>Soporte técnico</span>
                    <strong>{formatMoney(calculateTechnicalSupport(total))}</strong>
                  </div>
                  <div style={quoteSummaryRowStyle}>
                    <span>Base para ITBIS</span>
                    <strong>{formatMoney(calculateTaxableBase(total))}</strong>
                  </div>
                  <div style={quoteSummaryRowStyle}>
                    <span>ITBIS 18%</span>
                    <strong>{formatMoney(calculateItbis(total))}</strong>
                  </div>
                  <div style={quoteSummaryTotalRowStyle}>
                    <span>Total con ITBIS</span>
                    <strong>{formatMoney(calculateTotalWithItbis(total))}</strong>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>

        <section style={panelStyle}>
          <div style={panelHeaderStyle}>
            <p style={sectionEyebrowStyle}>Datos del cliente</p>
            <h2 style={panelTitleStyle}>Cuéntanos sobre tu evento</h2>
            <p style={panelTextStyle}>
              Completa estos datos para poder revisar tu solicitud correctamente.
            </p>
          </div>

          <div style={formGridStyle}>
            <div>
              <label style={labelStyle}>Nombre</label>
              <input
                type="text"
                placeholder="Tu nombre"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email"
                placeholder="Tu email"
                value={customerEmail}
                onChange={(event) => setCustomerEmail(event.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Tipo de evento</label>
              <input
                type="text"
                placeholder="Boda, concierto, corporativo, DJ set, cumpleaños..."
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Notas adicionales</label>
              <textarea
                placeholder="Fecha, lugar, duración, montaje, luces, sonido, pantalla o cualquier detalle importante"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                style={textareaStyle}
              />
            </div>
          </div>

          <div style={submitWrapStyle}>
            {!isLoggedIn ? (
              <Link href="/login" style={primaryLinkButtonStyle}>
                Inicia sesión para guardar tu cotización
              </Link>
            ) : (
              <button
                type="button"
                onClick={saveQuote}
                disabled={saving}
                style={{
                  ...primaryButtonStyle,
                  opacity: saving ? 0.72 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Enviando...' : 'Enviar cotización'}
              </button>
            )}
          </div>
        </section>
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
  maxWidth: 1080,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
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

const sessionBoxStyle: React.CSSProperties = {
  marginTop: 12,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 20,
  padding: 16,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
};

const sectionEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 900,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  fontSize: 11,
};

const sessionTitleStyle: React.CSSProperties = {
  margin: '6px 0 5px',
  fontSize: 20,
};

const sessionTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.5,
  fontSize: 13,
};

const mainGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 360px',
  gap: 14,
  marginTop: 14,
  alignItems: 'start',
};

const panelStyle: React.CSSProperties = {
  marginTop: 14,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.13)',
  borderRadius: 22,
  padding: 16,
  boxShadow: '0 14px 26px rgba(0,0,0,0.20)',
};

const quotePanelStyle: React.CSSProperties = {
  position: 'sticky',
  top: 116,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.90) 0%, rgba(30,27,75,0.42) 52%, rgba(7,12,24,0.96) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 22,
  padding: 16,
  boxShadow: '0 14px 30px rgba(0,0,0,0.24)',
};

const panelHeaderStyle: React.CSSProperties = {
  marginBottom: 12,
};

const panelTitleStyle: React.CSSProperties = {
  margin: '6px 0 5px',
  fontSize: 22,
};

const panelTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.5,
  fontSize: 13,
};

const softBoxStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: 'rgba(2, 6, 23, 0.38)',
  border: '1px solid rgba(250, 204, 21, 0.11)',
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
};

const categoryListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const categorySectionStyle: React.CSSProperties = {
  overflow: 'hidden',
  borderRadius: 18,
  background: 'rgba(2, 6, 23, 0.34)',
  border: '1px solid rgba(250, 204, 21, 0.12)',
};

const categoryHeaderStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 58,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 14px',
  border: 'none',
  background: 'rgba(15,23,42,0.62)',
  color: '#f8fafc',
  cursor: 'pointer',
  textAlign: 'left',
};

const categoryTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 17,
};

const categoryCountStyle: React.CSSProperties = {
  margin: '3px 0 0',
  color: '#94a3b8',
  fontSize: 12,
  fontWeight: 700,
};

const categoryChevronStyle: React.CSSProperties = {
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

const productListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: 10,
};

const productCardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  gap: 12,
  alignItems: 'center',
  padding: 12,
  borderRadius: 16,
  background: 'rgba(15,23,42,0.64)',
  border: '1px solid rgba(148,163,184,0.10)',
};

const productNameStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
};

const productDescriptionStyle: React.CSSProperties = {
  margin: '5px 0 0',
  color: '#94a3b8',
  fontSize: 12,
  lineHeight: 1.4,
};

const productFooterStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
};

const priceLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 10,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontWeight: 900,
};

const priceStyle: React.CSSProperties = {
  margin: '3px 0 0',
  fontSize: 16,
  fontWeight: 900,
  whiteSpace: 'nowrap',
};

const smallButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '9px 12px',
  border: 'none',
  borderRadius: 12,
  background: '#f97316',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
};

const quoteStackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const quoteItemCardStyle: React.CSSProperties = {
  border: '1px solid rgba(250, 204, 21, 0.12)',
  borderRadius: 16,
  padding: 12,
  background: 'rgba(2, 6, 23, 0.38)',
};

const quoteItemHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 10,
};

const quoteItemNameStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 900,
  fontSize: 14,
};

const quoteItemMetaStyle: React.CSSProperties = {
  margin: '5px 0 0',
  color: '#94a3b8',
  fontSize: 12,
};

const quoteItemActionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
};

const qtyButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 10,
  border: '1px solid rgba(250, 204, 21, 0.18)',
  background: 'rgba(15, 23, 42, 0.86)',
  color: '#f8fafc',
  fontWeight: 900,
  cursor: 'pointer',
};

const qtyValueStyle: React.CSSProperties = {
  minWidth: 20,
  textAlign: 'center',
  fontWeight: 900,
};

const quoteSubtotalStyle: React.CSSProperties = {
  margin: '10px 0 0',
  fontWeight: 800,
  color: '#dbe7f5',
  fontSize: 13,
};

const quoteSummaryBoxStyle: React.CSSProperties = {
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 18,
  padding: 14,
  background:
    'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(168,85,247,0.10) 48%, rgba(2,6,23,0.38) 100%)',
};

const quoteSummaryRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 8,
  color: '#cbd5e1',
  fontSize: 13,
};

const quoteSummaryTotalRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  paddingTop: 10,
  marginTop: 8,
  borderTop: '1px solid rgba(250,204,21,0.18)',
  color: '#fde68a',
  fontSize: 16,
};

const emptyStateStyle: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: 'rgba(2, 6, 23, 0.38)',
  border: '1px solid rgba(250, 204, 21, 0.11)',
};

const emptyTitleStyle: React.CSSProperties = {
  margin: 0,
  fontWeight: 900,
  fontSize: 15,
};

const emptyTextStyle: React.CSSProperties = {
  margin: '6px 0 0',
  color: '#94a3b8',
  lineHeight: 1.45,
  fontSize: 13,
};

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 12,
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#a5b4c7',
  fontSize: 12,
  fontWeight: 800,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 13px',
  borderRadius: 13,
  border: '1px solid rgba(250, 204, 21, 0.13)',
  background: 'rgba(2, 6, 23, 0.58)',
  color: '#f8fafc',
  outline: 'none',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 110,
  resize: 'vertical',
};

const submitWrapStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: 14,
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 15px',
  border: 'none',
  borderRadius: 14,
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 14px 26px rgba(236,72,153,0.20)',
};

const primaryLinkButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  textDecoration: 'none',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '13px 15px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
  fontWeight: 800,
};

const successBoxStyle: React.CSSProperties = {
  marginTop: 12,
  padding: '13px 15px',
  borderRadius: 14,
  background: 'rgba(20, 83, 45, 0.35)',
  border: '1px solid rgba(74, 222, 128, 0.28)',
  color: '#bbf7d0',
  fontWeight: 800,
};
