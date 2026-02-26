import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { useTrip } from '../context/TripContext';
import { generateResponse, getQuickReplies } from '../utils/aiResponder';

// ─── Typing indicator ─────────────────────────────────────────────────────

function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0,  duration: 300, useNativeDriver: true }),
          Animated.delay(300),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={typingStyles.container}>
      <View style={typingStyles.bubble}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[typingStyles.dot, { transform: [{ translateY: dot }] }]}
          />
        ))}
      </View>
    </View>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <View style={[bubbleStyles.row, isUser && bubbleStyles.rowUser]}>
      {!isUser && <Text style={bubbleStyles.avatar}>🤖</Text>}
      <View
        style={[
          bubbleStyles.bubble,
          isUser ? bubbleStyles.bubbleUser : bubbleStyles.bubbleAI,
        ]}
      >
        <Text style={[bubbleStyles.text, isUser && bubbleStyles.textUser]}>
          {message.text}
        </Text>
        <Text style={[bubbleStyles.time, isUser && bubbleStyles.timeUser]}>
          {message.timestamp}
        </Text>
      </View>
    </View>
  );
}

// ─── Quick reply chip ─────────────────────────────────────────────────────

function QuickReply({ label, onPress }) {
  return (
    <TouchableOpacity style={qrStyles.chip} onPress={onPress} activeOpacity={0.75}>
      <Text style={qrStyles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function nowTime() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'ai',
  text: '👋 Merhaba! Ben NomadWise AI asistanın. Seyahatinle ilgili her şeyi sorabilirsin — bütçe, yemek, güzergah veya konaklama hakkında.',
  timestamp: nowTime(),
};

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { preferences, tripData } = useTrip();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  const quickReplies = getQuickReplies(preferences);

  const scrollToBottom = () => {
    setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    const userText = (text || input).trim();
    if (!userText) return;

    // Add user message
    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: nowTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate AI typing delay (800ms – 1.4s)
    const delay = 800 + Math.random() * 600;
    setTimeout(() => {
      const responseText = generateResponse(userText, preferences, tripData);
      const aiMsg = {
        id: `a-${Date.now()}`,
        role: 'ai',
        text: responseText,
        timestamp: nowTime(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, delay);
  };

  const renderItem = ({ item }) => <MessageBubble message={item} />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarEmoji}>🤖</Text>
        </View>
        <View>
          <Text style={styles.aiName}>NomadWise AI</Text>
          <Text style={styles.aiStatus}>
            {isTyping ? 'Yazıyor...' : '● Çevrimiçi'}
          </Text>
        </View>
        {preferences && (
          <View style={styles.contextBadge}>
            <Text style={styles.contextText} numberOfLines={1}>
              📍 {preferences.destination}
            </Text>
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={isTyping ? <TypingDots /> : null}
        />

        {/* Quick replies */}
        {!isTyping && messages.length < 4 && (
          <View style={styles.quickRepliesRow}>
            {quickReplies.map((qr) => (
              <QuickReply key={qr} label={qr} onPress={() => sendMessage(qr)} />
            ))}
          </View>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, Shadow.lg]}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Sor bakalım..."
            placeholderTextColor={Colors.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={300}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isTyping) && styles.sendBtnDisabled]}
            onPress={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            activeOpacity={0.8}
          >
            <Text style={styles.sendIcon}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  aiAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiAvatarEmoji: { fontSize: 22 },
  aiName: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  aiStatus: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.medium,
  },
  contextBadge: {
    marginLeft: 'auto',
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    maxWidth: 130,
  },
  contextText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },

  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },

  quickRepliesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
});

const bubbleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  rowUser: {
    flexDirection: 'row-reverse',
  },
  avatar: { fontSize: 24, marginBottom: 4 },
  bubble: {
    maxWidth: '80%',
    borderRadius: Radius.xl,
    padding: Spacing.sm + 4,
  },
  bubbleAI: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    ...Shadow.sm,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  text: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  textUser: { color: '#FFFFFF' },
  time: {
    fontSize: 10,
    color: Colors.textTertiary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  timeUser: { color: 'rgba(255,255,255,0.6)' },
});

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 14,
    ...Shadow.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textTertiary,
  },
});

const qrStyles = StyleSheet.create({
  chip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary + '50',
    paddingHorizontal: 14,
    paddingVertical: 7,
    ...Shadow.sm,
  },
  text: {
    fontSize: Typography.size.xs,
    color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },
});
