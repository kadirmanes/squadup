import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
} from 'react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { GAMES, VIBES, GROUP_SIZES, PLAY_TIMES, getGame, getGroupSize } from '../constants/games';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getUserStats, updateUser } from '../services/firestoreService';
import { pickAndUploadAvatar } from '../services/storageService';
import VibeBadge from '../components/VibeBadge';
import HexButton from '../components/HexButton';

export default function ProfileScreen({ navigation }) {
  const { uid, userProfile, signOut, refreshProfile } = useAuth();
  const { requests } = useApp();
  const [stats, setStats] = useState({ total: 0, accepted: 0, acceptanceRate: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [editingVibe, setEditingVibe] = useState(false);
  const [savingVibe, setSavingVibe] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState(userProfile?.vibe ?? 'chill');
  const [editingDiscord, setEditingDiscord] = useState(false);
  const [discordTag, setDiscordTag] = useState(userProfile?.discordTag ?? '');
  const [savingDiscord, setSavingDiscord] = useState(false);

  // LookingFor editing
  const [selectedLookingFor, setSelectedLookingFor] = useState(userProfile?.lookingFor ?? 2);
  const [savingLookingFor, setSavingLookingFor] = useState(false);

  // Play times
  const [selectedPlayTimes, setSelectedPlayTimes] = useState(userProfile?.playTimes ?? []);
  const [savingPlayTimes, setSavingPlayTimes] = useState(false);

  const togglePlayTime = useCallback(async (id) => {
    const next = selectedPlayTimes.includes(id)
      ? selectedPlayTimes.filter((t) => t !== id)
      : [...selectedPlayTimes, id];
    setSelectedPlayTimes(next);
    setSavingPlayTimes(true);
    try {
      await updateUser(uid, { playTimes: next });
    } catch (err) {
      setSelectedPlayTimes(selectedPlayTimes); // rollback
      Alert.alert('Hata', 'Kaydedilemedi: ' + err.message);
    } finally {
      setSavingPlayTimes(false);
    }
  }, [uid, selectedPlayTimes]);

  // Avatar upload
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handlePickPhoto = useCallback(async () => {
    setUploadingPhoto(true);
    setUploadProgress(0);
    try {
      const url = await pickAndUploadAvatar(uid, setUploadProgress);
      if (url) await refreshProfile();
    } catch (err) {
      Alert.alert('Hata', err.message ?? 'Fotoğraf yüklenemedi.');
    } finally {
      setUploadingPhoto(false);
    }
  }, [uid, refreshProfile]);

  // Games editing
  const [editingGames, setEditingGames] = useState(false);
  const [editGames, setEditGames] = useState(userProfile?.games ?? []);
  const [rankPickerGame, setRankPickerGame] = useState(null);
  const [serverPickerGame, setServerPickerGame] = useState(null);
  const [savingGames, setSavingGames] = useState(false);

  useEffect(() => {
    if (!uid) return;
    setLoadingStats(true);
    getUserStats(uid)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [uid, requests.length]);

  useEffect(() => {
    if (userProfile?.vibe) setSelectedVibe(userProfile.vibe);
    if (userProfile?.discordTag !== undefined) setDiscordTag(userProfile.discordTag ?? '');
    if (userProfile?.games) setEditGames(userProfile.games);
    if (userProfile?.lookingFor) setSelectedLookingFor(userProfile.lookingFor);
    if (userProfile?.playTimes) setSelectedPlayTimes(userProfile.playTimes);
  }, [userProfile]);

  // Refs — blur handler stale closure'ı önlemek için
  const editingGamesRef   = useRef(editingGames);
  const editingVibeRef    = useRef(editingVibe);
  const editingDiscordRef = useRef(editingDiscord);
  const userProfileRef    = useRef(userProfile);
  const editGamesRef      = useRef(editGames);
  const selectedVibeRef   = useRef(selectedVibe);
  const discordTagRef     = useRef(discordTag);
  const uidRef            = useRef(uid);
  const refreshProfileRef = useRef(refreshProfile);

  useEffect(() => { editingGamesRef.current   = editingGames;     }, [editingGames]);
  useEffect(() => { editingVibeRef.current    = editingVibe;      }, [editingVibe]);
  useEffect(() => { editingDiscordRef.current = editingDiscord;   }, [editingDiscord]);
  useEffect(() => { userProfileRef.current    = userProfile;      }, [userProfile]);
  useEffect(() => { editGamesRef.current      = editGames;        }, [editGames]);
  useEffect(() => { selectedVibeRef.current   = selectedVibe;     }, [selectedVibe]);
  useEffect(() => { discordTagRef.current     = discordTag;       }, [discordTag]);
  useEffect(() => { uidRef.current            = uid;              }, [uid]);
  useEffect(() => { refreshProfileRef.current = refreshProfile;   }, [refreshProfile]);

  // Tab'dan çıkınca: kaydedilmemiş değişiklikleri sıfırla + uyar
  const resetEditing = useCallback(() => {
    const p = userProfileRef.current;
    setEditingGames(false);
    setEditGames(p?.games ?? []);
    setRankPickerGame(null);
    setServerPickerGame(null);
    setEditingVibe(false);
    setSelectedVibe(p?.vibe ?? 'chill');
    setEditingDiscord(false);
    setDiscordTag(p?.discordTag ?? '');
  }, []);

  useEffect(() => {
    if (!navigation) return;
    const unsubscribe = navigation.addListener('blur', () => {
      const wasEditingGames   = editingGamesRef.current;
      const wasEditingVibe    = editingVibeRef.current;
      const wasEditingDiscord = editingDiscordRef.current;
      const wasEditing = wasEditingGames || wasEditingVibe || wasEditingDiscord;

      // Anlık değerleri yakala (async callback için)
      const snapGames   = editGamesRef.current;
      const snapVibe    = selectedVibeRef.current;
      const snapDiscord = discordTagRef.current;

      resetEditing(); // her durumda cache temizle

      if (!wasEditing) return;

      Alert.alert(
        'Kaydedilmemiş Değişiklikler',
        'Değişiklikler kayıt edilsin mi?',
        [
          {
            text: 'Evet',
            onPress: async () => {
              try {
                const updates = {};
                if (wasEditingGames) {
                  updates.games   = snapGames;
                  updates.gameIds = snapGames.map((g) => g.gameId);
                }
                if (wasEditingVibe)    updates.vibe       = snapVibe;
                if (wasEditingDiscord) updates.discordTag = snapDiscord.trim();
                await updateUser(uidRef.current, updates);
                await refreshProfileRef.current();
              } catch (err) {
                Alert.alert('Hata', 'Kaydedilemedi: ' + err.message);
              }
            },
          },
          {
            text: 'Hayır',
            style: 'destructive',
            onPress: () => navigation.navigate('Profile'),
          },
        ],
      );
    });
    return unsubscribe;
  }, [navigation, resetEditing]);

  const handleSaveDiscord = async () => {
    setSavingDiscord(true);
    try {
      await updateUser(uid, { discordTag: discordTag.trim() });
      await refreshProfile();
      setEditingDiscord(false);
    } catch (err) {
      Alert.alert('Hata', 'Kaydedilemedi. ' + err.message);
    } finally {
      setSavingDiscord(false);
    }
  };

  // ── Games edit handlers ──────────────────────────────────────────────────────
  const toggleEditGame = (gameId) => {
    setEditGames((prev) => {
      const exists = prev.find((g) => g.gameId === gameId);
      if (exists) return prev.filter((g) => g.gameId !== gameId);
      const game = GAMES.find((g) => g.id === gameId);
      return [...prev, { gameId, rank: game.ranks[0], server: game.servers?.[0] ?? null, nickname: '' }];
    });
    setRankPickerGame(null);
    setServerPickerGame(null);
  };

  const setEditRank = (gameId, rank) => {
    setEditGames((prev) => prev.map((g) => (g.gameId === gameId ? { ...g, rank } : g)));
    setRankPickerGame(null);
  };

  const setEditServer = (gameId, server) => {
    setEditGames((prev) => prev.map((g) => (g.gameId === gameId ? { ...g, server } : g)));
    setServerPickerGame(null);
  };

  const setEditNickname = (gameId, nickname) => {
    setEditGames((prev) => prev.map((g) => (g.gameId === gameId ? { ...g, nickname } : g)));
  };

  const handleSaveGames = async () => {
    if (editGames.length === 0) {
      Alert.alert('Hata', 'En az bir oyun seçmelisin.');
      return;
    }
    setSavingGames(true);
    try {
      const gameIds = editGames.map((g) => g.gameId);
      await updateUser(uid, { games: editGames, gameIds });
      await refreshProfile();
      setEditingGames(false);
    } catch (err) {
      Alert.alert('Hata', 'Kaydedilemedi. ' + err.message);
    } finally {
      setSavingGames(false);
    }
  };

  const handleSaveLookingFor = async (value) => {
    setSavingLookingFor(true);
    try {
      await updateUser(uid, { lookingFor: value });
      setSelectedLookingFor(value);
      await refreshProfile();
    } catch (err) {
      Alert.alert('Hata', 'Kaydedilemedi. ' + err.message);
    } finally {
      setSavingLookingFor(false);
    }
  };

  const handleSaveVibe = async () => {
    setSavingVibe(true);
    try {
      await updateUser(uid, { vibe: selectedVibe });
      await refreshProfile();
      setEditingVibe(false);
    } catch (err) {
      Alert.alert('Hata', 'Oyun tarzı güncellenemedi. ' + err.message);
    } finally {
      setSavingVibe(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Çıkış Yap',
      'Emin misin? Profil bilgilerin korunacak.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Çıkış Yap', style: 'destructive', onPress: signOut },
      ],
    );
  };

  const joinDate = userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'Yakın Zamanda';

  const favoriteGame = (() => {
    if (!userProfile?.games?.length) return null;
    const sentByGame = {};
    requests
      .filter((r) => r.fromUid === uid)
      .forEach((r) => { sentByGame[r.gameId] = (sentByGame[r.gameId] ?? 0) + 1; });
    const topGame = Object.entries(sentByGame).sort((a, b) => b[1] - a[1])[0];
    return getGame(topGame?.[0] ?? userProfile.games[0].gameId);
  })();

  if (!userProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>PROFİL</Text>
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile hero card */}
        <View style={styles.profileCard}>
          <LinearGradient
            colors={['rgba(0,255,209,0.08)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handlePickPhoto}
            disabled={uploadingPhoto}
            style={styles.avatarWrapper}
          >
            <LinearGradient
              colors={['#00FFD1', '#0094FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatarGradient}
            >
              {userProfile.photoURL ? (
                <Image
                  source={{ uri: userProfile.photoURL }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>
                    {userProfile.username?.[0]?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
            </LinearGradient>
            {/* Camera overlay */}
            <View style={styles.cameraOverlay}>
              {uploadingPhoto ? (
                <Text style={styles.cameraIcon}>{uploadProgress}%</Text>
              ) : (
                <Text style={styles.cameraIcon}>📷</Text>
              )}
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{userProfile.username}</Text>
          <Text style={styles.joinDate}>KATILIM: {joinDate.toUpperCase()}</Text>
          <VibeBadge vibeId={userProfile.vibe} />
          {(userProfile.ratingCount ?? 0) >= 3 && (
            <View style={styles.trustBadge}>
              <Text style={styles.trustText}>
                ⭐ {userProfile.trustScore?.toFixed(1)}
                {'  '}
                <Text style={styles.trustCount}>({userProfile.ratingCount} değerlendirme)</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatBox value={loadingStats ? '—' : stats.total} label="GÖNDERİLEN" color={COLORS.secondary} />
          <StatBox value={loadingStats ? '—' : stats.accepted} label="KABUL" color={COLORS.success} />
          <StatBox value={loadingStats ? '—' : `${stats.acceptanceRate}%`} label="KABUL ORANI" color={COLORS.primary} />
        </View>

        {/* Favorite game */}
        {favoriteGame && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAVORİ OYUN</Text>
            <View style={[styles.favoriteCard, { borderColor: `${favoriteGame.color}55` }]}>
              <LinearGradient
                colors={[`${favoriteGame.color}15`, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.accentBar, { backgroundColor: favoriteGame.color }]} />
              <Text style={styles.favoriteEmoji}>{favoriteGame.emoji}</Text>
              <Text style={[styles.favoriteName, { color: favoriteGame.color }]}>{favoriteGame.name}</Text>
            </View>
          </View>
        )}

        {/* My games */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>OYUNLARIM</Text>
            {!editingGames && (
              <TouchableOpacity
                onPress={() => { setEditGames(userProfile.games ?? []); setEditingGames(true); }}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>DÜZENLE</Text>
              </TouchableOpacity>
            )}
          </View>

          {editingGames ? (
            <View style={{ gap: SPACING.sm }}>
              {/* Game grid */}
              <View style={styles.gameGrid}>
                {GAMES.map((game) => {
                  const selected = editGames.find((g) => g.gameId === game.id);
                  return (
                    <TouchableOpacity
                      key={game.id}
                      activeOpacity={0.75}
                      onPress={() => toggleEditGame(game.id)}
                      style={[
                        styles.gameChip,
                        selected
                          ? { backgroundColor: `${game.color}20`, borderColor: game.color }
                          : { backgroundColor: COLORS.surface, borderColor: COLORS.border },
                      ]}
                    >
                      <Text style={styles.gameChipEmoji}>{game.emoji}</Text>
                      <Text style={[styles.gameChipName, selected && { color: game.color }]}>
                        {game.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Per-game rank / server / nick */}
              {editGames.map((g) => {
                const game = getGame(g.gameId);
                if (!game) return null;
                return (
                  <View key={g.gameId} style={[styles.gameDetailCard, { borderColor: `${game.color}44` }]}>
                    <View style={[styles.accentBar, { backgroundColor: game.color }]} />
                    <Text style={[styles.gameDetailTitle, { color: game.color }]}>
                      {game.emoji} {game.name}
                    </Text>

                    {/* Rank picker */}
                    <TouchableOpacity
                      style={styles.pickerRow}
                      onPress={() => setRankPickerGame(rankPickerGame === g.gameId ? null : g.gameId)}
                    >
                      <Text style={styles.pickerLabel}>RANK</Text>
                      <Text style={[styles.pickerValue, { color: game.color }]}>{g.rank} ▾</Text>
                    </TouchableOpacity>
                    {rankPickerGame === g.gameId && (
                      <ScrollView style={styles.dropdownList} nestedScrollEnabled>
                        {game.ranks.map((rank) => (
                          <TouchableOpacity
                            key={rank}
                            style={styles.dropdownItem}
                            onPress={() => setEditRank(g.gameId, rank)}
                          >
                            <Text style={[styles.dropdownItemText, g.rank === rank && { color: game.color }]}>
                              {rank}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}

                    {/* Server picker */}
                    {game.servers && (
                      <>
                        <TouchableOpacity
                          style={styles.pickerRow}
                          onPress={() => setServerPickerGame(serverPickerGame === g.gameId ? null : g.gameId)}
                        >
                          <Text style={styles.pickerLabel}>SERVER</Text>
                          <Text style={[styles.pickerValue, { color: game.color }]}>{g.server ?? '—'} ▾</Text>
                        </TouchableOpacity>
                        {serverPickerGame === g.gameId && (
                          <View style={styles.dropdownList}>
                            {game.servers.map((sv) => (
                              <TouchableOpacity
                                key={sv}
                                style={styles.dropdownItem}
                                onPress={() => setEditServer(g.gameId, sv)}
                              >
                                <Text style={[styles.dropdownItemText, g.server === sv && { color: game.color }]}>
                                  {sv}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </>
                    )}

                    {/* Nickname */}
                    <TextInput
                      style={styles.nicknameInput}
                      placeholder={game.nicknameHint ?? 'Oyun içi isim (isteğe bağlı)'}
                      placeholderTextColor={COLORS.textMuted}
                      value={g.nickname ?? ''}
                      onChangeText={(val) => setEditNickname(g.gameId, val)}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={40}
                    />
                  </View>
                );
              })}

              {/* Save / Cancel */}
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs }}>
                <TouchableOpacity onPress={() => setEditingGames(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>İPTAL</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <HexButton label="KAYDET" onPress={handleSaveGames} loading={savingGames} />
                </View>
              </View>
            </View>
          ) : (
            userProfile.games?.length > 0 ? (
              userProfile.games.map((g, i) => {
                const game = getGame(g.gameId);
                if (!game) return null;
                return (
                  <View key={i} style={[styles.gameItem, { borderColor: `${game.color}44` }]}>
                    <View style={[styles.accentBar, { backgroundColor: game.color }]} />
                    <Text style={styles.gameItemEmoji}>{game.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gameItemName}>{game.name}</Text>
                      <Text style={[styles.gameItemRank, { color: game.color }]}>{g.rank}</Text>
                      {g.nickname ? <Text style={styles.gameItemNickname}>🎮 {g.nickname}</Text> : null}
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      {g.server ? (
                        <View style={styles.serverBadge}>
                          <Text style={[styles.serverText, { color: game.color }]}>{g.server}</Text>
                        </View>
                      ) : null}
                      {g.region ? (
                        <View style={styles.regionBadge}>
                          <Text style={styles.regionText}>{g.region}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={styles.gameHint}>Henüz oyun eklenmedi. DÜZENLE'ye bas.</Text>
            )
          )}
        </View>

        {/* Discord tag */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DISCORD TAG</Text>
            {!editingDiscord && (
              <TouchableOpacity onPress={() => setEditingDiscord(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>{userProfile?.discordTag ? 'DEĞİŞTİR' : 'EKLE'}</Text>
              </TouchableOpacity>
            )}
          </View>
          {editingDiscord ? (
            <View style={{ gap: SPACING.sm }}>
              <TextInput
                style={styles.discordInput}
                placeholder="örn. kullaniciadi#1234"
                placeholderTextColor={COLORS.textMuted}
                value={discordTag}
                onChangeText={setDiscordTag}
                maxLength={40}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                <TouchableOpacity onPress={() => setEditingDiscord(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>İPTAL</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <HexButton label="KAYDET" onPress={handleSaveDiscord} loading={savingDiscord} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.discordRow}>
              <Text style={styles.discordIcon}>💬</Text>
              <Text style={[styles.discordValue, !userProfile?.discordTag && { color: COLORS.textMuted }]}>
                {userProfile?.discordTag || 'Not set — visible to your squads after matching'}
              </Text>
            </View>
          )}
        </View>

        {/* Kadro boyutu */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>KADRO BOYUTU</Text>
            <Text style={styles.sectionHint}>Kaç kişilik kadro arıyorsun?</Text>
          </View>
          <View style={styles.groupSizeRow}>
            {GROUP_SIZES.map((gs) => {
              const isSelected = selectedLookingFor === gs.id;
              return (
                <TouchableOpacity
                  key={gs.id}
                  activeOpacity={0.75}
                  onPress={() => handleSaveLookingFor(gs.id)}
                  style={[styles.groupSizeBtn, isSelected && styles.groupSizeBtnActive]}
                >
                  <Text style={styles.groupSizeEmoji}>{gs.emoji}</Text>
                  <Text style={[styles.groupSizeLabel, isSelected && { color: COLORS.primary }]}>
                    {gs.label}
                  </Text>
                  <Text style={styles.groupSizeDesc}>{gs.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {savingLookingFor && <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 6 }} />}
        </View>

        {/* Edit vibe */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>OYUN TARZI</Text>
            {!editingVibe && (
              <TouchableOpacity onPress={() => setEditingVibe(true)} style={styles.editBtn}>
                <Text style={styles.editBtnText}>DEĞİŞTİR</Text>
              </TouchableOpacity>
            )}
          </View>

          {editingVibe ? (
            <View style={{ gap: SPACING.sm }}>
              {VIBES.map((vibe) => {
                const isSelected = selectedVibe === vibe.id;
                return (
                  <TouchableOpacity
                    key={vibe.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedVibe(vibe.id)}
                    style={[
                      styles.vibeOption,
                      isSelected && { borderColor: vibe.color, backgroundColor: `${vibe.color}15` },
                    ]}
                  >
                    <Text style={{ fontSize: 22 }}>{vibe.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.vibeLabel, isSelected && { color: vibe.color }]}>{vibe.label}</Text>
                      <Text style={styles.vibeSub}>{vibe.sublabel}</Text>
                    </View>
                    {isSelected && <View style={[styles.selectedDot, { backgroundColor: vibe.color }]} />}
                  </TouchableOpacity>
                );
              })}
              <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs }}>
                <TouchableOpacity onPress={() => setEditingVibe(false)} style={styles.cancelBtn}>
                  <Text style={styles.cancelBtnText}>İPTAL</Text>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <HexButton
                    label="TARZI KAYDET"
                    onPress={handleSaveVibe}
                    loading={savingVibe}
                    disabled={selectedVibe === userProfile.vibe}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.currentVibe}>
              <VibeBadge vibeId={userProfile.vibe} />
              <Text style={styles.vibeHint}>DEĞİŞTİR'e bas ve güncelle</Text>
            </View>
          )}
        </View>

        {/* Oynama zamanı */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>OYNAMA ZAMANI</Text>
            {savingPlayTimes && <ActivityIndicator size="small" color={COLORS.primary} />}
          </View>
          <Text style={[styles.sectionHint, { marginBottom: SPACING.xs }]}>
            Genellikle hangi saatlerde oynuyorsun? (Çoklu seçim)
          </Text>
          <View style={styles.playTimeGrid}>
            {PLAY_TIMES.map((pt) => {
              const isSelected = selectedPlayTimes.includes(pt.id);
              return (
                <TouchableOpacity
                  key={pt.id}
                  activeOpacity={0.75}
                  onPress={() => togglePlayTime(pt.id)}
                  style={[
                    styles.playTimeBtn,
                    isSelected && { borderColor: pt.color, backgroundColor: `${pt.color}18` },
                  ]}
                >
                  <Text style={styles.playTimeEmoji}>{pt.emoji}</Text>
                  <Text style={[styles.playTimeLabel, isSelected && { color: pt.color }]}>
                    {pt.label}
                  </Text>
                  <Text style={styles.playTimeDesc}>{pt.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Sign out */}
        <View style={[styles.section, { marginTop: SPACING.lg }]}>
          <HexButton label="ÇIKIŞ YAP" onPress={handleSignOut} variant="outline" />
        </View>

        {/* Ayarlar */}
        <View style={[styles.section, { marginBottom: SPACING.xxl }]}>
          <Text style={styles.sectionTitle}>UYGULAMA</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => Linking.openURL('https://kadirmanes.github.io/squadup-web/privacy.html')}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsRowIcon}>🔒</Text>
              <Text style={styles.settingsRowLabel}>Gizlilik Politikası</Text>
              <Text style={styles.settingsRowChevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <TouchableOpacity
              style={styles.settingsRow}
              onPress={() => Linking.openURL('https://kadirmanes.github.io/squadup-web/terms.html')}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsRowIcon}>📄</Text>
              <Text style={styles.settingsRowLabel}>Kullanım Şartları</Text>
              <Text style={styles.settingsRowChevron}>›</Text>
            </TouchableOpacity>

            <View style={styles.settingsDivider} />

            <View style={[styles.settingsRow, { opacity: 0.5 }]}>
              <Text style={styles.settingsRowIcon}>📱</Text>
              <Text style={styles.settingsRowLabel}>Sürüm</Text>
              <Text style={styles.settingsRowValue}>
                {Constants.expoConfig?.version ?? '1.0.0'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatBox({ value, label, color }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function formatDate(ts) {
  try {
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return 'Recently';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontFamily: FONTS.orbitron.extraBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  scrollContent: { padding: SPACING.lg },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  avatarWrapper: {
    marginBottom: SPACING.xs,
    position: 'relative',
  },
  avatarGradient: {
    width: 88,
    height: 88,
    borderRadius: BORDER_RADIUS.full,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONTS.orbitron.black,
    fontSize: 32,
    color: COLORS.primary,
  },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.full,
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  cameraIcon: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontFamily: FONTS.orbitron.bold,
  },
  username: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  joinDate: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1.5,
    marginBottom: SPACING.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 20,
    letterSpacing: 0.5,
  },
  statLabel: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
    textAlign: 'center',
  },
  section: { gap: SPACING.sm, marginBottom: SPACING.md },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: FONTS.orbitron.semiBold,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 2,
  },
  editBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    backgroundColor: COLORS.primaryDim,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: `${COLORS.primary}55`,
  },
  editBtnText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 1,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  accentBar: {
    width: 3,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  favoriteEmoji: { fontSize: 28, marginLeft: 10 },
  favoriteName: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  gameItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    gap: SPACING.sm,
    overflow: 'hidden',
  },
  gameItemEmoji: { fontSize: 20, marginLeft: 10 },
  gameItemName: {
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  gameItemRank: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 12,
  },
  gameItemNickname: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  serverBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serverText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    letterSpacing: 1,
  },
  regionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
  },
  regionText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  currentVibe: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  vibeHint: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    flex: 1,
  },
  vibeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.sm,
    gap: SPACING.sm,
  },
  vibeLabel: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  vibeSub: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  selectedDot: { width: 8, height: 8, borderRadius: 4 },
  sectionHint: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  groupSizeRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
    marginTop: SPACING.sm,
  },
  groupSizeBtn: {
    flex: 1,
    minWidth: 70,
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 2,
  },
  groupSizeBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(99,102,241,0.1)',
  },
  groupSizeEmoji: { fontSize: 20 },
  groupSizeLabel: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  groupSizeDesc: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  cancelBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  cancelBtnText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 11,
    color: COLORS.textSecondary,
    letterSpacing: 1,
  },
  gameGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    gap: 4,
  },
  gameChipEmoji: { fontSize: 14 },
  gameChipName: {
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  gameDetailCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    paddingLeft: SPACING.md + 3,
    gap: 6,
    overflow: 'hidden',
  },
  gameDetailTitle: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  pickerLabel: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  pickerValue: {
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 14,
  },
  dropdownList: {
    maxHeight: 160,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownItem: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemText: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  nicknameInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  gameHint: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: SPACING.sm,
  },
  discordInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  discordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
  },
  discordIcon: { fontSize: 20 },
  discordValue: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  playTimeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  playTimeBtn: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    gap: 2,
  },
  playTimeEmoji: { fontSize: 22 },
  playTimeLabel: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 11,
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  playTimeDesc: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  // Trust score badge on profile card
  trustBadge: {
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.35)',
    marginTop: SPACING.xs,
  },
  trustText: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 14,
    color: '#F59E0B',
  },
  trustCount: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  // Settings card
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  settingsRowIcon: { fontSize: 16, width: 22, textAlign: 'center' },
  settingsRowLabel: {
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 15,
    color: COLORS.textPrimary,
    flex: 1,
  },
  settingsRowChevron: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 20,
    color: COLORS.textMuted,
  },
  settingsRowValue: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
});
