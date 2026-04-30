import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
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

const serviceOptions = [
  'Luces',
  'Sonido',
  'Pantallas LED',
  'Tarimas',
  'DJs',
  'Soporte técnico',
];

const eventTypeOptions = [
  'Boda',
  'Cumpleaños',
  'Concierto',
  'Corporativo',
  'Quince años',
  'Otro',
];

export default function CotizarScreen() {
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [eventType, setEventType] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [notes, setNotes] = useState('');

  const isReadyToSend =
    customerName.trim().length > 0 &&
    customerPhone.trim().length > 0 &&
    eventType.trim().length > 0 &&
    selectedServices.length > 0;

  const selectedSummary = useMemo(
    () => selectedServices.join(', ') || 'Selecciona uno o más servicios',
    [selectedServices]
  );

  const toggleService = (service: string) => {
    setSelectedServices((current) =>
      current.includes(service)
        ? current.filter((item) => item !== service)
        : [...current, service]
    );
  };

  const submitQuote = () => {
    if (!isReadyToSend) {
      Alert.alert(
        'Faltan datos',
        'Completa nombre, teléfono, tipo de evento y selecciona al menos un servicio.'
      );
      return;
    }

    Alert.alert(
      'Solicitud preparada',
      'Esta pantalla ya tiene la estructura. El próximo paso es conectarla con Supabase para guardar la cotización.'
    );
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
            <Text style={styles.eyebrow}>Nueva cotización</Text>
            <Text style={styles.title}>Cuéntanos qué necesitas para tu evento</Text>
            <Text style={styles.description}>
              Completa el flujo por pasos para preparar una solicitud clara. Por ahora queda visual; luego la conectamos al mismo panel admin de la web.
            </Text>
          </View>

          <View style={styles.stepsCard}>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>1</Text>
              <Text style={styles.stepText}>Tipo de evento</Text>
            </View>
            <View style={styles.stepDivider} />
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>2</Text>
              <Text style={styles.stepText}>Servicios</Text>
            </View>
            <View style={styles.stepDivider} />
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>3</Text>
              <Text style={styles.stepText}>Datos</Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Tipo de evento *</Text>
            <Text style={styles.helperText}>Selecciona una opción o escribe otra en el campo de abajo.</Text>

            <View style={styles.servicesGrid}>
              {eventTypeOptions.map((type) => {
                const isSelected = eventType === type;

                return (
                  <Pressable
                    key={type}
                    onPress={() => setEventType(type)}
                    style={[styles.servicePill, isSelected && styles.servicePillSelected]}
                  >
                    <Text style={[styles.serviceText, isSelected && styles.serviceTextSelected]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Otro tipo de evento</Text>
              <TextInput
                value={eventType}
                onChangeText={setEventType}
                placeholder="Ej. Bautizo, actividad escolar, lanzamiento..."
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Servicios solicitados</Text>
            <Text style={styles.helperText}>{selectedSummary}</Text>

            <View style={styles.servicesGrid}>
              {serviceOptions.map((service) => {
                const isSelected = selectedServices.includes(service);

                return (
                  <Pressable
                    key={service}
                    onPress={() => toggleService(service)}
                    style={[styles.servicePill, isSelected && styles.servicePillSelected]}
                  >
                    <Text style={[styles.serviceText, isSelected && styles.serviceTextSelected]}>
                      {service}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Datos del cliente</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre completo *</Text>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Ej. Eric Sousa"
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Teléfono / WhatsApp *</Text>
              <TextInput
                value={customerPhone}
                onChangeText={setCustomerPhone}
                placeholder="Ej. 829-935-9774"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Datos del evento</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Fecha tentativa</Text>
              <TextInput
                value={eventDate}
                onChangeText={setEventDate}
                placeholder="Ej. 25/05/2026"
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Lugar del evento</Text>
              <TextInput
                value={eventLocation}
                onChangeText={setEventLocation}
                placeholder="Dirección, salón, ciudad o provincia"
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notas adicionales</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Cuéntanos detalles importantes del montaje..."
                placeholderTextColor="#64748b"
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>Resumen de solicitud</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Evento</Text>
              <Text style={styles.summaryValue}>{eventType || 'Pendiente'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Servicios</Text>
              <Text style={styles.summaryValue}>{selectedSummary}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Cliente</Text>
              <Text style={styles.summaryValue}>{customerName || 'Pendiente'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Teléfono</Text>
              <Text style={styles.summaryValue}>{customerPhone || 'Pendiente'}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Lugar</Text>
              <Text style={styles.summaryValue}>{eventLocation || 'Pendiente'}</Text>
            </View>
          </View>

          <Pressable
            onPress={submitQuote}
            style={[styles.submitButton, !isReadyToSend && styles.submitButtonDisabled]}
          >
            <Text style={styles.submitButtonText}>Enviar solicitud de cotización</Text>
          </Pressable>
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
  stepsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    padding: 14,
    backgroundColor: 'rgba(2, 6, 23, 0.46)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    textAlign: 'center',
    lineHeight: 28,
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    color: '#fed7aa',
    fontSize: 13,
    fontWeight: '900',
  },
  stepText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '800',
  },
  stepDivider: {
    width: 18,
    height: 1,
    backgroundColor: 'rgba(148, 163, 184, 0.22)',
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
  sectionTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  helperText: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 19,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  servicePill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.2)',
  },
  servicePillSelected: {
    backgroundColor: 'rgba(249, 115, 22, 0.18)',
    borderColor: 'rgba(249, 115, 22, 0.48)',
  },
  serviceText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
  },
  serviceTextSelected: {
    color: '#fed7aa',
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
  textArea: {
    minHeight: 112,
  },
  summaryCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(37, 99, 235, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.22)',
    gap: 12,
  },
  summaryRow: {
    gap: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.12)',
  },
  summaryLabel: {
    color: '#93c5fd',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 20,
  },
  submitButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: '#f97316',
  },
  submitButtonDisabled: {
    opacity: 0.58,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
});