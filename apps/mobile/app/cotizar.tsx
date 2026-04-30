import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  is_active: boolean | null;
};

type QuoteItem = Product & {
  quantity: number;
};

const QUOTE_CART_STORAGE_KEY = 'sm_events_quote_cart';

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

function calculateItbis(value: number | null | undefined) {
  return Number(value ?? 0) * 0.18;
}

function calculateTotalWithItbis(value: number | null | undefined) {
  return Number(value ?? 0) * 1.18;
}

export default function CotizarScreen() {
  const params = useLocalSearchParams<{ cart?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [eventType, setEventType] = useState('');
  const [notes, setNotes] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [hasLoadedSavedCart, setHasLoadedSavedCart] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      const { data, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (productsError) {
        setError(productsError.message);
      } else {
        setProducts((data || []) as Product[]);
      }

      setLoading(false);
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const loadCartFromParams = async () => {
      if (!params.cart || products.length === 0 || quoteItems.length > 0) return;

      try {
      const cart = JSON.parse(String(params.cart)) as Array<{ id: string; quantity: number }>;

      const hydratedItems = cart
        .map((cartItem) => {
          const product = products.find((item) => item.id === cartItem.id);
          if (!product) return null;

          return {
            ...product,
            quantity: Math.max(1, Number(cartItem.quantity || 1)),
          };
        })
        .filter(Boolean) as QuoteItem[];

      if (hydratedItems.length > 0) {
        setQuoteItems(hydratedItems);
        await AsyncStorage.setItem(QUOTE_CART_STORAGE_KEY, JSON.stringify(cart));
        setHasLoadedSavedCart(true);
      }
      } catch {
        // Ignoramos carritos inválidos.
      }
    };

    loadCartFromParams();
  }, [params.cart, products, quoteItems.length]);

  useEffect(() => {
    const loadSavedCart = async () => {
      if (products.length === 0 || quoteItems.length > 0 || hasLoadedSavedCart) return;

      try {
        const savedCart = await AsyncStorage.getItem(QUOTE_CART_STORAGE_KEY);

        if (!savedCart) {
          setHasLoadedSavedCart(true);
          return;
        }

        const cart = JSON.parse(savedCart) as Array<{ id: string; quantity: number }>;

        const hydratedItems = cart
          .map((cartItem) => {
            const product = products.find((item) => item.id === cartItem.id);
            if (!product) return null;

            return {
              ...product,
              quantity: Math.max(1, Number(cartItem.quantity || 1)),
            };
          })
          .filter(Boolean) as QuoteItem[];

        if (hydratedItems.length > 0) {
          setQuoteItems(hydratedItems);
        }
      } catch {
        await AsyncStorage.removeItem(QUOTE_CART_STORAGE_KEY);
      } finally {
        setHasLoadedSavedCart(true);
      }
    };

    loadSavedCart();
  }, [products, quoteItems.length, hasLoadedSavedCart]);

  useEffect(() => {
    if (!hasLoadedSavedCart) return;

    const saveCart = async () => {
      const cart = quoteItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
      }));

      if (cart.length === 0) {
        await AsyncStorage.removeItem(QUOTE_CART_STORAGE_KEY);
        return;
      }

      await AsyncStorage.setItem(QUOTE_CART_STORAGE_KEY, JSON.stringify(cart));
    };

    saveCart();
  }, [quoteItems, hasLoadedSavedCart]);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);
      setSessionEmail(user?.email ?? null);
      setCustomerEmail(user?.email ?? '');
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
      setSessionEmail(session?.user?.email ?? null);
      setCustomerEmail(session?.user?.email ?? '');
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const addToQuote = (product: Product) => {
    setQuoteItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const increaseQuantity = (productId: string) => {
    setQuoteItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decreaseQuantity = (productId: string) => {
    setQuoteItems((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const total = useMemo(
    () => quoteItems.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0),
    [quoteItems]
  );

  const itemCount = useMemo(
    () => quoteItems.reduce((sum, item) => sum + item.quantity, 0),
    [quoteItems]
  );

  const saveQuote = async () => {
    if (!isLoggedIn) {
      setError('Debes iniciar sesión para guardar tu cotización.');
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para guardar tu cotización.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a Login', onPress: () => router.push('/login') },
      ]);
      return;
    }

    if (!customerName.trim()) {
      setError('Debes escribir tu nombre.');
      return;
    }

    if (!customerEmail.trim()) {
      setError('Debes escribir tu email.');
      return;
    }

    if (!eventType.trim()) {
      setError('Debes indicar el tipo de evento.');
      return;
    }

    if (quoteItems.length === 0) {
      setError('No hay servicios en la cotización.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError('Tu sesión no está disponible. Vuelve a iniciar sesión.');
      setSaving(false);
      return;
    }

    const { data: quoteData, error: quoteError } = await supabase
      .from('quotes')
      .insert([
        {
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          event_type: eventType.trim(),
          notes,
          status: 'draft',
          total,
          user_id: user.id,
        },
      ])
      .select()
      .single();

    if (quoteError) {
      setError(quoteError.message);
      setSaving(false);
      return;
    }

    const itemsToInsert = quoteItems.map((item) => ({
      quote_id: quoteData.id,
      product_id: item.id,
      product_name: item.name,
      unit_price: item.price ?? 0,
      quantity: item.quantity,
      subtotal: Number(item.price ?? 0) * item.quantity,
    }));

    const { error: itemsError } = await supabase.from('quote_items').insert(itemsToInsert);

    if (itemsError) {
      setError(itemsError.message);
      setSaving(false);
      return;
    }

    try {
      await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/resend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'quote_created',
          quoteId: quoteData.id,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          eventType: eventType.trim(),
          notes,
          total,
          items: quoteItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price ?? 0,
            subtotal: Number(item.price ?? 0) * item.quantity,
          })),
        }),
      });
    } catch {
      // No bloqueamos al usuario si el correo falla.
    }

    setSuccessMessage(`Tu cotización fue enviada correctamente. ID: ${quoteData.id}`);
    Alert.alert('Cotización enviada', 'Tu cotización fue enviada correctamente.');

    setQuoteItems([]);
    setCustomerName('');
    setEventType('');
    setNotes('');
    setSaving(false);

    setTimeout(() => {
      router.push('/my-quotes');
    }, 900);
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
            <Text style={styles.eyebrow}>Cotizar</Text>
            <Text style={styles.title}>Arma tu cotización</Text>
            <Text style={styles.description}>
              Selecciona los servicios que necesitas, cuéntanos sobre tu evento y envíanos la solicitud para revisarla con claridad.
            </Text>
          </View>

          {!isLoggedIn && (
            <View style={styles.sessionBox}>
              <View style={styles.sessionTextBlock}>
                <Text style={styles.sectionEyebrow}>Tu cuenta</Text>
                <Text style={styles.sessionTitle}>Inicia sesión para cotizar</Text>
                <Text style={styles.sessionText}>
                  Para guardar tu cotización y darle seguimiento necesitas entrar con tu cuenta.
                </Text>
              </View>

              <Link href="/login" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
                </Pressable>
              </Link>
            </View>
          )}

          {isLoggedIn && sessionEmail && (
            <View style={styles.sessionBox}>
              <View style={styles.sessionTextBlock}>
                <Text style={styles.sectionEyebrow}>Sesión activa</Text>
                <Text style={styles.sessionTitle}>Cotizando como cliente</Text>
                <Text style={styles.sessionText}>
                  Entraste como {sessionEmail}. Esta cotización quedará vinculada a tu cuenta.
                </Text>
              </View>
            </View>
          )}

          {error && <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View>}
          {successMessage && <View style={styles.successBox}><Text style={styles.successText}>{successMessage}</Text></View>}

          <View style={styles.sectionBlock}>
            <Text style={styles.sectionEyebrow}>Servicios</Text>
            <Text style={styles.sectionTitle}>Selecciona lo que necesitas</Text>
            <Text style={styles.sectionText}>
              Agrega servicios a tu cotización y ajusta las cantidades antes de enviarla.
            </Text>
          </View>

          {loading ? (
            <View style={styles.panel}>
              <ActivityIndicator color="#fbbf24" />
              <Text style={styles.mutedText}>Cargando servicios...</Text>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.panel}>
              <Text style={styles.mutedText}>Todavía no hay servicios disponibles.</Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {products.map((product) => (
                <View key={product.id} style={styles.productCard}>
                  <View>
                    <Text style={styles.categoryBadge}>{product.category || 'General'}</Text>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productDescription}>
                      {product.description || 'Servicio disponible para cotización.'}
                    </Text>
                  </View>

                  <View style={styles.productFooter}>
                    <View>
                      <Text style={styles.priceLabel}>Desde</Text>
                      <Text style={styles.price}>{formatMoney(product.price)}</Text>
                    </View>

                    <Pressable onPress={() => addToQuote(product)} style={styles.smallButton}>
                      <Text style={styles.primaryButtonText}>Agregar</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.panel}>
            <Text style={styles.sectionEyebrow}>Datos del cliente</Text>
            <Text style={styles.panelTitle}>Cuéntanos sobre tu evento</Text>
            <Text style={styles.panelText}>
              Completa tus datos para revisar tu solicitud y responderte con claridad.
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nombre</Text>
              <TextInput
                value={customerName}
                onChangeText={setCustomerName}
                placeholder="Tu nombre"
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={customerEmail}
                onChangeText={setCustomerEmail}
                placeholder="Tu email"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Tipo de evento</Text>
              <TextInput
                value={eventType}
                onChangeText={setEventType}
                placeholder="Boda, concierto, corporativo, DJ set, cumpleaños..."
                placeholderTextColor="#64748b"
                style={styles.input}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Notas adicionales</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Fecha, lugar, duración, montaje, luces, sonido, pantalla o cualquier detalle importante"
                placeholderTextColor="#64748b"
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.quotePanel}>
            <Text style={styles.sectionEyebrow}>Mi cotización</Text>
            <Text style={styles.panelTitle}>Resumen de tu selección</Text>
            <Text style={styles.panelText}>Revisa tu selección antes de enviarla.</Text>

            {quoteItems.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Todavía no has agregado servicios</Text>
                <Text style={styles.emptyText}>
                  Empieza eligiendo servicios para construir tu cotización.
                </Text>
              </View>
            ) : (
              <View style={styles.quoteItemsList}>
                {quoteItems.map((item) => (
                  <View key={item.id} style={styles.quoteItemCard}>
                    <View style={styles.quoteItemHeader}>
                      <View style={styles.quoteItemInfo}>
                        <Text style={styles.quoteItemName}>{item.name}</Text>
                        <Text style={styles.quoteItemMeta}>Unitario: {formatMoney(item.price)}</Text>
                      </View>

                      <View style={styles.qtyActions}>
                        <Pressable onPress={() => decreaseQuantity(item.id)} style={styles.qtyButton}>
                          <Text style={styles.qtyButtonText}>−</Text>
                        </Pressable>
                        <Text style={styles.qtyValue}>{item.quantity}</Text>
                        <Pressable onPress={() => increaseQuantity(item.id)} style={styles.qtyButton}>
                          <Text style={styles.qtyButtonText}>+</Text>
                        </Pressable>
                      </View>
                    </View>

                    <Text style={styles.quoteSubtotal}>
                      Subtotal: {formatMoney(Number(item.price ?? 0) * item.quantity)}
                    </Text>
                  </View>
                ))}

                <View style={styles.quoteSummaryBox}>
                  <View style={styles.quoteSummaryRow}>
                    <Text style={styles.quoteSummaryLabel}>Total de items</Text>
                    <Text style={styles.quoteSummaryValue}>{itemCount}</Text>
                  </View>
                  <View style={styles.quoteSummaryRow}>
                    <Text style={styles.quoteSummaryLabel}>Subtotal sin ITBIS</Text>
                    <Text style={styles.quoteSummaryValue}>{formatMoney(total)}</Text>
                  </View>
                  <View style={styles.quoteSummaryRow}>
                    <Text style={styles.quoteSummaryLabel}>ITBIS 18%</Text>
                    <Text style={styles.quoteSummaryValue}>{formatMoney(calculateItbis(total))}</Text>
                  </View>
                  <View style={styles.quoteSummaryRow}>
                    <Text style={styles.quoteSummaryLabel}>Total con ITBIS</Text>
                    <Text style={styles.quoteSummaryValue}>{formatMoney(calculateTotalWithItbis(total))}</Text>
                  </View>
                </View>

                {!isLoggedIn ? (
                  <Link href="/login" asChild>
                    <Pressable style={styles.fullButton}>
                      <Text style={styles.primaryButtonText}>Inicia sesión para guardar tu cotización</Text>
                    </Pressable>
                  </Link>
                ) : (
                  <Pressable
                    onPress={saveQuote}
                    disabled={saving}
                    style={[styles.fullButton, saving && styles.buttonDisabled]}
                  >
                    <Text style={styles.primaryButtonText}>{saving ? 'Enviando...' : 'Enviar cotización'}</Text>
                  </Pressable>
                )}
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8 },
  backButton: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(15, 23, 42, 0.82)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.18)' },
  backButtonText: { color: '#e5e7eb', fontSize: 13, fontWeight: '900' },
  logo: { width: 78, height: 54 },
  heroCard: { borderRadius: 28, padding: 22, backgroundColor: 'rgba(15, 23, 42, 0.82)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)', gap: 12 },
  eyebrow: { color: '#fbbf24', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.2 },
  description: { color: '#a8b8ce', fontSize: 15, lineHeight: 22 },
  sectionBlock: { gap: 6 },
  sectionEyebrow: { color: '#fbbf24', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  sectionTitle: { color: '#ffffff', fontSize: 25, fontWeight: '900', letterSpacing: -0.6 },
  sectionText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  sessionBox: { borderRadius: 24, padding: 18, backgroundColor: 'rgba(15, 23, 42, 0.78)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 14 },
  sessionTextBlock: { gap: 6 },
  sessionTitle: { color: '#ffffff', fontSize: 22, fontWeight: '900' },
  sessionText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  primaryButton: { alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#f97316' },
  primaryButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  smallButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f97316' },
  fullButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 18, backgroundColor: '#f97316' },
  buttonDisabled: { opacity: 0.72 },
  errorBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(127, 29, 29, 0.30)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.32)' },
  errorText: { color: '#fecaca', fontWeight: '800' },
  successBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(20, 83, 45, 0.35)', borderWidth: 1, borderColor: 'rgba(74, 222, 128, 0.28)' },
  successText: { color: '#bbf7d0', fontWeight: '800' },
  panel: { borderRadius: 24, padding: 18, backgroundColor: 'rgba(15, 23, 42, 0.78)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 14 },
  mutedText: { color: '#94a3b8', fontSize: 14, fontWeight: '700' },
  productGrid: { gap: 10 },
  productCard: { minHeight: 142, borderRadius: 18, padding: 14, backgroundColor: 'rgba(15, 23, 42, 0.84)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', justifyContent: 'space-between', gap: 12 },
  categoryBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.24)', fontSize: 10, fontWeight: '900' },
  productName: { color: '#ffffff', fontSize: 17, fontWeight: '900', marginTop: 10, marginBottom: 5 },
  productDescription: { color: '#94a3b8', fontSize: 12, lineHeight: 17 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 2 },
  priceLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '800' },
  price: { color: '#ffffff', fontSize: 18, fontWeight: '900', marginTop: 3 },
  panelTitle: { color: '#ffffff', fontSize: 23, fontWeight: '900', marginTop: 5 },
  panelText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  fieldGroup: { gap: 7 },
  label: { color: '#a5b4c7', fontSize: 13, fontWeight: '700' },
  input: { minHeight: 48, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, backgroundColor: 'rgba(2, 6, 23, 0.68)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', color: '#f8fafc', fontSize: 15 },
  textArea: { minHeight: 120 },
  quotePanel: { borderRadius: 26, padding: 18, backgroundColor: 'rgba(15,23,42,0.88)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)', gap: 14 },
  emptyState: { padding: 18, borderRadius: 18, backgroundColor: 'rgba(2, 6, 23, 0.42)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)' },
  emptyTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  emptyText: { color: '#94a3b8', fontSize: 14, lineHeight: 20, marginTop: 6 },
  quoteItemsList: { gap: 12 },
  quoteItemCard: { borderRadius: 18, padding: 14, backgroundColor: 'rgba(2, 6, 23, 0.42)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)' },
  quoteItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  quoteItemInfo: { flex: 1 },
  quoteItemName: { color: '#ffffff', fontSize: 16, fontWeight: '900' },
  quoteItemMeta: { color: '#94a3b8', fontSize: 13, marginTop: 5 },
  qtyActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyButton: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.18)', backgroundColor: 'rgba(15, 23, 42, 0.86)', alignItems: 'center', justifyContent: 'center' },
  qtyButtonText: { color: '#ffffff', fontSize: 18, fontWeight: '900' },
  qtyValue: { color: '#ffffff', minWidth: 22, textAlign: 'center', fontWeight: '900' },
  quoteSubtotal: { color: '#dbe7f5', fontSize: 14, fontWeight: '800', marginTop: 12 },
  quoteSummaryBox: { borderRadius: 18, padding: 16, backgroundColor: 'rgba(245, 158, 11, 0.10)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)', gap: 8 },
  quoteSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  quoteSummaryLabel: { color: '#cbd5e1', fontSize: 13, fontWeight: '700' },
  quoteSummaryValue: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
});
