import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { getUser, submitRating } from '../services/firestoreService';
import { getGame, openGameOrStore } from '../constants/games';

export default function SquadsScreen({ navigation }) {
  const { uid } = useAuth();
  const { chats, isLoadingChats, chatsError, refreshChats } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshChats();
    setRefreshing(false);
  }, [refreshChats]);

  const renderItem = useCallback(({ item }) => (
    <SquadCard chat={item} uid={uid} navigation={navigation} />
  ), [uid, navigation]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>KADROLARIM</Text>
          <Text style={styles.headerCount}>
            {chats.length} <Text style={styles.headerCountSub}>BAĞLANTI</Text>
          </Text>
        </View>
        <View style={styles.divider} />
      </SafeAreaView>

      {isLoadingChats && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : chatsError ? (
        <ErrorState message={chatsError} onRetry={handleRefresh} />
      ) : chats.length === 0 ? (
        <EmptyState onRefresh={handleRefresh} refreshing={refreshing} />
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
}

function SquadCard({ chat, uid, navigation }) {
  const otherUid = chat.participants.find((p) => p !== uid);
  const [otherUser, setOtherUser] = useState(null);
  const [rated, setRated] = useState(false);
  const [rating, setRating] = useState(null);
  const game = getGame(chat.gameId);

  useEffect(() => {
    if (!otherUid) return;
    getUser(otherUid).then(setOtherUser).catch(() => {});
  }, [otherUid]);

  const handlePress = () => {
    navigation.navigate('Chat', {
      chatId: chat.id,
      otherUid,
      otherUsername: otherUser?.username ?? otherUid?.slice(0, 8) ?? '...',
      gameId: chat.gameId,
    });
  };

  const timeLabel = (() => {
    const ts = chat.lastMessageAt ?? chat.createdAt;
    if (!ts) return '';
    try {
      const date = ts?.toDate ? ts.toDate() : new Date(ts);
      const diff = Math.floor((Date.now() - date) / 1000);
      if (diff < 60) return 'Az önce';
      if (diff < 3600) return `${Math.floor(diff / 60)} dk`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} sa`;
      return date.toLocaleDateString('tr-TR');
    } catch {
      return '';
    }
  })();

  const handleOpenGame = () => openGameOrStore(game);

  const handleViewProfile = () => {
    if (!otherUser) return;
    // Flatten player data the same way FindSquadScreen would
    const player = {
      ...otherUser,
      uid: otherUid,
      gameId: chat.gameId,
    };
    navigation.navigate('PlayerProfile', { player });
  };

  const handleRate = () => {
    if (rated) return;
    const username = otherUser?.username ?? 'Bu oyuncuyu';
    Alert.alert(
      '⭐ Oyuncuyu Değerlendir',
      `${username} ile olan deneyimini puanla:`,
      [
        { text: '⭐ 1 – Kötü',      onPress: () => submitScore(1) },
        { text: '⭐⭐ 2 – Fena Değil', onPress: () => submitScore(2) },
        { text: '⭐⭐⭐ 3 – İyi',     onPress: () => submitScore(3) },
        { text: '⭐⭐⭐⭐ 4 – Harika', onPress: () => submitScore(4) },
        { text: '⭐⭐⭐⭐⭐ 5 – Mükemmel', onPress: () => submitScore(5) },
        { text: 'İptal', style: 'cancel' },
      ]
    );
  };

  const submitScore = async (score) => {
    try {
      const result = await submitRating(uid, otherUid, chat.id, score);
      if (result?.alreadyRated) {
        Alert.alert('Zaten Değerlendirildi', 'Bu oyuncuyu daha önce puanladınız.');
      }
      setRating(score);
      setRated(true);
    } catch (err) {
      Alert.alert('Hata', 'Puanlama gönderilemedi: ' + err.message);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardMain}>
        {/* Oyuncu avatarı — tıklanınca profil */}
        <TouchableOpacity
          activeOpacity={otherUser ? 0.75 : 1}
          onPress={handleViewProfile}
          style={[styles.avatar, { backgroundColor: `${game?.color ?? COLORS.primary}22`, borderColor: `${game?.color ?? COLORS.primary}55` }]}
        >
          <Text style={{ fontSize: 24 }}>{game?.emoji ?? '🎮'}</Text>
        </TouchableOpacity>

        {/* Sohbet bilgileri — tıklanınca chat */}
        <TouchableOpacity activeOpacity={0.8} onPress={handlePress} style={styles.cardInfo}>
          <View style={styles.cardTop}>
            <Text style={styles.username} numberOfLines={1}>
              {otherUser?.username ?? otherUid?.slice(0, 8) ?? '...'}
            </Text>
            <Text style={styles.time}>{timeLabel}</Text>
          </View>
          <Text style={[styles.gameName, { color: game?.color ?? COLORS.primary }]}>
            {game?.name ?? chat.gameId ?? '—'}
          </Text>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {chat.lastMessage ?? 'Henüz mesaj yok — merhaba de! 👋'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePress} activeOpacity={0.6} style={styles.chevronBtn}>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Action buttons row */}
      <View style={styles.cardActions}>
        {/* 🎮 Oyunu Aç butonu */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenGame}
          style={[
            styles.actionBtn,
            { borderColor: game?.mobileScheme ? (game?.color ?? COLORS.primary) : COLORS.border },
          ]}
        >
          <Text style={[
            styles.actionBtnText,
            { color: game?.mobileScheme ? (game?.color ?? COLORS.primary) : COLORS.textMuted },
          ]}>
            {game?.mobileScheme ? `▶ ${game.name.toUpperCase()} AÇ` : '🖥️ PC OYUNU'}
          </Text>
        </TouchableOpacity>

        {/* ⭐ Puanla butonu */}
        <TouchableOpacity
          activeOpacity={rated ? 1 : 0.8}
          onPress={handleRate}
          style={[styles.actionBtn, styles.rateBtn, rated && styles.rateBtnDone]}
        >
          <Text style={[styles.actionBtnText, styles.rateBtnText, rated && styles.rateBtnDoneText]}>
            {rated ? `✅ ${rating}★ VERİLDİ` : '⭐ PUANLA'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState({ onRefresh, refreshing }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 48, marginBottom: SPACING.sm }}>⚔️</Text>
      <Text style={styles.emptyTitle}>KADRO YOK</Text>
      <Text style={styles.emptyDesc}>
        Bir davet kabul et ya da davetini kabul ettir — sohbet başlasın.
      </Text>
      <TouchableOpacity
        onPress={onRefresh}
        disabled={refreshing}
        style={styles.retryBtn}
      >
        <Text style={styles.retryText}>{refreshing ? 'YÜKLENİYOR...' : '🔄 YENİLE'}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <View style={styles.center}>
      <Text style={{ fontSize: 48, marginBottom: SPACING.sm }}>⚠️</Text>
      <Text style={styles.emptyTitle}>BAĞLANTI HATASI</Text>
      <Text style={styles.emptyDesc}>{message}</Text>
      <TouchableOpacity onPress={onRetry} style={styles.retryBtn}>
        <Text style={styles.retryText}>YENİDEN DENE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  headerTitle: {
    fontFamily: FONTS.orbitron.extraBold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: 2,
  },
  headerCount: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 14,
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  headerCountSub: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 1,
  },
  divider: { height: 1, backgroundColor: COLORS.border },
  list: { padding: SPACING.md, paddingBottom: SPACING.xl },
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  chevronBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  actionBtnText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 10,
    letterSpacing: 1.5,
  },
  rateBtn: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  rateBtnText: {
    color: '#F59E0B',
  },
  rateBtnDone: {
    backgroundColor: '#F59E0B0F',
  },
  rateBtnDoneText: {
    color: COLORS.textMuted,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: { flex: 1, gap: 3, justifyContent: 'center' },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 17,
    color: COLORS.textPrimary,
    flex: 1,
  },
  time: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 11,
    color: COLORS.textMuted,
    marginLeft: SPACING.xs,
  },
  gameName: {
    fontFamily: FONTS.rajdhani.semiBold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  lastMessage: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chevron: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 24,
    color: COLORS.textMuted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 18,
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  emptyDesc: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryDim,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  retryText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 11,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
});
