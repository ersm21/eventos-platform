import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Faltan datos', 'Escribe tu correo y contraseña para continuar.');
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsLoading(false);

    if (error) {
      Alert.alert('No se pudo iniciar sesión', error.message);
      return;
    }

    Alert.alert('Bienvenido', 'Has iniciado sesión correctamente.', [
      {
        text: 'OK',
        onPress: () => router.replace('/'),
      },
    ]);
  };

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
            <Text style={styles.eyebrow}>Acceso cliente</Text>
            <Text style={styles.title}>Entra a tu cuenta de SM Events</Text>
            <Text style={styles.description}>
              Accede para revisar tus cotizaciones, reuniones y solicitudes desde la app.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Correo electrónico</Text>
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
              onPress={handleLogin}
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              disabled={isLoading}
            >
              <Text style={styles.submitButtonText}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </Text>
            </Pressable>

            <View style={styles.divider} />

            <Text style={styles.helperText}>
              Usa el correo y contraseña registrados en SM Events para acceder a tus cotizaciones y reuniones.
            </Text>
          </View>

          <View style={styles.quickActions}>
            <Link href="/cotizar" asChild>
              <Pressable style={styles.quickCard}>
                <Text style={styles.quickTitle}>¿No tienes cuenta?</Text>
                <Text style={styles.quickText}>Puedes solicitar una cotización y luego organizamos tu acceso.</Text>
              </Pressable>
            </Link>

            <Link href="/my-quotes" asChild>
              <Pressable style={styles.quickCard}>
                <Text style={styles.quickTitle}>Ver cotizaciones</Text>
                <Text style={styles.quickText}>Revisa tus cotizaciones desde la app.</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 42,
    gap: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  backButtonText: {
    color: '#e5e7eb',
    fontSize: 13,
    fontWeight: '900',
  },
  logo: {
    width: 78,
    height: 54,
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.16)',
    gap: 12,
  },
  eyebrow: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    lineHeight: 36,
    fontWeight: '900',
    letterSpacing: -1.1,
  },
  description: {
    color: '#a8b8ce',
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(2, 6, 23, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    gap: 14,
  },
  fieldGroup: {
    gap: 7,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
  },
  input: {
    minHeight: 48,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
    color: '#f8fafc',
    fontSize: 15,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: '#f97316',
  },
  submitButtonDisabled: {
    opacity: 0.64,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.16)',
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
  },
  quickActions: {
    gap: 12,
  },
  quickCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.62)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  quickTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 6,
  },
  quickText: {
    color: '#a8b8ce',
    fontSize: 14,
    lineHeight: 20,
  },
});
