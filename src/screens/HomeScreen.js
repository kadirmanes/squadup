import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { GAMES } from '../constants/games';
import { useAuth } from '../context/AuthContext';
import GameCard from '../components/GameCard';
import BannerAd from '../components/BannerAd';

const { width } = Dimensions.get('window');

const STATS = [
  { value: '24,891', label: 'Active Players' },
  { value: '5', label: 'Games' },
  { value: '<30s', label: 'Match Time' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Select Game', desc: 'Choose from 5 top competitive games', icon: '🎮' },
  { step: '02', title: 'Choose Vibe', desc: 'Pick your playstyle: tryhard, chill, learn, or silent', icon: '⚡' },
  { step: '03', title: 'Find Squad', desc: 'Instant matches with same rank & vibe players', icon: '🏆' },
];

export default function HomeScreen({ navigation }) {
  const { userProfile } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleGamePress = (game) => {
    navigation.navigate('FindSquad', { filterGame: game.id });
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: COLORS.background }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>
              {userProfile ? `WELCOME BACK, ${userProfile.username?.toUpperCase()}` : 'WELCOME TO'}
            </Text>
            <LinearGradient
              colors={['#00FFD1', '#0094FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.appTitle}>SQUAD UP</Text>
            </LinearGradient>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>LIVE</Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Stats bar */}
          <View style={styles.statsBar}>
            {STATS.map((stat, i) => (
              <React.Fragment key={stat.label}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                {i < STATS.length - 1 && <View style={styles.statDivider} />}
              </React.Fragment>
            ))}
          </View>

          {/* Quick Find Squad CTA */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('FindSquad')}
            style={styles.ctaWrapper}
          >
            <LinearGradient
              colors={['#00FFD1', '#0094FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
            >
              <Text style={styles.ctaIcon}>⚡</Text>
              <Text style={styles.ctaText}>FIND MY SQUAD NOW</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Select Your Game */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>SELECT YOUR GAME</Text>
              <TouchableOpacity onPress={() => navigation.navigate('FindSquad')}>
                <Text style={styles.sectionMore}>SEE ALL →</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gamesRow}
            >
              {GAMES.map((game) => (
                <GameCard key={game.id} game={game} onPress={handleGamePress} />
              ))}
            </ScrollView>
          </View>

          {/* How It Works */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>HOW IT WORKS</Text>
            <View style={styles.howItWorksRow}>
              {HOW_IT_WORKS.map((item, i) => (
                <React.Fragment key={item.step}>
                  <View style={styles.howCard}>
                    <View style={styles.howIconBg}>
                      <Text style={styles.howIcon}>{item.icon}</Text>
                    </View>
                    <View style={[styles.stepBadge]}>
                      <Text style={styles.stepBadgeText}>{item.step}</Text>
                    </View>
                    <Text style={styles.howTitle}>{item.title}</Text>
                    <Text style={styles.howDesc}>{item.desc}</Text>
                  </View>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <Text style={styles.howArrow}>→</Text>
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>

          {/* Vibe section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PLAY YOUR WAY</Text>
            <View style={styles.vibeGrid}>
              {[
                { emoji: '😤', label: 'TRYHARD', sublabel: 'Rank up mode', color: '#FF4444' },
                { emoji: '😂', label: 'CHILL', sublabel: 'Fun first', color: '#00D084' },
                { emoji: '🎓', label: 'LEARN', sublabel: 'Improve daily', color: '#0094FF' },
                { emoji: '🔥', label: 'SILENT', sublabel: 'No toxicity', color: '#FF8C00' },
              ].map((v) => (
                <TouchableOpacity
                  key={v.label}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('FindSquad', { filterVibe: v.label.toLowerCase() })}
                  style={[styles.vibeCard, { borderColor: `${v.color}44` }]}
                >
                  <LinearGradient
                    colors={[`${v.color}18`, 'transparent']}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.vibeEmoji}>{v.emoji}</Text>
                  <Text style={[styles.vibeLabel, { color: v.color }]}>{v.label}</Text>
                  <Text style={styles.vibeSub}>{v.sublabel}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: SPACING.xl }} />
        </Animated.View>
      </ScrollView>

      <BannerAd />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
  },
  appTitle: {
    fontFamily: FONTS.orbitron.black,
    fontSize: 28,
    letterSpacing: 3,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.successDim,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: `${COLORS.success}44`,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.online,
  },
  onlineText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.online,
    letterSpacing: 1,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: SPACING.xl },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 16,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  ctaWrapper: {
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 6,
    overflow: 'hidden',
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
  },
  ctaIcon: { fontSize: 18 },
  ctaText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 14,
    color: COLORS.background,
    letterSpacing: 1.5,
  },
  ctaArrow: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 16,
    color: COLORS.background,
  },
  section: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: FONTS.orbitron.semiBold,
    fontSize: 13,
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  sectionMore: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  gamesRow: { paddingRight: SPACING.lg, paddingBottom: SPACING.sm },
  howItWorksRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
  },
  howCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  howIconBg: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  howIcon: { fontSize: 20 },
  stepBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontFamily: FONTS.orbitron.black,
    fontSize: 8,
    color: COLORS.background,
  },
  howTitle: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 13,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  howDesc: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 13,
  },
  howArrow: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 20,
  },
  vibeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  vibeCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
    overflow: 'hidden',
  },
  vibeEmoji: { fontSize: 26 },
  vibeLabel: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 13,
    letterSpacing: 1,
  },
  vibeSub: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
