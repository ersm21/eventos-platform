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
  image_url: string | null;
};

type QuoteItem = Product & {
  quantity: number;
};

function getCategoryElementId(category: string) {
  return `quote-category-${category
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`;
}

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

export default function CotizarPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [isMobileQuote, setIsMobileQuote] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
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

  useEffect(() => {
    const fromCatalog = new URLSearchParams(window.location.search).get('from') === 'catalogo';
    if (!fromCatalog) return;

    const savedCart = window.localStorage.getItem('sm-events-catalog-cart');
    if (!savedCart) return;

    try {
      type CatalogCartPayloadItem = Partial<Product> & {
        product?: Partial<Product>;
        product_id?: string;
        productId?: string;
        title?: string;
        unit_price?: number | string | null;
        unitPrice?: number | string | null;
        base_price?: number | string | null;
        pricePerUnit?: number | string | null;
        imageUrl?: string | null;
        quantity?: number | string | null;
      };

      const parsedCart = JSON.parse(savedCart) as CatalogCartPayloadItem[];

      if (!Array.isArray(parsedCart) || parsedCart.length === 0) return;

      const normalizedItems: QuoteItem[] = parsedCart.map((item, index) => {
        const product = item.product || item;

        const rawPrice =
          product.price ??
          item.price ??
          item.unit_price ??
          item.unitPrice ??
          item.base_price ??
          item.pricePerUnit ??
          0;

        const price = Number(rawPrice ?? 0);
        const quantity = Number(item.quantity || 1);

        return {
          id: String(product.id || item.id || item.product_id || item.productId || `catalog-${index}`),
          name: String(product.name || item.name || item.title || 'Servicio'),
          description: product.description ?? item.description ?? null,
          price: Number.isFinite(price) ? price : 0,
          category: product.category ?? item.category ?? 'General',
          is_active: product.is_active ?? item.is_active ?? true,
          image_url: product.image_url ?? item.image_url ?? item.imageUrl ?? null,
          quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
        };
      });

      setQuoteItems(normalizedItems);
    } catch (error) {
      console.error('No se pudo cargar el carrito del catálogo', error);
    }
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
      };
    });
  }, [productCategories]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const openCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: true,
    }));

    window.setTimeout(() => {
      document
        .getElementById(getCategoryElementId(category))
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
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

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileQuote(window.innerWidth <= 760);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const eventTypeOptions = [
    { value: '', label: 'Selecciona el tipo de evento' },
    { value: 'Boda', label: 'Boda' },
    { value: 'Cumpleaños', label: 'Cumpleaños' },
    { value: 'Quince años', label: 'Quince años' },
    { value: 'Evento corporativo', label: 'Evento corporativo' },
    { value: 'Concierto', label: 'Concierto' },
    { value: 'DJ set', label: 'DJ set' },
    { value: 'Fiesta privada', label: 'Fiesta privada' },
    { value: 'Graduación', label: 'Graduación' },
    { value: 'Bautizo', label: 'Bautizo' },
    { value: 'Actividad escolar', label: 'Actividad escolar' },
    { value: 'Actividad religiosa', label: 'Actividad religiosa' },
    { value: 'Feria / expo', label: 'Feria / expo' },
    { value: 'Otro (agregar en notas)', label: 'Otro (agregar en notas)' },
  ];

  const eventLocationOptions = [
    { label: 'Selecciona una ciudad', value: '' },
    { label: 'Santiago', value: 'Santiago' },
    { label: 'Moca', value: 'Moca' },
    { label: 'La Vega', value: 'La Vega' },
    { label: 'Puerto Plata', value: 'Puerto Plata' },
    { label: 'Mao', value: 'Mao' },
    { label: 'Santo Domingo', value: 'Santo Domingo' },
    { label: 'La Romana', value: 'La Romana' },
    { label: 'Punta Cana', value: 'Punta Cana' },
    { label: 'Bávaro', value: 'Bavaro' },
  ];

  const saveQuote = async () => {
    if (!isLoggedIn) {
      setError('Debes iniciar sesión para guardar tu cotización.');
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

    if (!eventLocation.trim()) {
      setError('Selecciona la ciudad o zona del evento para calcular el transporte.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const quoteCustomerName =
      customerName.trim() || sessionEmail?.split('@')[0] || 'Cliente';
    const quoteCustomerEmail = sessionEmail || customerEmail.trim();

    if (!quoteCustomerEmail) {
      setError('Debes iniciar sesión para enviar una cotización.');
      return;
    }

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
          customer_name: quoteCustomerName,
          customer_email: quoteCustomerEmail,
          event_type: eventType,
          notes: [
            eventLocation.trim() ? `Lugar: ${eventLocation.trim()}` : '',
            notes.trim(),
          ]
            .filter(Boolean)
            .join('\n'),
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
      product_image_url: item.image_url ?? null,
      product_description: item.description ?? null,
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
          customerName: quoteCustomerName,
          customerEmail: quoteCustomerEmail,
          eventType,
          notes: [
            eventLocation.trim() ? `Lugar: ${eventLocation.trim()}` : '',
            notes.trim(),
          ]
            .filter(Boolean)
            .join('\n'),
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
    setCustomerEmail('');
    setEventType('');
    setEventLocation('');
    setNotes('');
    setSaving(false);

    setTimeout(() => {
      router.push('/my-quotes');
    }, 900);
  };

  return (
    <main style={isMobileQuote ? mobilePageStyle : pageStyle}>
      <div style={isMobileQuote ? mobileContainerStyle : containerStyle}>
        {isMobileQuote && (
          <section style={mobileQuoteAppHeaderStyle}>
            <p style={mobileQuoteEyebrowStyle}>SM Events</p>
            <h1 style={mobileQuoteAppTitleStyle}>Cotiza tu evento</h1>
            <p style={mobileQuoteAppTextStyle}>
              Revisa tus servicios, completa los detalles y envía tu solicitud.
            </p>
            <div style={mobileQuoteStepsStyle}>
              <span style={quoteItems.length > 0 ? mobileQuoteStepActiveStyle : mobileQuoteStepStyle}>
                Servicios
              </span>
              <span style={eventLocation && eventType && eventDate ? mobileQuoteStepActiveStyle : mobileQuoteStepStyle}>
                Evento
              </span>
              <span
                style={
                  quoteItems.length > 0 && eventLocation && eventType && eventDate
                    ? mobileQuoteStepActiveStyle
                    : mobileQuoteStepStyle
                }
              >
                Resumen
              </span>
            </div>
          </section>
        )}
        <AppNavbar ctaHref="/book-meeting" ctaLabel="Hablar con nosotros" />



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

        {error && <div style={errorBoxStyle}>{error}</div>}
        {successMessage && <div style={successBoxStyle}>{successMessage}</div>}

        <div style={isMobileQuote ? mobileMainGridStyle : mainGridStyle}>
          <section style={isMobileQuote ? mobileServicesPanelStyle : panelStyle}>
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
              <>
                <div style={categoryTabsStyle}>
                  {productCategories.map((category) => {
                    const isActive = !!expandedCategories[category];

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => openCategory(category)}
                        style={isActive ? categoryTabButtonActiveStyle : categoryTabButtonStyle}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>

                <div style={categoryListStyle}>
                {productCategories.map((category) => {
                  const isOpen = !!expandedCategories[category];
                  const categoryProducts = productsByCategory[category] || [];

                  return (
                    <section
                      id={getCategoryElementId(category)}
                      key={category}
                      style={categorySectionStyle}
                    >
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
                  <div style={productThumbWrapStyle}>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        style={productThumbStyle}
                      />
                    ) : (
                      <div style={productThumbPlaceholderStyle}>
                        {product.category || 'SM'}
                      </div>
                    )}
                  </div>
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
              </>
            )}
          </section>

          <div style={isMobileQuote ? mobileQuoteSideColumnStyle : quoteSideColumnStyle}>
          <aside style={isMobileQuote ? mobileQuotePanelStyle : quotePanelStyle}>
            {isMobileQuote && (
              <div style={mobileQuotePanelHeaderStyle}>
                <p style={mobileQuoteEyebrowStyle}>Servicios seleccionados</p>
                <h2 style={mobileQuotePanelTitleStyle}>
                  {quoteItems.length > 0
                    ? `${quoteItems.reduce((sum, item) => sum + item.quantity, 0)} servicio${
                        quoteItems.reduce((sum, item) => sum + item.quantity, 0) === 1 ? '' : 's'
                      } agregados`
                    : 'Tu selección está vacía'}
                </h2>
                <p style={mobileQuotePanelTextStyle}>
                  {quoteItems.length > 0
                    ? 'Ajusta cantidades o elimina servicios antes de enviar.'
                    : 'Agrega servicios desde el catálogo o desde las categorías disponibles.'}
                </p>
              </div>
            )}
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
                  <div key={item.id} style={isMobileQuote ? mobileQuoteItemCardStyle : quoteItemCardStyle}>
                    <div style={isMobileQuote ? mobileQuoteItemHeaderStyle : quoteItemHeaderStyle}>
                      <div>
                        <p style={isMobileQuote ? mobileQuoteItemNameStyle : quoteItemNameStyle}>{item.name}</p>
                        <p style={isMobileQuote ? mobileQuoteItemMetaStyle : quoteItemMetaStyle}>
                          {formatMoney(item.price)} por unidad
                        </p>
                      </div>

                      <div style={isMobileQuote ? mobileQuoteItemActionsStyle : quoteItemActionsStyle}>
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

                    <p style={isMobileQuote ? mobileQuoteSubtotalStyle : quoteSubtotalStyle}>
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
                    <span>Transporte</span>
                    <strong>{formatMoney(calculateTransport(total, eventLocation))}</strong>
                  </div>
                  <div style={quoteSummaryRowStyle}>
                    <span>Base para ITBIS</span>
                    <strong>{formatMoney(calculateTaxableBase(total, eventLocation))}</strong>
                  </div>
                  <div style={quoteSummaryRowStyle}>
                    <span>ITBIS 18%</span>
                    <strong>{formatMoney(calculateItbis(total, eventLocation))}</strong>
                  </div>
                  <div style={quoteSummaryTotalRowStyle}>
                    <span>Total con ITBIS</span>
                    <strong>{formatMoney(calculateTotalWithItbis(total, eventLocation))}</strong>
                  </div>
                </div>
              </div>
            )}
          </aside>
            <section style={isMobileQuote ? mobileLocationHeroStyle : locationHeroStyle}>
            {isMobileQuote && (
              <div style={mobileQuotePanelHeaderStyle}>
                <p style={mobileQuoteEyebrowStyle}>Detalles del evento</p>
                <h2 style={mobileQuotePanelTitleStyle}>Cuéntanos dónde y cuándo</h2>
                <p style={mobileQuotePanelTextStyle}>
                  Estos datos nos ayudan a calcular logística, soporte y disponibilidad.
                </p>
              </div>
            )}
              <div>
                <p style={sectionEyebrowStyle}>Lugar del evento</p>
                <h1 style={locationHeroTitleStyle}>Ciudad del evento</h1>
                <p style={locationHeroTextStyle}>Calculamos el transporte según la ciudad.</p>
              </div>

              <label style={locationSelectWrapStyle}>
                <span style={locationSelectLabelStyle}>Ciudad / zona</span>
                <select
                  required
                  value={eventLocation}
                  onChange={(event) => setEventLocation(event.target.value)}
                  style={locationSelectStyle}
                >
                  {eventLocationOptions.map((option) => (
                    <option key={option.value || 'empty-location'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={locationSelectWrapStyle}>
                <span style={locationSelectLabelStyle}>Tipo de evento</span>
                <select
                  value={eventType}
                  onChange={(event) => setEventType(event.target.value)}
                  style={locationSelectStyle}
                >
                  {eventTypeOptions.map((option) => (
                    <option key={option.value || 'empty-event-type'} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label style={locationSelectWrapStyle}>
                <span style={locationSelectLabelStyle}>Fecha del evento</span>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                  style={inputStyle}
                />
              </label>

              <label style={locationSelectWrapStyle}>
                <span style={locationSelectLabelStyle}>Notas adicionales</span>
                <textarea
                  placeholder="Duración, montaje, horario, detalles especiales..."
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  style={compactTextareaStyle}
                />
              </label>

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
            </section>


          </div>
        </div>


      </div>
    </main>
  );
}

const mobileQuoteItemCardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  display: 'grid',
  gap: 8,
  padding: 10,
  borderRadius: 16,
  background: 'linear-gradient(145deg, rgba(2, 6, 23, 0.56), rgba(15, 23, 42, 0.44))',
  border: '1px solid rgba(148, 163, 184, 0.11)',
  overflow: 'hidden',
};

const mobileQuoteItemHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) auto',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  minWidth: 0,
};

const mobileQuoteItemNameStyle: React.CSSProperties = {
  margin: 0,
  color: '#ffffff',
  fontSize: 13,
  fontWeight: 900,
  lineHeight: 1.18,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const mobileQuoteItemMetaStyle: React.CSSProperties = {
  margin: '3px 0 0',
  color: '#94a3b8',
  fontSize: 10.5,
  lineHeight: 1.25,
};

const mobileQuoteItemActionsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 6,
  flex: '0 0 auto',
};

const mobileQuoteSubtotalStyle: React.CSSProperties = {
  margin: 0,
  color: '#facc15',
  fontSize: 12,
  fontWeight: 900,
  textAlign: 'right',
};

const mobileQuoteAppHeaderStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  boxSizing: 'border-box',
  borderRadius: 24,
  padding: '16px 14px',
  background:
    'linear-gradient(145deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 0.78))',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  boxShadow: '0 18px 44px rgba(0, 0, 0, 0.28)',
  overflow: 'hidden',
};

const mobileQuoteEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#facc15',
  fontSize: 10.5,
  fontWeight: 950,
  letterSpacing: '0.15em',
  textTransform: 'uppercase',
};

const mobileQuoteAppTitleStyle: React.CSSProperties = {
  margin: '7px 0 0',
  color: '#ffffff',
  fontSize: 30,
  lineHeight: 1.02,
  fontWeight: 950,
  letterSpacing: '-0.055em',
};

const mobileQuoteAppTextStyle: React.CSSProperties = {
  margin: '7px 0 0',
  color: '#94a3b8',
  fontSize: 13,
  lineHeight: 1.4,
};

const mobileQuoteStepsStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 7,
  marginTop: 14,
};

const mobileQuoteStepStyle: React.CSSProperties = {
  minWidth: 0,
  borderRadius: 999,
  padding: '8px 6px',
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.13)',
  color: '#94a3b8',
  fontSize: 10.5,
  fontWeight: 900,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const mobileQuoteStepActiveStyle: React.CSSProperties = {
  minWidth: 0,
  borderRadius: 999,
  padding: '8px 6px',
  color: '#111827',
  background: '#facc15',
  border: '1px solid rgba(250, 204, 21, 0.7)',
  fontSize: 10.5,
  fontWeight: 900,
  textAlign: 'center',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const mobileQuotePanelHeaderStyle: React.CSSProperties = {
  display: 'grid',
  gap: 5,
  marginBottom: 12,
};

const mobileQuotePanelTitleStyle: React.CSSProperties = {
  margin: 0,
  color: '#ffffff',
  fontSize: 18,
  lineHeight: 1.08,
  fontWeight: 950,
  letterSpacing: '-0.035em',
};

const mobileQuotePanelTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 12,
  lineHeight: 1.35,
};

const mobilePageStyle: React.CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  maxWidth: '100%',
  overflowX: 'hidden',
  background:
    'radial-gradient(circle at top left, rgba(250, 204, 21, 0.10), transparent 26%), radial-gradient(circle at bottom right, rgba(236, 72, 153, 0.08), transparent 28%), #020617',
  color: '#f8fafc',
};

const mobileContainerStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  margin: '0 auto',
  padding: '10px 10px 132px',
  boxSizing: 'border-box',
  display: 'grid',
  gap: 10,
  overflowX: 'hidden',
};

const mobileMainGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 10,
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  overflowX: 'hidden',
};

const mobileServicesPanelStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: 12,
  borderRadius: 22,
  overflow: 'hidden',
  order: 2,
  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.72))',
  border: '1px solid rgba(250, 204, 21, 0.10)',
  boxShadow: '0 14px 32px rgba(0, 0, 0, 0.20)',
};

const mobileQuoteSideColumnStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  order: 1,
};

const mobileQuotePanelStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: 13,
  borderRadius: 24,
  overflow: 'hidden',
  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.86))',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  boxShadow: '0 18px 42px rgba(0, 0, 0, 0.30)',
};

const mobileLocationHeroStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: 13,
  borderRadius: 24,
  overflow: 'hidden',
  background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(2, 6, 23, 0.74))',
  border: '1px solid rgba(250, 204, 21, 0.12)',
  boxShadow: '0 14px 32px rgba(0, 0, 0, 0.22)',
};

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

const locationHeroStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  background: 'rgba(15, 23, 42, 0.58)',
  border: '1px solid rgba(250, 204, 21, 0.10)',
  borderRadius: 18,
  padding: '12px 14px',
  boxShadow: '0 14px 32px rgba(0,0,0,0.14)',
};

const locationHeroTitleStyle: React.CSSProperties = {
  margin: '4px 0 2px',
  fontSize: 18,
  lineHeight: 1.08,
  letterSpacing: '-0.03em',
};

const locationHeroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.35,
  fontSize: 11,
};

const locationSelectWrapStyle: React.CSSProperties = {
  width: '100%',
  display: 'grid',
  gap: 5,
  background: 'rgba(2, 6, 23, 0.32)',
  border: '1px solid rgba(250, 204, 21, 0.11)',
  borderRadius: 14,
  padding: 8,
};

const locationSelectLabelStyle: React.CSSProperties = {
  color: '#fbbf24',
  fontSize: 9,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const locationSelectStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 36,
  borderRadius: 10,
  border: '1px solid rgba(250, 204, 21, 0.14)',
  background: 'rgba(2, 6, 23, 0.86)',
  color: '#f8fafc',
  outline: 'none',
  padding: '7px 10px',
  fontWeight: 800,
  fontSize: 12,
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
  fontSize: 32,
  lineHeight: 1.02,
  letterSpacing: '-0.05em',
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

const clientCompactSectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  background: 'rgba(15, 23, 42, 0.58)',
  border: '1px solid rgba(250, 204, 21, 0.10)',
  borderRadius: 18,
  padding: '12px 14px',
  boxShadow: '0 14px 32px rgba(0,0,0,0.14)',
};

const clientCompactTitleStyle: React.CSSProperties = {
  margin: '4px 0 2px',
  fontSize: 18,
  lineHeight: 1.08,
  letterSpacing: '-0.03em',
};

const clientCompactTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.35,
  fontSize: 11,
};

const quoteSideColumnStyle: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  alignSelf: 'start',
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
};

const panelTitleStyle: React.CSSProperties = {
  margin: '5px 0 4px',
  fontSize: 20,
  letterSpacing: '-0.03em',
};

const panelTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.42,
  fontSize: 12,
};

const softBoxStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 16,
  background: 'rgba(2, 6, 23, 0.38)',
  border: '1px solid rgba(250, 204, 21, 0.10)',
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
};

const categoryTabsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 7,
  overflowX: 'auto',
  padding: '3px 1px 10px',
  marginTop: 12,
  marginBottom: 4,
  scrollbarWidth: 'none',
};

const categoryTabButtonStyle: React.CSSProperties = {
  flexShrink: 0,
  border: '1px solid rgba(250,204,21,0.16)',
  background: 'rgba(2,6,23,0.46)',
  color: '#cbd5e1',
  borderRadius: 999,
  padding: '9px 13px',
  fontSize: 12,
  fontWeight: 900,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const categoryTabButtonActiveStyle: React.CSSProperties = {
  ...categoryTabButtonStyle,
  background: 'linear-gradient(135deg, rgba(245,158,11,0.26), rgba(168,85,247,0.22))',
  color: '#fde68a',
  border: '1px solid rgba(250,204,21,0.34)',
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

const productThumbWrapStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 14,
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(2,6,23,0.90), rgba(15,23,42,0.90))',
  border: '1px solid rgba(250,204,21,0.12)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const productThumbStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  objectPosition: 'center',
  display: 'block',
  padding: 6,
};

const productThumbPlaceholderStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fbbf24',
  fontSize: 10,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background:
    'radial-gradient(circle at 20% 20%, rgba(250,204,21,0.18), transparent 30%), rgba(2,6,23,0.66)',
};

const productCardStyle: React.CSSProperties = {
  borderRadius: 16,
  background: 'rgba(15,23,42,0.64)',
  border: '1px solid rgba(148,163,184,0.10)',
  display: 'grid',
  gridTemplateColumns: '56px 1fr auto',
  alignItems: 'center',
  gap: 12,
  minHeight: 92,
  padding: 12,
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

const compactTextareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 76,
  resize: 'vertical',
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
