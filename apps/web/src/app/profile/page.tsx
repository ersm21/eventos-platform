'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase/client';
import AppNavbar from '../../components/AppNavbar';

type Profile = {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function normalizeSupabasePublicUrl(url: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return url;

  return url
    .replace('http://127.0.0.1:54321', supabaseUrl)
    .replace('http://localhost:54321', supabaseUrl);
}

export default function ProfilePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const displayAvatarUrl = avatarPreviewUrl || avatarUrl;
  const profileIsComplete = !!fullName.trim() && !!displayAvatarUrl;

  const loadProfile = async () => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId(null);
      setUserEmail(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);
    setUserEmail(user.email ?? null);
    setLoginEmail(user.email ?? '');

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    if (data) {
      const loadedProfile = data as Profile;

      setFullName(loadedProfile.full_name ?? '');
      setPhone(loadedProfile.phone ?? '');
      setAvatarUrl(
        loadedProfile.avatar_url
          ? normalizeSupabasePublicUrl(loadedProfile.avatar_url)
          : null
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithEmail = async () => {
    if (!loginEmail.trim()) {
      setError('Escribe tu email.');
      return;
    }

    if (!loginPassword.trim()) {
      setError('Escribe tu contraseña.');
      return;
    }

    setLoggingIn(true);
    setError(null);
    setSuccessMessage(null);

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (loginError) {
      setError(loginError.message);
      setLoggingIn(false);
      return;
    }

    setLoginPassword('');
    setLoggingIn(false);
    await loadProfile();
  };

  const loginWithGoogle = async () => {
    setLoggingIn(true);
    setError(null);
    setSuccessMessage(null);

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });

    if (googleError) {
      setError(googleError.message);
      setLoggingIn(false);
    }
  };

  const handleAvatarChange = (file: File | null) => {
    setSelectedAvatarFile(file);

    if (!file) {
      setAvatarPreviewUrl(null);
      return;
    }

    setAvatarPreviewUrl(URL.createObjectURL(file));
  };

  const uploadAvatarIfNeeded = async () => {
    if (!userId || !selectedAvatarFile) return avatarUrl;

    setUploadingAvatar(true);

    const safeName = selectedAvatarFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, selectedAvatarFile, {
        contentType: selectedAvatarFile.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      setUploadingAvatar(false);
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const publicUrl = normalizeSupabasePublicUrl(publicUrlData.publicUrl);
    setAvatarUrl(publicUrl);
    setAvatarPreviewUrl(null);
    setSelectedAvatarFile(null);
    setUploadingAvatar(false);

    return publicUrl;
  };

  const saveProfile = async () => {
    if (!userId) {
      setError('Debes iniciar sesión.');
      return;
    }

    if (!fullName.trim()) {
      setError('Debes escribir tu nombre completo.');
      return;
    }

    if (!avatarUrl && !selectedAvatarFile) {
      setError('Debes subir una foto de perfil.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const nextAvatarUrl = await uploadAvatarIfNeeded();

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: userId,
            full_name: fullName.trim(),
            phone: phone.trim() || null,
            avatar_url: nextAvatarUrl,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (saveError) {
        setError(saveError.message);
        setSaving(false);
        return;
      }

      setSuccessMessage('Tu perfil fue actualizado correctamente.');
      setSaving(false);
      await loadProfile();
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : 'Error inesperado guardando el perfil.';

      setError(message);
      setSaving(false);
      setUploadingAvatar(false);
    }
  };

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <AppNavbar ctaHref="/cotizar" ctaLabel="Cotizar ahora" />

        <section style={heroCardStyle}>
          <p style={eyebrowStyle}>Cuenta</p>
          <h1 style={heroTitleStyle}>Mi perfil</h1>
          <p style={heroTextStyle}>
            {userId
              ? 'Completa tu perfil para usar todas las funciones de cliente.'
              : 'Inicia sesión para acceder y completar tu perfil.'}
          </p>
        </section>

        {loading ? (
          <div style={infoBoxStyle}>Cargando perfil...</div>
        ) : !userId ? (
          <section style={cardStyle}>
            <h2 style={cardTitleStyle}>Iniciar sesión</h2>
            <p style={mutedTextStyle}>
              Entra con tu cuenta para ver y completar tu perfil.
            </p>

            <div style={formGridStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle}>Email</span>
                <input
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  type="email"
                  placeholder="tuemail@email.com"
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Contraseña</span>
                <input
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  type="password"
                  placeholder="Tu contraseña"
                  style={inputStyle}
                />
              </label>
            </div>

            {error && <div style={errorBoxStyle}>{error}</div>}

            <div style={actionsRowStyle}>
              <button
                type="button"
                onClick={loginWithEmail}
                disabled={loggingIn}
                style={{
                  ...primaryButtonStyle,
                  opacity: loggingIn ? 0.65 : 1,
                }}
              >
                {loggingIn ? 'Entrando...' : 'Iniciar sesión'}
              </button>

              <button
                type="button"
                onClick={loginWithGoogle}
                disabled={loggingIn}
                style={{
                  ...secondaryButtonStyle,
                  opacity: loggingIn ? 0.65 : 1,
                }}
              >
                Continuar con Google
              </button>
            </div>
          </section>
        ) : (
          <section style={cardStyle}>
            <div style={profileHeaderStyle}>
              <div style={avatarWrapStyle}>
                {displayAvatarUrl ? (
                  <img
                    src={displayAvatarUrl}
                    alt="Foto de perfil"
                    style={avatarImageStyle}
                  />
                ) : (
                  <div style={avatarPlaceholderStyle}>+</div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <p style={eyebrowStyle}>Estado del perfil</p>
                <h2 style={cardTitleStyle}>
                  {profileIsComplete ? 'Perfil completo' : 'Falta foto o nombre'}
                </h2>
                <p style={mutedTextStyle}>
                  Sesión iniciada como {userEmail || 'cliente'}.
                </p>
              </div>
            </div>

            <div style={formGridStyle}>
              <label style={fieldStyle}>
                <span style={labelStyle}>Foto de perfil</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    handleAvatarChange(file);
                  }}
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Email</span>
                <input
                  value={userEmail || ''}
                  disabled
                  style={{
                    ...inputStyle,
                    opacity: 0.7,
                    cursor: 'not-allowed',
                  }}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Nombre completo</span>
                <input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Escribe tu nombre completo"
                  style={inputStyle}
                />
              </label>

              <label style={fieldStyle}>
                <span style={labelStyle}>Teléfono</span>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="Ej: 829-935-9774"
                  style={inputStyle}
                />
              </label>
            </div>

            {error && <div style={errorBoxStyle}>{error}</div>}
            {successMessage && <div style={successBoxStyle}>{successMessage}</div>}

            <div style={actionsRowStyle}>
              <button
                type="button"
                onClick={saveProfile}
                disabled={saving || uploadingAvatar}
                style={{
                  ...primaryButtonStyle,
                  opacity: saving || uploadingAvatar ? 0.65 : 1,
                }}
              >
                {saving || uploadingAvatar ? 'Guardando...' : 'Guardar perfil'}
              </button>

              <Link href="/account" style={secondaryLinkStyle}>
                Volver a mi cuenta
              </Link>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  color: '#f8fafc',
  padding: '34px 20px 80px',
  background:
    'radial-gradient(circle at 12% 18%, rgba(168,85,247,0.20), transparent 28%), radial-gradient(circle at 88% 12%, rgba(245,158,11,0.16), transparent 28%), linear-gradient(135deg, #020617 0%, #09090f 48%, #111827 100%)',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

const containerStyle: React.CSSProperties = {
  maxWidth: 980,
  margin: '0 auto',
};

const heroCardStyle: React.CSSProperties = {
  position: 'relative',
  overflow: 'hidden',
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(24,24,37,0.88) 42%, rgba(30,27,75,0.86) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.16)',
  borderRadius: 28,
  padding: 24,
  boxShadow: '0 24px 58px rgba(0,0,0,0.30)',
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
  margin: '10px 0 8px',
  fontSize: 42,
  lineHeight: 1.04,
  letterSpacing: '-0.04em',
};

const heroTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.6,
};

const cardStyle: React.CSSProperties = {
  marginTop: 14,
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(30,27,75,0.42) 52%, rgba(9,14,28,0.92) 100%)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  borderRadius: 22,
  padding: 18,
  boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
};

const cardTitleStyle: React.CSSProperties = {
  margin: '8px 0 6px',
  fontSize: 24,
};

const mutedTextStyle: React.CSSProperties = {
  margin: 0,
  color: '#94a3b8',
  lineHeight: 1.55,
};

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 12,
  marginTop: 16,
};

const fieldStyle: React.CSSProperties = {
  display: 'grid',
  gap: 7,
};

const labelStyle: React.CSSProperties = {
  color: '#cbd5e1',
  fontSize: 13,
  fontWeight: 800,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 48,
  padding: '12px 13px',
  borderRadius: 14,
  border: '1px solid rgba(250, 204, 21, 0.14)',
  background: 'rgba(2, 6, 23, 0.68)',
  color: '#f8fafc',
  outline: 'none',
};

const profileHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  flexWrap: 'wrap',
};

const avatarWrapStyle: React.CSSProperties = {
  width: 118,
  height: 118,
  borderRadius: 999,
  border: '2px solid rgba(250, 204, 21, 0.30)',
  overflow: 'hidden',
  background: 'rgba(2, 6, 23, 0.60)',
  display: 'grid',
  placeItems: 'center',
  flexShrink: 0,
};

const avatarImageStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
};

const avatarPlaceholderStyle: React.CSSProperties = {
  color: '#fbbf24',
  fontSize: 44,
  fontWeight: 900,
};

const actionsRowStyle: React.CSSProperties = {
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
  border: 'none',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 48%, #8b5cf6 100%)',
  color: '#fff',
  fontWeight: 900,
  boxShadow: '0 16px 30px rgba(236,72,153,0.22)',
};

const secondaryButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '11px 15px',
  borderRadius: 14,
  border: '1px solid rgba(250, 204, 21, 0.18)',
  cursor: 'pointer',
  background: 'rgba(2, 6, 23, 0.48)',
  color: '#f8fafc',
  fontWeight: 800,
};

const secondaryLinkStyle: React.CSSProperties = {
  ...secondaryButtonStyle,
  textDecoration: 'none',
};

const infoBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: '16px',
  borderRadius: 16,
  background: 'rgba(15, 23, 42, 0.78)',
  border: '1px solid rgba(250, 204, 21, 0.14)',
  color: '#a7b5c9',
};

const errorBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: '13px 15px',
  borderRadius: 14,
  background: 'rgba(127, 29, 29, 0.30)',
  border: '1px solid rgba(248, 113, 113, 0.32)',
  color: '#fecaca',
  fontWeight: 800,
};

const successBoxStyle: React.CSSProperties = {
  marginTop: 14,
  padding: '13px 15px',
  borderRadius: 14,
  background: 'rgba(20, 83, 45, 0.35)',
  border: '1px solid rgba(74, 222, 128, 0.28)',
  color: '#bbf7d0',
  fontWeight: 800,
};
