

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

const catalogItems = [
  {
    title: 'Luces',
    description: 'Iluminación robótica, ambiental y efectos para crear el ambiente correcto.',
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Sonido',
    description: 'Sistemas de sonido para eventos sociales, corporativos y producciones en vivo.',
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Pantallas LED',
    description: 'Pantallas para tarimas, visuales, presentaciones, branding y conciertos.',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Tarimas',
    description: 'Estructuras y tarimas para shows, bodas, conferencias y montajes técnicos.',
    image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'DJs',
    description: 'DJs para todo tipo de eventos, con música adaptada al público y al ambiente.',
    image: 'https://images.unsplash.com/photo-1571266028243-d220c6a7edbf?auto=format&fit=crop&w=900&q=80',
  },
  {
    title: 'Soporte técnico',
    description: 'Operación, asistencia, coordinación técnica y soporte durante el evento.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80',
  },
];

export default function CatalogoScreen() {
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
            <Text style={styles.title}>Servicios técnicos para tu evento</Text>
            <Text style={styles.description}>
              Explora los servicios principales de SM Events y solicita una cotización desde la app.
            </Text>

            <Link href="/cotizar" asChild>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Cotizar ahora</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.grid}>
            {catalogItems.map((item) => (
              <View key={item.title} style={styles.card}>
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  <Text style={styles.cardText}>{item.description}</Text>
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
  primaryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#f97316',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
  },
  grid: {
    gap: 14,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(2, 6, 23, 0.56)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.14)',
  },
  cardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#0f172a',
  },
  cardBody: {
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  cardText: {
    color: '#a8b8ce',
    fontSize: 14,
    lineHeight: 20,
  },
});