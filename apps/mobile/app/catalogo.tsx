import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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

type CatalogCartItem = Product & {
  quantity: number;
};

const QUOTE_CART_STORAGE_KEY = 'sm_events_quote_cart';

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

export default function CatalogoScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CatalogCartItem[]>([]);
  const [hasLoadedSavedCart, setHasLoadedSavedCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProducts = async () => {
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

    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = products.map((product) => product.category || 'General');
    return ['Todos', ...Array.from(new Set(uniqueCategories))];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todos') return products;
    return products.filter((product) => (product.category || 'General') === selectedCategory);
  }, [products, selectedCategory]);

  useEffect(() => {
    const loadSavedCart = async () => {
      if (products.length === 0 || cartItems.length > 0 || hasLoadedSavedCart) return;

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
          .filter(Boolean) as CatalogCartItem[];

        if (hydratedItems.length > 0) {
          setCartItems(hydratedItems);
        }
      } catch {
        await AsyncStorage.removeItem(QUOTE_CART_STORAGE_KEY);
      } finally {
        setHasLoadedSavedCart(true);
      }
    };

    loadSavedCart();
  }, [products, cartItems.length, hasLoadedSavedCart]);

  useEffect(() => {
    if (!hasLoadedSavedCart) return;

    const saveCart = async () => {
      const cart = cartItems.map((item) => ({
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
  }, [cartItems, hasLoadedSavedCart]);

  const addToCatalogCart = (product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);

      if (existingItem) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const decreaseCatalogCartItem = (productId: string) => {
    setCartItems((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const goToQuoteWithCart = async () => {
    const cart = cartItems.map((item) => ({
      id: item.id,
      quantity: item.quantity,
    }));

    await AsyncStorage.setItem(QUOTE_CART_STORAGE_KEY, JSON.stringify(cart));

    router.push({
      pathname: '/cotizar',
      params: {
        cart: JSON.stringify(cart),
      },
    });
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
            <Text style={styles.eyebrow}>Catálogo</Text>
            <Text style={styles.title}>Servicios disponibles</Text>
            <Text style={styles.description}>
              Revisa los servicios activos de SM Events. Este catálogo se alimenta de la misma tabla de productos usada por la web y el panel admin.
            </Text>
          </View>

          {loading && (
            <View style={styles.infoBox}>
              <ActivityIndicator color="#fbbf24" />
              <Text style={styles.infoText}>Cargando catálogo...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {!loading && !error && products.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Todavía no hay servicios activos.</Text>
              <Text style={styles.emptyText}>
                Cuando agregues productos activos desde el panel admin, aparecerán aquí y también en Cotizar.
              </Text>
            </View>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryRow}
              >
                {categories.map((category) => {
                  const active = selectedCategory === category;

                  return (
                    <Pressable
                      key={category}
                      onPress={() => setSelectedCategory(category)}
                      style={[styles.categoryPill, active && styles.categoryPillActive]}
                    >
                      <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>
                        {category}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.productGrid}>
                {filteredProducts.map((product) => (
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

                      <Pressable onPress={() => addToCatalogCart(product)} style={styles.quoteButton}>
                        <Text style={styles.quoteButtonText}>Agregar</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              {cartItems.length > 0 && (
                <View style={styles.cartSummaryCard}>
                  <View style={styles.cartSummaryHeader}>
                    <View>
                      <Text style={styles.cartSummaryLabel}>Selección para cotizar</Text>
                      <Text style={styles.cartSummaryTitle}>{cartItemCount} producto(s) agregados</Text>
                    </View>

                    <Pressable onPress={goToQuoteWithCart} style={styles.continueButton}>
                      <Text style={styles.continueButtonText}>Continuar</Text>
                    </Pressable>
                  </View>

                  <View style={styles.cartItemsList}>
                    {cartItems.map((item) => (
                      <View key={item.id} style={styles.cartItemRow}>
                        <View style={styles.cartItemInfo}>
                          <Text style={styles.cartItemName}>{item.name}</Text>
                          <Text style={styles.cartItemMeta}>Cantidad: {item.quantity}</Text>
                        </View>

                        <View style={styles.cartQtyActions}>
                          <Pressable onPress={() => decreaseCatalogCartItem(item.id)} style={styles.cartQtyButton}>
                            <Text style={styles.cartQtyButtonText}>−</Text>
                          </Pressable>
                          <Pressable onPress={() => addToCatalogCart(item)} style={styles.cartQtyButton}>
                            <Text style={styles.cartQtyButtonText}>+</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
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
  emptyCard: { padding: 20, borderRadius: 22, backgroundColor: 'rgba(15,23,42,0.82)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 8 },
  emptyTitle: { color: '#ffffff', fontSize: 17, fontWeight: '900' },
  emptyText: { color: '#94a3b8', fontSize: 14, lineHeight: 20 },
  categoryRow: { gap: 8, paddingRight: 4 },
  categoryPill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(15, 23, 42, 0.86)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.18)' },
  categoryPillActive: { backgroundColor: 'rgba(249, 115, 22, 0.18)', borderColor: 'rgba(249, 115, 22, 0.42)' },
  categoryPillText: { color: '#cbd5e1', fontSize: 12, fontWeight: '900' },
  categoryPillTextActive: { color: '#fed7aa' },
  productGrid: { gap: 10 },
  productCard: { minHeight: 142, borderRadius: 18, padding: 14, backgroundColor: 'rgba(15, 23, 42, 0.84)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', justifyContent: 'space-between', gap: 12 },
  categoryBadge: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 999, backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.24)', fontSize: 10, fontWeight: '900' },
  productName: { color: '#ffffff', fontSize: 17, fontWeight: '900', marginTop: 10, marginBottom: 5 },
  productDescription: { color: '#94a3b8', fontSize: 12, lineHeight: 17 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 2 },
  priceLabel: { color: '#64748b', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '800' },
  price: { color: '#ffffff', fontSize: 18, fontWeight: '900', marginTop: 3 },
  quoteButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f97316' },
  quoteButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  cartSummaryCard: { borderRadius: 22, padding: 14, backgroundColor: 'rgba(2, 6, 23, 0.96)', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.34)', gap: 12 },
  cartSummaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cartSummaryLabel: { color: '#fbbf24', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  cartSummaryTitle: { color: '#ffffff', fontSize: 16, fontWeight: '900', marginTop: 4 },
  continueButton: { paddingVertical: 10, paddingHorizontal: 13, borderRadius: 14, backgroundColor: '#f97316' },
  continueButtonText: { color: '#ffffff', fontSize: 13, fontWeight: '900' },
  cartItemsList: { gap: 8 },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 10, borderRadius: 14, backgroundColor: 'rgba(15, 23, 42, 0.72)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)' },
  cartItemInfo: { flex: 1, gap: 3 },
  cartItemName: { color: '#f8fafc', fontSize: 13, fontWeight: '900' },
  cartItemMeta: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },
  cartQtyActions: { flexDirection: 'row', gap: 6 },
  cartQtyButton: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249, 115, 22, 0.18)', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.32)' },
  cartQtyButtonText: { color: '#fed7aa', fontSize: 16, fontWeight: '900' },
});
