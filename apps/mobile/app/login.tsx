import { LinearGradient } from 'expo-linear-gradient';
import * as Linking from 'expo-linking';
import { Link, router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
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

WebBrowser.maybeCompleteAuthSession();

function getTokensFromUrl(url: string) {
  const parsedUrl = new URL(url.replace('#', '?'));
  const accessToken = parsedUrl.searchParams.get('access_token');
  const refreshToken = parsedUrl.searchParams.get('refresh_token');

  return { accessToken, refreshToken };
}

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace('/account');
        return;
      }

      setCheckingSession(false);
    };

    checkSession();
  }, []);

  const signInWithEmail = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Escribe tu email y contraseña.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    setSuccessMessage('Sesión iniciada correctamente.');
    setLoading(false);
    router.replace('/account');
  };

  const createAccountWithEmail = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Escribe tu email y contraseña para crear la cuenta.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSuccessMessage('Cuenta creada. Revisa tu correo si Supabase pide confirmación.');
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const redirectTo = Linking.createURL('/login');

    const { data, error: googleError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });

    if (googleError || !data?.url) {
      setError(googleError?.message || 'No pudimos iniciar sesión con Google.');
      setLoading(false);
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

    if (result.type !== 'success') {
      setLoading(false);
      return;
    }

    const { accessToken, refreshToken } = getTokensFromUrl(result.url);

    if (!accessToken || !refreshToken) {
      setError('No pudimos completar la sesión de Google. Revisa los redirect URLs en Supabase.');
      setLoading(false);
      return;
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) {
      setError(sessionError.message);
      setLoading(false);
      return;
    }

    setSuccessMessage('Sesión iniciada con Google.');
    setLoading(false);
    router.replace('/account');
  };

  if (checkingSession) {
    return (
      <LinearGradient colors={['#020617', '#09090f', '#111827']} style={styles.page}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#fbbf24" />
            <Text style={styles.loadingText}>Revisando sesión...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#020617', '#09090f', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Link href="/" asChild>
              <Pressable style={styles.backButton}>
                <Text style={styles.backButtonText}>← Inicio</Text>
              </Pressable>
            </Link>

            <Image source={require('../assets/images/sm-logo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Acceso de cliente</Text>
            <Text style={styles.title}>Inicia sesión en SM Events</Text>
            <Text style={styles.description}>
              Entra para guardar cotizaciones, revisar reuniones, confirmar propuestas y subir comprobantes.
            </Text>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Entrar con email</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="cliente@email.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Contraseña</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Tu contraseña"
                placeholderTextColor="#64748b"
                secureTextEntry
                style={styles.input}
              />
            </View>

            <Pressable
              onPress={signInWithEmail}
              disabled={loading}
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
            >
              <Text style={styles.primaryButtonText}>{loading ? 'Procesando...' : 'Iniciar sesión'}</Text>
            </Pressable>

            <Pressable
              onPress={createAccountWithEmail}
              disabled={loading}
              style={[styles.secondaryButton, loading && styles.buttonDisabled]}
            >
              <Text style={styles.secondaryButtonText}>Crear cuenta con email</Text>
            </Pressable>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            onPress={signInWithGoogle}
            disabled={loading}
            style={[styles.googleButton, loading && styles.buttonDisabled]}
          >
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Entrar con Google</Text>
          </Pressable>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Importante</Text>
            <Text style={styles.noteText}>
              Para que Google funcione, Supabase debe tener Google Provider activo y el redirect URL de la app permitido.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 118, gap: 16 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: '#e5e7eb', fontSize: 15, fontWeight: '800' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  backButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(15, 23, 42, 0.82)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.18)' },
  backButtonText: { color: '#e5e7eb', fontSize: 13, fontWeight: '900' },
  logo: { width: 78, height: 54 },
  heroCard: { borderRadius: 28, padding: 22, backgroundColor: 'rgba(15, 23, 42, 0.82)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)', gap: 12 },
  eyebrow: { color: '#fbbf24', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.2 },
  description: { color: '#a8b8ce', fontSize: 15, lineHeight: 22 },
  errorBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(127, 29, 29, 0.30)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.32)' },
  errorText: { color: '#fecaca', fontWeight: '800' },
  successBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(20, 83, 45, 0.35)', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.28)' },
  successText: { color: '#bbf7d0', fontWeight: '800' },
  formCard: { borderRadius: 24, padding: 18, backgroundColor: 'rgba(2, 6, 23, 0.56)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.14)', gap: 14 },
  sectionTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  fieldGroup: { gap: 7 },
  label: { color: '#cbd5e1', fontSize: 13, fontWeight: '800' },
  input: { minHeight: 48, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: 'rgba(15, 23, 42, 0.92)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.18)', color: '#f8fafc', fontSize: 15 },
  primaryButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 18, backgroundColor: '#f97316' },
  primaryButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  secondaryButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 18, backgroundColor: 'rgba(2, 6, 23, 0.48)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.18)' },
  secondaryButtonText: { color: '#f8fafc', fontSize: 15, fontWeight: '900' },
  buttonDisabled: { opacity: 0.58 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(148, 163, 184, 0.18)' },
  dividerText: { color: '#94a3b8', fontSize: 13, fontWeight: '900' },
  googleButton: { minHeight: 54, borderRadius: 18, backgroundColor: '#ffffff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  googleIcon: { color: '#111827', fontSize: 18, fontWeight: '900' },
  googleButtonText: { color: '#111827', fontSize: 15, fontWeight: '900' },
  noteCard: { padding: 16, borderRadius: 22, backgroundColor: 'rgba(250, 204, 21, 0.08)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 6 },
  noteTitle: { color: '#fde68a', fontSize: 17, fontWeight: '900' },
  noteText: { color: '#cbd5e1', fontSize: 14, lineHeight: 20 },
});
