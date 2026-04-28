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
    <header
      style={{
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
      }}
    >
      <div
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            textDecoration: 'none',
            color: '#e5e7eb',
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 16,
              display: 'grid',
              placeItems: 'center',
              background:
                'linear-gradient(135deg, rgba(37,99,235,1) 0%, rgba(96,165,250,1) 100%)',
              color: '#fff',
              fontWeight: 900,
              fontSize: 18,
              boxShadow: '0 12px 24px rgba(37,99,235,0.28)',
            }}
          >
            EP
          </div>

          <div>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#60a5fa',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              SM EVENTS
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 15,
                color: '#cbd5e1',
                fontWeight: 700,
              }}
            >
              Luces, sonido, pantallas LED y producción
            </p>
          </div>
        </Link>

        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <Link href="/" style={navLinkStyle}>
            Inicio
          </Link>

          <a href="/#catalogo" style={navLinkStyle}>
            Catálogo
          </a>

          <a href="/#cotizar" style={navLinkStyle}>
            Cotizar
          </a>

          <Link href="/my-quotes" style={navLinkStyle}>
            Mis cotizaciones
          </Link>

          <Link href="/my-meetings" style={navLinkStyle}>
            Mis reuniones
          </Link>

          <Link href="/account" style={navLinkStyle}>
            Mi cuenta
          </Link>

          {!isLoggedIn ? (
            <Link href="/login" style={navLinkStyle}>
              Login
            </Link>
          ) : (
            <button onClick={handleLogout} style={logoutButtonStyle}>
              Cerrar sesión
            </button>
          )}

          <a href={ctaHref} style={ctaButtonStyle}>
            {ctaLabel}
          </a>
        </nav>
      </div>
    </header>
  );
}

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