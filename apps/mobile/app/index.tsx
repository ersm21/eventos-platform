import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import {
  Image,
  ImageBackground,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const whatsappUrl = 'https://wa.me/18299359774';
const latitude = 19.48076;
const longitude = -70.66218;

const serviceHighlights = [
  { label: 'Luces', image: require('../assets/images/hero-luces.jpg') },
  { label: 'Sonido', image: require('../assets/images/hero-sonido.jpg') },
  { label: 'LED', image: require('../assets/images/hero-led.png') },
  { label: 'Tarimas', image: require('../assets/images/hero-tarima.jpeg') },
];

const coverageTags = ['Sociales', 'Conciertos', 'Bodas', 'Corporativos', 'Soporte técnico'];

const openWhatsApp = async () => {
  try {
    const canOpen = await Linking.canOpenURL(whatsappUrl);

    if (canOpen) {
      await Linking.openURL(whatsappUrl);
      return;
    }

    await Linking.openURL('https://api.whatsapp.com/send?phone=18299359774');
  } catch (error) {
    console.warn('No se pudo abrir WhatsApp:', error);
  }
};

const openGoogleMaps = async () => {
  const label = 'SM Events';
  const encodedLabel = encodeURIComponent(label);
  const nativeUrl = Platform.select({
    ios: `maps://?ll=${latitude},${longitude}&q=${encodedLabel}`,
    android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodedLabel})`,
    default: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
  });

  if (nativeUrl) {
    const canOpenNative = await Linking.canOpenURL(nativeUrl);

    if (canOpenNative) {
      await Linking.openURL(nativeUrl);
      return;
    }
  }

  await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
};

const openGoogleReviews = async () => {
  await Linking.openURL('https://www.google.com/search?q=SM+Events+19.48076+-70.66218+reviews');
};

export default function Index() {
  return (
    <LinearGradient colors={['#020617', '#070914', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Image source={require('../assets/images/sm-logo.png')} style={styles.logo} resizeMode="contain" />
              <View>
                <Text style={styles.brandLabel}>SM Events</Text>
                <Text style={styles.brandSubtitle}>Producción técnica</Text>
              </View>
            </View>

            <Link href="/account" asChild>
              <Pressable style={styles.accountPill}>
                <Text style={styles.accountPillText}>Cuenta</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroGlowOne} />
            <View style={styles.heroGlowTwo} />

            <Text style={styles.heroEyebrow}>Producción de eventos</Text>
            <Text style={styles.heroTitle}>Haz que tu evento se vea y suene como debe</Text>
            <Text style={styles.heroText}>
              Producción técnica para eventos sociales, corporativos y producciones en vivo. Luces, sonido, pantallas LED, tarimas y soporte técnico con un proceso claro.
            </Text>

            <View style={styles.heroActions}>
              <Link href="/request-meeting" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Solicitar reunión</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEyebrow}>Servicios</Text>
              <Text style={styles.sectionTitle}>Producción técnica</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.serviceCarousel}>
            {serviceHighlights.map((service) => (
              <ImageBackground key={service.label} source={service.image} style={styles.serviceCard} imageStyle={styles.serviceImage}>
                <LinearGradient colors={['rgba(2,6,23,0.05)', 'rgba(2,6,23,0.82)']} style={styles.serviceOverlay}>
                  <Text style={styles.serviceLabel}>{service.label}</Text>
                </LinearGradient>
              </ImageBackground>
            ))}
          </ScrollView>

          <View style={styles.infoCard}>
            <Text style={styles.infoEyebrow}>Servicio completo</Text>
            <Text style={styles.infoTitle}>Del montaje al seguimiento</Text>
            <Text style={styles.infoText}>
              Te acompañamos desde la planificación hasta el desmontaje con soluciones técnicas para eventos sociales, corporativos y producciones en vivo.
            </Text>

            <View style={styles.coveragePills}>
              {coverageTags.map((tag) => (
                <View key={tag} style={styles.coveragePill}>
                  <Text style={styles.coveragePillText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.missionVisionRow}>
            <View style={styles.smallInfoCard}>
              <Text style={styles.infoEyebrow}>Misión</Text>
              <Text style={styles.smallInfoText}>
                Hacer que cada evento se vea, suene y funcione como debe.
              </Text>
            </View>

            <View style={styles.smallInfoCard}>
              <Text style={styles.infoEyebrow}>Visión</Text>
              <Text style={styles.smallInfoText}>
                Ser una referencia confiable en producción técnica de eventos.
              </Text>
            </View>
          </View>

          <View style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <View>
                <Text style={styles.sectionEyebrowGold}>Cobertura</Text>
                <Text style={styles.locationTitle}>Santiago y todo RD</Text>
              </View>

              <Pressable onPress={openGoogleMaps} style={styles.mapSmallButton}>
                <Text style={styles.mapSmallButtonText}>Mapa ↗</Text>
              </Pressable>
            </View>

            <Text style={styles.locationText}>
              Base en C. Penetración Flor de Gurabo, Santiago de los Caballeros 51000. Eventos en todo República Dominicana y soporte técnico en Estados Unidos.
            </Text>

            <View style={styles.contactButtonsRow}>
              <Pressable style={styles.contactButton} onPress={openWhatsApp}>
                <Text style={styles.contactButtonLabel}>WhatsApp</Text>
                <Text style={styles.contactButtonValue}>829-935-9774</Text>
              </Pressable>

              <Pressable style={styles.contactButton} onPress={openGoogleMaps}>
                <Text style={styles.contactButtonLabel}>Coordenadas</Text>
                <Text style={styles.contactButtonValue}>19.48076, -70.66218</Text>
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.mapCard} onPress={openGoogleMaps}>
            <View style={styles.mapPreview}>
              <View style={styles.mapGlowBlue} />
              <View style={styles.mapGlowGold} />
              <View style={styles.mapRoadHorizontal} />
              <View style={styles.mapRoadVertical} />
              <View style={styles.mapPinOuter}>
                <View style={styles.mapPinInner} />
              </View>
              <Text style={styles.mapPreviewText}>Ubicación exacta de SM Events</Text>
            </View>

            <View style={styles.mapFooter}>
              <Text style={styles.mapFooterText}>Abrir en Apple Maps, Google Maps o navegador.</Text>
              <Text style={styles.mapArrow}>↗</Text>
            </View>
          </Pressable>

          <View style={styles.reviewCard}>
            <View>
              <Text style={styles.reviewText}>¿Ya trabajaste con nosotros?</Text>
              <Text style={styles.stars}>★★★★★</Text>
            </View>

            <Pressable onPress={openGoogleReviews} style={styles.reviewButton}>
              <Text style={styles.reviewButtonText}>Dejar reseña</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 118, gap: 13 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  logo: { width: 70, height: 46 },
  brandLabel: { color: '#f8fafc', fontSize: 16, fontWeight: '900' },
  brandSubtitle: { color: '#94a3b8', fontSize: 12, fontWeight: '700', marginTop: 2 },
  accountPill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(15,23,42,0.86)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.16)' },
  accountPillText: { color: '#fde68a', fontSize: 12, fontWeight: '900' },

  heroCard: { position: 'relative', overflow: 'hidden', borderRadius: 30, padding: 22, backgroundColor: 'rgba(15, 23, 42, 0.90)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)', gap: 12 },
  heroGlowOne: { position: 'absolute', width: 220, height: 220, borderRadius: 999, right: -72, top: -78, backgroundColor: 'rgba(245,158,11,0.15)' },
  heroGlowTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 999, left: -88, bottom: -96, backgroundColor: 'rgba(59,130,246,0.10)' },
  heroEyebrow: { color: '#fbbf24', fontSize: 12, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  heroTitle: { color: '#ffffff', fontSize: 33, lineHeight: 36, fontWeight: '900', letterSpacing: -1.2 },
  heroText: { color: '#a8b8ce', fontSize: 14, lineHeight: 21 },
  heroActions: { flexDirection: 'row', gap: 9, flexWrap: 'wrap', marginTop: 5 },

  primaryButton: { backgroundColor: '#f97316', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 15 },
  primaryButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  secondaryButton: { backgroundColor: 'rgba(2,6,23,0.46)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.22)', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 15 },
  secondaryButtonText: { color: '#f8fafc', fontWeight: '900', fontSize: 14 },


  sectionHeaderRow: { marginTop: 2, gap: 3 },
  sectionEyebrow: { color: '#60a5fa', fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  sectionEyebrowGold: { color: '#fbbf24', fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
  sectionTitle: { color: '#f8fafc', fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 },

  serviceCarousel: { gap: 10, paddingRight: 2 },
  serviceCard: { width: 156, height: 174, borderRadius: 24, overflow: 'hidden', backgroundColor: 'rgba(15,23,42,0.84)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)' },
  serviceImage: { borderRadius: 22 },
  serviceOverlay: { flex: 1, justifyContent: 'flex-end', padding: 12 },
  serviceLabel: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(2,6,23,0.72)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.24)', color: '#f8fafc', fontSize: 12, fontWeight: '900' },

  infoCard: { borderRadius: 24, padding: 17, backgroundColor: 'rgba(15,23,42,0.84)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.14)', gap: 8 },
  infoEyebrow: { color: '#fbbf24', fontSize: 11, fontWeight: '900', letterSpacing: 0.9, textTransform: 'uppercase' },
  infoTitle: { color: '#ffffff', fontSize: 22, lineHeight: 26, fontWeight: '900', letterSpacing: -0.4 },
  infoText: { color: '#c4d0e0', fontSize: 13, lineHeight: 19 },
  coveragePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 4 },
  coveragePill: { paddingVertical: 6, paddingHorizontal: 9, borderRadius: 999, backgroundColor: 'rgba(250,204,21,0.08)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.16)' },
  coveragePillText: { color: '#fde68a', fontSize: 12, fontWeight: '800' },

  missionVisionRow: { flexDirection: 'row', gap: 10 },
  smallInfoCard: { flex: 1, minHeight: 112, borderRadius: 20, padding: 14, backgroundColor: 'rgba(2,6,23,0.42)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', gap: 8 },
  smallInfoText: { color: '#c4d0e0', fontSize: 13, lineHeight: 18 },

  locationCard: { borderRadius: 22, padding: 16, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.16)', gap: 10 },
  locationHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  locationTitle: { color: '#ffffff', fontSize: 22, lineHeight: 26, fontWeight: '900', letterSpacing: -0.45, marginTop: 5 },
  locationText: { color: '#c4d0e0', fontSize: 13, lineHeight: 19 },
  mapSmallButton: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999, backgroundColor: 'rgba(250,204,21,0.10)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.18)' },
  mapSmallButtonText: { color: '#fde68a', fontSize: 12, fontWeight: '900' },
  contactButtonsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  contactButton: { flex: 1, minWidth: 145, gap: 3, padding: 12, borderRadius: 16, backgroundColor: 'rgba(2,6,23,0.36)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.12)' },
  contactButtonLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  contactButtonValue: { color: '#fbbf24', fontWeight: '900', fontSize: 14, lineHeight: 18 },

  mapCard: { borderRadius: 22, padding: 14, backgroundColor: 'rgba(2,6,23,0.56)', borderWidth: 1, borderColor: 'rgba(96,165,250,0.22)', gap: 10 },
  mapPreview: { height: 126, borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(15,23,42,0.94)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.14)', position: 'relative', justifyContent: 'flex-end', padding: 13 },
  mapGlowBlue: { position: 'absolute', width: 190, height: 190, borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.16)', top: -76, right: -52 },
  mapGlowGold: { position: 'absolute', width: 150, height: 150, borderRadius: 999, backgroundColor: 'rgba(250,204,21,0.12)', bottom: -56, left: -38 },
  mapRoadHorizontal: { position: 'absolute', left: 0, right: 0, top: 62, height: 2, backgroundColor: 'rgba(148,163,184,0.24)' },
  mapRoadVertical: { position: 'absolute', top: 0, bottom: 0, left: '52%', width: 2, backgroundColor: 'rgba(148,163,184,0.20)' },
  mapPinOuter: { position: 'absolute', top: 43, left: '46%', width: 34, height: 34, borderRadius: 999, backgroundColor: 'rgba(249,115,22,0.22)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.60)', alignItems: 'center', justifyContent: 'center' },
  mapPinInner: { width: 13, height: 13, borderRadius: 999, backgroundColor: '#f97316' },
  mapPreviewText: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
  mapFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  mapFooterText: { color: '#94a3b8', fontSize: 13, lineHeight: 18, flex: 1 },
  mapArrow: { color: '#fbbf24', fontSize: 22, fontWeight: '900' },

  reviewCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: 13, borderRadius: 18, backgroundColor: 'rgba(250,204,21,0.07)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.14)' },
  reviewText: { color: '#cbd5e1', fontSize: 13, fontWeight: '800' },
  stars: { color: '#fbbf24', fontSize: 20, fontWeight: '900', marginTop: 2 },
  reviewButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(250,204,21,0.10)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.20)' },
  reviewButtonText: { color: '#fde68a', fontSize: 12, fontWeight: '900' },
});
