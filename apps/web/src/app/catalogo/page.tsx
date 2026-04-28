

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

export default function CatalogoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

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

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/cotizar" ctaLabel="Cotizar ahora" />

        <section style={heroCardStyle}>
          <p style={eyebrowStyle}>Catálogo</p>
          <h1 style={heroTitleStyle}>Servicios para tu evento</h1>
          <p style={heroTextStyle}>
            Explora los servicios disponibles de SM Events. Cuando estés listo,
            pasa a cotizar y cuéntanos qué necesitas para tu montaje.
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

        <section style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <div>
              <p style={sectionEyebrowStyle}>Servicios activos</p>
              <h2 style={sectionTitleStyle}>Elige lo que necesitas</h2>
              <p style={sectionTextStyle}>
                Luces, sonido, pantallas LED, tarimas y producción para bodas,
                conciertos, eventos corporativos y montajes privados.
              </p>
            </div>
          </div>

          {loading ? (
            <div style={panelStyle}>
              <p style={mutedTextStyle}>Cargando catálogo...</p>
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
                    <Link href="/cotizar" style={smallButtonStyle}>
                      Cotizar
                    </Link>
                  </div>
                </article>
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
  color: '#e5e7eb',
  padding: '34px 20px 80px',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(9,14,28,0.94) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 30,
  padding: 30,
  boxShadow: '0 24px 60px rgba(0,0,0,0.24)',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#93c5fd',
  fontWeight: 900,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontSize: 14,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '12px 0 10px',
  fontSize: 46,
  lineHeight: 1.05,
  letterSpacing: '-0.03em',
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#9fb1c8',
  fontSize: 17,
  lineHeight: 1.65,
  maxWidth: 760,
};

const heroActionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap',
  marginTop: 24,
};

const primaryButtonStyle: React.CSSProperties = {
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

const secondaryButtonStyle: React.CSSProperties = {
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

const smallButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 14px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  color: '#fff',
  fontWeight: 800,
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
};