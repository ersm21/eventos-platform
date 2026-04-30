import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Linking,
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

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
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) return url;

  return url
    .replace('http://127.0.0.1:54321', supabaseUrl)
    .replace('http://localhost:54321', supabaseUrl);
}

export default function ProfileScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayAvatarUrl = localAvatarUri || avatarUrl;

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

    return () => subscription.unsubscribe();
  }, []);

  const loginFromProfile = async () => {
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

  const loginWithGoogleFromProfile = async () => {
    setLoggingIn(true);
    setError(null);

    const { data, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
      },
    });

    if (googleError) {
      setError(googleError.message);
      setLoggingIn(false);
      return;
    }

    if (data?.url) {
      await Linking.openURL(data.url);
    }

    setLoggingIn(false);
  };

  const pickAvatar = async () => {
    if (!userId) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Necesitas dar permiso para acceder a la galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.82,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setUploadingAvatar(true);
    setError(null);

    try {
      const asset = result.assets[0];
      setLocalAvatarUri(asset.uri);

      const response = await fetch(asset.uri);
      const arrayBuffer = await response.arrayBuffer();

      const filePath = `${userId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        setError(uploadError.message);
        setUploadingAvatar(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = normalizeSupabasePublicUrl(publicUrlData.publicUrl);
      setAvatarUrl(`${publicUrl}?v=${Date.now()}`);
      setUploadingAvatar(false);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : 'Error inesperado subiendo la foto.';

      setError(message);
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async () => {
    if (!userId) {
      setError('Debes iniciar sesión.');
      return;
    }

    if (!avatarUrl && !localAvatarUri) {
      setError('Debes subir una foto de perfil.');
      return;
    }

    if (!fullName.trim()) {
      setError('Debes escribir tu nombre completo.');
      return;
    }

    setSaving(true);
    setError(null);

    const cleanAvatarUrl = avatarUrl ? avatarUrl.split('?v=')[0] : null;

    const payload = {
      user_id: userId,
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      avatar_url: cleanAvatarUrl,
      updated_at: new Date().toISOString(),
    };

    const { error: saveError } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' });

    if (saveError) {
      setError(saveError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    Alert.alert('Perfil guardado', 'Tu perfil fue actualizado correctamente.');
    await loadProfile();
  };

  const profileIsComplete = (!!avatarUrl || !!localAvatarUri) && !!fullName.trim();

  return (
    <LinearGradient colors={['#020617', '#070914', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Cuenta</Text>
              <Text style={styles.title}>Mi perfil</Text>
              <Text style={styles.subtitle}>
                {userId
                  ? 'Completa tu perfil para usar todas las funciones de cliente.'
                  : 'Inicia sesión para acceder y completar tu perfil.'}
              </Text>
            </View>

            <Link href="/account" asChild>
              <Pressable style={styles.backButton}>
                <Text style={styles.backButtonText}>Cuenta</Text>
              </Pressable>
            </Link>
          </View>

          {loading ? (
            <View style={styles.infoCard}>
              <ActivityIndicator color="#fbbf24" />
              <Text style={styles.infoText}>Cargando...</Text>
            </View>
          ) : !userId ? (
            <View style={styles.card}>
              <Text style={styles.loginTitle}>Iniciar sesión</Text>
              <Text style={styles.loginText}>
                Entra con tu cuenta para ver y completar tu perfil.
              </Text>

              <View>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="tuemail@email.com"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              <View>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  secureTextEntry
                  placeholder="Tu contraseña"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                onPress={loginFromProfile}
                disabled={loggingIn}
                style={[styles.saveButton, loggingIn && styles.disabledButton]}
              >
                <Text style={styles.saveButtonText}>
                  {loggingIn ? 'Entrando...' : 'Iniciar sesión'}
                </Text>
              </Pressable>

              <Pressable
                onPress={loginWithGoogleFromProfile}
                disabled={loggingIn}
                style={[styles.googleButton, loggingIn && styles.disabledButton]}
              >
                <Text style={styles.googleButtonText}>Continuar con Google</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.avatarWrap}>
                {displayAvatarUrl ? (
                  <Image
                    source={{ uri: displayAvatarUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>+</Text>
                  </View>
                )}

                <Pressable
                  onPress={pickAvatar}
                  disabled={uploadingAvatar}
                  style={[styles.avatarButton, uploadingAvatar && styles.disabledButton]}
                >
                  <Text style={styles.avatarButtonText}>
                    {uploadingAvatar ? 'Subiendo...' : displayAvatarUrl ? 'Cambiar foto' : 'Subir foto'}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.statusBox}>
                <Text style={styles.statusLabel}>Estado del perfil</Text>
                <Text style={profileIsComplete ? styles.statusComplete : styles.statusPending}>
                  {profileIsComplete ? 'Perfil completo' : 'Falta foto de perfil o nombre'}
                </Text>
              </View>

              {userEmail && (
                <View>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.readOnlyValue}>{userEmail}</Text>
                </View>
              )}

              <View>
                <Text style={styles.label}>Nombre completo</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Escribe tu nombre completo"
                  placeholderTextColor="#64748b"
                  style={styles.input}
                />
              </View>

              <View>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Ej: 829-935-9774"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  style={styles.input}
                />
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable
                onPress={saveProfile}
                disabled={saving}
                style={[styles.saveButton, saving && styles.disabledButton]}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Guardando...' : 'Guardar perfil'}
                </Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 118, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  eyebrow: { color: '#fbbf24', fontSize: 12, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 36, lineHeight: 39, fontWeight: '900', letterSpacing: -1.2, marginTop: 4 },
  subtitle: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginTop: 6, maxWidth: 270 },
  backButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.86)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.16)' },
  backButtonText: { color: '#fde68a', fontSize: 12, fontWeight: '900' },
  infoCard: { padding: 18, borderRadius: 22, backgroundColor: 'rgba(15,23,42,0.84)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.14)', gap: 10, alignItems: 'center' },
  infoText: { color: '#cbd5e1', fontSize: 14, fontWeight: '800' },
  card: { borderRadius: 26, padding: 18, backgroundColor: 'rgba(15,23,42,0.88)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.14)', gap: 16 },
  loginTitle: { color: '#ffffff', fontSize: 24, fontWeight: '900' },
  loginText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  avatarWrap: { alignItems: 'center', gap: 12 },
  avatarImage: { width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(2,6,23,0.60)', borderWidth: 2, borderColor: 'rgba(250,204,21,0.30)' },
  avatarPlaceholder: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(2,6,23,0.60)', borderWidth: 2, borderColor: 'rgba(250,204,21,0.24)' },
  avatarPlaceholderText: { color: '#fbbf24', fontSize: 44, fontWeight: '900' },
  avatarButton: { paddingVertical: 11, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#f97316' },
  avatarButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  statusBox: { padding: 13, borderRadius: 16, backgroundColor: 'rgba(2,6,23,0.42)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', gap: 4 },
  statusLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  statusComplete: { color: '#86efac', fontSize: 14, fontWeight: '900' },
  statusPending: { color: '#fde68a', fontSize: 14, fontWeight: '900' },
  label: { color: '#cbd5e1', fontSize: 13, fontWeight: '800', marginBottom: 7 },
  readOnlyValue: { color: '#94a3b8', fontSize: 14, fontWeight: '700', paddingVertical: 12, paddingHorizontal: 13, borderRadius: 14, backgroundColor: 'rgba(2,6,23,0.42)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
  input: { minHeight: 48, borderRadius: 14, paddingHorizontal: 13, paddingVertical: 11, backgroundColor: 'rgba(2,6,23,0.56)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', color: '#f8fafc', fontSize: 14 },
  errorBox: { padding: 13, borderRadius: 14, backgroundColor: 'rgba(127,29,29,0.30)', borderWidth: 1, borderColor: 'rgba(248,113,113,0.32)' },
  errorText: { color: '#fecaca', fontSize: 13, fontWeight: '800' },
  saveButton: { alignItems: 'center', justifyContent: 'center', minHeight: 50, borderRadius: 16, backgroundColor: '#f97316' },
  saveButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  googleButton: { alignItems: 'center', justifyContent: 'center', minHeight: 50, borderRadius: 16, backgroundColor: 'rgba(2,6,23,0.56)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.22)' },
  googleButtonText: { color: '#f8fafc', fontSize: 15, fontWeight: '900' },
  disabledButton: { opacity: 0.6 },
});
