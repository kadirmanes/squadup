import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { useTrip } from '../context/TripContext';
import { getApiKey } from '../services/aiRoute';
import { replaceActivity } from '../services/aiRoute';
import { getVisitedPlaces, addVisitedPlace } from '../utils/storage';

// ─── Tag metadata ─────────────────────────────────────────────────────────

const TAG_DETAILS = {
  Doğa: {
    tips: [
      '🥾 Sağlam yürüyüş ayakkabısı giy',
      '💧 En az 1.5L su götür',
      '🧴 Güneş kremi ve böcek spreyi unut',
    ],
    nearby: ['Manzara Noktası', 'Şelale', 'Piknik Alanı'],
    description: 'Etrafındaki doğal zenginlikleri keşfet. Bu bölge fotoğraf tutkunları ve doğa yürüyüşçüleri için idealdir.',
  },
  Yemek: {
    tips: [
      '🕐 Öğle arası kalabalık olabilir, rezervasyon önerilir',
      '💳 Nakit da bulundur',
      '🌶️ Yerel spesiyalleri dene',
    ],
    nearby: ['Çarşı', 'Fırın', 'Kafe'],
    description: 'Yöresel tatları ve otantik mutfağıyla ünlü bir mekân. Yerel halkın da uğrak noktalarından.',
  },
  Kültür: {
    tips: [
      '🎒 Rehber kitap veya sesli rehber kullan',
      '👟 Rahat ayakkabı giy, yürüyüş uzun sürebilir',
      '📷 Fotoğraf izinlerini kontrol et',
    ],
    nearby: ['Müze', 'Tarihi Çarşı', 'Sanat Galerisi'],
    description: 'Tarihin izlerini taşıyan bu alan, bölgenin kültürel mirasının en önemli parçalarından biri.',
  },
  Premium: {
    tips: [
      '✅ Önceden rezervasyon zorunlu',
      '🎩 Smart casual kıyafet önerilir',
      '🚗 Transfer hizmetinden yararlan',
    ],
    nearby: ['Spa & Wellness', 'Özel Plaj', 'Bar Lounge'],
    description: 'Özel seçilmiş lüks deneyim. Misafirlerimize yönelik kişiselleştirilmiş hizmet sunar.',
  },
  Aktivite: {
    tips: [
      '⚡ Enerji içeceği veya bar atıştır',
      '🧤 Ekipmanlara dikkat et',
      '☁️ Hava durumunu sabah kontrol et',
    ],
    nearby: ['Ekipman Kiralama', 'Spor Mağazası', 'Kafe'],
    description: 'Adrenalin arayanlar için biçilmiş kaftan. Yetkilendirilmiş rehberler eşliğinde güvenli aktivite.',
  },
  Serbest: {
    tips: [
      '🛍️ Yerel el sanatları ve hediyelik eşya ara',
      '☕ Bir kahve molası ver, yerel kafe keşfet',
      '💰 Pazarlık yapabileceğin yerler olabilir',
    ],
    nearby: ['Çarşı', 'Kafe', 'Hediyelik Eşya'],
    description: 'Serbest zaman — şehrin çarşısını, pazarını veya alışveriş merkezini keşfet. Yerel deneyim için ideal.',
  },
  Yolculuk: {
    tips: [
      '⛽ Yola çıkmadan önce yakıt/su kontrol et',
      '🗺️ Mola noktalarını önceden belirle',
      '🎵 Yol listeni hazırla, dinlendirici müzik seç',
    ],
    nearby: ['Akaryakıt İstasyonu', 'Mola Tesisi', 'Otopark'],
    description: 'Şehirler arası yolculuk — coğrafyayı değiştirirken yeni manzaralar seni bekliyor.',
  },
  default: {
    tips: [
      '🗺️ Rotayı önceden incele',
      '📱 Şarj cihazını yanına al',
      '🌤️ Hava durumuna göre giyim',
    ],
    nearby: ['Otopark', 'ATM', 'Eczane'],
    description: 'Seyahat planının bir parçası. Tam zamanında olmak için önceden hazırlık yapmanız önerilir.',
  },
};

const TAG_COLORS = {
  Yemek:    { bg: '#FFF8E1', text: '#E65100', border: '#FFE082' },
  Doğa:     { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  Kültür:   { bg: '#EDE7F6', text: '#4527A0', border: '#CE93D8' },
  Aktivite: { bg: '#FCE4EC', text: '#AD1457', border: '#F48FB1' },
  Premium:  { bg: '#FFF8E1', text: '#FF6F00', border: '#FFCC02' },
  Serbest:   { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
  Yolculuk:  { bg: '#E3F2FD', text: '#0D47A1', border: '#90CAF9' },
  default:   { bg: Colors.background, text: Colors.textSecondary, border: Colors.border },
};

const REPLACE_REASONS = [
  { id: 'been', label: '🏛️ Daha önce gittim' },
  { id: 'boring', label: '😐 İlgimi çekmiyor' },
  { id: 'far', label: '🗺️ Çok uzak' },
  { id: 'other', label: '💬 Başka sebep' },
];

// ─── Main screen ──────────────────────────────────────────────────────────

export default function ActivityDetailScreen({ navigation, route }) {
  const { activity, dayTitle, dayLocation, dayIndex, activityIndex } = route.params || {};
  const { preferences, updateActivity } = useTrip();

  const [visited,           setVisited]           = useState(false);
  const [showReasonModal,   setShowReasonModal]    = useState(false);
  const [replacing,         setReplacing]         = useState(false);

  useEffect(() => {
    if (!activity?.title) return;
    getVisitedPlaces().then((places) => setVisited(places.includes(activity.title)));
  }, [activity?.title]);

  if (!activity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.error}>
          <Text>Aktivite bulunamadı.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tagColor = TAG_COLORS[activity.tag] || TAG_COLORS.default;
  const fallback = TAG_DETAILS[activity.tag] || TAG_DETAILS.default;
  const details  = { ...fallback, description: activity.description || fallback.description };

  const handleMarkVisited = async () => {
    await addVisitedPlace(activity.title);
    setVisited(true);
  };

  const handleSelectReason = async (reason) => {
    setShowReasonModal(false);
    setReplacing(true);
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        Alert.alert('API Anahtarı Gerekli', 'Aktivite değiştirmek için API anahtarı gereklidir.');
        return;
      }
      const newAct = await replaceActivity(
        { location: dayLocation || dayTitle },
        activity,
        reason,
        preferences || {},
        apiKey,
      );
      updateActivity(dayIndex, activityIndex, newAct);
      Alert.alert('Aktivite Değiştirildi ✓', `"${newAct.title}" rotanıza eklendi.`);
      navigation.goBack();
    } catch {
      Alert.alert('Hata', 'Aktivite değiştirilemedi. Tekrar dene.');
    } finally {
      setReplacing(false);
    }
  };

  const openMaps = () => {
    if (!activity.address) return;
    const url = `https://maps.google.com/?q=${encodeURIComponent(activity.address)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Drag handle */}
      <View style={styles.dragHandle} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.tagBadge, { backgroundColor: tagColor.bg, borderColor: tagColor.border }]}>
            <Text style={[styles.tagText, { color: tagColor.text }]}>{activity.tag}</Text>
          </View>
          <Text style={styles.dayRef}>{dayTitle}</Text>
        </View>

        {/* Title block */}
        <View style={styles.titleBlock}>
          <View style={styles.timeRow}>
            <View style={styles.timePill}>
              <Text style={styles.timePillText}>🕐 {activity.time}</Text>
            </View>
            {activity.cost && (
              <View style={styles.costPill}>
                <Text style={styles.costPillText}>{activity.cost}</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{activity.title}</Text>
        </View>

        {/* Description */}
        <View style={[styles.section, Shadow.sm]}>
          <Text style={styles.sectionTitle}>📝 Hakkında</Text>
          <Text style={styles.description}>{details.description}</Text>
          {activity.reviewSummary ? (
            <Text style={styles.reviewSummary}>💬 "{activity.reviewSummary}"</Text>
          ) : null}
          {/* Maps link for any activity with an address */}
          {activity.address ? (
            <TouchableOpacity style={styles.mapsBtn} onPress={openMaps} activeOpacity={0.8}>
              <Text style={styles.mapsBtnText}>📍 {activity.address}</Text>
              <Text style={styles.mapsBtnLink}>Google Haritalar →</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Food alternatives */}
        {activity.alternatives?.length > 0 && (
          <View style={[styles.section, Shadow.sm]}>
            <Text style={styles.sectionTitle}>🍽️ Alternatif Restoranlar</Text>
            {activity.alternatives.map((alt, i) => {
              const openAltMaps = () => {
                const q = alt.address ? `${alt.name} ${alt.address}` : alt.name;
                Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(q)}`).catch(() => {});
              };
              return (
                <TouchableOpacity key={i} style={styles.altCard} onPress={openAltMaps} activeOpacity={0.8}>
                  <View style={styles.altHeader}>
                    <Text style={styles.altName}>{alt.name}</Text>
                    {alt.cost ? <Text style={styles.altCost}>{alt.cost}</Text> : null}
                  </View>
                  {alt.address ? <Text style={styles.altAddress}>📍 {alt.address}</Text> : null}
                  {alt.reviewSummary ? <Text style={styles.altReview}>💬 "{alt.reviewSummary}"</Text> : null}
                  <Text style={styles.altMapsHint}>Haritada Gör →</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Tips */}
        <View style={[styles.section, Shadow.sm]}>
          <Text style={styles.sectionTitle}>💡 İpuçları</Text>
          <View style={styles.tipsList}>
            {details.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nearby */}
        <View style={[styles.section, Shadow.sm]}>
          <Text style={styles.sectionTitle}>📍 Yakınında</Text>
          <View style={styles.nearbyRow}>
            {details.nearby.map((place, i) => (
              <View key={i} style={styles.nearbyChip}>
                <Text style={styles.nearbyText}>{place}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {/* Visited */}
          <TouchableOpacity
            style={[styles.actionBtn, visited && styles.actionBtnDone]}
            onPress={visited ? undefined : handleMarkVisited}
            activeOpacity={visited ? 1 : 0.8}
          >
            <Text style={[styles.actionBtnText, visited && styles.actionBtnTextDone]}>
              {visited ? '✓ Gezildi' : '✓ Burayı gezdim'}
            </Text>
          </TouchableOpacity>

          {/* Replace */}
          {replacing ? (
            <View style={[styles.actionBtn, styles.actionBtnReplace]}>
              <ActivityIndicator size="small" color={Colors.textSecondary} />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionBtnReplace]}
              onPress={() => setShowReasonModal(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnTextReplace}>🚫 Buraya gitmek istemiyorum</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Premium audio teaser */}
        <TouchableOpacity style={[styles.premiumBar, Shadow.sm]} activeOpacity={0.85}>
          <Text style={styles.premiumBarText}>🔒 Sesli Rehber — Premium</Text>
          <Text style={styles.premiumBarSub}>Bu aktivite için AI sesli anlatım dinle</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom close */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.closeBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>

      {/* Reason modal */}
      <Modal
        visible={showReasonModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReasonModal(false)}
      >
        <TouchableOpacity
          style={modalStyles.backdrop}
          activeOpacity={1}
          onPress={() => setShowReasonModal(false)}
        />
        <View style={modalStyles.sheet}>
          <View style={modalStyles.handle} />
          <Text style={modalStyles.title}>Neden değiştirmek istiyorsun?</Text>
          {REPLACE_REASONS.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={modalStyles.reasonBtn}
              onPress={() => handleSelectReason(r.label)}
              activeOpacity={0.75}
            >
              <Text style={modalStyles.reasonText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={modalStyles.cancelBtn} onPress={() => setShowReasonModal(false)} activeOpacity={0.7}>
            <Text style={modalStyles.cancelText}>Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  error:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dragHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginTop: Spacing.sm, marginBottom: Spacing.xs,
  },
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  tagBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full, borderWidth: 1 },
  tagText:  { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold },
  dayRef:   { fontSize: Typography.size.xs, color: Colors.textTertiary, flex: 1 },

  titleBlock: { marginBottom: Spacing.lg },
  timeRow:    { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  timePill:   { backgroundColor: Colors.primaryFaded, paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full },
  timePillText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.primary },
  costPill:   { backgroundColor: Colors.accentFaded, paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full },
  costPillText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.accentDark },
  title: { fontSize: Typography.size.xxl, fontWeight: Typography.weight.extrabold, color: Colors.textPrimary, lineHeight: 34, letterSpacing: -0.5 },

  section:      { backgroundColor: Colors.background, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.md },
  sectionTitle: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  description:  { fontSize: Typography.size.sm, color: Colors.textSecondary, lineHeight: 22 },

  reviewSummary: {
    fontSize: Typography.size.xs, color: Colors.textSecondary, fontStyle: 'italic',
    marginTop: Spacing.sm, lineHeight: 18,
  },
  mapsBtn: {
    marginTop: Spacing.sm, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  mapsBtnText: { fontSize: Typography.size.xs, color: Colors.textSecondary, flex: 1 },
  mapsBtnLink: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.primary },

  altCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border, marginTop: Spacing.sm, gap: 3,
  },
  altHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  altName:    { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textPrimary, flex: 1 },
  altCost:    { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.accentDark },
  altAddress: { fontSize: 11, color: Colors.textTertiary },
  altReview:  { fontSize: 11, color: Colors.textSecondary, fontStyle: 'italic' },
  altMapsHint:{ fontSize: 10, color: Colors.primary, fontWeight: Typography.weight.semibold, marginTop: 2 },

  tipsList: { gap: Spacing.sm },
  tipRow:   { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.sm + 2 },
  tipText:  { fontSize: Typography.size.sm, color: Colors.textPrimary, lineHeight: 20 },

  nearbyRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  nearbyChip: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: Colors.border },
  nearbyText: { fontSize: Typography.size.xs, color: Colors.textSecondary, fontWeight: Typography.weight.medium },

  actionRow: { gap: Spacing.sm, marginBottom: Spacing.md },
  actionBtn: {
    borderRadius: Radius.xl, paddingVertical: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#A5D6A7',
  },
  actionBtnDone:      { backgroundColor: '#C8E6C9', borderColor: '#81C784' },
  actionBtnReplace:   { backgroundColor: '#FFF3E0', borderColor: '#FFCC80' },
  actionBtnText:      { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: '#2E7D32' },
  actionBtnTextDone:  { color: '#1B5E20' },
  actionBtnTextReplace: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: '#E65100' },

  premiumBar: {
    backgroundColor: Colors.accentFaded, borderRadius: Radius.xl,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.accent + '50', marginBottom: Spacing.md,
  },
  premiumBarText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.accentDark, marginBottom: 4 },
  premiumBarSub:  { fontSize: Typography.size.xs, color: Colors.accentDark + 'AA' },

  bottomBar: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.borderLight, backgroundColor: Colors.surface,
  },
  closeBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.xl,
    height: 52, alignItems: 'center', justifyContent: 'center', ...Shadow.sm,
  },
  closeBtnText: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
});

const modalStyles = StyleSheet.create({
  backdrop: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: Spacing.sm,
  },
  title: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.xs },
  reasonBtn: {
    backgroundColor: Colors.background, borderRadius: Radius.xl,
    paddingVertical: Spacing.md + 2, paddingHorizontal: Spacing.md,
    alignItems: 'flex-start',
  },
  reasonText:  { fontSize: Typography.size.base, color: Colors.textPrimary, fontWeight: Typography.weight.medium },
  cancelBtn:   { marginTop: Spacing.xs, paddingVertical: Spacing.sm, alignItems: 'center' },
  cancelText:  { fontSize: Typography.size.base, color: Colors.textTertiary },
});
