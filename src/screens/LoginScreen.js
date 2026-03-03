import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { Routes } from '../navigation/routes';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
      // AuthContext state change → AppNavigator switches to app screens automatically
    } catch (e) {
      Alert.alert('Giriş Hatası', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Branding ── */}
          <View style={styles.brand}>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🧭</Text>
            </View>
            <Text style={styles.appName}>NomadWise</Text>
            <Text style={styles.tagline}>Seyahatini Keşfet · Rotanı Yaşa</Text>
          </View>

          {/* ── Form Card ── */}
          <View style={[styles.card, Shadow.md]}>
            <Text style={styles.cardTitle}>Hoş Geldin</Text>
            <Text style={styles.cardSubtitle}>Hesabına giriş yap</Text>

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>E-posta</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ornek@mail.com"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Şifre</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textTertiary}
                  secureTextEntry={!showPass}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot */}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => Alert.alert('Şifremi Unuttum', 'Bu özellik yakında aktif olacak.')}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Şifremi Unuttum</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
              </Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={styles.googleBtn}
              onPress={() => Alert.alert('Google ile Giriş', 'Bu özellik yakında aktif olacak!')}
              activeOpacity={0.85}
            >
              <View style={styles.googleLogo}>
                <Text style={styles.googleLogoText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Google ile Giriş Yap</Text>
            </TouchableOpacity>
          </View>

          {/* ── Register Link ── */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Hesabın yok mu? </Text>
            <TouchableOpacity onPress={() => navigation.navigate(Routes.REGISTER)} activeOpacity={0.7}>
              <Text style={styles.linkText}>Kayıt Ol</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl, justifyContent: 'center' },

  // Branding
  brand:     { alignItems: 'center', marginBottom: Spacing.xl, gap: Spacing.sm },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary + '40',
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: Typography.size.xxl, fontWeight: Typography.weight.extrabold,
    color: Colors.primary, letterSpacing: -0.5,
  },
  tagline: { fontSize: Typography.size.sm, color: Colors.textTertiary, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xxl,
    padding: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: Typography.size.xl, fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary, letterSpacing: -0.3,
  },
  cardSubtitle: { fontSize: Typography.size.sm, color: Colors.textTertiary, marginTop: -Spacing.sm },

  // Fields
  fieldWrap:  { gap: 6 },
  fieldLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.sm, height: 52,
  },
  inputIcon: { fontSize: 18 },
  input: {
    flex: 1, fontSize: Typography.size.base, color: Colors.textPrimary,
    paddingVertical: 0,
  },
  eyeBtn:  { padding: Spacing.xs },
  eyeText: { fontSize: 18 },

  forgotRow: { alignItems: 'flex-end', marginTop: -Spacing.xs },
  forgotText: {
    fontSize: Typography.size.sm, color: Colors.primary,
    fontWeight: Typography.weight.semibold,
  },

  // Buttons
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    height: 54, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: Typography.size.base, fontWeight: Typography.weight.bold,
    color: '#FFFFFF', letterSpacing: 0.2,
  },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.borderLight },
  dividerLabel: { fontSize: Typography.size.sm, color: Colors.textTertiary },

  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, borderRadius: Radius.xl, height: 54,
    borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  googleLogo: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center',
  },
  googleLogoText: {
    fontSize: 15, fontWeight: Typography.weight.bold, color: '#FFFFFF',
  },
  googleBtnText: {
    fontSize: Typography.size.base, fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },

  // Bottom
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomText: { fontSize: Typography.size.sm, color: Colors.textTertiary },
  linkText: {
    fontSize: Typography.size.sm, fontWeight: Typography.weight.bold,
    color: Colors.primary,
  },
});
