import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const services = ['Luces', 'Sonido', 'Pantallas LED', 'Tarimas', 'DJs'];
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

export default function Index() {
  return (
    <LinearGradient colors={['#020617', '#09090f', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image source={require('../assets/images/sm-logo.png')} style={styles.logo} resizeMode="contain" />
            <View>
              <Text style={styles.brandLabel}>SM Events</Text>
              <Text style={styles.brandSubtitle}>Producción de eventos</Text>
            </View>
          </View>

          <View style={styles.navRow}>
            <Link href="/catalogo" asChild>
              <Pressable style={styles.navPill}>
                <Text style={styles.navPillText}>Catálogo</Text>
              </Pressable>
            </Link>

            <Link href="/galeria" asChild>
              <Pressable style={styles.navPill}>
                <Text style={styles.navPillText}>Galería</Text>
              </Pressable>
            </Link>

            <Link href="/cotizar" asChild>
              <Pressable style={styles.navPill}>
                <Text style={styles.navPillText}>Cotizar</Text>
              </Pressable>
            </Link>

            <Link href="/my-quotes" asChild>
              <Pressable style={styles.navPill}>
                <Text style={styles.navPillText}>Cotizaciones</Text>
              </Pressable>
            </Link>

            <Link href="/my-meetings" asChild>
              <Pressable style={styles.navPill}>
                <Text style={styles.navPillText}>Reuniones</Text>
              </Pressable>
            </Link>

            <Link href="/account" asChild>
              <Pressable style={styles.navPill}>
                <Text style={styles.navPillText}>Cuenta</Text>
              </Pressable>
            </Link>

            <Link href="/login" asChild>
              <Pressable style={styles.navPillPrimary}>
                <Text style={styles.navPillPrimaryText}>Login</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Producción técnica</Text>
            <Text style={styles.title}>Haz que tu evento se vea y suene como debe</Text>
            <Text style={styles.description}>
              Cotiza luces, sonido, pantallas LED, tarimas, DJs y soporte técnico desde una app diseñada para organizar tu evento con claridad.
            </Text>

            <View style={styles.actionsRow}>
              <Link href="/cotizar" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Cotizar evento</Text>
                </Pressable>
              </Link>

              <Link href="/catalogo" asChild>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Ver catálogo</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Servicios</Text>
            <Text style={styles.sectionTitle}>Lo que puedes solicitar</Text>
          </View>

          <View style={styles.servicesGrid}>
            {services.map((service) => (
              <View key={service} style={styles.servicePill}>
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>

          <View style={styles.quickGrid}>
            <Link href="/my-quotes" asChild>
              <Pressable style={styles.quickCard}>
                <Text style={styles.quickTitle}>Mis cotizaciones</Text>
                <Text style={styles.quickText}>Revisa solicitudes, estados y propuestas aprobadas.</Text>
              </Pressable>
            </Link>

            <Link href="/my-meetings" asChild>
              <Pressable style={styles.quickCard}>
                <Text style={styles.quickTitle}>Mis reuniones</Text>
                <Text style={styles.quickText}>Consulta horarios y solicitudes de reunión.</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.contactCard}>
            <Text style={styles.sectionEyebrow}>Contacto</Text>
            <Text style={styles.contactTitle}>¿Necesitas ayuda rápida?</Text>
            <Text style={styles.contactText}>Escríbenos por WhatsApp para ayudarte a preparar tu evento.</Text>
            <Pressable style={styles.whatsappButton} onPress={openWhatsApp}>
              <Text style={styles.whatsappButtonText}>829-935-9774</Text>
            </Pressable>
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
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
  },
  logo: {
    width: 78,
    height: 54,
  },
  brandLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '900',
  },
  brandSubtitle: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  navRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -4,
  },
  navPill: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  navPillText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '900',
  },
  navPillPrimary: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.38)',
  },
  navPillPrimaryText: {
    color: '#fed7aa',
    fontSize: 12,
    fontWeight: '900',
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
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '900',
    letterSpacing: -1.2,
  },
  description: {
    color: '#a8b8ce',
    fontSize: 15,
    lineHeight: 22,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 6,
  },
  primaryButton: {
    backgroundColor: '#f97316',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontWeight: '900',
    fontSize: 14,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionEyebrow: {
    color: '#60a5fa',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  servicePill: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.16)',
  },
  serviceText: {
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '800',
  },
  quickGrid: {
    gap: 12,
  },
  quickCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: 'rgba(2, 6, 23, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  quickTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  quickText: {
    color: '#a8b8ce',
    fontSize: 14,
    lineHeight: 20,
  },
  contactCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.22)',
    gap: 8,
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
});
