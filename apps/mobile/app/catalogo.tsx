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
  image_url: string | null;
};

type CatalogCartItem = Product & {
  quantity: number;
};

const QUOTE_CART_STORAGE_KEY = 'sm_events_quote_cart';

const CATEGORY_ORDER = [
  'Audio',
  'Iluminación',
  'Pantallas LED',
  'Truss',
  'Tarimas',
  'Efectos especiales',
  'Pista de baile',
];

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toLocaleString()}`;
}

export default function CatalogoScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CatalogCartItem[]>([]);
  const [hasLoadedSavedCart, setHasLoadedSavedCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({  stickyCartBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(2, 6, 23, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.24)',
    shadowColor: '#000',
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  stickyCartInfo: {
    flex: 1,
  },
  stickyCartEyebrow: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  stickyCartTitle: {
    marginTop: 2,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  stickyCartButton: {
    minWidth: 58,
    minHeight: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#facc15',
    paddingHorizontal: 14,
  },
  stickyCartButtonText: {
    color: '#111827',
    fontSize: 13,
    fontWeight: '900',
  },
});
  const productsByCategory = useMemo(() => {
    const grouped = products.reduce<Record<string, Product[]>>((accumulator, product) => {
      const category = product.category || 'General';

      if (!accumulator[category]) {
        accumulator[category] = [];
      }

      accumulator[category].push(product);
      return accumulator;
    }, {});

    Object.keys(grouped).forEach((category) => {
      grouped[category].sort((a, b) => {
        const priceDifference = Number(a.price ?? 0) - Number(b.price ?? 0);

        if (priceDifference !== 0) return priceDifference;

        return a.name.localeCompare(b.name);
      });
    });

    return grouped;
  }, [products]);

  const productCategories = useMemo(() => {
    const existingCategories = Object.keys(productsByCategory);
    const orderedCategories = CATEGORY_ORDER.filter((category) =>
      existingCategories.includes(category)
    );
    const extraCategories = existingCategories
      .filter((category) => !CATEGORY_ORDER.includes(category))
      .sort((a, b) => a.localeCompare(b));

    return [...orderedCategories, ...extraCategories];
  }, [productsByCategory]);

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

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

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + Number(item.price ?? 0) * item.quantity,
        0
      ),
    [cartItems]
  );

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
              Explora los servicios activos de SM Events y agrega lo que necesites a tu cotización.
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
                Cuando agregues productos activos desde el panel admin, aparecerán aquí.
              </Text>
            </View>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              <View style={styles.categoryList}>
                {productCategories.map((category) => {
                  const isOpen = !!expandedCategories[category];
                  const categoryProducts = productsByCategory[category] || [];
                  const categoryImageUrl =
                    categoryProducts.find((product) => product.image_url)?.image_url ?? null;

                  return (
                    <View key={category} style={styles.categorySection}>
                      <Pressable
                        onPress={() => toggleCategory(category)}
                        style={styles.categoryHeader}
                      >
                        <View style={styles.categoryHeaderLeft}>
                          <View style={styles.categoryImageBox}>
                            {categoryImageUrl ? (
                              <Image
                                source={{ uri: categoryImageUrl }}
                                style={styles.categoryImage}
                              />
                            ) : (
                              <Text style={styles.categoryInitials}>
                                {category.slice(0, 2)}
                              </Text>
                            )}
                          </View>

                          <View>
                            <Text style={styles.categoryTitle}>{category}</Text>
                            <Text style={styles.categoryCount}>
                              {categoryProducts.length} servicio{categoryProducts.length === 1 ? '' : 's'}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.categoryChevron}>{isOpen ? '⌄' : '›'}</Text>
                      </Pressable>

                      {isOpen && (
                        <View style={styles.productGrid}>
                          {categoryProducts.map((product) => (
                            <View key={product.id} style={styles.productCard}>
                              <View>
                                {product.image_url && (
                                  <Image
                                    source={{ uri: product.image_url }}
                                    style={styles.productImage}
                                  />
                                )}

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
                      )}
                    </View>
                  );
                })}
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

        {cartItems.length > 0 && (
          <View style={styles.stickyCartBar}>
            <View style={styles.stickyCartInfo}>
              <Text style={styles.stickyCartEyebrow}>Agregado a tu cotización</Text>
              <Text style={styles.stickyCartTitle}>
                {cartItems.reduce((total, item) => total + item.quantity, 0)} servicio
                {cartItems.reduce((total, item) => total + item.quantity, 0) === 1 ? '' : 's'} · {formatMoney(cartTotal)}
              </Text>
            </View>

            <Pressable style={styles.stickyCartButton} onPress={goToQuoteWithCart}>
              <Text style={styles.stickyCartButtonText}>Ver</Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 16, paddingBottom: 160, gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 },
  backButton: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(15, 23, 42, 0.82)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.18)' },
  backButtonText: { color: '#e5e7eb', fontSize: 12, fontWeight: '900' },
  logo: { width: 58, height: 38 },
  heroCard: { borderRadius: 24, padding: 16, backgroundColor: 'rgba(15, 23, 42, 0.82)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)', gap: 8 },
  eyebrow: { color: '#fbbf24', fontSize: 11, fontWeight: '900', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 28, lineHeight: 31, fontWeight: '900', letterSpacing: -0.8 },
  description: { color: '#a8b8ce', fontSize: 13, lineHeight: 19 },
  infoBox: { padding: 14, borderRadius: 18, backgroundColor: 'rgba(15, 23, 42, 0.78)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 8, alignItems: 'center' },
  infoText: { color: '#a7b5c9', fontSize: 12, fontWeight: '700' },
  errorBox: { padding: 12, borderRadius: 14, backgroundColor: 'rgba(127, 29, 29, 0.30)', borderWidth: 1, borderColor: 'rgba(248, 113, 113, 0.32)' },
  errorText: { color: '#fecaca', fontWeight: '800' },
  emptyCard: { padding: 14, borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.82)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 6 },
  emptyTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  emptyText: { color: '#94a3b8', fontSize: 12, lineHeight: 18 },

  categoryList: { gap: 10 },
  categorySection: { borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(15, 23, 42, 0.64)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.12)' },
  categoryHeader: { minHeight: 54, paddingHorizontal: 13, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: 'rgba(2, 6, 23, 0.42)' },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryImageBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(250, 204, 21, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.18)',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryInitials: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  categoryTitle: { color: '#ffffff', fontSize: 15, fontWeight: '900' },
  categoryCount: { color: '#94a3b8', fontSize: 11, fontWeight: '800', marginTop: 2 },
  categoryChevron: { color: '#fbbf24', fontSize: 24, fontWeight: '900' },

  productGrid: { gap: 9, padding: 10 },
  productCard: { minHeight: 116, borderRadius: 16, padding: 12, backgroundColor: 'rgba(15, 23, 42, 0.84)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', justifyContent: 'space-between', gap: 9 },
  productImage: {
    width: '100%',
    height: 92,
    borderRadius: 13,
    marginBottom: 9,
    backgroundColor: 'rgba(2, 6, 23, 0.54)',
  },
  productName: { color: '#ffffff', fontSize: 15, fontWeight: '900', marginBottom: 3 },
  productDescription: { color: '#94a3b8', fontSize: 11, lineHeight: 15 },
  productFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 1 },
  priceLabel: { color: '#64748b', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '800' },
  price: { color: '#ffffff', fontSize: 16, fontWeight: '900', marginTop: 2 },
  quoteButton: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 11, backgroundColor: '#f97316' },
  quoteButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },

  cartSummaryCard: { borderRadius: 20, padding: 12, backgroundColor: 'rgba(2, 6, 23, 0.96)', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.34)', gap: 10 },
  cartSummaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  cartSummaryLabel: { color: '#fbbf24', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  cartSummaryTitle: { color: '#ffffff', fontSize: 14, fontWeight: '900', marginTop: 3 },
  continueButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#f97316' },
  continueButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  cartItemsList: { gap: 7 },
  cartItemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 9, borderRadius: 13, backgroundColor: 'rgba(15, 23, 42, 0.72)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)' },
  cartItemInfo: { flex: 1, gap: 3 },
  cartItemName: { color: '#f8fafc', fontSize: 12, fontWeight: '900' },
  cartItemMeta: { color: '#94a3b8', fontSize: 11, fontWeight: '700' },
  cartQtyActions: { flexDirection: 'row', gap: 6 },
  cartQtyButton: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(249, 115, 22, 0.18)', borderWidth: 1, borderColor: 'rgba(249, 115, 22, 0.32)' },
  cartQtyButtonText: { color: '#fed7aa', fontSize: 15, fontWeight: '900' },
});
