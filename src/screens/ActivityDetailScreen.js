import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';

// Richer mock details per tag type
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
  default:  { bg: Colors.background, text: Colors.textSecondary, border: Colors.border },
};

export default function ActivityDetailScreen({ navigation, route }) {
  const { activity, dayTitle } = route.params || {};

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
  const details = TAG_DETAILS[activity.tag] || TAG_DETAILS.default;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Drag handle indicator */}
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
        </View>

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

        {/* Premium audio guide teaser */}
        <TouchableOpacity style={[styles.premiumBar, Shadow.sm]} activeOpacity={0.85}>
          <Text style={styles.premiumBarText}>🔒 Sesli Rehber — Premium</Text>
          <Text style={styles.premiumBarSub}>Bu aktivite için AI sesli anlatım dinle</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Bottom close button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.closeBtnText}>Geri Dön</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.surface },
  error: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  dayRef: {
    fontSize: Typography.size.xs,
    color: Colors.textTertiary,
    flex: 1,
  },

  titleBlock: { marginBottom: Spacing.lg },
  timeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  timePill: {
    backgroundColor: Colors.primaryFaded,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  timePillText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
    color: Colors.primary,
  },
  costPill: {
    backgroundColor: Colors.accentFaded,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  costPillText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
    color: Colors.accentDark,
  },
  title: {
    fontSize: Typography.size.xxl,
    fontWeight: Typography.weight.extrabold,
    color: Colors.textPrimary,
    lineHeight: 34,
    letterSpacing: -0.5,
  },

  section: {
    backgroundColor: Colors.background,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  description: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
  },

  tipsList: { gap: Spacing.sm },
  tipRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.sm + 2,
  },
  tipText: {
    fontSize: Typography.size.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },

  nearbyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  nearbyChip: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nearbyText: {
    fontSize: Typography.size.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.weight.medium,
  },

  premiumBar: {
    backgroundColor: Colors.accentFaded,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent + '50',
    marginBottom: Spacing.md,
  },
  premiumBarText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
    color: Colors.accentDark,
    marginBottom: 4,
  },
  premiumBarSub: {
    fontSize: Typography.size.xs,
    color: Colors.accentDark + 'AA',
  },

  bottomBar: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  closeBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.xl,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  closeBtnText: {
    fontSize: Typography.size.base,
    fontWeight: Typography.weight.bold,
    color: '#FFFFFF',
  },
});
