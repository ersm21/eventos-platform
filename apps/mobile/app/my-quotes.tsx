

import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const quotes = [
  {
    id: 'SMQ-1024',
    client: 'Cliente de prueba',
    eventType: 'Boda',
    status: 'En revisión',
    date: 'Pendiente de confirmar',
    total: 'Pendiente',
  },
  {
    id: 'SMQ-1025',
    client: 'Evento corporativo',
    eventType: 'Corporativo',
    status: 'Aprobada',
    date: '15/05/2026',
    total: 'RD$85,000',
  },
];

function getStatusStyle(status: string) {
  if (status === 'Aprobada') return styles.statusApproved;
  if (status === 'Confirmada') return styles.statusConfirmed;
  return styles.statusReview;
}

export default function MyQuotesScreen() {
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
            <Text style={styles.eyebrow}>Mis cotizaciones</Text>
            <Text style={styles.title}>Revisa tus solicitudes y propuestas</Text>
            <Text style={styles.description}>
              Aquí podrás ver el estado de tus cotizaciones, propuestas aprobadas, depósitos y documentos cuando conectemos esta pantalla con Supabase.
            </Text>

            <Link href="/cotizar" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Nueva cotización</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionEyebrow}>Historial</Text>
            <Text style={styles.sectionTitle}>Cotizaciones recientes</Text>
          </View>

          <View style={styles.quotesList}>
            {quotes.map((quote) => (
              <View key={quote.id} style={styles.quoteCard}>
                <View style={styles.quoteHeader}>
                  <View>
                    <Text style={styles.quoteId}>{quote.id}</Text>
                    <Text style={styles.quoteClient}>{quote.client}</Text>
                  </View>

                  <View style={[styles.statusBadge, getStatusStyle(quote.status)]}>
                    <Text style={styles.statusText}>{quote.status}</Text>
                  </View>
                </View>

                <View style={styles.quoteDetailsGrid}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Evento</Text>
                    <Text style={styles.detailValue}>{quote.eventType}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Fecha</Text>
                    <Text style={styles.detailValue}>{quote.date}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Total</Text>
                    <Text style={styles.detailValue}>{quote.total}</Text>
                  </View>
                </View>

                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Ver detalles</Text>
                </Pressable>
              </View>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Próximo paso técnico</Text>
            <Text style={styles.infoText}>
              Esta pantalla está lista visualmente. Luego vamos a leer las cotizaciones reales desde Supabase según el usuario conectado.
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
  primaryButton: {
    alignSelf: 'flex-start',
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
  listHeader: {
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
  quotesList: {
    gap: 14,
  },
  quoteCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(2, 6, 23, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    gap: 14,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  quoteId: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  quoteClient: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusReview: {
    backgroundColor: 'rgba(250, 204, 21, 0.10)',
    borderColor: 'rgba(250, 204, 21, 0.24)',
  },
  statusApproved: {
    backgroundColor: 'rgba(34, 197, 94, 0.10)',
    borderColor: 'rgba(34, 197, 94, 0.24)',
  },
  statusConfirmed: {
    backgroundColor: 'rgba(59, 130, 246, 0.10)',
    borderColor: 'rgba(59, 130, 246, 0.24)',
  },
  statusText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '900',
  },
  quoteDetailsGrid: {
    gap: 10,
  },
  detailBox: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  detailValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.24)',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  secondaryButtonText: {
    color: '#e5e7eb',
    fontWeight: '900',
    fontSize: 13,
  },
  infoCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.22)',
    gap: 6,
  },
  infoTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
  },
  infoText: {
    color: '#bfdbfe',
    fontSize: 14,
    lineHeight: 20,
  },
});