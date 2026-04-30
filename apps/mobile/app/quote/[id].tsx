

import { LinearGradient } from 'expo-linear-gradient';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';

type Quote = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  event_type: string | null;
  notes: string | null;
  status: string | null;
  total: number | null;
  admin_final_total: number | null;
  admin_note: string | null;
  deposit_amount: number | null;
  deposit_status: string | null;
  deposit_reference: string | null;
  payment_proof_url: string | null;
  payment_proof_name: string | null;
  created_at: string | null;
};

type QuoteItem = {
  id: string;
  quote_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function calculateItbis(value: number | null | undefined) {
  return Number(value ?? 0) * 0.18;
}

function calculateTotalWithItbis(value: number | null | undefined) {
  return Number(value ?? 0) * 1.18;
}

function formatDate(value: string | null | undefined) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-DO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusLabel(status: string | null | undefined) {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'review':
      return 'En revisión';
    case 'approved':
      return 'Aprobada';
    case 'sent':
      return 'Enviada';
    case 'confirmed':
      return 'Confirmada';
    case 'cancelled':
      return 'Cancelada';
    default:
      return status || '—';
  }
}

function getStatusStyle(status: string | null | undefined) {
  switch (status) {
    case 'approved':
      return styles.statusApproved;
    case 'confirmed':
      return styles.statusConfirmed;
    case 'review':
      return styles.statusReview;
    case 'cancelled':
      return styles.statusCancelled;
    default:
      return styles.statusDefault;
  }
}

function getDepositStyle(status: string | null | undefined) {
  return status === 'paid' ? styles.depositPaid : styles.depositPending;
}

export default function QuoteDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const quoteId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId) {
        setError('No encontramos el ID de la cotización.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (quoteError || !quoteData) {
        setError('No pudimos cargar esta cotización.');
        setLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .eq('quote_id', quoteId)
        .order('created_at', { ascending: true });

      if (itemsError) {
        setError(itemsError.message);
        setLoading(false);
        return;
      }

      setQuote(quoteData as Quote);
      setItems((itemsData || []) as QuoteItem[]);
      setLoading(false);
    };

    loadQuote();
  }, [quoteId]);

  const confirmQuote = async () => {
    if (!quote) return;

    setConfirming(true);
    setError(null);
    setSuccessMessage(null);

    const { error: updateError } = await supabase
      .from('quotes')
      .update({ status: 'confirmed' })
      .eq('id', quote.id);

    if (updateError) {
      setError(updateError.message);
      setConfirming(false);
      return;
    }

    setQuote({ ...quote, status: 'confirmed' });
    setSuccessMessage('Tu cotización fue confirmada correctamente.');
    Alert.alert('Cotización confirmada', 'Tu cotización fue confirmada correctamente.');
    setConfirming(false);
  };

  if (loading) {
    return (
      <LinearGradient colors={['#020617', '#09090f', '#111827']} style={styles.page}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#fbbf24" />
            <Text style={styles.loadingText}>Cargando cotización...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!quote) {
    return (
      <LinearGradient colors={['#020617', '#09090f', '#111827']} style={styles.page}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>Error</Text>
              <Text style={styles.title}>Cotización no encontrada</Text>
              <Text style={styles.description}>{error || 'No pudimos cargar esta cotización.'}</Text>
            </View>

            <Link href="/my-quotes" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Volver a mis cotizaciones</Text>
              </Pressable>
            </Link>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const finalTotal = quote.admin_final_total ?? quote.total ?? 0;
  const itemsSubtotal = items.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0);
  const itbisAmount = calculateItbis(finalTotal);
  const totalWithItbis = calculateTotalWithItbis(finalTotal);

  return (
    <LinearGradient colors={['#020617', '#09090f', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Link href="/my-quotes" asChild>
              <Pressable style={styles.backButton}>
                <Text style={styles.backButtonText}>← Cotizaciones</Text>
              </Pressable>
            </Link>

            <Image source={require('../../assets/images/sm-logo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Tu propuesta</Text>
            <Text style={styles.title}>Cotización para tu evento</Text>
            <Text style={styles.description}>Revisa los detalles, confirma si ya está lista y revisa el estado de depósito.</Text>

            <View style={styles.badgeWrap}>
              <View style={[styles.badge, getStatusStyle(quote.status)]}>
                <Text style={styles.badgeText}>{getStatusLabel(quote.status)}</Text>
              </View>

              <View style={[styles.badge, getDepositStyle(quote.deposit_status)]}>
                <Text style={styles.badgeText}>Depósito {quote.deposit_status === 'paid' ? 'pagado' : 'pendiente'}</Text>
              </View>
            </View>
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

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Subtotal sin ITBIS</Text>
              <Text style={styles.statValue}>{formatMoney(finalTotal)}</Text>
              <Text style={styles.statHint}>Monto base aprobado</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>ITBIS 18%</Text>
              <Text style={styles.statValue}>{formatMoney(itbisAmount)}</Text>
              <Text style={styles.statHint}>Impuesto aplicado</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total con ITBIS</Text>
              <Text style={styles.statValue}>{formatMoney(totalWithItbis)}</Text>
              <Text style={styles.statHint}>Total final a pagar</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Depósito requerido</Text>
              <Text style={styles.statValue}>{formatMoney(quote.deposit_amount)}</Text>
              <Text style={styles.statHint}>Monto para asegurar fecha</Text>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Datos del cliente</Text>
            <Text style={styles.rowText}><Text style={styles.bold}>Cliente:</Text> {quote.customer_name || '—'}</Text>
            <Text style={styles.rowText}><Text style={styles.bold}>Email:</Text> {quote.customer_email || '—'}</Text>
            <Text style={styles.rowText}><Text style={styles.bold}>Evento:</Text> {quote.event_type || '—'}</Text>
            <Text style={styles.rowText}><Text style={styles.bold}>Fecha:</Text> {formatDate(quote.created_at)}</Text>
            <Text style={styles.rowText}><Text style={styles.bold}>Notas:</Text> {quote.notes || '—'}</Text>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Revisión final</Text>
            <Text style={styles.rowText}><Text style={styles.bold}>Nota del admin:</Text> {quote.admin_note || '—'}</Text>
            <Text style={styles.rowText}><Text style={styles.bold}>Referencia de depósito:</Text> {quote.deposit_reference || '—'}</Text>
            <Text style={styles.rowText}><Text style={styles.bold}>ID:</Text> {quote.id}</Text>

            <View style={styles.panelAction}>
              {quote.status === 'approved' ? (
                <Pressable onPress={confirmQuote} disabled={confirming} style={[styles.primaryButton, confirming && styles.buttonDisabled]}>
                  <Text style={styles.primaryButtonText}>{confirming ? 'Confirmando...' : 'Confirmar cotización'}</Text>
                </Pressable>
              ) : quote.status === 'confirmed' ? (
                <View style={styles.successMiniBox}>
                  <Text style={styles.successMiniText}>Esta cotización ya fue confirmada.</Text>
                </View>
              ) : (
                <View style={styles.infoMiniBox}>
                  <Text style={styles.infoMiniText}>Esta cotización todavía no está lista para confirmar.</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Comprobante de pago</Text>
            <Text style={styles.rowText}><Text style={styles.bold}>Archivo actual:</Text> {quote.payment_proof_name || 'No subido todavía'}</Text>

            {quote.payment_proof_url ? (
              <Pressable style={styles.primaryButton} onPress={() => Linking.openURL(quote.payment_proof_url || '')}>
                <Text style={styles.primaryButtonText}>Abrir comprobante</Text>
              </Pressable>
            ) : (
              <Text style={styles.mutedText}>La subida de comprobante desde la app la agregaremos en el próximo paso.</Text>
            )}
          </View>

          <View style={styles.panel}>
            <View style={styles.quoteItemsHeader}>
              <View>
                <Text style={styles.eyebrow}>Detalle de servicios</Text>
                <Text style={styles.panelTitle}>Productos de tu cotización</Text>
              </View>

              <View style={styles.totalsStack}>
                <Text style={styles.totalText}>Subtotal: {formatMoney(itemsSubtotal)}</Text>
                <Text style={styles.taxText}>ITBIS: {formatMoney(calculateItbis(itemsSubtotal))}</Text>
                <Text style={styles.totalText}>Total: {formatMoney(calculateTotalWithItbis(itemsSubtotal))}</Text>
              </View>
            </View>

            {items.length === 0 ? (
              <Text style={styles.mutedText}>No hay productos en esta cotización.</Text>
            ) : (
              <View style={styles.itemsList}>
                {items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName}>{item.product_name}</Text>
                      <Text style={styles.itemMeta}>Cantidad: {Number(item.quantity ?? 0)} · Unitario: {formatMoney(item.unit_price)}</Text>
                    </View>

                    <Text style={styles.itemSubtotal}>{formatMoney(item.subtotal)}</Text>
                  </View>
                ))}
              </View>
            )}
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
  badgeWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 11, borderRadius: 999, borderWidth: 1 },
  badgeText: { color: '#f8fafc', fontSize: 12, fontWeight: '900' },
  statusApproved: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.28)' },
  statusConfirmed: { backgroundColor: 'rgba(59,130,246,0.14)', borderColor: 'rgba(59,130,246,0.30)' },
  statusReview: { backgroundColor: 'rgba(250,204,21,0.12)', borderColor: 'rgba(250,204,21,0.28)' },
  statusCancelled: { backgroundColor: 'rgba(239,68,68,0.12)', borderColor: 'rgba(239,68,68,0.28)' },
  statusDefault: { backgroundColor: 'rgba(148,163,184,0.10)', borderColor: 'rgba(148,163,184,0.22)' },
  depositPaid: { backgroundColor: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.28)' },
  depositPending: { backgroundColor: 'rgba(250,204,21,0.12)', borderColor: 'rgba(250,204,21,0.28)' },
  errorBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(127, 29, 29, 0.30)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.32)' },
  errorText: { color: '#fecaca', fontWeight: '800' },
  successBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(20, 83, 45, 0.35)', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.28)' },
  successText: { color: '#bbf7d0', fontWeight: '800' },
  statsGrid: { gap: 10 },
  statCard: { borderRadius: 18, padding: 14, backgroundColor: 'rgba(15,23,42,0.82)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)' },
  statLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '800' },
  statValue: { color: '#ffffff', fontSize: 21, fontWeight: '900', marginTop: 8 },
  statHint: { color: '#64748b', fontSize: 13, marginTop: 5 },
  panel: { borderRadius: 24, padding: 16, backgroundColor: 'rgba(15, 23, 42, 0.82)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 10 },
  panelTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  rowText: { color: '#e5e7eb', fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '900', color: '#f8fafc' },
  panelAction: { marginTop: 6 },
  primaryButton: { alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#f97316' },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  buttonDisabled: { opacity: 0.65 },
  successMiniBox: { padding: 12, borderRadius: 14, backgroundColor: 'rgba(20, 83, 45, 0.35)', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.28)' },
  successMiniText: { color: '#bbf7d0', fontWeight: '800' },
  infoMiniBox: { padding: 12, borderRadius: 14, backgroundColor: 'rgba(30, 41, 59, 0.8)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.18)' },
  infoMiniText: { color: '#cbd5e1', fontWeight: '800' },
  mutedText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  quoteItemsHeader: { gap: 10 },
  totalsStack: { gap: 5 },
  totalText: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
  taxText: { color: '#fbbf24', fontSize: 14, fontWeight: '800' },
  itemsList: { gap: 10 },
  itemRow: { padding: 12, borderRadius: 14, backgroundColor: 'rgba(2, 6, 23, 0.42)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.10)', gap: 8 },
  itemInfo: { gap: 4 },
  itemName: { color: '#f8fafc', fontSize: 15, fontWeight: '900' },
  itemMeta: { color: '#94a3b8', fontSize: 13 },
  itemSubtotal: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
});