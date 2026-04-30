

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

const meetings = [
  {
    id: 'MTG-2041',
    title: 'Reunión de planificación',
    client: 'Cliente de prueba',
    date: 'Pendiente de confirmar',
    time: 'Por asignar',
    status: 'Solicitada',
  },
  {
    id: 'MTG-2042',
    title: 'Revisión de montaje',
    client: 'Evento corporativo',
    date: '15/05/2026',
    time: '10:30 AM',
    status: 'Confirmada',
  },
];

function getStatusStyle(status: string) {
  if (status === 'Confirmada') return styles.statusConfirmed;
  if (status === 'Cancelada') return styles.statusCancelled;
  return styles.statusRequested;
}

export default function MyMeetingsScreen() {
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
            <Text style={styles.eyebrow}>Mis reuniones</Text>
            <Text style={styles.title}>Consulta tus reuniones con SM Events</Text>
            <Text style={styles.description}>
              Aquí podrás ver reuniones solicitadas, confirmadas o pendientes de asignar cuando conectemos la app con Supabase.
            </Text>

            <Link href="/request-meeting" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Solicitar reunión</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionEyebrow}>Agenda</Text>
            <Text style={styles.sectionTitle}>Reuniones recientes</Text>
          </View>

          <View style={styles.meetingsList}>
            {meetings.map((meeting) => (
              <View key={meeting.id} style={styles.meetingCard}>
                <View style={styles.meetingHeader}>
                  <View style={styles.meetingTitleBlock}>
                    <Text style={styles.meetingId}>{meeting.id}</Text>
                    <Text style={styles.meetingTitle}>{meeting.title}</Text>
                    <Text style={styles.meetingClient}>{meeting.client}</Text>
                  </View>

                  <View style={[styles.statusBadge, getStatusStyle(meeting.status)]}>
                    <Text style={styles.statusText}>{meeting.status}</Text>
                  </View>
                </View>

                <View style={styles.detailsRow}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Fecha</Text>
                    <Text style={styles.detailValue}>{meeting.date}</Text>
                  </View>

                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Hora</Text>
                    <Text style={styles.detailValue}>{meeting.time}</Text>
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
              Esta pantalla queda lista visualmente. Luego vamos a leer las reuniones reales desde Supabase y mostrar horario, estado, teléfono, empresa y notas.
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
  meetingsList: {
    gap: 14,
  },
  meetingCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(2, 6, 23, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    gap: 14,
  },
  meetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  meetingTitleBlock: {
    flex: 1,
  },
  meetingId: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  meetingTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  meetingClient: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusRequested: {
    backgroundColor: 'rgba(250, 204, 21, 0.10)',
    borderColor: 'rgba(250, 204, 21, 0.24)',
  },
  statusConfirmed: {
    backgroundColor: 'rgba(34, 197, 94, 0.10)',
    borderColor: 'rgba(34, 197, 94, 0.24)',
  },
  statusCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.10)',
    borderColor: 'rgba(239, 68, 68, 0.24)',
  },
  statusText: {
    color: '#e5e7eb',
    fontSize: 12,
    fontWeight: '900',
  },
  detailsRow: {
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