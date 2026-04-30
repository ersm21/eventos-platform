import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

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
  user_id?: string | null;
};

type QuoteItem = {
  id: string;
  quote_id: string;
  product_name: string;
  unit_price: number | null;
  quantity: number | null;
  subtotal: number | null;
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

export default function MyQuotesScreen() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuotes = async () => {
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
        router.replace('/login');
        return;
      }

      setUserEmail(user.email ?? null);

      const { data, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (quotesError) {
        setError(quotesError.message);
        setLoading(false);
        return;
      }

      const loadedQuotes = (data || []) as Quote[];
      setQuotes(loadedQuotes);

      const quoteIds = loadedQuotes.map((quote) => quote.id);

      if (quoteIds.length === 0) {
        setQuoteItems([]);
        setLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*')
        .in('quote_id', quoteIds);

      if (itemsError) {
        setError(itemsError.message);
      } else {
        setQuoteItems((itemsData || []) as QuoteItem[]);
      }

      setLoading(false);
    };

    loadQuotes();
  }, []);

  const getItemsForQuote = (quoteId: string) =>
    quoteItems.filter((item) => item.quote_id === quoteId);

  const getItemsSubtotalForQuote = (quoteId: string) =>
    getItemsForQuote(quoteId).reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0);

  const getQuoteBaseTotal = (quote: Quote) =>
    Number(quote.admin_final_total ?? quote.total ?? getItemsSubtotalForQuote(quote.id));

  const hasQuoteAdminDiscount = (quote: Quote) => {
    const itemsSubtotal = getItemsSubtotalForQuote(quote.id);

    return (
      quote.admin_final_total !== null &&
      quote.admin_final_total !== undefined &&
      itemsSubtotal > 0 &&
      quote.admin_final_total < itemsSubtotal
    );
  };

  return (
    <LinearGradient colors={['#020617', '#09090f', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topRow}>
            <Link href="/account" asChild>
              <Pressable style={styles.backButton}>
                <Text style={styles.backButtonText}>← Cuenta</Text>
              </Pressable>
            </Link>

            <Image source={require('../assets/images/sm-logo.png')} style={styles.logo} resizeMode="contain" />
          </View>

          <View style={styles.heroCard}>
            <Text style={styles.eyebrow}>Área de cliente</Text>
            <Text style={styles.title}>Mis cotizaciones</Text>
            <Text style={styles.description}>
              {userEmail
                ? `Sesión iniciada como ${userEmail}. Aquí puedes revisar cada cotización y su estado.`
                : 'Aquí podrás revisar el estado de tus cotizaciones.'}
            </Text>
          </View>

          {loading && (
            <View style={styles.infoBox}>
              <ActivityIndicator color="#fbbf24" />
              <Text style={styles.infoText}>Cargando cotizaciones...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && !error && quotes.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Todavía no has creado cotizaciones.</Text>
              <Text style={styles.emptyText}>
                Cuando envíes una cotización desde la app o la web, aparecerá aquí.
              </Text>

              <Link href="/cotizar" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Ir a cotizar</Text>
                </Pressable>
              </Link>
            </View>
          )}

          {!loading && !error && quotes.length > 0 && (
            <View style={styles.quotesList}>
              {quotes.map((quote) => {
                const items = getItemsForQuote(quote.id);
                const itemsSubtotal = getItemsSubtotalForQuote(quote.id);
                const baseTotal = getQuoteBaseTotal(quote);
                const hasDiscount = hasQuoteAdminDiscount(quote);

                return (
                  <View key={quote.id} style={styles.quoteCard}>
                    <View style={styles.quoteHeader}>
                      <View style={styles.quoteHeaderText}>
                        <Text style={styles.smallLabel}>Cotización</Text>
                        <Text style={styles.quoteTitle}>{quote.event_type || 'Evento sin título'}</Text>
                        <Text style={styles.quoteId}>ID: {quote.id}</Text>
                      </View>

                      <View style={styles.badgeWrap}>
                        <View style={[styles.badge, getStatusStyle(quote.status)]}>
                          <Text style={styles.badgeText}>{getStatusLabel(quote.status)}</Text>
                        </View>

                        <View style={[styles.badge, getDepositStyle(quote.deposit_status)]}>
                          <Text style={styles.badgeText}>
                            Depósito {quote.deposit_status === 'paid' ? 'pagado' : 'pendiente'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.subCard}>
                      <Text style={styles.subCardTitle}>Resumen</Text>
                      <Text style={styles.rowText}>
                        <Text style={styles.bold}>Cliente:</Text> {quote.customer_name || '—'}
                      </Text>
                      <Text style={styles.rowText}>
                        <Text style={styles.bold}>Email:</Text> {quote.customer_email || '—'}
                      </Text>
                      <Text style={styles.rowText}>
                        <Text style={styles.bold}>Creada:</Text> {formatDate(quote.created_at)}
                      </Text>
                      <Text style={styles.rowText}>
                        <Text style={styles.bold}>Notas:</Text> {quote.notes || '—'}
                      </Text>
                    </View>

                    <View style={styles.subCard}>
                      <Text style={styles.subCardTitle}>Montos</Text>
                      <Text style={styles.rowText}>
                        <Text style={styles.bold}>Subtotal sin ITBIS:</Text>{' '}
                        {formatMoney(quote.admin_final_total ?? quote.total)}
                      </Text>
                      <Text style={styles.rowText}>
                        <Text style={styles.bold}>ITBIS 18%:</Text>{' '}
                        {formatMoney(calculateItbis(quote.admin_final_total ?? quote.total))}
                      </Text>
                      <Text style={styles.rowText}>
                        <Text style={styles.bold}>Total con ITBIS:</Text>{' '}
                        {formatMoney(calculateTotalWithItbis(quote.admin_final_total ?? quote.total))}
                      </Text>
                      <Text style={styles.rowText}>
                        <Text style={styles.bold}>Depósito:</Text> {formatMoney(quote.deposit_amount)}
                      </Text>
                      <Text style={styles.rowText}>
                        <Text style={styles.bold}>Referencia:</Text> {quote.deposit_reference || '—'}
                      </Text>
                    </View>

                    <View style={styles.subCard}>
                      <Text style={styles.smallLabel}>Detalle de servicios</Text>
                      <Text style={styles.subCardTitle}>Artículos de la cotización</Text>

                      <View style={styles.totalsStack}>
                        {hasDiscount ? (
                          <>
                            <Text style={styles.originalTotal}>
                              Subtotal sin descuento: {formatMoney(itemsSubtotal)}
                            </Text>
                            <Text style={styles.discountText}>
                              Descuento aplicado: -{formatMoney(itemsSubtotal - baseTotal)}
                            </Text>
                            <Text style={styles.totalText}>
                              Subtotal sin ITBIS: {formatMoney(baseTotal)}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.totalText}>
                            Subtotal sin descuento: {formatMoney(itemsSubtotal)}
                          </Text>
                        )}

                        <Text style={styles.taxText}>ITBIS 18%: {formatMoney(calculateItbis(baseTotal))}</Text>
                        <Text style={styles.totalText}>Total con ITBIS: {formatMoney(calculateTotalWithItbis(baseTotal))}</Text>
                      </View>

                      {items.length === 0 ? (
                        <Text style={styles.mutedText}>Todavía no hay artículos asociados.</Text>
                      ) : (
                        <View style={styles.itemsList}>
                          {items.map((item) => (
                            <View key={item.id} style={styles.itemRow}>
                              <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.product_name}</Text>
                                <Text style={styles.itemMeta}>
                                  Cantidad: {Number(item.quantity ?? 0)} · Unitario: {formatMoney(item.unit_price)}
                                </Text>
                              </View>

                              <Text style={styles.itemSubtotal}>{formatMoney(item.subtotal)}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    <View style={styles.subCard}>
                      <Text style={styles.subCardTitle}>Nota del admin</Text>
                      <Text style={styles.notesText}>{quote.admin_note || 'Sin nota todavía.'}</Text>
                    </View>

                    <View style={styles.actionsRow}>
                      <Link href={`/quote/${quote.id}`} asChild>
                        <Pressable style={styles.primaryButton}>
                          <Text style={styles.primaryButtonText}>Ver detalle</Text>
                        </Pressable>
                      </Link>

                      {quote.payment_proof_url && (
                        <Pressable
                          style={styles.secondaryButton}
                          onPress={() => Linking.openURL(quote.payment_proof_url || '')}
                        >
                          <Text style={styles.secondaryButtonText}>Ver comprobante</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
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
  title: { color: '#ffffff', fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.2 },
  description: { color: '#a8b8ce', fontSize: 15, lineHeight: 22 },
  infoBox: { padding: 18, borderRadius: 20, backgroundColor: 'rgba(15, 23, 42, 0.78)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 10, alignItems: 'center' },
  infoText: { color: '#a7b5c9', fontSize: 14, fontWeight: '700' },
  errorBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(127, 29, 29, 0.30)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.32)' },
  errorText: { color: '#fecaca', fontWeight: '800' },
  emptyState: { padding: 20, borderRadius: 22, backgroundColor: 'rgba(15,23,42,0.82)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 10 },
  emptyTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  emptyText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  quotesList: { gap: 14 },
  quoteCard: { borderRadius: 24, padding: 16, backgroundColor: 'rgba(15,23,42,0.84)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 12 },
  quoteHeader: { gap: 12 },
  quoteHeaderText: { gap: 4 },
  smallLabel: { color: '#fbbf24', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '900' },
  quoteTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  quoteId: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
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
  subCard: { borderRadius: 18, padding: 14, backgroundColor: 'rgba(2, 6, 23, 0.42)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 8 },
  subCardTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  rowText: { color: '#d7e2ee', fontSize: 14, lineHeight: 20 },
  bold: { fontWeight: '900', color: '#f8fafc' },
  totalsStack: { gap: 6, marginTop: 8 },
  originalTotal: { color: '#94a3b8', fontSize: 14, fontWeight: '800', textDecorationLine: 'line-through' },
  discountText: { color: '#86efac', fontSize: 14, fontWeight: '900' },
  taxText: { color: '#fbbf24', fontSize: 14, fontWeight: '800' },
  totalText: { color: '#f8fafc', fontSize: 15, fontWeight: '900' },
  mutedText: { color: '#94a3b8', fontSize: 14 },
  itemsList: { gap: 10, marginTop: 8 },
  itemRow: { padding: 12, borderRadius: 14, backgroundColor: 'rgba(15, 23, 42, 0.66)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.10)', gap: 8 },
  itemInfo: { gap: 4 },
  itemName: { color: '#f8fafc', fontSize: 15, fontWeight: '900' },
  itemMeta: { color: '#94a3b8', fontSize: 13 },
  itemSubtotal: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  notesText: { color: '#d7e2ee', fontSize: 14, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  primaryButton: { alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#f97316' },
  primaryButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  secondaryButton: { alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14, backgroundColor: 'rgba(2, 6, 23, 0.48)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.18)' },
  secondaryButtonText: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
});
