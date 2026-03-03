import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

function getInitials(name = '') {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function Field({ label, icon, hint, ...inputProps }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>
        <Text style={styles.fieldIcon}>{icon}  </Text>
        {label}
      </Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.textTertiary}
        autoCorrect={false}
        {...inputProps}
      />
      {hint && <Text style={styles.fieldHint}>{hint}</Text>}
    </View>
  );
}

export default function PersonalInfoScreen({ navigation }) {
  const { user, updateProfile } = useAuth();

  const [name,      setName]      = useState(user?.name      || '');
  const [email,     setEmail]     = useState(user?.email     || '');
  const [phone,     setPhone]     = useState(user?.phone     || '');
  const [city,      setCity]      = useState(user?.city      || '');
  const [bio,       setBio]       = useState(user?.bio       || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [saving,    setSaving]    = useState(false);
  const [dirty,     setDirty]     = useState(false);

  // Track unsaved changes
  useEffect(() => {
    const changed =
      name !== (user?.name || '') ||
      email !== (user?.email || '') ||
      phone !== (user?.phone || '') ||
      city  !== (user?.city  || '') ||
      bio   !== (user?.bio   || '') ||
      birthDate !== (user?.birthDate || '');
    setDirty(changed);
  }, [name, email, phone, city, bio, birthDate]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Ad Gerekli', 'Lütfen adınızı girin.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), email: email.trim(), phone, city, bio, birthDate });
      setDirty(false);
      Alert.alert('Kaydedildi', 'Kişisel bilgileriniz güncellendi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Hata', 'Bilgiler kaydedilemedi. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (dirty) {
      Alert.alert(
        'Kaydedilmemiş Değişiklikler',
        'Yaptığınız değişiklikler kaybolacak. Geri dönmek istiyor musunuz?',
        [
          { text: 'Vazgeç', style: 'cancel' },
          { text: 'Geri Dön', style: 'destructive', onPress: () => navigation.goBack() },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Nav Bar ── */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Kişisel Bilgiler</Text>
        {dirty ? (
          <TouchableOpacity
            style={styles.saveHeaderBtn}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.8}
          >
            <Text style={styles.saveHeaderBtnText}>{saving ? '…' : 'Kaydet'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Avatar ── */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>{getInitials(name)}</Text>
            </View>
            <TouchableOpacity
              style={styles.changePhotoBtn}
              onPress={() => Alert.alert('Fotoğraf Değiştir', 'Bu özellik yakında aktif olacak.')}
              activeOpacity={0.7}
            >
              <Text style={styles.changePhotoText}>Fotoğrafı Değiştir</Text>
            </TouchableOpacity>
          </View>

          {/* ── Fields ── */}
          <View style={[styles.section, Shadow.sm]}>
            <Text style={styles.sectionTitle}>Temel Bilgiler</Text>

            <Field
              label="Ad Soyad"
              icon="👤"
              value={name}
              onChangeText={setName}
              placeholder="Adınız ve soyadınız"
              autoCapitalize="words"
            />

            <View style={styles.fieldDivider} />

            <Field
              label="E-posta"
              icon="✉️"
              value={email}
              onChangeText={setEmail}
              placeholder="ornek@mail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              hint="Giriş için kullandığınız adres"
            />
          </View>

          <View style={[styles.section, Shadow.sm]}>
            <Text style={styles.sectionTitle}>İletişim & Konum</Text>

            <Field
              label="Telefon"
              icon="📱"
              value={phone}
              onChangeText={setPhone}
              placeholder="+90 5xx xxx xx xx"
              keyboardType="phone-pad"
            />

            <View style={styles.fieldDivider} />

            <Field
              label="Şehir"
              icon="📍"
              value={city}
              onChangeText={setCity}
              placeholder="Yaşadığınız şehir"
              autoCapitalize="words"
            />

            <View style={styles.fieldDivider} />

            <Field
              label="Doğum Tarihi"
              icon="🎂"
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="GG.AA.YYYY"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.section, Shadow.sm]}>
            <Text style={styles.sectionTitle}>Hakkımda</Text>

            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>
                <Text style={styles.fieldIcon}>📝  </Text>
                Biyografi
              </Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Kendini kısaca tanıt… Hangi tür seyahatlerden hoşlanırsın?"
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ── Save Button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, (!dirty || saving) && { opacity: 0.5 }]}
            onPress={handleSave}
            disabled={!dirty || saving}
            activeOpacity={0.85}
          >
            <Text style={styles.saveBtnText}>
              {saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: Spacing.xl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Nav bar
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: Colors.primary, fontWeight: Typography.weight.bold, lineHeight: 30 },
  navTitle: {
    fontSize: Typography.size.md, fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  saveHeaderBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
  },
  saveHeaderBtnText: {
    fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: '#FFF',
  },

  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, gap: Spacing.md },

  // Avatar
  avatarSection: { alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  avatarCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 4, borderColor: Colors.primaryFaded,
  },
  avatarInitials: {
    fontSize: 38, fontWeight: Typography.weight.extrabold,
    color: '#FFFFFF', letterSpacing: 1,
  },
  changePhotoBtn: {
    backgroundColor: Colors.primaryFaded, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  changePhotoText: {
    fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold,
    color: Colors.primary,
  },

  // Section card
  section: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.size.sm, fontWeight: Typography.weight.bold,
    color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },

  // Field
  fieldWrap: { gap: 6 },
  fieldLabel: {
    fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },
  fieldIcon: { fontSize: 15 },
  fieldHint: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  input: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 48,
    fontSize: Typography.size.base, color: Colors.textPrimary,
  },
  bioInput: { height: 100, paddingTop: Spacing.sm },
  fieldDivider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: -Spacing.md },

  // Save button
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    height: 56, alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  saveBtnText: {
    fontSize: Typography.size.base, fontWeight: Typography.weight.bold,
    color: '#FFFFFF', letterSpacing: 0.3,
  },
});
