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
  const [isAdmin, setIsAdmin] = useState(false);
  const allowedAdminEmails = ['ericrafaelsousamorel@gmail.com'];

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);
      setIsAdmin(
        !!user?.email &&
          allowedAdminEmails.includes(user.email.toLowerCase().trim())
      );
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      setIsAdmin(
        !!session?.user?.email &&
          allowedAdminEmails.includes(session.user.email.toLowerCase().trim())
      );
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    window.location.href = '/';
  };

  return (
    <header style={navbarStyle}>
      <div style={navbarInnerStyle}>
        <Link href="/" style={brandLinkStyle}>
          <div style={logoStyle}>
            <img src="/sm-logo.png" alt="SM Events" style={logoImageStyle} />
          </div>

          <div>
            <p style={brandSubtitleStyle}>Producción de eventos</p>
          </div>
        </Link>

        <nav style={navStyle}>
          <Link href="/" style={navLinkStyle}>
            Inicio
          </Link>

          <Link href="/catalogo" style={navLinkStyle}>
            Catálogo
          </Link>

          <Link href="/galeria" style={navLinkStyle}>
            Galería
          </Link>

          <Link href="/feed" style={navLinkStyle}>
            Feed
          </Link>

          <Link href="/cotizar" style={navLinkStyle}>
            Cotizar
          </Link>

          <Link href="/my-quotes" style={navLinkStyle}>
            Mis cotizaciones
          </Link>

          <Link href="/my-meetings" style={navLinkStyle}>
            Mis reuniones
          </Link>

          {isLoggedIn && (
            <Link href="/profile" style={navLinkStyle}>
              Mi perfil
            </Link>
          )}

          {isAdmin && (
            <Link href="/admin" style={adminLinkStyle}>
              Panel admin
            </Link>
          )}

          {!isLoggedIn ? (
            <Link href="/login" style={navLinkStyle}>
              Login
            </Link>
          ) : (
            <button onClick={handleLogout} style={logoutButtonStyle}>
              Cerrar sesión
            </button>
          )}

          <Link href={ctaHref} style={ctaButtonStyle}>
            {ctaLabel}
          </Link>
        </nav>
      </div>
    </header>
  );
}

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

const adminLinkStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '10px 12px',
  borderRadius: 12,
  textDecoration: 'none',
  background: 'rgba(250, 204, 21, 0.12)',
  color: '#fde68a',
  fontWeight: 900,
  border: '1px solid rgba(250, 204, 21, 0.24)',
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