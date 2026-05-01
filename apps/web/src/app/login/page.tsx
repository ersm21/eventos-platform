'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase/client';
import AppNavbar from '../../components/AppNavbar';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!email.trim() || !password.trim()) {
      setError('Debes escribir email y contraseña.');
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Inicio de sesión correcto.');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Cuenta creada correctamente. Ya puedes iniciar sesión.');
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/my-quotes`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
      return;
    }
  };

  const loginWithFacebook = async () => {
    setLoading(true);
    setError(null);

    const { error: facebookError } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });

    if (facebookError) {
      setError(facebookError.message);
      setLoading(false);
    }
  };


  return (
    <main style={pageStyle}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />

        <section style={loginCardStyle}>
          <p style={eyebrowStyle}>
            Acceso cliente
          </p>

          <h1 style={titleStyle}>
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>

          <p style={textStyle}>
            Accede a tus cotizaciones, comprobantes y estado de tu evento.
          </p>

          {error && (
            <div style={errorBoxStyle}>
              {error}
            </div>
          )}

          {message && (
            <div style={successBoxStyle}>
              {message}
            </div>
          )}

          <div style={socialIconsRowStyle}>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                ...socialIconButtonStyle,
                opacity: googleLoading ? 0.7 : 1,
              }}
              aria-label="Continuar con Google"
              title="Continuar con Google"
            >
              <svg viewBox="0 0 24 24" style={googleLogoStyle} aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={loginWithFacebook}
              disabled={loading}
              style={{
                ...socialIconButtonStyle,
                opacity: loading ? 0.7 : 1,
              }}
              aria-label="Continuar con Facebook"
              title="Continuar con Facebook"
            >
              <svg viewBox="0 0 24 24" style={facebookLogoStyle} aria-hidden="true">
                <path
                  fill="#1877F2"
                  d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.931-1.956 1.887v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
                />
              </svg>
            </button>
          </div>

          <div style={{ display: 'grid', gap: 14, marginTop: 10 }}>
            <div style={dividerWrapStyle}>
              <div style={dividerLineStyle} />
              <span>o continúa con email</span>
              <div style={dividerLineStyle} />
            </div>

            <div>
              <label style={labelStyle}>
                Email
              </label>
              <input
                type="email"
                placeholder="tuemail@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Contraseña
              </label>
              <input
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleAuth}
              disabled={loading}
              style={{
                ...primaryButtonStyle,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? 'Procesando...'
                : isLogin
                ? 'Iniciar sesión'
                : 'Crear cuenta'}
            </button>

            <button
              onClick={() => setIsLogin(!isLogin)}
              style={secondaryButtonStyle}
            >
              {isLogin
                ? 'No tengo cuenta, quiero registrarme'
                : 'Ya tengo cuenta, quiero entrar'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  color: '#f8fafc',
  padding: '40px 20px 80px',
  background:
    'radial-gradient(circle at 12% 18%, rgba(168,85,247,0.20), transparent 28%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #09090f 48%, #111827 100%)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const loginCardStyle: React.CSSProperties = {
  maxWidth: 520,
  margin: '40px auto 0',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(24,24,37,0.88) 44%, rgba(30,27,75,0.74) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 30,
  padding: 26,
  boxShadow: '0 30px 80px rgba(0,0,0,0.34)',
};

const eyebrowStyle: React.CSSProperties = {
  margin: 0,
  color: '#fbbf24',
  fontWeight: 900,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  fontSize: 12,
};

const titleStyle: React.CSSProperties = {
  margin: '10px 0 8px',
  fontSize: 36,
  letterSpacing: '-0.03em',
  textShadow: '0 18px 60px rgba(0,0,0,0.42)',
};

const textStyle: React.CSSProperties = {
  margin: 0,
  color: '#a7b5c9',
  lineHeight: 1.6,
};

const socialIconsRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  marginTop: 20,
  marginBottom: 18,
};

const socialIconButtonStyle: React.CSSProperties = {
  width: 58,
  height: 58,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.10)',
  background: 'rgba(255,255,255,0.04)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 14px 28px rgba(0,0,0,0.18)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
};

const googleLogoStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  display: 'block',
};

const facebookLogoStyle: React.CSSProperties = {
  width: 38,
  height: 38,
  display: 'block',
};

const googleButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 14,
  border: '1px solid rgba(250, 204, 21, 0.18)',
  background: '#ffffff',
  color: '#111827',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 14px 28px rgba(0,0,0,0.20)',
};

const dividerWrapStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  color: '#7c8798',
  fontSize: 13,
};

const dividerLineStyle: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: 'rgba(250, 204, 21, 0.16)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 700,
};

const primaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 14,
  border: 'none',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  cursor: 'pointer',
  boxShadow: '0 18px 34px rgba(236,72,153,0.24)',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  borderRadius: 14,
  border: '1px solid rgba(250, 204, 21, 0.18)',
  background: 'rgba(2, 6, 23, 0.48)',
  color: '#f8fafc',
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 18,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
};

const successBoxStyle: React.CSSProperties = {
  marginTop: 18,
  padding: '14px 16px',
  borderRadius: 14,
  background: 'rgba(20, 83, 45, 0.35)',
  border: '1px solid rgba(74, 222, 128, 0.28)',
  color: '#bbf7d0',
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