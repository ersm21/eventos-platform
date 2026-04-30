

import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const galleryItems = [
  {
    id: 'eventos-sociales',
    label: 'Eventos sociales',
    title: 'Cumpleaños, actividades privadas y celebraciones.',
    description: 'Montajes para fiestas privadas, cumpleaños, actividades familiares y celebraciones sociales.',
    image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'conciertos',
    label: 'Conciertos',
    title: 'Luces, sonido, tarimas y producción en vivo.',
    description: 'Producción técnica para artistas, shows, tarimas, pantallas, visuales y operación en vivo.',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'bodas',
    label: 'Bodas',
    title: 'Ambientes elegantes para momentos especiales.',
    description: 'Iluminación, sonido y soporte para ceremonias, recepciones y celebraciones de boda.',
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'corporativos',
    label: 'Corporativos',
    title: 'Presentaciones, conferencias y montajes empresariales.',
    description: 'Soluciones para lanzamientos, reuniones corporativas, conferencias y eventos institucionales.',
    image: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'soporte-tecnico',
    label: 'Soporte técnico',
    title: 'Asesoría, operación y soporte para proyectos técnicos.',
    description: 'Acompañamiento técnico, operación de equipos, coordinación y soporte antes y durante el evento.',
    image: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  },
];

export default function GaleriaScreen() {
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
            <Text style={styles.eyebrow}>Galería</Text>
            <Text style={styles.title}>Fotos e inspiración para tu próximo montaje</Text>
            <Text style={styles.description}>
              Explora referencias por tipo de evento. Esta sección ayuda a visualizar el estilo de producción que podemos preparar para eventos sociales, conciertos, bodas, corporativos y soporte técnico.
            </Text>
          </View>

          <View style={styles.filterRow}>
            {galleryItems.map((item) => (
              <Link key={item.id} href={`#${item.id}`} asChild>
                <Pressable style={styles.filterPill}>
                  <Text style={styles.filterText}>{item.label}</Text>
                </Pressable>
              </Link>
            ))}
          </View>

          <View style={styles.grid}>
            {galleryItems.map((item) => (
              <View key={item.id} nativeID={item.id} style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardEyebrow}>{item.label}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardText}>{item.description}</Text>

                  <Link href="/cotizar" asChild>
                    <Pressable style={styles.cardButton}>
                      <Text style={styles.cardButtonText}>Cotizar este tipo de evento</Text>
                    </Pressable>
                  </Link>
                </View>
              </View>
            ))}
          </View>
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  filterPill: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(250, 204, 21, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(250, 204, 21, 0.16)',
  },
  filterText: {
    color: '#fde68a',
    fontSize: 12,
    fontWeight: '900',
  },
  grid: {
    gap: 16,
  },
  card: {
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: 'rgba(2, 6, 23, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  cardImage: {
    width: '100%',
    height: 210,
    backgroundColor: '#0f172a',
  },
  cardBody: {
    padding: 18,
    gap: 8,
  },
  cardEyebrow: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  cardText: {
    color: '#a8b8ce',
    fontSize: 14,
    lineHeight: 20,
  },
  cardButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#f97316',
  },
  cardButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
});