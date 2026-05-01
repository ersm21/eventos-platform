'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';

type AppNavbarProps = {
  ctaHref?: string;
  ctaLabel?: string;
};

export default function AppNavbar({
  ctaHref = '#cotizar',
  ctaLabel = 'Cotizar ahora',
}: AppNavbarProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <header style={navbarStyle}>
      <div style={navbarInnerStyle}>
        <div style={mobileTopRowStyle}>
          <Link href="/" style={brandLinkStyle} onClick={() => setMobileMenuOpen(false)}>
            <div style={logoStyle}>
              <img src="/sm-logo.png" alt="SM Events" style={logoImageStyle} />
            </div>

            <div>
              <p style={brandSubtitleStyle}>Producción de eventos</p>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            style={mobileMenuButtonStyle}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? 'Cerrar' : 'Menú'}
          </button>
        </div>

        <nav style={getNavStyle(mobileMenuOpen)}>
          <Link href="/" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
            Inicio
          </Link>

          <Link href="/catalogo" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
            Catálogo
          </Link>

          <Link href="/galeria" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
            Galería
          </Link>

          <Link href="/feed" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
            Feed
          </Link>

          <Link href="/cotizar" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
            Cotizar
          </Link>

          <Link href="/my-quotes" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
            Mis cotizaciones
          </Link>

          <Link href="/my-meetings" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
            Mis reuniones
          </Link>

          {isLoggedIn && (
            <Link href="/profile" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
              Mi perfil
            </Link>
          )}

          {!isLoggedIn ? (
            <Link href="/login" style={navLinkStyle} onClick={() => setMobileMenuOpen(false)}>
              Login
            </Link>
          ) : (
            <button onClick={handleLogout} style={logoutButtonStyle}>
              Cerrar sesión
            </button>
          )}

          <Link href={ctaHref} style={ctaButtonStyle} onClick={() => setMobileMenuOpen(false)}>
            {ctaLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}

function getNavStyle(mobileMenuOpen: boolean): React.CSSProperties {
  return {
    ...navStyle,
    ['--mobile-menu-display' as string]: mobileMenuOpen ? 'grid' : 'none',
  };
}

const mobileTopRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 14,
  width: '100%',
};

const mobileMenuButtonStyle: React.CSSProperties = {
  display: 'none',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 13px',
  borderRadius: 14,
  border: '1px solid rgba(250, 204, 21, 0.22)',
  background: 'rgba(250, 204, 21, 0.10)',
  color: '#fde68a',
  fontWeight: 900,
  cursor: 'pointer',
};

const navbarStyle: React.CSSProperties = {
  position: 'sticky',
  top: 14,
  zIndex: 50,
  backdropFilter: 'blur(18px)',
  WebkitBackdropFilter: 'blur(18px)',
  background: 'rgba(2, 6, 23, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: 22,
  padding: '14px 18px',
  boxShadow: '0 14px 30px rgba(0,0,0,0.20)',
  marginBottom: 28,
};

const navbarInnerStyle: React.CSSProperties = {
  maxWidth: 1240,
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
};

const brandLinkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  textDecoration: 'none',
  color: '#e5e7eb',
};

const logoStyle: React.CSSProperties = {
  width: 92,
  height: 72,
  display: 'grid',
  placeItems: 'center',
  background: 'transparent',
  border: 'none',
  overflow: 'visible',
  boxShadow: 'none',
};

const logoImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  display: 'block',
  padding: 0,
};

const brandSubtitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 15,
  color: '#e5e7eb',
  fontWeight: 900,
  letterSpacing: '0.01em',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
};

const navLinkStyle: React.CSSProperties = {
  color: '#cbd5e1',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: 14,
  padding: '10px 12px',
  borderRadius: 12,
  background: 'transparent',
  border: '1px solid transparent',
};
const ctaButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 16px',
  borderRadius: 14,
  textDecoration: 'none',
  background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
  color: '#fff',
  fontWeight: 800,
  boxShadow: '0 14px 24px rgba(37,99,235,0.26)',
};

const logoutButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: '#0f172a',
  color: '#e5e7eb',
  fontWeight: 700,
  cursor: 'pointer',
};