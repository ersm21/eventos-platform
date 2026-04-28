'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase/client';
import AppNavbar from '../components/AppNavbar';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_active: boolean;
};

type QuoteItem = Product & {
  quantity: number;
};

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

export default function Home() {
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
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setProducts((data as Product[]) || []);
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
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      setSessionEmail(session?.user?.email ?? null);
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
        (sum, item) => sum + Number(item.price) * item.quantity,
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
      setError('No hay productos en la cotización.');
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
      unit_price: item.price,
      quantity: item.quantity,
      subtotal: Number(item.price) * item.quantity,
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
            unitPrice: item.price,
            subtotal: Number(item.price) * item.quantity,
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
    setCustomerEmail('');
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
        <AppNavbar ctaHref="#cotizar" ctaLabel="Cotizar ahora" />

        <section style={heroShellStyle}>
          <div style={heroGlowStyle} />
          <div style={heroGridStyle}>
            <div style={heroContentStyle}>
              <p style={brandHeroLabelStyle}>SM Events</p>
              <h1 style={heroTitleStyle}>
                Luces, sonido, pantallas LED, tarimas y producción para tu evento
              </h1>
              <p style={heroTextStyle}>
                Cotiza los servicios de SM Events, arma tu selección, solicita
                reuniones y da seguimiento a cada detalle desde tu cuenta.
              </p>

              <div style={heroButtonsStyle}>
                <a href="#catalogo" style={primaryHeroButtonStyle}>
                  Explorar catálogo
                </a>
                <Link href="/book-meeting" style={secondaryHeroButtonStyle}>
                  Solicitar reunión
                </Link>
              </div>

              <div style={heroTrustRowStyle}>
                <span style={miniBadgeStyle}>Luces y sonido</span>
                <span style={miniBadgeStyle}>Pantallas LED</span>
                <span style={miniBadgeStyle}>Tarimas y producción</span>
              </div>
            </div>

            <div style={heroStatsWrapStyle}>
              <div style={heroStatsRowStyle}>
                <div style={heroStatCardStyle}>
                  <p style={heroStatLabelStyle}>Productos activos</p>
                  <p style={heroStatValueStyle}>{products.length}</p>
                </div>
                <div style={heroStatCardStyle}>
                  <p style={heroStatLabelStyle}>Items en tu cotización</p>
                  <p style={heroStatValueStyle}>{itemCount}</p>
                </div>
                <div style={heroStatCardStyle}>
                  <p style={heroStatLabelStyle}>Total estimado</p>
                  <p style={heroStatValueStyle}>{formatMoney(total)}</p>
                </div>
              </div>

              <div style={highlightCardStyle}>
                <p style={highlightEyebrowStyle}>SM Events</p>
                <h3 style={highlightTitleStyle}>Tu evento organizado desde el primer contacto</h3>
                <p style={highlightTextStyle}>
                  Inicia sesión para ver tus cotizaciones, tus reuniones y cada
                  actualización importante de tu evento en un solo lugar.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section style={sessionBoxStyle}>
          {!isLoggedIn ? (
            <div style={sessionInnerStyle}>
              <div>
                <p style={sectionEyebrowStyle}>Tu cuenta</p>
                <h2 style={sessionTitleStyle}>Inicia sesión para guardar mejor</h2>
                <p style={sessionTextStyle}>
                  Guarda tus cotizaciones con tu usuario y vuelve cuando quieras
                  para revisarlas, confirmar reuniones y recibir actualizaciones.
                </p>
              </div>

              <Link href="/login" style={primaryLinkButtonStyle}>
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <div style={sessionInnerStyle}>
              <div>
                <p style={sectionEyebrowStyle}>Tu cuenta</p>
                <h2 style={sessionTitleStyle}>Tu sesión está activa</h2>
                <p style={sessionTextStyle}>
                  {sessionEmail
                    ? `Entraste como ${sessionEmail}. Todo lo que hagas aquí quedará vinculado a tu cuenta.`
                    : 'Tu cuenta está activa. Ya puedes guardar cotizaciones en tu perfil.'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/my-quotes" style={primaryLinkButtonStyle}>
                  Mis cotizaciones
                </Link>
                <Link href="/account" style={secondaryLinkButtonStyle}>
                  Mi cuenta
                </Link>
              </div>
            </div>
          )}
        </section>

        <section style={quickAccessStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Accesos rápidos</p>
              <h2 style={sectionTitleStyle}>Gestiona tu evento con SM Events</h2>
              <p style={sectionTextStyle}>
                Cotizaciones, reuniones, cuenta y seguimiento en un solo lugar.
              </p>
            </div>
          </div>

          <div style={quickGridStyle}>
            <Link href="/my-quotes" style={quickCardStyle}>
              <p style={quickCardEyebrowStyle}>Cliente</p>
              <h3 style={quickCardTitleStyle}>Mis cotizaciones</h3>
              <p style={quickCardTextStyle}>
                Revisa estados, totales, depósitos y cada cotización enviada.
              </p>
            </Link>

            <Link href="/my-meetings" style={quickCardStyle}>
              <p style={quickCardEyebrowStyle}>Cliente</p>
              <h3 style={quickCardTitleStyle}>Mis reuniones</h3>
              <p style={quickCardTextStyle}>
                Mira el estado de tus reuniones y sus cambios importantes.
              </p>
            </Link>

            <Link href="/book-meeting" style={quickCardStyle}>
              <p style={quickCardEyebrowStyle}>Agenda</p>
              <h3 style={quickCardTitleStyle}>Solicitar reunión</h3>
              <p style={quickCardTextStyle}>
                Reserva un horario disponible para hablar sobre tu evento.
              </p>
            </Link>

            <Link href="/account" style={quickCardStyle}>
              <p style={quickCardEyebrowStyle}>Cuenta</p>
              <h3 style={quickCardTitleStyle}>Mi cuenta</h3>
              <p style={quickCardTextStyle}>
                Gestiona tu sesión y entra al panel personal del cliente.
              </p>
            </Link>
          </div>
        </section>

        {error && <div style={errorBoxStyle}>{error}</div>}
        {successMessage && <div style={successBoxStyle}>{successMessage}</div>}

        <section id="catalogo" style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Catálogo</p>
              <h2 style={sectionTitleStyle}>Equipos y servicios de SM Events</h2>
              <p style={sectionTextStyle}>
                Selecciona luces, sonido, pantallas LED, tarimas y producción
                para bodas, conciertos, eventos corporativos y montajes privados.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={panelStyle}>
              <p style={{ margin: 0, color: '#94a3b8' }}>Cargando productos...</p>
            </div>
          ) : (
            <div style={productGridStyle}>
              {products.map((product) => (
                <article key={product.id} style={productCardStyle}>
                  <div style={productCardTopStyle}>
                    <span style={categoryBadgeStyle}>
                      {product.category || 'general'}
                    </span>
                  </div>

                  <div>
                    <h3 style={productNameStyle}>{product.name}</h3>
                    <p style={productDescriptionStyle}>{product.description}</p>
                  </div>

                  <div style={productFooterStyle}>
                    <div>
                      <p style={productPriceLabelStyle}>Desde</p>
                      <p style={productPriceStyle}>{formatMoney(product.price)}</p>
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

        <div id="cotizar" style={twoColumnLayoutStyle}>
          <section style={panelStyle}>
            <div style={panelHeaderStyle}>
              <div>
                <p style={sectionEyebrowStyle}>Datos del cliente</p>
                <h2 style={panelTitleStyle}>Cotiza tu evento con SM Events</h2>
                <p style={panelTextStyle}>
                  Completa tus datos para enviarnos una solicitud clara y más fácil
                  de revisar por nuestro equipo.
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
                <p style={emptyTitleStyle}>Todavía no has agregado productos</p>
                <p style={emptyTextStyle}>
                  Empieza eligiendo servicios de SM Events para construir tu
                  cotización.
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
                      Subtotal: {formatMoney(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                ))}

                <div style={quoteSummaryBoxStyle}>
                  <div style={quoteSummaryRowStyle}>
                    <span>Total de items</span>
                    <strong>{itemCount}</strong>
                  </div>
                  <div style={quoteSummaryRowStyle}>
                    <span>Total estimado</span>
                    <strong>{formatMoney(total)}</strong>
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
  color: '#e5e7eb',
  padding: '34px 20px 80px',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
};

const heroShellStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.90) 0%, rgba(17,24,39,0.82) 55%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 30,
  padding: 30,
  boxShadow: '0 24px 60px rgba(0,0,0,0.24)',
};

const heroGlowStyle: React.CSSProperties = {
  position: 'absolute',
  top: -40,
  right: -40,
  width: 240,
  height: 240,
  borderRadius: '999px',
  background: 'radial-gradient(circle, rgba(37,99,235,0.22), transparent 70%)',
  pointerEvents: 'none',
};

const heroGridStyle: React.CSSProperties = {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: '1.2fr 0.9fr',
  gap: 22,
  alignItems: 'stretch',
};

const heroContentStyle: React.CSSProperties = {
  maxWidth: 760,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#60a5fa',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const brandHeroLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#93c5fd',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: 18,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '14px 0 14px',
  fontSize: 52,
  lineHeight: 1.02,
  letterSpacing: '-0.03em',
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#9fb1c8',
  fontSize: 17,
  lineHeight: 1.65,
  maxWidth: 700,
};

const heroButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  marginTop: 24,
};

const primaryHeroButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '13px 18px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  color: '#fff',
  fontWeight: 800,
  boxShadow: '0 16px 28px rgba(37,99,235,0.24)',
};

const secondaryHeroButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '13px 18px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'rgba(2, 6, 23, 0.42)',
  color: '#e5e7eb',
  fontWeight: 800,
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const heroTrustRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 20,
};

const miniBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '7px 10px',
  borderRadius: 999,
  background: 'rgba(148, 163, 184, 0.08)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  color: '#cbd5e1',
  fontSize: 12,
  fontWeight: 700,
};

const heroStatsWrapStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
};

const heroStatsRowStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 14,
};

const heroStatCardStyle: React.CSSProperties = {
  background: 'rgba(2, 6, 23, 0.38)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: 20,
  padding: 18,
  boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
};

const heroStatLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 13,
};

const heroStatValueStyle: React.CSSProperties = {
  margin: '10px 0 0',
  fontSize: 30,
  fontWeight: 900,
};

const highlightCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(37,99,235,0.14) 0%, rgba(2,6,23,0.34) 100%)',
  border: '1px solid rgba(96, 165, 250, 0.18)',
  borderRadius: 22,
  padding: 18,
};

const highlightEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#93c5fd',
  fontSize: 12,
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const highlightTitleStyle: React.CSSProperties = {
  margin: '10px 0 8px',
  fontSize: 22,
};

const highlightTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#bfd0e5',
  lineHeight: 1.55,
};

const sessionBoxStyle: React.CSSProperties = {
  marginTop: 24,
  background: 'rgba(15, 23, 42, 0.8)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
};

const sessionInnerStyle: React.CSSProperties = {
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
  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  color: '#fff',
  fontWeight: 800,
  boxShadow: '0 14px 24px rgba(37,99,235,0.22)',
};

const secondaryLinkButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 14,
  textDecoration: 'none',
  background: '#0f172a',
  color: '#e5e7eb',
  fontWeight: 700,
  border: '1px solid rgba(148, 163, 184, 0.18)',
};

const quickAccessStyle: React.CSSProperties = {
  marginTop: 30,
};

const quickGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
};

const quickCardStyle: React.CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(9,14,28,0.82) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 22,
  padding: 20,
  boxShadow: '0 14px 30px rgba(0,0,0,0.16)',
  color: '#e5e7eb',
  minHeight: 180,
};

const quickCardEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#60a5fa',
  fontWeight: 800,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const quickCardTitleStyle: React.CSSProperties = {
  margin: '10px 0 10px',
  fontSize: 22,
};

const quickCardTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.55,
};

const sectionStyle: React.CSSProperties = {
  marginTop: 32,
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: 16,
};

const sectionEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#60a5fa',
  fontWeight: 800,
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

const panelStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.82)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 26,
  padding: 22,
  boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
};

const quotePanelStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.88) 0%, rgba(7,12,24,0.9) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 26,
  padding: 22,
  boxShadow: '0 22px 44px rgba(0,0,0,0.22)',
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

const productGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: 16,
};

const productCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(9,14,28,0.9) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 22,
  padding: 18,
  boxShadow: '0 14px 30px rgba(0,0,0,0.16)',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: 230,
};

const productCardTopStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const categoryBadgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px 10px',
  borderRadius: '999px',
  background: 'rgba(59, 130, 246, 0.14)',
  color: '#93c5fd',
  border: '1px solid rgba(59, 130, 246, 0.26)',
  fontSize: 12,
  fontWeight: 800,
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

const productPriceLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#64748b',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const productPriceStyle: React.CSSProperties = {
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
  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: '0 14px 24px rgba(37,99,235,0.22)',
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
  border: '1px solid rgba(148, 163, 184, 0.16)',
  background: '#0b1220',
  color: '#e5e7eb',
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
  background: 'rgba(2, 6, 23, 0.36)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
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
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: 18,
  padding: 14,
  background: 'rgba(2, 6, 23, 0.36)',
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
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: '#0f172a',
  color: '#e5e7eb',
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
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: 18,
  padding: 16,
  background:
    'linear-gradient(180deg, rgba(37,99,235,0.10) 0%, rgba(2,6,23,0.34) 100%)',
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