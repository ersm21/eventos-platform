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
  image_url?: string | null;
  is_active: boolean | null;
};

type CatalogCartItem = Product & {
  quantity: number;
};

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

const preferredCategoryOrder = [
  'Audio',
  'Iluminación',
  'Pantallas LED',
  'Truss',
  'Tarimas',
  'Efectos especiales',
];

const categoryVisuals: Record<string, { label: string; description: string }> = {
  Audio: {
    label: 'Audio',
    description: 'Sonido profesional, bocinas, consolas, micrófonos y soporte técnico.',
  },
  Iluminación: {
    label: 'Iluminación',
    description: 'Luces robóticas, wash, beam, ambientación y diseño visual.',
  },
  'Pantallas LED': {
    label: 'Pantallas LED',
    description: 'Pantallas para tarima, fondos visuales, contenido y producción.',
  },
  Truss: {
    label: 'Truss',
    description: 'Estructuras, soportes, torres, rigging y montaje técnico.',
  },
  Tarimas: {
    label: 'Tarimas',
    description: 'Tarimas para conciertos, bodas, corporativos y eventos privados.',
  },
  'Efectos especiales': {
    label: 'Efectos especiales',
    description: 'Confeti, humo, pirotecnia fría y detalles de impacto para eventos.',
  },
  General: {
    label: 'General',
    description: 'Servicios adicionales y soluciones especiales para tu evento.',
  },
};

function normalizeCategory(category: string | null | undefined) {
  const cleanCategory = category?.trim() || 'General';
  const lowerCategory = cleanCategory.toLowerCase();

  if (
    lowerCategory.includes('pantalla') ||
    lowerCategory.includes('pantallas') ||
    lowerCategory.includes('led') ||
    lowerCategory.includes('video')
  ) {
    return 'Pantallas LED';
  }

  if (
    lowerCategory.includes('efecto') ||
    lowerCategory.includes('confeti') ||
    lowerCategory.includes('humo') ||
    lowerCategory.includes('spark') ||
    lowerCategory.includes('chisp')
  ) {
    return 'Efectos especiales';
  }

  if (lowerCategory.includes('ilumin')) {
    return 'Iluminación';
  }

  if (lowerCategory.includes('tarima')) {
    return 'Tarimas';
  }

  if (lowerCategory.includes('truss')) {
    return 'Truss';
  }

  if (lowerCategory.includes('audio') || lowerCategory.includes('sonido')) {
    return 'Audio';
  }

  return cleanCategory;
}

export default function CatalogoPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CatalogCartItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [isMobileCatalog, setIsMobileCatalog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setLoading(false);
        return;
      }

      setProducts((data || []) as Product[]);
      setLoading(false);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const updateViewport = () => {
      setIsMobileCatalog(window.innerWidth <= 760);
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);

    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const productsByCategory = useMemo(() => {
    const grouped = products.reduce<Record<string, Product[]>>((accumulator, product) => {
      const category = normalizeCategory(product.category);

      if (!accumulator[category]) {
        accumulator[category] = [];
      }

      accumulator[category].push(product);
      return accumulator;
    }, {});

    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => {
        const priceDifference = Number(a.price ?? 0) - Number(b.price ?? 0);

        if (priceDifference !== 0) return priceDifference;

        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [products]);

  const productCategories = useMemo(() => {
    const existingCategories = Object.keys(productsByCategory);
    const allCategories = Array.from(
      new Set([...preferredCategoryOrder, ...existingCategories])
    );

    return allCategories.sort((a, b) => {
      const aIndex = preferredCategoryOrder.indexOf(a);
      const bIndex = preferredCategoryOrder.indexOf(b);

      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;

      return aIndex - bIndex;
    });
  }, [productsByCategory]);

  const cartItemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0),
    [cartItems]
  );

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const addToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const decreaseCartItem = (productId: string) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const goToQuoteWithCart = () => {
    const cart = cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    }));

    router.push(`/cotizar?cart=${encodeURIComponent(JSON.stringify(cart))}`);
  };

  return (
    <main style={isMobileCatalog ? mobileCatalogLayoutStyle : pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/cotizar" ctaLabel="Cotizar ahora" />

        <section style={heroCardStyle}>
          <p style={eyebrowStyle}>Catálogo</p>
          <h1 style={heroTitleStyle}>Servicios para tu evento</h1>
          <p style={heroTextStyle}>
            Explora por subdivisión, agrega productos a tu selección y continúa directo a cotizar.
          </p>

          <div style={heroActionsStyle}>
            <Link href="/cotizar" style={primaryButtonStyle}>
              Ir a cotizar
            </Link>
            <Link href="/book-meeting" style={secondaryButtonStyle}>
              Solicitar reunión
            </Link>
          </div>
        </section>

        {error && <div style={errorBoxStyle}>{error}</div>}

        <div style={mainGridStyle}>
          <section style={panelStyle}>
            <div style={sectionHeaderStyle}>
              <p style={sectionEyebrowStyle}>Servicios activos</p>
              <h2 style={sectionTitleStyle}>Elige lo que necesitas</h2>
              <p style={sectionTextStyle}>
                Audio, iluminación, pantallas LED, truss, tarimas y efectos especiales.
              </p>
            </div>

            {loading ? (
              <div style={softBoxStyle}>
                <p style={mutedTextStyle}>Cargando catálogo...</p>
              </div>
            ) : products.length === 0 ? (
              <div style={softBoxStyle}>
                <p style={mutedTextStyle}>Todavía no hay servicios disponibles.</p>
              </div>
            ) : (
              <div style={isMobileCatalog ? mobileCategoryListStyle : categoryListStyle}>
                {productCategories.map((category) => {
                  const isOpen = !!expandedCategories[category];
                  const categoryProducts = productsByCategory[category] || [];
                  const categoryVisual = categoryVisuals[category] || {
                    label: category,
                    description: 'Servicios disponibles para esta subdivisión.',
                  };

                  return (
                    <section key={category} style={isMobileCatalog ? mobileCategorySectionStyle : categorySectionStyle}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category)}
                        style={isMobileCatalog ? mobileCategoryHeaderStyle : categoryHeaderStyle}
                      >
                        <div style={categoryHeaderContentStyle}>
                          <div style={isMobileCatalog ? mobileCategoryThumbStyle : categoryThumbStyle}>
                            <span>{categoryVisual.label.slice(0, 2).toUpperCase()}</span>
                          </div>

                          <div>
                            <h3 style={categoryTitleStyle}>{categoryVisual.label}</h3>
                            {!isMobileCatalog && <p style={categoryDescriptionStyle}>{categoryVisual.description}</p>}
                            <p style={categoryCountStyle}>
                              {categoryProducts.length > 0
                                ? `${categoryProducts.length} producto${categoryProducts.length === 1 ? '' : 's'}`
                                : 'Próximamente agregaremos productos'}
                            </p>
                          </div>
                        </div>

                        <span style={categoryChevronStyle}>{isOpen ? '−' : '+'}</span>
                      </button>

                      {isOpen && categoryProducts.length === 0 && (
                        <div style={emptyCategoryStyle}>
                          <p style={emptyTitleStyle}>Esta subdivisión todavía no tiene productos.</p>
                          <p style={emptyTextStyle}>
                            Pronto agregaremos opciones, fotos y detalles para esta categoría.
                          </p>
                        </div>
                      )}

                      {isOpen && categoryProducts.length > 0 && (
                        <div style={isMobileCatalog ? mobileProductListStyle : productGridStyle}>
                          {categoryProducts.map((product) => (
                            <article key={product.id} style={isMobileCatalog ? mobileProductCardStyle : productCardStyle}>
                              {product.image_url ? (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  style={isMobileCatalog ? mobileProductImageStyle : productImageStyle}
                                />
                              ) : (
                                <div style={isMobileCatalog ? mobileProductImagePlaceholderStyle : productImagePlaceholderStyle}>
                                  <span>{category}</span>
                                </div>
                              )}

                              <div style={productBodyStyle}>
                                <h4 style={productNameStyle}>{product.name}</h4>
                                <p style={isMobileCatalog ? mobileProductDescriptionStyle : productDescriptionStyle}>
                                  {product.description || 'Servicio disponible para cotización.'}
                                </p>

                                <div style={productFooterStyle}>
                                  <div>
                                    <p style={priceLabelStyle}>Desde</p>
                                    <p style={priceStyle}>{formatMoney(product.price)}</p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => addToCart(product)}
                                    style={smallButtonStyle}
                                  >
                                    Agregar
                                  </button>
                                </div>
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

          <aside style={isMobileCatalog ? mobileCartPanelStyle : cartPanelStyle}>
            <div style={cartHeaderStyle}>
              <div>
                <p style={sectionEyebrowStyle}>Selección</p>
                <h2 style={cartTitleStyle}>Carrito para cotizar</h2>
              </div>

              <span style={cartBadgeStyle}>{cartItemCount}</span>
            </div>

            {cartItems.length === 0 ? (
              <div style={emptyCartStyle}>
                <p style={emptyTitleStyle}>No has agregado productos</p>
                <p style={emptyTextStyle}>
                  Abre una subdivisión y agrega productos para armar tu cotización.
                </p>
              </div>
            ) : (
              <div style={cartStackStyle}>
                {cartItems.map((item) => (
                  <div key={item.id} style={cartItemStyle}>
                    <div>
                      <p style={cartItemNameStyle}>{item.name}</p>
                      <p style={cartItemMetaStyle}>
                        {item.quantity} × {formatMoney(item.price)}
                      </p>
                    </div>

                    <div style={cartQtyActionsStyle}>
                      <button
                        type="button"
                        onClick={() => decreaseCartItem(item.id)}
                        style={qtyButtonStyle}
                      >
                        −
                      </button>

                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        style={qtyButtonStyle}
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}

                <div style={cartSummaryStyle}>
                  <span>Subtotal estimado</span>
                  <strong>{formatMoney(cartSubtotal)}</strong>
                </div>

                <button
                  type="button"
                  onClick={goToQuoteWithCart}
                  style={continueButtonStyle}
                >
                  Continuar a cotizar
                </button>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

const mobileCatalogLayoutStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr',
  gap: 14,
  alignItems: 'start',
};

const mobileCategoryListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const mobileCategorySectionStyle: React.CSSProperties = {
  borderRadius: 18,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.10)',
  overflow: 'hidden',
  boxShadow: '0 14px 34px rgba(0, 0, 0, 0.18)',
};

const mobileCategoryHeaderStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 10,
  padding: 12,
  border: 'none',
  background: 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(30,41,59,0.74))',
  color: '#fff',
  cursor: 'pointer',
  textAlign: 'left',
};

const mobileCategoryThumbStyle: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: 14,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(250, 204, 21, 0.14)',
  color: '#facc15',
  fontSize: 12,
  fontWeight: 900,
  flex: '0 0 auto',
};

const mobileProductListStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 10,
};

const mobileProductCardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '86px minmax(0, 1fr)',
  gap: 11,
  alignItems: 'stretch',
  padding: 10,
  borderRadius: 16,
  background: 'rgba(2, 6, 23, 0.48)',
  border: '1px solid rgba(148, 163, 184, 0.12)',
};

const mobileProductImageStyle: React.CSSProperties = {
  width: 86,
  height: 86,
  borderRadius: 14,
  objectFit: 'cover',
  background: 'rgba(2, 6, 23, 0.7)',
};

const mobileProductImagePlaceholderStyle: React.CSSProperties = {
  width: 86,
  height: 86,
  borderRadius: 14,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(250, 204, 21, 0.10)',
  color: '#facc15',
  fontSize: 10,
  fontWeight: 900,
  textAlign: 'center',
  padding: 6,
};

const mobileProductDescriptionStyle: React.CSSProperties = {
  margin: '5px 0 0',
  color: '#94a3b8',
  fontSize: 11,
  lineHeight: 1.35,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

const mobileCartPanelStyle: React.CSSProperties = {
  ...cartPanelStyle,
  position: 'sticky',
  bottom: 12,
  zIndex: 20,
  borderRadius: 20,
  padding: 14,
  boxShadow: '0 18px 44px rgba(0,0,0,0.35)',
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

const heroActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 16,
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 15px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  boxShadow: '0 14px 26px rgba(236,72,153,0.20)',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 15px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'rgba(2, 6, 23, 0.46)',
  color: '#f8fafc',
  fontWeight: 800,
  border: '1px solid rgba(250, 204, 21, 0.18)',
};

const mainGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) 340px',
  gap: 14,
  marginTop: 14,
  alignItems: 'start',
};

const panelStyle: React.CSSProperties = {
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.13)',
  borderRadius: 22,
  padding: 16,
  boxShadow: '0 14px 26px rgba(0,0,0,0.20)',
};

const sectionHeaderStyle: React.CSSProperties = {
  marginBottom: 12,
};

const sectionEyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 900,
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  fontSize: 11,
};

const sectionTitleStyle: React.CSSProperties = {
  margin: '6px 0 5px',
  fontSize: 22,
};

const sectionTextStyle: React.CSSProperties = {
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

const categoryHeaderContentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  minWidth: 0,
};

const categoryThumbStyle: React.CSSProperties = {
  width: 54,
  height: 54,
  borderRadius: 16,
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
  background: 'linear-gradient(135deg, rgba(250,204,21,0.16), rgba(59,130,246,0.14))',
  border: '1px solid rgba(250,204,21,0.18)',
  color: '#fde68a',
  fontSize: 13,
  fontWeight: 900,
};

const categoryDescriptionStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: '#cbd5e1',
  fontSize: 12,
  lineHeight: 1.4,
};

const emptyCategoryStyle: React.CSSProperties = {
  margin: 10,
  padding: 14,
  borderRadius: 16,
  background: 'rgba(2, 6, 23, 0.38)',
  border: '1px solid rgba(250, 204, 21, 0.11)',
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

const productGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 10,
  padding: 10,
};

const productCardStyle: React.CSSProperties = {
  overflow: 'hidden',
  borderRadius: 17,
  background: 'rgba(15,23,42,0.64)',
  border: '1px solid rgba(148,163,184,0.10)',
};

const productImageStyle: React.CSSProperties = {
  width: '100%',
  height: 132,
  objectFit: 'contain',
  objectPosition: 'center',
  display: 'block',
  padding: 10,
  background:
    'linear-gradient(135deg, rgba(2,6,23,0.92), rgba(15,23,42,0.92))',
  borderBottom: '1px solid rgba(250,204,21,0.10)',
};

const productImagePlaceholderStyle: React.CSSProperties = {
  height: 132,
  display: 'grid',
  placeItems: 'center',
  background:
    'linear-gradient(135deg, rgba(250,204,21,0.10), rgba(59,130,246,0.10))',
  color: '#fde68a',
  fontWeight: 900,
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const productBodyStyle: React.CSSProperties = {
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
  justifyContent: 'space-between',
  gap: 10,
  marginTop: 12,
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

const cartPanelStyle: React.CSSProperties = {
  position: 'sticky',
  top: 116,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.90) 0%, rgba(30,27,75,0.42) 52%, rgba(7,12,24,0.96) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 22,
  padding: 16,
  boxShadow: '0 14px 30px rgba(0,0,0,0.24)',
};

const cartHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 12,
};

const cartTitleStyle: React.CSSProperties = {
  margin: '6px 0 0',
  fontSize: 20,
};

const cartBadgeStyle: React.CSSProperties = {
  minWidth: 32,
  height: 32,
  borderRadius: 999,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(249,115,22,0.18)',
  border: '1px solid rgba(249,115,22,0.30)',
  color: '#fed7aa',
  fontWeight: 900,
};

const emptyCartStyle: React.CSSProperties = {
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

const cartStackStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
};

const cartItemStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
  padding: 10,
  borderRadius: 14,
  background: 'rgba(2, 6, 23, 0.38)',
  border: '1px solid rgba(148,163,184,0.10)',
};

const cartItemNameStyle: React.CSSProperties = {
  margin: 0,
  color: '#f8fafc',
  fontSize: 13,
  fontWeight: 900,
};

const cartItemMetaStyle: React.CSSProperties = {
  margin: '4px 0 0',
  color: '#94a3b8',
  fontSize: 12,
};

const cartQtyActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 6,
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

const cartSummaryStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  padding: 14,
  borderRadius: 16,
  background: 'rgba(250,204,21,0.08)',
  border: '1px solid rgba(250,204,21,0.14)',
  color: '#fde68a',
};

const continueButtonStyle: React.CSSProperties = {
  width: '100%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 15px',
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
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
