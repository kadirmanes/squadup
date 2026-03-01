import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { useTrip } from '../context/TripContext';
import AccommodationBadge from '../components/AccommodationBadge';
import { getWeatherApiKey, saveWeatherApiKey, getVehicleProfile } from '../utils/storage';
import { VEHICLE_TYPES } from './OnboardingScreen';

const ACCOM_EMOJI = { caravan: '🚐', camping: '⛺', hotel: '🏨' };
const BUDGET_EMOJI = { ekonomik: '💚', standart: '✨', lux: '👑' };

function StatBox({ emoji, value, label }) {
  return (
    <View style={statStyles.box}>
      <Text style={statStyles.emoji}>{emoji}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function PastTripCard({ trip }) {
  return (
    <View style={[ptStyles.card, Shadow.sm]}>
      <Text style={ptStyles.emoji}>{trip.emoji}</Text>
      <View style={ptStyles.info}>
        <Text style={ptStyles.dest}>{trip.destination}</Text>
        <Text style={ptStyles.meta}>
          {trip.days} gün · {ACCOM_EMOJI[trip.accommodationType]} · {BUDGET_EMOJI[trip.budget]}
        </Text>
        <Text style={ptStyles.date}>{trip.date}</Text>
      </View>
      <TouchableOpacity style={ptStyles.reloadBtn} activeOpacity={0.8}>
        <Text style={ptStyles.reloadText}>🔁</Text>
      </TouchableOpacity>
    </View>
  );
}

function SettingRow({ emoji, label, description, hasToggle, value, onToggle, onPress }) {
  return (
    <TouchableOpacity
      style={settingStyles.row}
      onPress={onPress}
      activeOpacity={hasToggle ? 1 : 0.7}
    >
      <Text style={settingStyles.emoji}>{emoji}</Text>
      <View style={settingStyles.text}>
        <Text style={settingStyles.label}>{label}</Text>
        {description && <Text style={settingStyles.desc}>{description}</Text>}
      </View>
      {hasToggle ? (
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: Colors.border, true: Colors.primaryLight }}
          thumbColor={value ? Colors.primary : Colors.textTertiary}
        />
      ) : (
        <Text style={settingStyles.arrow}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen({ navigation }) {
  const { preferences, tripData, pastTrips, resetTrip } = useTrip();
  const [notifications, setNotifications] = useState(true);
  const [offlineMode, setOfflineMode]     = useState(false);
  const [weatherKey,  setWeatherKey]      = useState('');
  const [editingKey,  setEditingKey]      = useState(false);
  const [vehicleProfile, setVehicleProfile] = useState(null);

  useEffect(() => {
    getWeatherApiKey().then((k) => setWeatherKey(k || ''));
    getVehicleProfile().then(setVehicleProfile);
  }, []);

  const handleSaveWeatherKey = async () => {
    await saveWeatherApiKey(weatherKey);
    setEditingKey(false);
    Alert.alert('Kaydedildi', 'Hava durumu API anahtarı kaydedildi.');
  };

  const vehicleTypeDef = VEHICLE_TYPES.find((v) => v.id === vehicleProfile?.vehicleType);

  const accomEmoji = ACCOM_EMOJI[preferences?.accommodationType] || '🧭';
  const totalDays = pastTrips.reduce((s, t) => s + t.days, 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Avatar Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>{accomEmoji}</Text>
          </View>
          <Text style={styles.username}>Gezgin</Text>
          <Text style={styles.tagline}>
            {preferences
              ? `Aktif: ${preferences.destination} · ${preferences.days} gün`
              : 'Henüz rota oluşturulmadı'}
          </Text>

          {preferences && (
            <View style={styles.badgeRow}>
              <AccommodationBadge type={preferences.accommodationType} />
              <View
                style={[
                  styles.budgetBadge,
                  { backgroundColor: preferences.budget === 'lux' ? '#FBE9E7' : preferences.budget === 'ekonomik' ? '#E8F5E9' : '#FFF8E1' },
                ]}
              >
                <Text style={styles.budgetBadgeText}>
                  {BUDGET_EMOJI[preferences.budget]} {preferences.budget.charAt(0).toUpperCase() + preferences.budget.slice(1)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, Shadow.sm]}>
          <StatBox emoji="🗺️" value={pastTrips.length + (preferences ? 1 : 0)} label="Toplam Seyahat" />
          <View style={styles.statDivider} />
          <StatBox emoji="📅" value={totalDays + (preferences?.days || 0)} label="Toplam Gün" />
          <View style={styles.statDivider} />
          <StatBox emoji="🏕️" value={`${pastTrips.length * 8 + (tripData?.days?.reduce((s, d) => s + d.activities.length, 0) || 0)}`} label="Aktivite" />
        </View>

        {/* Premium Upgrade */}
        <TouchableOpacity style={[styles.premiumCard, Shadow.md]} activeOpacity={0.88}>
          <View>
            <Text style={styles.premiumTitle}>👑 NomadWise Premium</Text>
            <Text style={styles.premiumDesc}>
              Sesli Rehber, Çevrimdışı Haritalar, Sınırsız Rota
            </Text>
          </View>
          <View style={styles.premiumPriceBox}>
            <Text style={styles.premiumPrice}>₺99</Text>
            <Text style={styles.premiumPeriod}>/ay</Text>
          </View>
        </TouchableOpacity>

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Geçmiş Seyahatler</Text>
            <View style={styles.pastList}>
              {pastTrips.map((trip) => (
                <PastTripCard key={trip.id} trip={trip} />
              ))}
            </View>
          </>
        )}

        {/* Settings */}
        <Text style={styles.sectionTitle}>Ayarlar</Text>
        <View style={[styles.settingsCard, Shadow.sm]}>
          <SettingRow
            emoji="🔔"
            label="Bildirimler"
            description="Rota güncellemeleri ve hatırlatıcılar"
            hasToggle
            value={notifications}
            onToggle={setNotifications}
          />
          <View style={styles.settingDivider} />
          <SettingRow
            emoji="📥"
            label="Çevrimdışı Mod"
            description="Premium özellik"
            hasToggle
            value={offlineMode}
            onToggle={() => {}}
          />
          <View style={styles.settingDivider} />
          <SettingRow emoji="🌍" label="Dil" description="Türkçe" onPress={() => {}} />
          <View style={styles.settingDivider} />
          <SettingRow emoji="🎨" label="Tema" description="Açık (Doğal)" onPress={() => {}} />
          <View style={styles.settingDivider} />
          <SettingRow emoji="📧" label="Geri Bildirim Gönder" onPress={() => {}} />
        </View>

        {/* Vehicle Profile Card */}
        {vehicleProfile?.vehicleType && (
          <>
            <Text style={styles.sectionTitle}>Araç Profili</Text>
            <View style={[styles.settingsCard, Shadow.sm]}>
              <View style={settingStyles.row}>
                <Text style={settingStyles.emoji}>{vehicleTypeDef?.emoji || '🚐'}</Text>
                <View style={settingStyles.text}>
                  <Text style={settingStyles.label}>{vehicleTypeDef?.label || vehicleProfile.vehicleType}</Text>
                  <Text style={settingStyles.desc}>
                    {[
                      vehicleProfile.persons && `${vehicleProfile.persons} kişi`,
                      vehicleProfile.length  && `${vehicleProfile.length}m`,
                      vehicleProfile.waterTank && `${vehicleProfile.waterTank}L su`,
                      vehicleProfile.solarPanel && '☀️ Güneş paneli',
                    ].filter(Boolean).join(' · ')}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* API Keys Section */}
        <Text style={styles.sectionTitle}>API Anahtarları</Text>
        <View style={[styles.settingsCard, Shadow.sm]}>
          <View style={apiStyles.row}>
            <Text style={settingStyles.emoji}>🌤️</Text>
            <View style={apiStyles.content}>
              <Text style={settingStyles.label}>OpenWeatherMap</Text>
              {editingKey ? (
                <View style={apiStyles.inputRow}>
                  <TextInput
                    style={apiStyles.input}
                    value={weatherKey}
                    onChangeText={setWeatherKey}
                    placeholder="API anahtarını gir..."
                    placeholderTextColor={Colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry
                  />
                  <TouchableOpacity style={apiStyles.saveBtn} onPress={handleSaveWeatherKey} activeOpacity={0.8}>
                    <Text style={apiStyles.saveBtnText}>Kaydet</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={settingStyles.desc}>
                  {weatherKey ? '●●●●●●●●' + weatherKey.slice(-4) : 'Ayarlanmadı — openweathermap.org'}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => setEditingKey(!editingKey)} style={apiStyles.editBtn} activeOpacity={0.75}>
              <Text style={apiStyles.editBtnText}>{editingKey ? 'İptal' : 'Düzenle'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reset trip */}
        {preferences && (
          <TouchableOpacity
            style={styles.resetBtn}
            onPress={resetTrip}
            activeOpacity={0.8}
          >
            <Text style={styles.resetText}>🔄 Rotayı Sıfırla</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.version}>NomadWise AI v1.0.0</Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.md },

  header: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarEmoji: { fontSize: 40 },
  username: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.size.sm,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  budgetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  budgetBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.textSecondary,
  },

  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.xs,
  },

  premiumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.accentFaded,
    borderRadius: Radius.xl,
    padding: Spacing.md + 4,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.accent,
  },
  premiumTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.accentDark,
    marginBottom: 4,
  },
  premiumDesc: {
    fontSize: Typography.size.xs,
    color: Colors.accentDark + 'BB',
    maxWidth: '80%',
  },
  premiumPriceBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  premiumPrice: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.accentDark,
  },
  premiumPeriod: {
    fontSize: Typography.size.xs,
    color: Colors.accentDark,
    marginBottom: 3,
  },

  sectionTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },

  pastList: { gap: Spacing.sm, marginBottom: Spacing.lg },

  settingsCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.md,
  },

  resetBtn: {
    borderWidth: 1.5,
    borderColor: Colors.error + '60',
    borderRadius: Radius.xl,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  resetText: {
    fontSize: Typography.size.sm,
    color: Colors.error,
    fontWeight: Typography.weight.semibold,
  },

  version: {
    textAlign: 'center',
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    marginBottom: Spacing.sm,
  },
});

const apiStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.sm },
  content:   { flex: 1 },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginTop: 4 },
  input:     { flex: 1, height: 36, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, paddingHorizontal: Spacing.sm, fontSize: Typography.size.sm, color: Colors.textPrimary },
  saveBtn:   { backgroundColor: Colors.primary, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 8 },
  saveBtnText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: '#FFF' },
  editBtn:   { paddingHorizontal: Spacing.sm },
  editBtnText: { fontSize: Typography.size.sm, color: Colors.primary, fontWeight: Typography.weight.semibold },
});

const statStyles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', gap: 4 },
  emoji: { fontSize: 22 },
  value: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
  },
  label: { fontSize: 10, color: Colors.textTertiary, textAlign: 'center' },
});

const ptStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  emoji: { fontSize: 30 },
  info: { flex: 1 },
  dest: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
  },
  meta: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  date: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  reloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryFaded,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reloadText: { fontSize: 16 },
});

const settingStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  emoji: { fontSize: 20, width: 28, textAlign: 'center' },
  text: { flex: 1 },
  label: {
    fontSize: Typography.size.base,
    color: Colors.textPrimary,
    fontWeight: Typography.weight.medium,
  },
  desc: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  arrow: {
    fontSize: 22,
    color: Colors.textTertiary,
  },
});
