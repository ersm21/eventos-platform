import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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

type MeetingSlot = {
  id: string;
  slot_date: string;
  slot_time: string;
  is_active: boolean | null;
  created_at: string | null;
};

function formatDateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-DO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatShortDay(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-DO', { weekday: 'short' });
}

function formatDayNumber(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return String(date.getDate());
}

function formatMonthLabel(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-DO', { month: 'short' });
}

function buildNextThirtyDays() {
  const days: string[] = [];
  const today = new Date();

  for (let index = 0; index < 30; index += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    days.push(date.toISOString().slice(0, 10));
  }

  return days;
}

export default function RequestMeetingScreen() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');

  const [slots, setSlots] = useState<MeetingSlot[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSlots = async () => {
      setLoadingSlots(true);
      setError(null);

      const today = new Date().toISOString().slice(0, 10);
      const endDate = new Date(Date.now() + 29 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

      const { data, error: slotsError } = await supabase
        .from('meeting_slots')
        .select('*')
        .eq('is_active', true)
        .gte('slot_date', today)
        .lte('slot_date', endDate)
        .order('slot_date', { ascending: true })
        .order('slot_time', { ascending: true });

      if (slotsError) {
        setError(slotsError.message);
        setLoadingSlots(false);
        return;
      }

      setSlots((data || []) as MeetingSlot[]);
      setLoadingSlots(false);
    };

    loadSlots();
  }, []);

  const selectedSlot = useMemo(
    () => slots.find((slot) => slot.id === selectedSlotId) || null,
    [slots, selectedSlotId]
  );

  const nextThirtyDays = useMemo(() => buildNextThirtyDays(), []);

  const slotsByDate = useMemo(() => {
    return slots.reduce<Record<string, MeetingSlot[]>>((accumulator, slot) => {
      accumulator[slot.slot_date] = accumulator[slot.slot_date] || [];
      accumulator[slot.slot_date].push(slot);
      return accumulator;
    }, {});
  }, [slots]);

  const selectedDateSlots = selectedDate ? slotsByDate[selectedDate] || [] : [];

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setError('Debes escribir tu nombre.');
      return;
    }

    if (!lastName.trim()) {
      setError('Debes escribir tu apellido.');
      return;
    }

    if (!phoneNumber.trim()) {
      setError('Debes escribir tu número de teléfono.');
      return;
    }

    if (!customerEmail.trim()) {
      setError('Debes escribir tu email.');
      return;
    }

    if (!selectedDate) {
      setError('Debes elegir una fecha disponible.');
      return;
    }

    if (!selectedSlot) {
      setError('Debes elegir un horario disponible.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const extraNotes = [
      `Teléfono: ${phoneNumber.trim()}`,
      companyName.trim() ? `Empresa: ${companyName.trim()}` : 'Empresa: No aplica',
      notes.trim() ? `Notas: ${notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const { data: meetingData, error: insertError } = await supabase
      .from('meeting_requests')
      .insert([
        {
          user_id: user?.id ?? null,
          slot_id: selectedSlot.id,
          customer_name: fullName,
          customer_email: customerEmail.trim(),
          requested_date: selectedSlot.slot_date,
          requested_time: selectedSlot.slot_time,
          notes: extraNotes,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    const { error: slotUpdateError } = await supabase
      .from('meeting_slots')
      .update({ is_active: false })
      .eq('id', selectedSlot.id);

    if (slotUpdateError) {
      setError(slotUpdateError.message);
      setSaving(false);
      return;
    }

    try {
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meeting_request',
          meetingId: meetingData?.id,
          customerName: fullName,
          customerEmail: customerEmail.trim(),
          requestedDate: selectedSlot.slot_date,
          requestedTime: selectedSlot.slot_time,
          notes: extraNotes,
        }),
      });
    } catch {
      // No bloqueamos al usuario si el email falla.
    }

    setSlots((prev) => prev.filter((slot) => slot.id !== selectedSlot.id));
    setSuccessMessage('Tu solicitud de reunión fue enviada correctamente.');
    Alert.alert('Solicitud enviada', 'Tu solicitud de reunión fue enviada correctamente.');
    setFirstName('');
    setLastName('');
    setPhoneNumber('');
    setCompanyName('');
    setCustomerEmail('');
    setNotes('');
    setSelectedSlotId('');
    setSelectedDate('');
    setSaving(false);
  };

  return (
    <LinearGradient colors={['#020617', '#09090f', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Link href="/my-meetings" asChild>
              <Pressable style={styles.backButton}>
                <Text style={styles.backButtonText}>← Citas</Text>
              </Pressable>
            </Link>

            <Image source={require('../assets/images/sm-logo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Reservar reunión</Text>
            <Text style={styles.title}>Solicita una reunión</Text>
            <Text style={styles.description}>
              Elige uno de los horarios disponibles y envíanos tu solicitud. La app usa la misma agenda que la web y el panel admin.
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
            <Text style={styles.sectionTitle}>Datos del cliente</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput value={firstName} onChangeText={setFirstName} placeholder="Tu nombre" placeholderTextColor="#64748b" style={styles.input} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Apellido</Text>
              <TextInput value={lastName} onChangeText={setLastName} placeholder="Tu apellido" placeholderTextColor="#64748b" style={styles.input} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Número de teléfono</Text>
              <TextInput value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Ej: 829-935-9774" placeholderTextColor="#64748b" keyboardType="phone-pad" style={styles.input} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Empresa <Text style={styles.optionalLabel}>(si aplica)</Text></Text>
              <TextInput value={companyName} onChangeText={setCompanyName} placeholder="Nombre de la empresa" placeholderTextColor="#64748b" style={styles.input} />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput value={customerEmail} onChangeText={setCustomerEmail} placeholder="Tu email" placeholderTextColor="#64748b" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Fecha disponible</Text>

            {loadingSlots ? (
              <View style={styles.infoBox}>
                <ActivityIndicator color="#fbbf24" />
                <Text style={styles.infoText}>Cargando horarios disponibles...</Text>
              </View>
            ) : slots.length === 0 ? (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>No hay horarios disponibles en este momento.</Text>
              </View>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.calendarRow}
                >
                  {nextThirtyDays.map((date) => {
                    const availableCount = slotsByDate[date]?.length || 0;
                    const isSelected = selectedDate === date;
                    const isAvailable = availableCount > 0;

                    return (
                      <Pressable
                        key={date}
                        onPress={() => {
                          if (!isAvailable) return;
                          setSelectedDate(date);
                          setSelectedSlotId('');
                          setError(null);
                        }}
                        disabled={!isAvailable}
                        style={[
                          styles.calendarDay,
                          isSelected && styles.calendarDaySelected,
                          !isAvailable && styles.calendarDayDisabled,
                        ]}
                      >
                        <Text style={styles.calendarWeekday}>{formatShortDay(date)}</Text>
                        <Text style={styles.calendarDayNumber}>{formatDayNumber(date)}</Text>
                        <Text style={styles.calendarMonth}>{formatMonthLabel(date)}</Text>
                        <Text style={styles.calendarAvailability}>
                          {isAvailable ? `${availableCount} disp.` : 'No disp.'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={styles.selectedDatePanel}>
                  <Text style={styles.selectedDateLabel}>Fecha seleccionada</Text>
                  <Text style={styles.selectedDateText}>
                    {selectedDate ? formatDateLabel(selectedDate) : 'Selecciona una fecha del calendario'}
                  </Text>

                  {selectedDate && (
                    <View style={styles.timeSlotsGrid}>
                      {selectedDateSlots.map((slot) => (
                        <Pressable
                          key={slot.id}
                          onPress={() => setSelectedSlotId(slot.id)}
                          style={[
                            styles.timeSlot,
                            selectedSlotId === slot.id && styles.timeSlotSelected,
                          ]}
                        >
                          <Text style={styles.timeSlotText}>{slot.slot_time}</Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Notas</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Cuéntanos sobre tu evento o lo que quieres hablar"
              placeholderTextColor="#64748b"
              style={[styles.input, styles.textArea]}
              multiline
              textAlignVertical="top"
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            disabled={saving || loadingSlots}
            style={[styles.submitButton, (saving || loadingSlots) && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>{saving ? 'Enviando...' : 'Solicitar reunión'}</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 20, paddingBottom: 118, gap: 16 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  backButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(15, 23, 42, 0.82)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.18)' },
  backButtonText: { color: '#e5e7eb', fontSize: 13, fontWeight: '900' },
  logo: { width: 78, height: 54 },
  heroCard: { borderRadius: 28, padding: 22, backgroundColor: 'rgba(15, 23, 42, 0.82)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)', gap: 12 },
  eyebrow: { color: '#fbbf24', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 32, lineHeight: 36, fontWeight: '900', letterSpacing: -1.1 },
  description: { color: '#a8b8ce', fontSize: 15, lineHeight: 22 },
  errorBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(127, 29, 29, 0.30)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.32)' },
  errorText: { color: '#fecaca', fontWeight: '800' },
  successBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(20, 83, 45, 0.35)', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.28)' },
  successText: { color: '#bbf7d0', fontWeight: '800' },
  formCard: { borderRadius: 24, padding: 18, backgroundColor: 'rgba(2, 6, 23, 0.56)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.14)', gap: 14 },
  sectionTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  fieldGroup: { gap: 7 },
  label: { color: '#cbd5e1', fontSize: 13, fontWeight: '800' },
  optionalLabel: { color: '#64748b', fontWeight: '600' },
  input: { minHeight: 48, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: 'rgba(15, 23, 42, 0.92)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.18)', color: '#f8fafc', fontSize: 15 },
  textArea: { minHeight: 112 },
  infoBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(2, 6, 23, 0.42)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 10, alignItems: 'center' },
  infoText: { color: '#a7b5c9', fontSize: 14, fontWeight: '700' },
  calendarRow: { gap: 8, paddingRight: 4 },
  calendarDay: { width: 74, minHeight: 82, alignItems: 'center', justifyContent: 'center', gap: 3, padding: 8, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.12)', backgroundColor: 'rgba(2, 6, 23, 0.52)' },
  calendarDaySelected: { borderColor: 'rgba(250, 204, 21, 0.52)', backgroundColor: 'rgba(245, 158, 11, 0.24)' },
  calendarDayDisabled: { opacity: 0.42, backgroundColor: 'rgba(15, 23, 42, 0.30)' },
  calendarWeekday: { color: '#94a3b8', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  calendarDayNumber: { color: '#f8fafc', fontSize: 19, fontWeight: '900' },
  calendarMonth: { color: '#fbbf24', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  calendarAvailability: { color: '#a7b5c9', fontSize: 10, fontWeight: '700' },
  selectedDatePanel: { padding: 14, borderRadius: 18, backgroundColor: 'rgba(2, 6, 23, 0.42)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 14 },
  selectedDateLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  selectedDateText: { color: '#f8fafc', fontSize: 16, fontWeight: '900' },
  timeSlotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)', backgroundColor: 'rgba(2, 6, 23, 0.58)' },
  timeSlotSelected: { borderColor: 'rgba(250, 204, 21, 0.60)', backgroundColor: '#f97316' },
  timeSlotText: { color: '#ffffff', fontWeight: '900' },
  submitButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 18, backgroundColor: '#f97316' },
  submitButtonDisabled: { opacity: 0.58 },
  submitButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
});
