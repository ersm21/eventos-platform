'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase/client';
import AppNavbar from '../../components/AppNavbar';

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!user) {
        router.replace('/login');
        return;
      }

      setEmail(user.email ?? null);
      setUserId(user.id);
      setLoading(false);
    };

    loadUser();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <main style={pageStyle}>
        <div style={containerStyle}>
          <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />
          <section style={heroCardStyle}>
            <p style={eyebrowStyle}>Mi cuenta</p>
            <h1 style={heroTitleStyle}>Cargando cuenta...</h1>
            <p style={heroTextStyle}>Un momento mientras verificamos tu sesión.</p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/my-quotes" ctaLabel="Mis cotizaciones" />

        <section style={heroCardStyle}>
          <p style={eyebrowStyle}>Mi cuenta</p>
          <h1 style={heroTitleStyle}>Panel de cuenta</h1>
          <p style={heroTextStyle}>
            Desde aquí puedes revisar tu sesión, entrar a tus paneles y gestionar
            tu acceso.
          </p>
        </section>

        {error && <div style={errorBoxStyle}>{error}</div>}

        <div style={gridStyle}>
          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>Datos principales</h2>

            <div style={subCardStyle}>
              <p style={smallLabelStyle}>Email</p>
              <p style={valueStyle}>{email || '—'}</p>
            </div>

            <div style={subCardStyle}>
              <p style={smallLabelStyle}>Estado</p>
              <p style={valueStyle}>Sesión activa</p>
            </div>

            <div style={subCardStyle}>
              <p style={smallLabelStyle}>User ID</p>
              <p style={smallValueStyle}>{userId || '—'}</p>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>Accesos rápidos</h2>

            <div style={actionsGridStyle}>
              <Link href="/my-quotes" style={primaryLinkStyle}>
                Ver mis cotizaciones
              </Link>

              <Link href="/my-meetings" style={secondaryLinkStyle}>
                Ver mis reuniones
              </Link>

              <Link href="/" style={secondaryLinkStyle}>
                Volver al inicio
              </Link>

              <button
                onClick={handleLogout}
                disabled={loggingOut}
                style={logoutButtonStyle}
              >
                {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
              </button>
            </div>
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

const heroCardStyle: React.CSSProperties = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.90) 0%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 28,
  padding: 26,
  boxShadow: '0 20px 48px rgba(0,0,0,0.22)',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#60a5fa',
  fontWeight: 800,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const heroTitleStyle: React.CSSProperties = {
  margin: '10px 0 8px',
  fontSize: 40,
  lineHeight: 1.04,
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.6,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
  gap: 18,
  marginTop: 22,
};

const cardStyle: React.CSSProperties = {
  background:
    'linear-gradient(180deg, rgba(15,23,42,0.84) 0%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(148, 163, 184, 0.16)',
  borderRadius: 24,
  padding: 22,
  boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
};

const cardTitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 14,
  fontSize: 24,
};

const subCardStyle: React.CSSProperties = {
  background: 'rgba(2, 6, 23, 0.34)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: 18,
  padding: 16,
  marginBottom: 12,
};

const smallLabelStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  fontSize: 13,
};

const valueStyle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 22,
  fontWeight: 800,
};

const smallValueStyle: React.CSSProperties = {
  margin: '8px 0 0',
  fontSize: 13,
  fontWeight: 700,
  wordBreak: 'break-all',
  color: '#dbe6f3',
};

const actionsGridStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
};

const primaryLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  color: '#fff',
  fontWeight: 800,
};

const secondaryLinkStyle: React.CSSProperties = {
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

const logoutButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 14,
  border: '1px solid rgba(248, 113, 113, 0.28)',
  background: 'rgba(127, 29, 29, 0.30)',
  color: '#fecaca',
  fontWeight: 800,
  cursor: 'pointer',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 22,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
};