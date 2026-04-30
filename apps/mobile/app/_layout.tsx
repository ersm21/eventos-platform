import { router, Slot, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const tabs = [
  { label: 'Inicio', href: '/' },
  { label: 'Feed', href: '/feed' },
  { label: 'Catálogo', href: '/catalogo' },
  { label: 'Cotizar', href: '/cotizar' },
  { label: 'Citas', href: '/my-meetings' },
  { label: 'Cuenta', href: '/account' },
];

function isActiveTab(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname.startsWith(href);
}

function BottomNav() {
  const pathname = usePathname();

  return (
    <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
      <View style={styles.bottomNav}>
        {tabs.map((tab) => {
          const active = isActiveTab(pathname, tab.href);

          return (
            <Pressable
              key={tab.href}
              onPress={() => router.push(tab.href)}
              style={[styles.tabButton, active && styles.tabButtonActive]}
            >
              <Text style={[styles.tabIcon, active && styles.tabTextActive]}>
                {tab.label === 'Inicio'
                  ? '⌂'
                  : tab.label === 'Feed'
                    ? '◌'
                    : tab.label === 'Catálogo'
                      ? '▦'
                      : tab.label === 'Cotizar'
                        ? '+'
                        : tab.label === 'Citas'
                          ? '◷'
                          : '◉'}
              </Text>
              <Text style={[styles.tabLabel, active && styles.tabTextActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <View style={styles.screenArea}>
          <Slot />
        </View>
        <BottomNav />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#020617',
  },
  screenArea: {
    flex: 1,
  },
  bottomSafeArea: {
    backgroundColor: 'rgba(2, 6, 23, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.14)',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    paddingTop: 7,
    paddingBottom: 5,
    backgroundColor: 'rgba(2, 6, 23, 0.98)',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 7,
    borderRadius: 15,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(249, 115, 22, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.28)',
  },
  tabIcon: {
    color: '#94a3b8',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 19,
  },
  tabLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '900',
  },
  tabTextActive: {
    color: '#fed7aa',
  },
});
