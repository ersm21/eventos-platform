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
  const latitude = 19.48076;
  const longitude = -70.66218;
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
  await Linking.openURL(
    'https://www.google.com/search?q=SM+Events+19.48076+-70.66218+reviews'
  );
};

export default function Index() {
  return (
    <LinearGradient colors={['#020617', '#09090f', '#111827']} style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Image source={require('../assets/images/sm-logo.png')} style={styles.logo} resizeMode="contain" />
            <View>
              <Text style={styles.brandLabel}>SM Events</Text>
              <Text style={styles.brandSubtitle}>Producción de eventos</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <Text style={styles.brandHeroLabel}>Producción de eventos</Text>
            <Text style={styles.title}>Hacemos que tu evento se vea y suene como debe</Text>
            <Text style={styles.description}>
              Cuéntanos qué estás preparando y te ayudamos a organizar luces, sonido, pantallas LED, tarimas y producción con un proceso claro.
            </Text>

            <View style={styles.actionsRow}>
              <Link href="/request-meeting" asChild>
                <Pressable style={styles.primaryButton}>
                  <Text style={styles.primaryButtonText}>Solicitar reunión</Text>
                </Pressable>
              </Link>

              <Link href="/account" asChild>
                <Pressable style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Entrar a mi cuenta</Text>
                </Pressable>
              </Link>
            </View>
          </View>

          <View style={styles.photoGrid}>
            <ImageBackground source={require('../assets/images/hero-luces.jpg')} style={[styles.photoTile, styles.photoTall]} imageStyle={styles.photoImage}>
              <LinearGradient colors={['rgba(2,6,23,0.08)', 'rgba(2,6,23,0.76)']} style={styles.photoOverlay}>
                <Text style={styles.photoTag}>Luces</Text>
              </LinearGradient>
            </ImageBackground>

            <ImageBackground source={require('../assets/images/hero-sonido.jpg')} style={styles.photoTile} imageStyle={styles.photoImage}>
              <LinearGradient colors={['rgba(2,6,23,0.08)', 'rgba(2,6,23,0.76)']} style={styles.photoOverlay}>
                <Text style={styles.photoTag}>Sonido</Text>
              </LinearGradient>
            </ImageBackground>

            <ImageBackground source={require('../assets/images/hero-led.png')} style={styles.photoTile} imageStyle={styles.photoImage}>
              <LinearGradient colors={['rgba(2,6,23,0.08)', 'rgba(2,6,23,0.76)']} style={styles.photoOverlay}>
                <Text style={styles.photoTag}>LED</Text>
              </LinearGradient>
            </ImageBackground>

            <ImageBackground source={require('../assets/images/hero-tarima.jpeg')} style={[styles.photoTile, styles.photoTall]} imageStyle={styles.photoImage}>
              <LinearGradient colors={['rgba(2,6,23,0.08)', 'rgba(2,6,23,0.76)']} style={styles.photoOverlay}>
                <Text style={styles.photoTag}>Tarimas</Text>
              </LinearGradient>
            </ImageBackground>
          </View>

          <View style={styles.highlightCard}>
            <Text style={styles.highlightEyebrow}>Servicio completo</Text>
            <Text style={styles.highlightTitle}>Del montaje al seguimiento</Text>
            <Text style={styles.highlightText}>Un proceso simple para coordinar tu evento con más claridad.</Text>
          </View>

          <View style={styles.aboutSection}>
            <Text style={styles.sectionEyebrowGold}>Sobre nosotros</Text>

            <View style={styles.aboutMainCard}>
              <Text style={styles.aboutCardEyebrow}>Quiénes somos</Text>
              <Text style={styles.aboutTitle}>Tu equipo técnico para eventos sociales, corporativos y producciones en vivo.</Text>
              <Text style={styles.aboutText}>
                Trabajamos con luces, sonido, pantallas LED, tarimas, techos en truss, DJs y soluciones técnicas para eventos de diferentes tamaños. Nuestro objetivo es que cada montaje se vea profesional, funcione correctamente y se ejecute con claridad desde la planificación hasta el desmontaje.
              </Text>

              <View style={styles.coveragePills}>
                {['Eventos sociales', 'Conciertos', 'Bodas', 'Corporativos', 'Soporte técnico'].map((item) => (
                  <Link key={item} href="/galeria" asChild>
                    <Pressable style={styles.coveragePill}>
                      <Text style={styles.coveragePillText}>{item}</Text>
                    </Pressable>
                  </Link>
                ))}
              </View>
            </View>

            <View style={styles.missionVisionCard}>
              <View>
                <Text style={styles.aboutCardEyebrow}>Misión</Text>
                <Text style={styles.aboutText}>
                  Hacer que cada evento se vea, suene y funcione como debe, ofreciendo soluciones técnicas confiables, montaje profesional y acompañamiento personalizado en cada etapa del proceso.
                </Text>
              </View>

              <View style={styles.divider} />

              <View>
                <Text style={styles.aboutCardEyebrow}>Visión</Text>
                <Text style={styles.aboutText}>
                  Ser una de las empresas de producción técnica de eventos más confiables de República Dominicana, reconocida por su calidad, puntualidad, innovación y capacidad de resolver en cualquier escenario.
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.locationCard}>
            <Text style={styles.aboutCardEyebrow}>Cobertura</Text>
            <Text style={styles.locationTitle}>Estamos en Santiago y vamos a todo el país.</Text>
            <Text style={styles.aboutText}>
              Nuestra base está en C. Penetración Flor de Gurabo, Santiago de los Caballeros 51000, pero realizamos eventos en todo el territorio nacional. También brindamos soporte técnico y asesoría para proyectos en Estados Unidos.
            </Text>

            <View style={styles.contactList}>
              <Pressable style={styles.contactItem} onPress={openWhatsApp}>
                <Text style={styles.contactLabel}>WhatsApp / Teléfono</Text>
                <Text style={styles.contactLink}>829-935-9774</Text>
              </Pressable>

              <Pressable style={styles.contactItem} onPress={openGoogleMaps}>
                <Text style={styles.contactLabel}>Ubicación</Text>
                <Text style={styles.contactValue}>C. Penetración Flor de Gurabo, Santiago de los Caballeros 51000</Text>
              </Pressable>

              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>Cobertura</Text>
                <Text style={styles.contactValue}>Todo República Dominicana · Soporte técnico en Estados Unidos</Text>
              </View>
            </View>
          </View>

          <Pressable style={styles.mapCard} onPress={openGoogleMaps}>
            <View style={styles.mapTopRow}>
              <View>
                <Text style={styles.aboutCardEyebrow}>Ubicación geográfica</Text>
                <Text style={styles.mapTitle}>Ver SM Events en el mapa</Text>
              </View>
              <Text style={styles.mapArrow}>↗</Text>
            </View>

            <View style={styles.mapPreview}>
              <View style={styles.mapGlowOne} />
              <View style={styles.mapGlowTwo} />
              <View style={styles.mapRoadHorizontal} />
              <View style={styles.mapRoadVertical} />
              <View style={styles.mapPinOuter}>
                <View style={styles.mapPinInner} />
              </View>
              <Text style={styles.mapPreviewText}>19.48076° N, 70.66218° O</Text>
            </View>

            <Text style={styles.mapDescription}>
              Abre la ubicación exacta de SM Events en Apple Maps, Google Maps o navegador.
            </Text>
          </Pressable>

          <View style={styles.reviewCard}>
            <View>
              <Text style={styles.reviewText}>¿Ya trabajaste con nosotros?</Text>
              <Text style={styles.stars}>★★★★★</Text>
            </View>
            <Pressable onPress={openGoogleReviews} style={styles.reviewButton}>
              <Text style={styles.reviewButtonText}>Déjanos una reseña</Text>
            </Pressable>
          </View>

          <View style={styles.quickGrid}>
            <Link href="/catalogo" asChild>
              <Pressable style={styles.quickCard}>
                <Text style={styles.quickEyebrow}>Servicios</Text>
                <Text style={styles.quickTitle}>Ver catálogo</Text>
                <Text style={styles.quickText}>Explora productos reales y agrégalos a una cotización.</Text>
              </Pressable>
            </Link>

            <Link href="/my-quotes" asChild>
              <Pressable style={styles.quickCard}>
                <Text style={styles.quickEyebrow}>Cliente</Text>
                <Text style={styles.quickTitle}>Mis cotizaciones</Text>
                <Text style={styles.quickText}>Revisa solicitudes, estados y propuestas aprobadas.</Text>
              </Pressable>
            </Link>

            <Link href="/my-meetings" asChild>
              <Pressable style={styles.quickCard}>
                <Text style={styles.quickEyebrow}>Agenda</Text>
                <Text style={styles.quickTitle}>Mis reuniones</Text>
                <Text style={styles.quickText}>Consulta horarios y solicitudes de reunión.</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  safeArea: { flex: 1 },
  content: { padding: 18, paddingBottom: 118, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 6, marginBottom: 2 },
  logo: { width: 78, height: 54 },
  brandLabel: { color: '#f8fafc', fontSize: 16, fontWeight: '900' },
  brandSubtitle: { color: '#cbd5e1', fontSize: 12, fontWeight: '700', marginTop: 2 },
  heroCard: { position: 'relative', overflow: 'hidden', borderRadius: 26, padding: 20, backgroundColor: 'rgba(15, 23, 42, 0.90)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)', gap: 11 },
  heroGlow: { position: 'absolute', top: -62, right: -54, width: 210, height: 210, borderRadius: 999, backgroundColor: 'rgba(245, 158, 11, 0.16)' },
  brandHeroLabel: { color: '#fbbf24', fontSize: 13, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  title: { color: '#ffffff', fontSize: 32, lineHeight: 35, fontWeight: '900', letterSpacing: -1.2 },
  description: { color: '#a8b8ce', fontSize: 14, lineHeight: 21 },
  actionsRow: { flexDirection: 'row', gap: 9, flexWrap: 'wrap', marginTop: 6 },
  primaryButton: { backgroundColor: '#f97316', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 15 },
  primaryButtonText: { color: '#ffffff', fontWeight: '900', fontSize: 14 },
  secondaryButton: { backgroundColor: 'rgba(2, 6, 23, 0.46)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.22)', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 15 },
  secondaryButtonText: { color: '#f8fafc', fontWeight: '900', fontSize: 14 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoTile: { width: '48.5%', minHeight: 96, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.14)', backgroundColor: 'rgba(15, 23, 42, 0.84)' },
  photoTall: { minHeight: 126 },
  photoImage: { borderRadius: 22 },
  photoOverlay: { flex: 1, justifyContent: 'flex-end', padding: 12 },
  photoTag: { alignSelf: 'flex-start', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(2, 6, 23, 0.72)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.24)', color: '#f8fafc', fontSize: 12, fontWeight: '900' },
  highlightCard: { borderRadius: 20, padding: 15, backgroundColor: 'rgba(245, 158, 11, 0.10)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.18)', gap: 6 },
  highlightEyebrow: { color: '#fbbf24', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  highlightTitle: { color: '#ffffff', fontSize: 20, fontWeight: '900' },
  highlightText: { color: '#bfd0e5', fontSize: 13, lineHeight: 19 },
  aboutSection: { borderRadius: 26, padding: 15, backgroundColor: 'rgba(15,23,42,0.82)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 12 },
  sectionEyebrowGold: { color: '#fbbf24', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase' },
  aboutMainCard: { borderRadius: 20, padding: 14, backgroundColor: 'rgba(2, 6, 23, 0.42)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)', gap: 7 },
  aboutCardEyebrow: { color: '#fbbf24', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  aboutTitle: { color: '#ffffff', fontSize: 20, lineHeight: 25, fontWeight: '900', letterSpacing: -0.35 },
  aboutText: { color: '#c4d0e0', lineHeight: 20, fontSize: 13 },
  coveragePills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 7 },
  coveragePill: { paddingVertical: 6, paddingHorizontal: 9, borderRadius: 999, backgroundColor: 'rgba(250, 204, 21, 0.08)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)' },
  coveragePillText: { color: '#fde68a', fontSize: 12, fontWeight: '800' },
  missionVisionCard: { borderRadius: 20, padding: 14, backgroundColor: 'rgba(2, 6, 23, 0.34)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.14)', gap: 14 },
  divider: { height: 1, backgroundColor: 'rgba(250, 204, 21, 0.18)' },
  locationCard: { borderRadius: 22, padding: 16, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.16)', gap: 9 },
  locationTitle: { color: '#ffffff', fontSize: 22, lineHeight: 26, fontWeight: '900', letterSpacing: -0.45 },
  contactList: { gap: 10, marginTop: 8 },
  contactItem: { gap: 4, padding: 11, borderRadius: 15, backgroundColor: 'rgba(2, 6, 23, 0.34)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.12)' },
  contactLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7 },
  contactValue: { color: '#f8fafc', fontWeight: '800', lineHeight: 20 },
  contactLink: { color: '#fbbf24', fontWeight: '900', fontSize: 16 },
  reviewCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', padding: 13, borderRadius: 18, backgroundColor: 'rgba(250, 204, 21, 0.07)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.14)' },
  reviewText: { color: '#cbd5e1', fontSize: 13, fontWeight: '800' },
  stars: { color: '#fbbf24', fontSize: 20, fontWeight: '900', marginTop: 2 },
  reviewButton: { paddingVertical: 9, paddingHorizontal: 12, borderRadius: 999, backgroundColor: 'rgba(250, 204, 21, 0.10)', borderWidth: 1, borderColor: 'rgba(250, 204, 21, 0.20)' },
  reviewButtonText: { color: '#fde68a', fontSize: 12, fontWeight: '900' },
  mapCard: { borderRadius: 22, padding: 15, backgroundColor: 'rgba(2, 6, 23, 0.56)', borderWidth: 1, borderColor: 'rgba(96, 165, 250, 0.22)', gap: 11 },
  mapTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  mapTitle: { color: '#ffffff', fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 6 },
  mapArrow: { color: '#fbbf24', fontSize: 24, fontWeight: '900' },
  mapPreview: { height: 132, borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(15, 23, 42, 0.94)', borderWidth: 1, borderColor: 'rgba(148, 163, 184, 0.14)', position: 'relative', justifyContent: 'flex-end', padding: 13 },
  mapGlowOne: { position: 'absolute', width: 190, height: 190, borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.16)', top: -70, right: -50 },
  mapGlowTwo: { position: 'absolute', width: 150, height: 150, borderRadius: 999, backgroundColor: 'rgba(250,204,21,0.12)', bottom: -55, left: -35 },
  mapRoadHorizontal: { position: 'absolute', left: 0, right: 0, top: 72, height: 2, backgroundColor: 'rgba(148, 163, 184, 0.24)' },
  mapRoadVertical: { position: 'absolute', top: 0, bottom: 0, left: '52%', width: 2, backgroundColor: 'rgba(148, 163, 184, 0.20)' },
  mapPinOuter: { position: 'absolute', top: 45, left: '46%', width: 34, height: 34, borderRadius: 999, backgroundColor: 'rgba(249,115,22,0.22)', borderWidth: 1, borderColor: 'rgba(249,115,22,0.60)', alignItems: 'center', justifyContent: 'center' },
  mapPinInner: { width: 13, height: 13, borderRadius: 999, backgroundColor: '#f97316' },
  mapPreviewText: { color: '#f8fafc', fontSize: 14, fontWeight: '900' },
  mapDescription: { color: '#94a3b8', fontSize: 13, lineHeight: 18 },
});
