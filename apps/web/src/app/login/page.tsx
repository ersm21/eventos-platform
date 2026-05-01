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
              <span style={googleIconStyle}>G</span>
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
              <span style={facebookIconStyle}>f</span>
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
  width: 56,
  height: 56,
  borderRadius: 999,
  border: '1px solid rgba(255,255,255,0.18)',
  background: 'rgba(255,255,255,0.96)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  boxShadow: '0 14px 28px rgba(0,0,0,0.22)',
};

const googleIconStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #4285F4 0%, #34A853 35%, #FBBC05 68%, #EA4335 100%)',
  color: '#ffffff',
  fontWeight: 900,
  fontSize: 20,
  lineHeight: 1,
};

const facebookIconStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  borderRadius: 999,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#1877f2',
  color: '#ffffff',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontWeight: 900,
  fontSize: 26,
  lineHeight: 1,
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