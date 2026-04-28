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
        redirectTo: 'http://localhost:3000/my-quotes',
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
      return;
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(59,130,246,0.14), transparent 24%), linear-gradient(180deg, #0f172a 0%, #111827 50%, #0b1120 100%)',
        color: '#e5e7eb',
        padding: '40px 20px 80px',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <AppNavbar ctaHref="/" ctaLabel="Volver al inicio" />

        <section
          style={{
            maxWidth: 520,
            margin: '40px auto 0',
            background: 'rgba(15, 23, 42, 0.78)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
          }}
        >
          <p
            style={{
              margin: 0,
              color: '#60a5fa',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: 12,
            }}
          >
            Acceso cliente
          </p>

          <h1 style={{ margin: '10px 0 8px', fontSize: 34 }}>
            {isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </h1>

          <p style={{ margin: 0, color: '#94a3b8' }}>
            Accede a tus cotizaciones, comprobantes y estado de tu evento.
          </p>

          {error && (
            <div
              style={{
                marginTop: 18,
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(127, 29, 29, 0.30)',
                border: '1px solid rgba(248, 113, 113, 0.32)',
                color: '#fecaca',
              }}
            >
              {error}
            </div>
          )}

          {message && (
            <div
              style={{
                marginTop: 18,
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(20, 83, 45, 0.35)',
                border: '1px solid rgba(74, 222, 128, 0.28)',
                color: '#bbf7d0',
              }}
            >
              {message}
            </div>
          )}

          <div style={{ display: 'grid', gap: 14, marginTop: 20 }}>
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid rgba(148, 163, 184, 0.18)',
                background: '#ffffff',
                color: '#111827',
                fontWeight: 800,
                cursor: 'pointer',
                opacity: googleLoading ? 0.7 : 1,
              }}
            >
              {googleLoading ? 'Abriendo Google...' : 'Continuar con Google'}
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                color: '#64748b',
                fontSize: 13,
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'rgba(148, 163, 184, 0.18)' }} />
              <span>o continúa con email</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(148, 163, 184, 0.18)' }} />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: 6,
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
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
              <label
                style={{
                  display: 'block',
                  marginBottom: 6,
                  color: '#94a3b8',
                  fontSize: 13,
                }}
              >
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
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                borderRadius: 12,
                border: 'none',
                background: '#2563eb',
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 16px',
                borderRadius: 12,
                border: '1px solid rgba(148, 163, 184, 0.18)',
                background: '#0f172a',
                color: '#e5e7eb',
                fontWeight: 700,
                cursor: 'pointer',
              }}
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

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  borderRadius: 12,
  border: '1px solid rgba(148, 163, 184, 0.18)',
  background: '#0f172a',
  color: '#e5e7eb',
};