import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirm.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm alanları doldurun.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Şifre Uyuşmuyor', 'Girdiğiniz şifreler aynı değil.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Şifre Çok Kısa', 'Şifreniz en az 6 karakter olmalı.');
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      // Auth state change → AppNavigator switches to app screens automatically
    } catch (e) {
      Alert.alert('Kayıt Hatası', e.message);
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
          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={styles.backIcon}>‹</Text>
            </TouchableOpacity>
            <View style={styles.logoBox}>
              <Text style={styles.logoEmoji}>🧭</Text>
            </View>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>NomadWise'a katıl, rotanı keşfet</Text>
          </View>

          {/* ── Form Card ── */}
          <View style={[styles.card, Shadow.md]}>

            {/* Name */}
            <Field
              label="Ad Soyad"
              icon="👤"
              value={name}
              onChangeText={setName}
              placeholder="Adınız ve soyadınız"
              autoCapitalize="words"
            />

            {/* Email */}
            <Field
              label="E-posta"
              icon="✉️"
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <Field
              label="Şifre"
              icon="🔒"
              value={password}
              onChangeText={setPassword}
              placeholder="En az 6 karakter"
              secureTextEntry={!showPass}
              autoCapitalize="none"
              rightAction={
                <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              }
            />

            {/* Confirm */}
            <Field
              label="Şifre Tekrar"
              icon="🔑"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Şifreyi tekrar gir"
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />

            {/* Register Button */}
            <TouchableOpacity
              style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
              onPress={handleRegister}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? 'Hesap oluşturuluyor…' : 'Kayıt Ol'}
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
              onPress={() => Alert.alert('Google ile Kayıt', 'Bu özellik yakında aktif olacak!')}
              activeOpacity={0.85}
            >
              <View style={styles.googleLogo}>
                <Text style={styles.googleLogoText}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Google ile Kayıt Ol</Text>
            </TouchableOpacity>

            {/* Terms note */}
            <Text style={styles.terms}>
              Kayıt olarak{' '}
              <Text style={styles.termsLink} onPress={() => {}}>Kullanım Koşulları</Text>
              {'nı ve '}
              <Text style={styles.termsLink} onPress={() => {}}>Gizlilik Politikası</Text>
              {'nı kabul etmiş olursunuz.'}
            </Text>
          </View>

          {/* ── Login Link ── */}
          <View style={styles.bottomRow}>
            <Text style={styles.bottomText}>Zaten hesabın var mı? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={styles.linkText}>Giriş Yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, icon, rightAction, ...inputProps }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <Text style={styles.inputIcon}>{icon}</Text>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          placeholderTextColor={Colors.textTertiary}
          autoCorrect={false}
          {...inputProps}
        />
        {rightAction}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.background },
  content: { flexGrow: 1, paddingHorizontal: Spacing.md, paddingBottom: Spacing.xl },

  // Header
  header: { alignItems: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.xl, gap: Spacing.sm },
  backBtn: {
    position: 'absolute', left: 0, top: Spacing.md,
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: Colors.primary, fontWeight: Typography.weight.bold, lineHeight: 30 },
  logoBox: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary + '40',
  },
  logoEmoji: { fontSize: 32 },
  title: {
    fontSize: Typography.size.xxl, fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary, letterSpacing: -0.5,
  },
  subtitle: { fontSize: Typography.size.sm, color: Colors.textTertiary, textAlign: 'center' },

  // Card
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xxl,
    padding: Spacing.lg, gap: Spacing.md, marginBottom: Spacing.lg,
  },

  // Fields
  fieldWrap: { gap: 6 },
  fieldLabel: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textSecondary },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.sm, height: 52,
  },
  inputIcon: { fontSize: 18 },
  input: { fontSize: Typography.size.base, color: Colors.textPrimary, paddingVertical: 0 },
  eyeBtn: { padding: Spacing.xs },
  eyeText: { fontSize: 18 },

  // Buttons
  primaryBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    height: 54, alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.xs,
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
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  googleLogo: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#4285F4', alignItems: 'center', justifyContent: 'center',
  },
  googleLogoText: { fontSize: 15, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
  googleBtnText: {
    fontSize: Typography.size.base, fontWeight: Typography.weight.semibold,
    color: Colors.textPrimary,
  },

  // Terms
  terms: { fontSize: 11, color: Colors.textTertiary, textAlign: 'center', lineHeight: 17 },
  termsLink: { color: Colors.primary, fontWeight: Typography.weight.semibold },

  // Bottom
  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomText: { fontSize: Typography.size.sm, color: Colors.textTertiary },
  linkText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.primary },
});
