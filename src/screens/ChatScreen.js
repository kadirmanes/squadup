import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { sendMessage, subscribeToMessages } from '../services/chatService';
import { getGame } from '../constants/games';
import { sendPushNotification } from '../services/notificationService';
import { getUser } from '../services/firestoreService';

export default function ChatScreen({ route, navigation }) {
  const { chatId, otherUid, otherUsername, gameId } = route.params;
  const { uid, userProfile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherPushToken, setOtherPushToken] = useState(null);
  const flatListRef = useRef(null);
  const game = getGame(gameId);

  // Load other user's push token once
  useEffect(() => {
    getUser(otherUid).then((u) => {
      if (u?.expoPushToken) {
        setOtherPushToken(u.expoPushToken);
        console.log('[Chat] Other user push token loaded:', u.expoPushToken);
      } else {
        console.warn('[Chat] Other user has no push token — notifications will not be sent');
      }
    }).catch(() => {});
  }, [otherUid]);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = subscribeToMessages(chatId, setMessages);
    return unsubscribe;
  }, [chatId]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setText('');
    setSending(true);
    try {
      await sendMessage(chatId, uid, trimmed);
      // Notify other player
      if (otherPushToken) {
        await sendPushNotification(
          otherPushToken,
          `💬 ${userProfile?.username ?? 'Your squad'}`,
          trimmed,
        );
      }
    } catch (err) {
      console.warn('[Chat] Send error:', err.message);
    } finally {
      setSending(false);
    }
  }, [text, sending, chatId, uid, otherPushToken, userProfile]);

  const renderItem = useCallback(({ item }) => (
    <MessageBubble message={item} isOwn={item.senderId === uid} />
  ), [uid]);

  const keyExtractor = useCallback((item) => item.id, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: game?.color ? `${game.color}44` : COLORS.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{otherUsername}</Text>
          <Text style={[styles.headerGame, { color: game?.color ?? COLORS.primary }]}>
            {game?.emoji} {game?.name ?? gameId}
          </Text>
        </View>
        <View style={[styles.headerAvatar, { backgroundColor: `${game?.color ?? COLORS.primary}22` }]}>
          <Text style={{ fontSize: 20 }}>{game?.emoji ?? '🎮'}</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>Eşleşme tamam! Merhaba de 👋</Text>
            </View>
          }
        />

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Mesaj yaz..."
            placeholderTextColor={COLORS.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { opacity: text.trim() && !sending ? 1 : 0.4 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={COLORS.background} />
            ) : (
              <Text style={styles.sendIcon}>▶</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({ message, isOwn }) {
  const timeLabel = (() => {
    try {
      const date = message.createdAt?.toDate ? message.createdAt.toDate() : new Date(message.createdAt);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleRight : styles.bubbleLeft]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, isOwn && { color: COLORS.background }]}>
          {message.text}
        </Text>
      </View>
      <Text style={[styles.bubbleTime, isOwn && { textAlign: 'right' }]}>{timeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  backBtn: { padding: SPACING.xs },
  backText: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 20,
    color: COLORS.textPrimary,
  },
  headerInfo: { flex: 1 },
  headerName: {
    fontFamily: FONTS.rajdhani.bold,
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  headerGame: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    padding: SPACING.md,
    paddingBottom: SPACING.sm,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.xxl,
  },
  emptyChatText: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 15,
    color: COLORS.textMuted,
  },
  bubbleWrapper: {
    marginBottom: SPACING.sm,
    maxWidth: '80%',
  },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  bubble: {
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  bubbleOwn: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 16,
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  bubbleTime: {
    fontFamily: FONTS.rajdhani.regular,
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
    backgroundColor: COLORS.surface,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontFamily: FONTS.rajdhani.medium,
    fontSize: 16,
    color: COLORS.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sendIcon: {
    color: COLORS.background,
    fontSize: 16,
    fontFamily: FONTS.orbitron.bold,
  },
});
