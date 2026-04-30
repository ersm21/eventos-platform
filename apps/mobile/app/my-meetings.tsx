import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

type MeetingRequest = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  requested_date: string;
  requested_time: string;
  notes: string | null;
  status: string | null;
  created_at: string | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMeetingDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-DO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function getMeetingLabel(status: string | null | undefined) {
  switch (status) {
    case 'pending':
      return 'Pendiente';
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status || '—';
  }
}

function getStatusStyle(status: string | null | undefined) {
  if (status === 'confirmed') return styles.statusConfirmed;
  if (status === 'cancelled') return styles.statusCancelled;
  return styles.statusRequested;
}

export default function MyMeetingsScreen() {
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMeetings = async () => {
    setLoading(true);
    setError(null);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setError(userError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      router.replace('/profile');
      return;
    }

    setUserEmail(user.email ?? null);

    const { data, error: meetingsError } = await supabase
      .from('meeting_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (meetingsError) {
      setError(meetingsError.message);
      setLoading(false);
      return;
    }

    setMeetings((data || []) as MeetingRequest[]);
    setLoading(false);
  };

  useEffect(() => {
    loadMeetings();
  }, []);

  const requestedCount = useMemo(
    () => meetings.filter((meeting) => meeting.status === 'pending').length,
    [meetings]
  );

  const confirmedCount = useMemo(
    () => meetings.filter((meeting) => meeting.status === 'confirmed').length,
    [meetings]
  );

  return (
    <LinearGradient colors={['#020617', '#070914', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>Agenda</Text>
              <Text style={styles.title}>Mis reuniones</Text>
              <Text style={styles.description}>
                {userEmail
                  ? `Sesión: ${userEmail}`
                  : 'Revisa tus solicitudes y reuniones confirmadas.'}
              </Text>
            </View>

            <Link href="/" asChild>
              <Pressable style={styles.backButton}>
                <Text style={styles.backButtonText}>Inicio</Text>
              </Pressable>
            </Link>
          </View>

          <Link href="/request-meeting" asChild>
            <Pressable style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Solicitar reunión</Text>
            </Pressable>
          </Link>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Pendientes</Text>
              <Text style={styles.summaryValue}>{requestedCount}</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Confirmadas</Text>
              <Text style={styles.summaryValue}>{confirmedCount}</Text>
            </View>
          </View>

          {loading && (
            <View style={styles.infoCard}>
              <ActivityIndicator color="#fbbf24" />
              <Text style={styles.infoText}>Cargando reuniones...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && !error && meetings.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Todavía no has solicitado reuniones.</Text>
              <Text style={styles.emptyText}>
                Cuando envíes una solicitud de reunión, aparecerá aquí.
              </Text>

              <Link href="/request-meeting" asChild>
                <Pressable style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Solicitar reunión</Text>
                </Pressable>
              </Link>
            </View>
          )}

          {!loading && !error && meetings.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionEyebrow}>Recientes</Text>
                <Text style={styles.sectionTitle}>Últimas reuniones</Text>
              </View>

              <View style={styles.meetingsList}>
                {meetings.map((meeting) => (
                  <View key={meeting.id} style={styles.meetingCard}>
                    <View style={styles.meetingTopRow}>
                      <View style={styles.meetingTitleBlock}>
                        <Text style={styles.meetingId}>
                          {meeting.id.slice(0, 8).toUpperCase()}
                        </Text>
                        <Text style={styles.meetingTitle}>
                          {meeting.customer_name || 'Solicitud de reunión'}
                        </Text>
                        <Text style={styles.meetingClient}>
                          Enviada: {formatDate(meeting.created_at)}
                        </Text>
                      </View>

                      <View style={[styles.statusBadge, getStatusStyle(meeting.status)]}>
                        <Text style={styles.statusText}>
                          {getMeetingLabel(meeting.status)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailsRow}>
                      <View style={styles.detailBox}>
                        <Text style={styles.detailLabel}>Fecha</Text>
                        <Text style={styles.detailValue}>
                          {formatMeetingDate(meeting.requested_date)}
                        </Text>
                      </View>

                      <View style={styles.detailBox}>
                        <Text style={styles.detailLabel}>Hora</Text>
                        <Text style={styles.detailValue}>{meeting.requested_time}</Text>
                      </View>
                    </View>

                    <View style={styles.notesBox}>
                      <Text style={styles.detailLabel}>Notas</Text>
                      <Text style={styles.notesText}>
                        {meeting.notes || 'Sin notas adicionales.'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: {
    padding: 16,
    paddingBottom: 112,
    gap: 12,
  },
  header: {
    minHeight: 124,
    borderRadius: 24,
    padding: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.16)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  eyebrow: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 33,
    fontWeight: '900',
    letterSpacing: -0.9,
    marginTop: 5,
  },
  description: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 240,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 11,
    borderRadius: 999,
    backgroundColor: 'rgba(2, 6, 23, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.16)',
  },
  backButtonText: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '900',
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#f97316',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minHeight: 72,
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    justifyContent: 'center',
    gap: 4,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  infoCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.14)',
    gap: 8,
    alignItems: 'center',
  },
  infoText: {
    color: '#a7b5c9',
    fontSize: 12,
    fontWeight: '700',
  },
  errorCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(127, 29, 29, 0.30)',
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.32)',
  },
  errorText: {
    color: '#fecaca',
    fontWeight: '800',
  },
  emptyCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(15,23,42,0.82)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.14)',
    gap: 8,
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
  },
  emptyButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f97316',
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionHeader: {
    gap: 3,
    marginTop: 2,
  },
  sectionEyebrow: {
    color: '#60a5fa',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  meetingsList: {
    gap: 10,
  },
  meetingCard: {
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(2, 6, 23, 0.50)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
    gap: 12,
  },
  meetingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    alignItems: 'flex-start',
  },
  meetingTitleBlock: {
    flex: 1,
  },
  meetingId: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  meetingTitle: {
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '900',
    marginTop: 4,
  },
  meetingClient: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 9,
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
    fontSize: 11,
    fontWeight: '900',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailBox: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 4,
  },
  detailValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '900',
  },
  notesBox: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.10)',
  },
  notesText: {
    color: '#d7e2ee',
    fontSize: 12,
    lineHeight: 18,
  },
});
