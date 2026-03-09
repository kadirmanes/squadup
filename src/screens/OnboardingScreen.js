import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { GAMES, VIBES, REGIONS } from '../constants/games';
import { useAuth } from '../context/AuthContext';
import { createUser } from '../services/firestoreService';
import HexButton from '../components/HexButton';

const TOTAL_STEPS = 4;
const STEP_TITLES = ['KULLANICI ADI', 'OYUNLARIN', 'OYUN TARZI', 'BÖLGE'];
const STEP_SUBTITLES = [
  'Rakiplerine korku salan bir kullanıcı adı seç.',
  'Oynadığın oyunları, rankını, sunucunu ve oyun içi adını gir.',
  'Nasıl oynamayı seversin?',
  'Hangi sunucudasın?',
];

export default function OnboardingScreen({ navigation }) {
  const { uid, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1
  const [username, setUsername] = useState('');
  // Step 2
  const [selectedGames, setSelectedGames] = useState([]);
  const [rankPickerGame, setRankPickerGame] = useState(null);
  const [serverPickerGame, setServerPickerGame] = useState(null);
  // Step 3
  const [selectedVibe, setSelectedVibe] = useState(null);
  // Step 4
  const [selectedRegion, setSelectedRegion] = useState(null);

  const canProceed = () => {
    if (step === 1) return username.trim().length >= 3;
    if (step === 2) return selectedGames.length > 0;
    if (step === 3) return selectedVibe !== null;
    if (step === 4) return selectedRegion !== null;
    return false;
  };

  const toggleGame = (gameId) => {
    setSelectedGames((prev) => {
      const exists = prev.find((g) => g.gameId === gameId);
      if (exists) return prev.filter((g) => g.gameId !== gameId);
      const game = GAMES.find((g) => g.id === gameId);
      return [...prev, {
        gameId,
        rank: game.ranks[0],
        server: game.servers?.[0] ?? null,
        nickname: '',
      }];
    });
    setRankPickerGame(null);
    setServerPickerGame(null);
  };

  const setRankForGame = (gameId, rank) => {
    setSelectedGames((prev) =>
      prev.map((g) => (g.gameId === gameId ? { ...g, rank } : g)),
    );
    setRankPickerGame(null);
  };

  const setServerForGame = (gameId, server) => {
    setSelectedGames((prev) =>
      prev.map((g) => (g.gameId === gameId ? { ...g, server } : g)),
    );
    setServerPickerGame(null);
  };

  const setNicknameForGame = (gameId, nickname) => {
    setSelectedGames((prev) =>
      prev.map((g) => (g.gameId === gameId ? { ...g, nickname } : g)),
    );
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    setLoading(true);
    try {
      const gamesWithRegion = selectedGames.map((g) => ({
        ...g,
        region: selectedRegion,
      }));
      const userData = {
        username: username.trim(),
        games: gamesWithRegion,
        vibe: selectedVibe,
        region: selectedRegion,
      };
      await createUser(uid, userData);
      await completeOnboarding({ uid, ...userData });
      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Hata', 'Profil kaydedilemedi. Tekrar dene.\n' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / TOTAL_STEPS) * 100}%` }]}>
            <LinearGradient
              colors={['#00FFD1', '#0094FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
        </View>

        <View style={styles.header}>
          <Text style={styles.stepLabel}>ADIM {step} / {TOTAL_STEPS}</Text>
          <Text style={styles.title}>{STEP_TITLES[step - 1]}</Text>
          <Text style={styles.subtitle}>{STEP_SUBTITLES[step - 1]}</Text>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── STEP 1: Username ── */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="örn. NightWolf_TR"
                placeholderTextColor={COLORS.textMuted}
                value={username}
                onChangeText={setUsername}
                maxLength={20}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.hint}>3–20 characters. No spaces.</Text>
              {username.length > 0 && username.length < 3 && (
                <Text style={styles.error}>Kullanıcı adı en az 3 karakter olmalı.</Text>
              )}
            </View>
          )}

          {/* ── STEP 2: Games ── */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              {GAMES.map((game) => {
                const sel = selectedGames.find((g) => g.gameId === game.id);
                const isSelected = !!sel;
                return (
                  <View key={game.id}>
                    {/* Game row */}
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => toggleGame(game.id)}
                      style={[styles.gameRow, isSelected && { borderColor: game.color }]}
                    >
                      <View style={[styles.gameIcon, { backgroundColor: `${game.color}22` }]}>
                        <Text style={{ fontSize: 22 }}>{game.emoji}</Text>
                      </View>
                      <Text style={[styles.gameName, isSelected && { color: game.color }]}>{game.name}</Text>
                      <View style={[styles.checkbox, isSelected && { backgroundColor: game.color, borderColor: game.color }]}>
                        {isSelected && <Text style={{ color: COLORS.background, fontSize: 12, fontFamily: FONTS.orbitron.bold }}>✓</Text>}
                      </View>
                    </TouchableOpacity>

                    {isSelected && (
                      <View style={styles.gameDetails}>
                        {/* Rank picker */}
                        <TouchableOpacity
                          style={[styles.pickerRow, { borderColor: `${game.color}55` }]}
                          onPress={() => {
                            setRankPickerGame(rankPickerGame === game.id ? null : game.id);
                            setServerPickerGame(null);
                          }}
                        >
                          <Text style={styles.pickerLabel}>Rank</Text>
                          <Text style={[styles.pickerValue, { color: game.color }]}>{sel.rank}</Text>
                          <Text style={styles.pickerArrow}>{rankPickerGame === game.id ? '▲' : '▼'}</Text>
                        </TouchableOpacity>

                        {rankPickerGame === game.id && (
                          <View style={styles.dropdownList}>
                            <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
                              {game.ranks.map((rank) => (
                                <TouchableOpacity
                                  key={rank}
                                  style={[styles.dropdownItem, sel.rank === rank && { backgroundColor: `${game.color}22` }]}
                                  onPress={() => setRankForGame(game.id, rank)}
                                >
                                  <Text style={[styles.dropdownItemText, sel.rank === rank && { color: game.color }]}>{rank}</Text>
                                </TouchableOpacity>
                              ))}
                            </ScrollView>
                          </View>
                        )}

                        {/* Server picker (only if game has servers) */}
                        {game.servers && (
                          <>
                            <TouchableOpacity
                              style={[styles.pickerRow, { borderColor: `${game.color}55` }]}
                              onPress={() => {
                                setServerPickerGame(serverPickerGame === game.id ? null : game.id);
                                setRankPickerGame(null);
                              }}
                            >
                              <Text style={styles.pickerLabel}>Server</Text>
                              <Text style={[styles.pickerValue, { color: game.color }]}>{sel.server ?? game.servers[0]}</Text>
                              <Text style={styles.pickerArrow}>{serverPickerGame === game.id ? '▲' : '▼'}</Text>
                            </TouchableOpacity>

                            {serverPickerGame === game.id && (
                              <View style={styles.dropdownList}>
                                <ScrollView style={{ maxHeight: 160 }} nestedScrollEnabled>
                                  {game.servers.map((srv) => (
                                    <TouchableOpacity
                                      key={srv}
                                      style={[styles.dropdownItem, sel.server === srv && { backgroundColor: `${game.color}22` }]}
                                      onPress={() => setServerForGame(game.id, srv)}
                                    >
                                      <Text style={[styles.dropdownItemText, sel.server === srv && { color: game.color }]}>{srv}</Text>
                                    </TouchableOpacity>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                          </>
                        )}

                        {/* In-game nickname */}
                        <TextInput
                          style={[styles.nicknameInput, { borderColor: `${game.color}44` }]}
                          placeholder={game.nicknameHint ?? 'Oyun içi kullanıcı adı (isteğe bağlı)'}
                          placeholderTextColor={COLORS.textMuted}
                          value={sel.nickname}
                          onChangeText={(text) => setNicknameForGame(game.id, text)}
                          maxLength={40}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* ── STEP 3: Vibe ── */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              {VIBES.map((vibe) => {
                const isSelected = selectedVibe === vibe.id;
                return (
                  <TouchableOpacity
                    key={vibe.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedVibe(vibe.id)}
                    style={[styles.vibeCard, isSelected && { borderColor: vibe.color, backgroundColor: `${vibe.color}15` }]}
                  >
                    <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.vibeLabel, isSelected && { color: vibe.color }]}>{vibe.label}</Text>
                      <Text style={styles.vibeSubLabel}>{vibe.sublabel}</Text>
                    </View>
                    {isSelected && <View style={[styles.selectedDot, { backgroundColor: vibe.color }]} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── STEP 4: Region ── */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.regionGrid}>
                {REGIONS.map((region) => {
                  const isSelected = selectedRegion === region.id;
                  return (
                    <TouchableOpacity
                      key={region.id}
                      activeOpacity={0.8}
                      onPress={() => setSelectedRegion(region.id)}
                      style={[styles.regionCard, isSelected && { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim }]}
                    >
                      <Text style={styles.regionFlag}>{region.flag}</Text>
                      <Text style={[styles.regionId, isSelected && { color: COLORS.primary }]}>{region.id}</Text>
                      <Text style={styles.regionLabel}>{region.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity onPress={() => setStep((s) => s - 1)} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← BACK</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <HexButton
              label={step === TOTAL_STEPS ? 'ARENA\'YA GİR' : 'İLERİ →'}
              onPress={handleNext}
              disabled={!canProceed()}
              loading={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  progressBar: {
    height: 3,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
    gap: 6,
  },
  stepLabel: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 2,
  },
  title: {
    fontFamily: FONTS.orbitron.extraBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  content: { flex: 1 },
  contentInner: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  stepContainer: { gap: 10 },
  textInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 18,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  hint: { fontFamily: FONTS.rajdhani.regular, fontSize: 13, color: COLORS.textMuted },
  error: { fontFamily: FONTS.rajdhani.medium, fontSize: 13, color: COLORS.error },

  // Game selection
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  gameIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameName: {
    flex: 1,
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Game details (rank, server, nickname)
  gameDetails: {
    marginLeft: SPACING.lg,
    gap: 6,
    marginTop: -4,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: 6,
  },
  pickerLabel: { fontFamily: FONTS.rajdhani.medium, fontSize: 13, color: COLORS.textSecondary, width: 50 },
  pickerValue: { flex: 1, fontFamily: FONTS.rajdhani.bold, fontSize: 14 },
  pickerArrow: { fontFamily: FONTS.rajdhani.regular, fontSize: 12, color: COLORS.textMuted },
  dropdownList: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: -4,
  },
  dropdownItem: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: { fontFamily: FONTS.rajdhani.medium, fontSize: 14, color: COLORS.textSecondary },
  nicknameInput: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },

  // Vibe
  vibeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.md,
  },
  vibeEmoji: { fontSize: 30 },
  vibeLabel: { fontFamily: FONTS.rajdhani.bold, fontSize: 18, color: COLORS.textPrimary, letterSpacing: 0.5 },
  vibeSubLabel: { fontFamily: FONTS.rajdhani.medium, fontSize: 13, color: COLORS.textSecondary },
  selectedDot: { width: 10, height: 10, borderRadius: 5 },

  // Region
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  regionCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 6,
  },
  regionFlag: { fontSize: 32 },
  regionId: { fontFamily: FONTS.orbitron.bold, fontSize: 16, color: COLORS.textPrimary, letterSpacing: 1 },
  regionLabel: { fontFamily: FONTS.rajdhani.medium, fontSize: 12, color: COLORS.textSecondary },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  backBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.md },
  backBtnText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
});
