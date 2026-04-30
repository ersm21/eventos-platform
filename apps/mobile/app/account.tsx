import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  return (
    <LinearGradient colors={['#020617', '#070914', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>SM</Text>
            </View>

            <Text style={styles.eyebrow}>Cuenta</Text>
            <Text style={styles.title}>Área del cliente</Text>
            <Text style={styles.subtitle}>
              Accede a tu perfil, cotizaciones, reuniones y seguimiento de solicitudes.
            </Text>
          </View>

          <View style={styles.statusGrid}>
            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Estado</Text>
              <Text style={styles.statusValue}>Cliente</Text>
            </View>

            <View style={styles.statusCard}>
              <Text style={styles.statusLabel}>Acceso</Text>
              <Text style={styles.statusValue}>App</Text>
            </View>
          </View>

          <View style={styles.menuList}>
            <Link href="/my-quotes" asChild>
              <Pressable style={styles.menuCard}>
                <View>
                  <Text style={styles.menuTitle}>Mis cotizaciones</Text>
                  <Text style={styles.menuText}>Revisa estados, propuestas y solicitudes recientes.</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </Pressable>
            </Link>

            <Link href="/my-meetings" asChild>
              <Pressable style={styles.menuCard}>
                <View>
                  <Text style={styles.menuTitle}>Mis reuniones</Text>
                  <Text style={styles.menuText}>Consulta reuniones solicitadas o confirmadas.</Text>
                </View>
                <Text style={styles.menuArrow}>›</Text>
              </Pressable>
            </Link>
          </View>

          <Link href="/profile" asChild>
            <Pressable style={styles.profileButton}>
              <Text style={styles.profileButtonText}>Mi perfil</Text>
            </Pressable>
          </Link>

          <View style={styles.contactCard}>
            <Text style={styles.contactEyebrow}>Contacto directo</Text>
            <Text style={styles.contactTitle}>¿Necesitas ayuda con tu cuenta?</Text>
            <Text style={styles.contactText}>
              Escríbenos por WhatsApp y te ayudamos con cotizaciones, reuniones o datos del evento.
            </Text>

            <Pressable style={styles.whatsappButton} onPress={openWhatsApp}>
              <Text style={styles.whatsappButtonText}>Escribir por WhatsApp</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 112, gap: 12 },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    padding: 16,
    paddingTop: 20,
    paddingLeft: 84,
    minHeight: 132,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.16)',
    gap: 7,
    justifyContent: 'center',
  },
  logoCircle: {
    position: 'absolute',
    top: 18,
    left: 16,
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(249,115,22,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.40)',
  },
  logoText: { color: '#fed7aa', fontSize: 17, fontWeight: '900' },
  eyebrow: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 27,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  subtitle: { color: '#94a3b8', fontSize: 13, lineHeight: 19 },
  statusGrid: { flexDirection: 'row', gap: 10 },
  statusCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(2,6,23,0.42)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
    justifyContent: 'center',
    gap: 4,
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusValue: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  menuList: { gap: 10 },
  menuCard: {
    minHeight: 84,
    borderRadius: 18,
    padding: 14,
    backgroundColor: 'rgba(2,6,23,0.44)',
    borderWidth: 1,
    borderColor: 'rgba(148,163,184,0.14)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  menuTitle: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  menuText: { color: '#94a3b8', fontSize: 12, lineHeight: 17, marginTop: 4 },
  menuArrow: { color: '#fbbf24', fontSize: 32, fontWeight: '700' },
  profileButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#f97316',
  },
  profileButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  contactCard: {
    borderRadius: 20,
    padding: 15,
    backgroundColor: 'rgba(37,99,235,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(96,165,250,0.22)',
    gap: 7,
  },
  contactEyebrow: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  contactTitle: { color: '#ffffff', fontSize: 20, lineHeight: 23, fontWeight: '900' },
  contactText: { color: '#bfdbfe', fontSize: 12, lineHeight: 18 },
  whatsappButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(250,204,21,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.20)',
  },
  whatsappButtonText: { color: '#fde68a', fontWeight: '900' },
});
