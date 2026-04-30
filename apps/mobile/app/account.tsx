

import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { Link, router } from 'expo-router';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const accountActions = [
  {
    title: 'Mis cotizaciones',
    description: 'Revisa estados, propuestas y solicitudes recientes.',
    href: '/my-quotes',
  },
  {
    title: 'Mis reuniones',
    description: 'Consulta reuniones solicitadas o confirmadas.',
    href: '/my-meetings',
  },
  {
    title: 'Nueva cotización',
    description: 'Solicita luces, sonido, pantallas LED, tarimas, DJs y soporte.',
    href: '/cotizar',
  },
];

const whatsappUrl = 'https://wa.me/18299359774';

const openWhatsApp = async () => {
  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return;
    }

    await Linking.openURL('https://api.whatsapp.com/send?phone=18299359774');
  } catch (error) {
    console.warn('No se pudo abrir WhatsApp:', error);
  }
};

export default function AccountScreen() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUserEmail(user?.email ?? null);
      setCheckingSession(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
      setCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    router.replace('/login');
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

          <View style={styles.profileCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>SM</Text>
            </View>

            <Text style={styles.eyebrow}>Cuenta</Text>
            <Text style={styles.title}>Perfil del cliente</Text>
            <Text style={styles.description}>
              Esta sección centraliza el acceso del cliente a sus cotizaciones, reuniones y solicitudes. Por ahora está visual; luego se conectará con Supabase Auth.
            </Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Estado</Text>
              <Text style={styles.infoValue}>Modo visual</Text>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Acceso</Text>
              <Text style={styles.infoValue}>Cliente</Text>
            </View>
          </View>

          <View style={styles.actionsList}>
            {accountActions.map((action) => (
              <Link key={action.href} href={action.href} asChild>
                <Pressable style={styles.actionCard}>
                  <View style={styles.actionTextBlock}>
                    <Text style={styles.actionTitle}>{action.title}</Text>
                    <Text style={styles.actionDescription}>{action.description}</Text>
                  </View>
                  <Text style={styles.actionArrow}>›</Text>
                </Pressable>
              </Link>
            ))}
          </View>

          <Link href="/profile" asChild>
            <Pressable style={styles.profileButton}>
              <Text style={styles.profileButtonText}>Mi perfil</Text>
            </Pressable>
          </Link>

          <View style={styles.sessionCard}>
            <Text style={styles.sessionLabel}>Estado de cuenta</Text>
            {checkingSession ? (
              <Text style={styles.sessionText}>Revisando sesión...</Text>
            ) : userEmail ? (
              <>
                <Text style={styles.sessionTitle}>Sesión iniciada</Text>
                <Text style={styles.sessionText}>{userEmail}</Text>
                <Pressable onPress={signOut} style={styles.logoutButton}>
                  <Text style={styles.logoutButtonText}>Cerrar sesión</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.sessionTitle}>No has iniciado sesión</Text>
                <Text style={styles.sessionText}>
                  Inicia sesión para ver tus cotizaciones, reuniones, confirmar propuestas y subir comprobantes.
                </Text>
                <Link href="/login" asChild>
                  <Pressable style={styles.loginButton}>
                    <Text style={styles.loginButtonText}>Iniciar sesión</Text>
                  </Pressable>
                </Link>
              </>
            )}
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.sectionEyebrow}>Contacto directo</Text>
            <Text style={styles.contactTitle}>¿Necesitas ayuda con tu cuenta?</Text>
            <Text style={styles.contactText}>
              Escríbenos por WhatsApp y te ayudamos con tus cotizaciones, reuniones o datos del evento.
            </Text>
            <Pressable style={styles.whatsappButton} onPress={openWhatsApp}>
              <Text style={styles.whatsappButtonText}>829-935-9774</Text>
            </Pressable>
          </View>

          <View style={styles.noteCard}>
            <Text style={styles.noteTitle}>Pendiente de conexión</Text>
            <Text style={styles.noteText}>
              Luego conectaremos esta pantalla al usuario real de Supabase para mostrar nombre, correo, teléfono, historial y cerrar sesión.
            </Text>
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
  profileCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.16)',
    gap: 10,
  },
  avatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarText: {
    color: '#fed7aa',
    fontSize: 18,
    fontWeight: '900',
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
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoBox: {
    flex: 1,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(2, 6, 23, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  infoValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  actionsList: {
    gap: 12,
  },
  actionCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 6, 23, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'center',
  },
  actionTextBlock: {
    flex: 1,
    gap: 5,
  },
  actionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  actionDescription: {
    color: '#a8b8ce',
    fontSize: 14,
    lineHeight: 20,
  },
  actionArrow: {
    color: '#fbbf24',
    fontSize: 34,
    fontWeight: '300',
  },
  contactCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.22)',
    gap: 8,
  },
  sectionEyebrow: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  contactTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  contactText: {
    color: '#bfdbfe',
    fontSize: 14,
    lineHeight: 20,
  },
  whatsappButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.2)',
  },
  whatsappButtonText: {
    color: '#fde68a',
    fontWeight: '900',
  },
  noteCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.14)',
    gap: 6,
  },
  noteTitle: {
    color: '#fde68a',
    fontSize: 17,
    fontWeight: '900',
  },
  noteText: {
    color: '#cbd5e1',
    fontSize: 14,
    lineHeight: 20,
  },
  sessionCard: { borderRadius: 22, padding: 16, backgroundColor: 'rgba(2, 6, 23, 0.56)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 8, marginTop: 4 },
  sessionLabel: { color: '#fbbf24', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  sessionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  sessionText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  loginButton: { alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#f97316', marginTop: 4 },
  loginButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  logoutButton: { alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(127, 29, 29, 0.36)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.30)', marginTop: 4 },
  logoutButtonText: { color: '#fecaca', fontSize: 14, fontWeight: '900' },
  profileButton: { alignItems: 'center', justifyContent: 'center', minHeight: 50, borderRadius: 16, backgroundColor: '#f97316', marginTop: 8 },
  profileButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
});