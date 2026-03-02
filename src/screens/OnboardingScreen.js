/**
 * OnboardingScreen — 6-step wizard.
 * Steps: Nereden → Nereye → Tarihler → Konaklama → Bütçe → İlgi Alanları
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';
import { Radius, Shadow, Spacing, Typography } from '../constants/theme';
import { Routes } from '../navigation/routes';
import { useTrip } from '../context/TripContext';
import { saveVehicleProfile } from '../utils/storage';

const { width: W } = Dimensions.get('window');
const CELL_SIZE = Math.floor((W - 32) / 7);

// ─── Static options ────────────────────────────────────────────────────────

// ─── Vehicle types (araç profili) ─────────────────────────────────────────

export const VEHICLE_TYPES = [
  { id: 'small_caravan',  accom: 'caravan', label: 'Küçük Karavan',  emoji: '🚐', desc: '< 6m — her yola uygun',       bg: '#E8F5E9', color: Colors.caravan, defaults: { length: 5,    waterTank: 80,  persons: 2 } },
  { id: 'medium_caravan', accom: 'caravan', label: 'Orta Karavan',   emoji: '🚐', desc: '6–8m — ana yollar',           bg: '#E8F5E9', color: Colors.caravan, defaults: { length: 7,    waterTank: 130, persons: 4 } },
  { id: 'large_caravan',  accom: 'caravan', label: 'Büyük Karavan',  emoji: '🚐', desc: '> 8m — geniş yollar',         bg: '#E8F5E9', color: Colors.caravan, defaults: { length: 9,    waterTank: 200, persons: 6 } },
  { id: 'alcove',         accom: 'caravan', label: 'Alkoven',         emoji: '🚌', desc: '> 8m — yüksek profil',         bg: '#E8F5E9', color: Colors.caravan, defaults: { length: 8,    waterTank: 150, persons: 5 } },
  { id: 'tent',           accom: 'camping', label: 'Çadır',           emoji: '⛺', desc: 'Doğada özgür konaklama',      bg: '#E0F2F1', color: Colors.camping, defaults: { length: null, waterTank: null, persons: 2 } },
  { id: 'hotel',          accom: 'hotel',   label: 'Otel',            emoji: '🏨', desc: 'Şehir konforu',               bg: '#FFF8E1', color: Colors.hotel,   defaults: { length: null, waterTank: null, persons: 2 } },
];

const DEFAULT_VEHICLE_PROFILE = { vehicleType: null, length: null, waterTank: null, solarPanel: false, persons: 2 };

// ─── NumberStepper helper ──────────────────────────────────────────────────

function NumberStepper({ label, value, onChange, min, max, step = 1, unit = '' }) {
  return (
    <View style={nsStyles.row}>
      <Text style={nsStyles.label}>{label}</Text>
      <View style={nsStyles.controls}>
        <TouchableOpacity style={nsStyles.btn} onPress={() => onChange(Math.max(min, value - step))} activeOpacity={0.7}>
          <Text style={nsStyles.btnText}>−</Text>
        </TouchableOpacity>
        <Text style={nsStyles.value}>{value}{unit}</Text>
        <TouchableOpacity style={nsStyles.btn} onPress={() => onChange(Math.min(max, value + step))} activeOpacity={0.7}>
          <Text style={nsStyles.btnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const nsStyles = StyleSheet.create({
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  label:    { fontSize: Typography.size.base, color: Colors.textSecondary, flex: 1 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  btn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryFaded, borderWidth: 1, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  btnText:  { fontSize: 18, color: Colors.primary, fontWeight: '700', lineHeight: 22 },
  value:    { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary, minWidth: 56, textAlign: 'center' },
});

// ─── Step: Araç Profili ────────────────────────────────────────────────────

function StepVehicle({ profile, onChange, includeMeals, onToggleMeals }) {
  const { Switch } = require('react-native');
  const selected = VEHICLE_TYPES.find((v) => v.id === profile.vehicleType);
  const isCaravan = selected && selected.accom === 'caravan';

  const selectType = (vt) => {
    onChange({
      ...profile,
      vehicleType: vt.id,
      length:    vt.defaults.length,
      waterTank: vt.defaults.waterTank,
      persons:   vt.defaults.persons,
    });
  };

  return (
    <View style={sStyles.stepContent}>
      {/* 2-column vehicle type grid */}
      <View style={vStyles.grid}>
        {VEHICLE_TYPES.map((vt) => {
          const sel = profile.vehicleType === vt.id;
          return (
            <TouchableOpacity
              key={vt.id}
              style={[vStyles.card, { backgroundColor: vt.bg }, sel && { borderColor: vt.color, borderWidth: 2, ...Shadow.sm }]}
              onPress={() => selectType(vt)}
              activeOpacity={0.8}
            >
              <Text style={vStyles.cardEmoji}>{vt.emoji}</Text>
              <Text style={[vStyles.cardLabel, sel && { color: vt.color }]}>{vt.label}</Text>
              <Text style={vStyles.cardDesc}>{vt.desc}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Detail fields — shown once a type is selected */}
      {selected && (
        <View style={[vStyles.detailBox, Shadow.sm]}>
          <Text style={vStyles.detailTitle}>Detaylar (isteğe bağlı)</Text>
          <NumberStepper label="Kaç kişilik?" value={profile.persons} onChange={(v) => onChange({ ...profile, persons: v })} min={1} max={12} unit=" kişi" />
          {isCaravan && (
            <>
              <View style={vStyles.divider} />
              <NumberStepper label="Araç uzunluğu" value={profile.length || selected.defaults.length} onChange={(v) => onChange({ ...profile, length: v })} min={3} max={15} step={0.5} unit=" m" />
              <View style={vStyles.divider} />
              <NumberStepper label="Su deposu" value={profile.waterTank || selected.defaults.waterTank} onChange={(v) => onChange({ ...profile, waterTank: v })} min={20} max={500} step={10} unit=" L" />
              <View style={vStyles.divider} />
              <View style={nsStyles.row}>
                <Text style={nsStyles.label}>☀️ Güneş paneli var mı?</Text>
                <Switch
                  value={profile.solarPanel}
                  onValueChange={(v) => onChange({ ...profile, solarPanel: v })}
                  trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                  thumbColor={profile.solarPanel ? Colors.primary : Colors.textTertiary}
                />
              </View>
            </>
          )}
        </View>
      )}

      {/* Meal toggle (same as accom step) */}
      <TouchableOpacity
        style={[sStyles.mealToggle, includeMeals && sStyles.mealToggleActive]}
        onPress={() => onToggleMeals(!includeMeals)}
        activeOpacity={0.8}
      >
        <Text style={sStyles.mealToggleEmoji}>🍽️</Text>
        <View style={sStyles.mealToggleText}>
          <Text style={sStyles.mealToggleLabel}>Restoran Önerileri</Text>
          <Text style={sStyles.mealToggleDesc}>
            {includeMeals ? 'Kahvaltı, öğle ve akşam planınıza dahil' : 'Yemeği kendim hallederim'}
          </Text>
        </View>
        <View style={[sStyles.toggleSwitch, includeMeals && sStyles.toggleSwitchOn]}>
          <View style={[sStyles.toggleThumb, includeMeals && sStyles.toggleThumbOn]} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const vStyles = StyleSheet.create({
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card:       { width: '48%', borderRadius: Radius.xl, borderWidth: 1.5, borderColor: 'transparent', padding: Spacing.md, gap: 4, alignItems: 'center' },
  cardEmoji:  { fontSize: 28 },
  cardLabel:  { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.textPrimary, textAlign: 'center' },
  cardDesc:   { fontSize: 10, color: Colors.textTertiary, textAlign: 'center' },
  detailBox:  { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, gap: 0 },
  detailTitle:{ fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.xs },
  divider:    { height: 1, backgroundColor: Colors.borderLight, marginVertical: 2 },
});

// ─── Step: Hazır Rotalar ───────────────────────────────────────────────────

function StepPresets({ onSelect }) {
  return (
    <View style={psStyles.container}>
      <View style={psStyles.grid}>
        {PRESET_ROUTES.map((route) => (
          <TouchableOpacity
            key={route.id}
            style={[psStyles.card, { backgroundColor: route.bg, borderColor: route.border }]}
            onPress={() => onSelect(route)}
            activeOpacity={0.8}
          >
            <Text style={psStyles.cardEmoji}>{route.emoji}</Text>
            <Text style={[psStyles.cardTitle, { color: route.color }]}>{route.title}</Text>
            <Text style={psStyles.cardSub}>{route.subtitle}</Text>
            <Text style={psStyles.cardCities} numberOfLines={1}>{route.cities.join(' › ')}</Text>
            <View style={[psStyles.daysTag, { backgroundColor: route.color }]}>
              <Text style={psStyles.daysTagText}>~{route.recommendedDays} gün</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={psStyles.customBtn} onPress={() => onSelect(null)} activeOpacity={0.8}>
        <Text style={psStyles.customBtnText}>✏️  Kendi Rotamı Planlayayım</Text>
      </TouchableOpacity>
    </View>
  );
}

const psStyles = StyleSheet.create({
  container:    { gap: Spacing.md },
  grid:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  card:         { width: '48%', borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.md, gap: 3 },
  cardEmoji:    { fontSize: 26 },
  cardTitle:    { fontSize: Typography.size.base, fontWeight: Typography.weight.bold },
  cardSub:      { fontSize: Typography.size.xs, color: Colors.textTertiary },
  cardCities:   { fontSize: 9, color: Colors.textTertiary, marginTop: 2 },
  daysTag:      { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  daysTagText:  { fontSize: Typography.size.xs, color: '#FFFFFF', fontWeight: Typography.weight.bold },
  customBtn:    { borderRadius: Radius.xl, borderWidth: 1.5, borderColor: Colors.border, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: Colors.surface },
  customBtnText:{ fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textSecondary },
});

// ─── Accommodation options ─────────────────────────────────────────────────

const ACCOMMODATION_OPTIONS = [
  { id: 'caravan', label: 'Karavan', emoji: '🚐', desc: 'Kamping & su noktaları öncelikli', bg: '#E8F5E9', color: Colors.caravan },
  { id: 'camping', label: 'Çadır',   emoji: '⛺', desc: 'Doğa & ücretsiz alanlar',          bg: '#E0F2F1', color: Colors.camping },
  { id: 'hotel',   label: 'Otel',    emoji: '🏨', desc: 'Şehir merkezi & butik oteller',    bg: '#FFF8E1', color: Colors.hotel   },
];

const BUDGET_OPTIONS = [
  { id: 'ekonomik', label: 'Ekonomik', emoji: '💚', desc: 'Ücretsiz alanlar & yerel lezzet', color: Colors.budgetEkonomik, bg: '#E8F5E9', border: '#A5D6A7' },
  { id: 'standart', label: 'Standart', emoji: '✨', desc: 'Konfor & tasarruf dengesi',        color: Colors.budgetStandart, bg: '#FFF8E1', border: '#FFE082' },
  { id: 'lux',      label: 'Lüks',    emoji: '👑', desc: 'Glamping, fine dining & VIP',      color: Colors.budgetLux,      bg: '#FBE9E7', border: '#FFAB91' },
];

const INTEREST_OPTIONS = [
  { id: 'dogal',      label: '🌿 Doğal Alanlar' },
  { id: 'tarih',      label: '🏛️ Tarih & Kültür' },
  { id: 'gastronomi', label: '🍽️ Gastronomi' },
  { id: 'macera',     label: '⚡ Macera Sporları' },
  { id: 'huzur',      label: '🧘 Huzur & Meditasyon' },
  { id: 'fotograf',   label: '📸 Fotoğrafçılık' },
];

const POPULAR_STARTS = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana'];
const POPULAR_ENDS   = ['Kapadokya', 'Bodrum', 'Rize', 'Trabzon', 'Pamukkale', 'Mardin'];

// ─── Preset routes ─────────────────────────────────────────────────────────

export const PRESET_ROUTES = [
  {
    id: 'karadeniz',
    title: 'Karadeniz',
    emoji: '🌊',
    subtitle: 'Doğu Karadeniz Kıyısı',
    cities: ['Samsun', 'Ordu', 'Giresun', 'Trabzon', 'Rize', 'Artvin'],
    highlights: 'Sümela, Uzungöl, Ayder Yaylası',
    recommendedDays: 6,
    bg: '#E3F2FD', color: '#1565C0', border: '#90CAF9',
  },
  {
    id: 'ege',
    title: 'Ege Kıyısı',
    emoji: '⛵',
    subtitle: 'Antik & Mavi',
    cities: ['İzmir', 'Çeşme', 'Selçuk', 'Kuşadası', 'Didim', 'Bodrum'],
    highlights: 'Efes, Alaçatı, Bodrum',
    recommendedDays: 6,
    bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7',
  },
  {
    id: 'dogu_anadolu',
    title: 'Doğu Anadolu',
    emoji: '🏔️',
    subtitle: 'Dağlar & Kültür',
    cities: ['Erzurum', 'Kars', 'Iğdır', 'Ağrı', 'Van'],
    highlights: 'Kars Kalesi, Ağrı Dağı, Van Gölü',
    recommendedDays: 5,
    bg: '#FBE9E7', color: '#BF360C', border: '#FFAB91',
  },
  {
    id: 'akdeniz',
    title: 'Akdeniz',
    emoji: '🌴',
    subtitle: 'Güneş & Tarih',
    cities: ['Antalya', 'Alanya', 'Silifke', 'Mersin'],
    highlights: 'Aspendos, Alanya Kalesi, Kızkalesi',
    recommendedDays: 4,
    bg: '#FFF8E1', color: '#F57F17', border: '#FFE082',
  },
  {
    id: 'kapadokya',
    title: 'Kapadokya',
    emoji: '🎈',
    subtitle: 'Orta Anadolu',
    cities: ['Ankara', 'Kırşehir', 'Nevşehir', 'Aksaray'],
    highlights: 'Peribacaları, Derinkuyu, Balon Turu',
    recommendedDays: 4,
    bg: '#F3E5F5', color: '#6A1B9A', border: '#CE93D8',
  },
  {
    id: 'guneybati',
    title: 'Güneybatı',
    emoji: '🦋',
    subtitle: 'Mavi Yolculuk',
    cities: ['Muğla', 'Marmaris', 'Fethiye', 'Kaş', 'Antalya'],
    highlights: 'Ölüdeniz, Kelebek Vadisi, Kaş',
    recommendedDays: 5,
    bg: '#E0F2F1', color: '#00695C', border: '#80CBC4',
  },
];

const TR_MONTHS     = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
const TR_DAYS_SHORT = ['Pt','Sa','Ça','Pe','Cu','Ct','Pz'];

const STEPS = [
  { key: 'presets',       title: 'Rota Seç',       subtitle: 'Hazır rota veya kendin planla',      emoji: '🗺️' },
  { key: 'startLocation', title: 'Nereden?',        subtitle: 'Yolculuğun başlangıç noktası',      emoji: '🚩' },
  { key: 'destination',   title: 'Nereye?',         subtitle: 'Hedef şehir veya bölge',            emoji: '🏁' },
  { key: 'dates',         title: 'Ne Zaman?',       subtitle: 'Başlangıç ve bitiş tarihi',         emoji: '📅' },
  { key: 'accom',         title: 'Konaklama',       subtitle: 'Seyahat stilini seç',               emoji: '🏕️' },
  { key: 'vehicle',       title: 'Araç Profili',    subtitle: 'Araç tipini ve detaylarını belirle', emoji: '🚐' },
  { key: 'budget',        title: 'Bütçe',           subtitle: 'Harcama tercihini belirle',         emoji: '💰' },
  { key: 'interests',     title: 'İlgi Alanları',   subtitle: 'Birden fazla seçebilirsin',         emoji: '✨' },
];

// ─── Calendar Helpers ──────────────────────────────────────────────────────

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayMon(year, month) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

function isInRange(date, start, end) {
  if (!date || !start || !end) return false;
  return date > start && date < end;
}

function toDateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ─── Step Components ───────────────────────────────────────────────────────

function LocationStep({ value, onChange, suggestions, placeholder }) {
  return (
    <View style={sStyles.stepContent}>
      <View style={[sStyles.inputWrapper, Shadow.sm]}>
        <Text style={sStyles.inputEmoji}>📍</Text>
        <TextInput
          style={sStyles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={onChange}
          autoFocus
          returnKeyType="done"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ color: Colors.textTertiary, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={sStyles.suggestions}>
        {suggestions.map((s) => (
          <TouchableOpacity key={s} style={sStyles.suggestionChip} onPress={() => onChange(s)} activeOpacity={0.75}>
            <Text style={sStyles.suggestionText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function StepDates({ startDate, endDate, onDatesChange }) {
  const today = toDateOnly(new Date());
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDayMon = getFirstDayMon(viewYear, viewMonth);
  const totalCells  = Math.ceil((firstDayMon + daysInMonth) / 7) * 7;

  const handleDayPress = (day) => {
    const pressed = new Date(viewYear, viewMonth, day);
    if (pressed < today) return;

    if (!startDate || (startDate && endDate)) {
      onDatesChange(pressed, null);
    } else {
      if (pressed < startDate) {
        onDatesChange(pressed, null);
      } else if (isSameDay(pressed, startDate)) {
        onDatesChange(null, null);
      } else {
        onDatesChange(startDate, pressed);
      }
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  const computedDays = startDate && endDate
    ? Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1)
    : null;

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - firstDayMon + 1;
    return (dayNum < 1 || dayNum > daysInMonth) ? null : dayNum;
  });

  return (
    <View style={sStyles.calendarWrap}>
      {/* Month navigation */}
      <View style={sStyles.calMonthRow}>
        <TouchableOpacity style={sStyles.calNavBtn} onPress={prevMonth} activeOpacity={0.7}>
          <Text style={sStyles.calNavText}>‹</Text>
        </TouchableOpacity>
        <Text style={sStyles.calMonthLabel}>{TR_MONTHS[viewMonth]} {viewYear}</Text>
        <TouchableOpacity style={sStyles.calNavBtn} onPress={nextMonth} activeOpacity={0.7}>
          <Text style={sStyles.calNavText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Day name headers */}
      <View style={sStyles.calDayHeaders}>
        {TR_DAYS_SHORT.map((d) => (
          <View key={d} style={[sStyles.calCell, { height: 28 }]}>
            <Text style={sStyles.calDayHeader}>{d}</Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      <View style={sStyles.calGrid}>
        {cells.map((day, idx) => {
          if (!day) return <View key={`e-${idx}`} style={sStyles.calCell} />;

          const cellDate = new Date(viewYear, viewMonth, day);
          const isPast   = cellDate < today;
          const isStart  = isSameDay(cellDate, startDate);
          const isEnd    = isSameDay(cellDate, endDate);
          const inRange  = isInRange(cellDate, startDate, endDate);
          const isToday  = isSameDay(cellDate, today);

          let cellBg     = 'transparent';
          let textColor  = isPast ? Colors.textTertiary : Colors.textPrimary;
          let fontWeight = Typography.weight.medium;
          let dotStyle   = null;

          if (inRange)          cellBg = Colors.primaryFaded;
          if (isStart || isEnd) {
            dotStyle   = { backgroundColor: Colors.primary, borderRadius: CELL_SIZE / 2 };
            textColor  = '#FFFFFF';
            fontWeight = Typography.weight.bold;
          }

          let rangeEdge = {};
          if (inRange) {
            const col = idx % 7;
            if (col === 0 || isStart) rangeEdge = { borderTopLeftRadius: CELL_SIZE / 2, borderBottomLeftRadius: CELL_SIZE / 2 };
            if (col === 6 || isEnd)   rangeEdge = { borderTopRightRadius: CELL_SIZE / 2, borderBottomRightRadius: CELL_SIZE / 2 };
          }

          return (
            <TouchableOpacity
              key={day}
              style={[sStyles.calCell, { backgroundColor: cellBg }, rangeEdge]}
              onPress={() => !isPast && handleDayPress(day)}
              activeOpacity={isPast ? 1 : 0.75}
            >
              <View style={[sStyles.calDayInner, dotStyle]}>
                <Text style={[
                  sStyles.calDayText,
                  { color: textColor, fontWeight },
                  isToday && !isStart && !isEnd && { textDecorationLine: 'underline' },
                ]}>
                  {day}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Summary bar */}
      {startDate ? (
        <View style={sStyles.dateSummary}>
          <Text style={sStyles.dateSummaryText}>
            {`${startDate.getDate()} ${TR_MONTHS[startDate.getMonth()]}`}
            {' → '}
            {endDate ? `${endDate.getDate()} ${TR_MONTHS[endDate.getMonth()]}` : 'Bitiş tarihi seç'}
          </Text>
          {computedDays && (
            <View style={sStyles.daysChip}>
              <Text style={sStyles.daysChipText}>{computedDays} gün</Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={sStyles.calHint}>Başlangıç tarihine dokun</Text>
      )}
      {startDate && !endDate && (
        <Text style={sStyles.calHint}>Şimdi bitiş tarihini seç</Text>
      )}
    </View>
  );
}

function StepAccommodation({ value, onChange, includeMeals, onToggleMeals }) {
  return (
    <View style={[sStyles.stepContent, { gap: Spacing.sm }]}>
      {ACCOMMODATION_OPTIONS.map((opt) => {
        const sel = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[sStyles.accomCard, { backgroundColor: opt.bg }, sel && { borderColor: opt.color, borderWidth: 2.5, ...Shadow.sm }]}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.8}
          >
            <Text style={sStyles.accomEmoji}>{opt.emoji}</Text>
            <View style={sStyles.accomText}>
              <Text style={[sStyles.accomLabel, sel && { color: opt.color }]}>{opt.label}</Text>
              <Text style={sStyles.accomDesc}>{opt.desc}</Text>
            </View>
            <View style={[sStyles.radio, { borderColor: opt.color }, sel && { backgroundColor: opt.color }]}>
              {sel && <View style={sStyles.radioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Meal recommendations toggle */}
      <TouchableOpacity
        style={[sStyles.mealToggle, includeMeals && sStyles.mealToggleActive]}
        onPress={() => onToggleMeals(!includeMeals)}
        activeOpacity={0.8}
      >
        <Text style={sStyles.mealToggleEmoji}>🍽️</Text>
        <View style={sStyles.mealToggleText}>
          <Text style={sStyles.mealToggleLabel}>Restoran Önerileri</Text>
          <Text style={sStyles.mealToggleDesc}>
            {includeMeals
              ? 'Kahvaltı, öğle ve akşam yemeği planınıza dahil'
              : 'Yemeği kendim hallederim (karavan/çadır mutfağı)'}
          </Text>
        </View>
        <View style={[sStyles.toggleSwitch, includeMeals && sStyles.toggleSwitchOn]}>
          <View style={[sStyles.toggleThumb, includeMeals && sStyles.toggleThumbOn]} />
        </View>
      </TouchableOpacity>
    </View>
  );
}

function StepBudget({ value, onChange }) {
  return (
    <View style={[sStyles.stepContent, { gap: Spacing.sm }]}>
      {BUDGET_OPTIONS.map((opt) => {
        const sel = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            style={[sStyles.budgetCard, { backgroundColor: opt.bg, borderColor: sel ? opt.color : opt.border }, sel && Shadow.sm]}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.8}
          >
            <Text style={sStyles.budgetEmoji}>{opt.emoji}</Text>
            <View style={sStyles.budgetText}>
              <Text style={[sStyles.budgetLabel, { color: opt.color }]}>{opt.label}</Text>
              <Text style={sStyles.budgetDesc}>{opt.desc}</Text>
            </View>
            <View style={[sStyles.radio, { borderColor: opt.color }, sel && { backgroundColor: opt.color }]}>
              {sel && <View style={sStyles.radioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function StepInterests({ value, onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter((i) => i !== id) : [...value, id]);
  return (
    <View style={sStyles.stepContent}>
      <View style={sStyles.chipsWrap}>
        {INTEREST_OPTIONS.map((opt) => {
          const sel = value.includes(opt.id);
          return (
            <TouchableOpacity
              key={opt.id}
              style={[sStyles.interestChip, sel && { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary }]}
              onPress={() => toggle(opt.id)}
              activeOpacity={0.75}
            >
              <Text style={[sStyles.interestText, sel && { color: Colors.primary, fontWeight: '600' }]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {value.length === 0 && <Text style={sStyles.skipHint}>Atlamak istersen devam et →</Text>}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────

export default function OnboardingScreen({ navigation }) {
  const { startTrip } = useTrip();
  const [stepIndex,     setStepIndex]     = useState(0);
  const [startLocation, setStartLocation] = useState('');
  const [destination,   setDestination]   = useState('');
  const [startDate,     setStartDate]     = useState(null);
  const [endDate,       setEndDate]       = useState(null);
  const [accommodation,  setAccommodation]  = useState('caravan');
  const [vehicleProfile, setVehicleProfile] = useState(DEFAULT_VEHICLE_PROFILE);
  const [budget,         setBudget]         = useState('standart');
  const [interests,      setInterests]      = useState([]);
  const [includeMeals,   setIncludeMeals]   = useState(true);
  const [presetRoute,    setPresetRoute]    = useState(null);

  const slideX  = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const computedDays = useMemo(() => {
    if (!startDate || !endDate) return 1;
    return Math.max(1, Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
  }, [startDate, endDate]);

  const animate = useCallback((exitDir, cb) => {
    Animated.parallel([
      Animated.timing(slideX,  { toValue: exitDir * -W * 0.35, duration: 220, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      cb();
      slideX.setValue(exitDir * W * 0.35);
      opacity.setValue(0);
      Animated.parallel([
        Animated.timing(slideX,  { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    });
  }, []);

  const canProceed = useMemo(() => {
    switch (STEPS[stepIndex].key) {
      case 'presets':       return false; // navigation via card taps
      case 'startLocation': return startLocation.trim().length > 0;
      case 'destination':   return destination.trim().length > 0;
      case 'dates':         return startDate !== null && endDate !== null;
      default:              return true;
    }
  }, [stepIndex, startLocation, destination, startDate, endDate]);

  const isLast = stepIndex === STEPS.length - 1;

  const goNext = useCallback(() => {
    if (!canProceed) return;
    if (!isLast) {
      animate(1, () => setStepIndex((i) => i + 1));
    } else {
      // Derive accommodationType from vehicle profile if set, else from accom step
      const vtDef = VEHICLE_TYPES.find((v) => v.id === vehicleProfile.vehicleType);
      const resolvedAccom = vtDef ? vtDef.accom : accommodation;

      // Save vehicle profile to AsyncStorage
      const profileToSave = { ...vehicleProfile, resolvedAccommodationType: resolvedAccom };
      saveVehicleProfile(profileToSave).catch(() => {});

      const prefs = {
        startLocation:     startLocation.trim(),
        destination:       destination.trim(),
        startDate:         startDate ? startDate.toISOString().split('T')[0] : null,
        endDate:           endDate   ? endDate.toISOString().split('T')[0]   : null,
        days:              computedDays,
        accommodationType: resolvedAccom,
        vehicleProfile:    profileToSave,
        budget,
        interests,
        includeMeals,
      };
      navigation.navigate(Routes.GENERATING, { preferences: prefs });
    }
  }, [canProceed, isLast, startLocation, destination, startDate, endDate, computedDays, accommodation, vehicleProfile, budget, interests, includeMeals]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) animate(-1, () => setStepIndex((i) => i - 1));
  }, [stepIndex]);

  const handlePresetSelect = useCallback((preset) => {
    if (preset) {
      setStartLocation(preset.cities[0]);
      setDestination(preset.cities[preset.cities.length - 1]);
      setPresetRoute(preset);
      const datesIdx = STEPS.findIndex((s) => s.key === 'dates');
      animate(1, () => setStepIndex(datesIdx));
    } else {
      setPresetRoute(null);
      animate(1, () => setStepIndex(1));
    }
  }, [animate]);

  const step = STEPS[stepIndex];

  const renderContent = () => {
    switch (step.key) {
      case 'startLocation':
        return <LocationStep value={startLocation} onChange={setStartLocation} suggestions={POPULAR_STARTS} placeholder="İstanbul, Ankara, İzmir..." />;
      case 'destination':
        return <LocationStep value={destination} onChange={setDestination} suggestions={POPULAR_ENDS} placeholder="Kapadokya, Bodrum, Rize..." />;
      case 'dates':
        return <StepDates startDate={startDate} endDate={endDate} onDatesChange={(s, e) => { setStartDate(s); setEndDate(e); }} />;
      case 'accom':
        return <StepAccommodation value={accommodation} onChange={setAccommodation} includeMeals={includeMeals} onToggleMeals={setIncludeMeals} />;
      case 'vehicle':
        return <StepVehicle profile={vehicleProfile} onChange={setVehicleProfile} includeMeals={includeMeals} onToggleMeals={setIncludeMeals} />;
      case 'budget':
        return <StepBudget value={budget} onChange={setBudget} />;
      case 'interests':
        return <StepInterests value={interests} onChange={setInterests} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Progress */}
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${((stepIndex + 1) / STEPS.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{stepIndex + 1}/{STEPS.length}</Text>
        </View>

        {/* Route preview pill — visible after both cities entered */}
        {startLocation.trim() && destination.trim() && stepIndex >= 2 && (
          <View style={styles.routePreview}>
            <Text style={styles.routePreviewText} numberOfLines={1}>
              {startLocation} → {destination}
            </Text>
            {computedDays > 1 && (
              <View style={styles.routePreviewDaysPill}>
                <Text style={styles.routePreviewDaysText}>{computedDays} gün</Text>
              </View>
            )}
          </View>
        )}

        {/* Step header */}
        <View style={styles.header}>
          <Text style={styles.headerEmoji}>{step.emoji}</Text>
          <Text style={styles.headerTitle}>{step.title}</Text>
          <Text style={styles.headerSub}>{step.subtitle}</Text>
        </View>

        {/* Animated body */}
        <Animated.View style={[styles.body, { transform: [{ translateX: slideX }], opacity }]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {renderContent()}
          </ScrollView>
        </Animated.View>

        {/* Nav row */}
        <View style={styles.navRow}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.8} disabled={stepIndex === 0}>
            <Text style={[styles.backText, stepIndex === 0 && { opacity: 0 }]}>← Geri</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
            onPress={goNext}
            disabled={!canProceed}
            activeOpacity={0.85}
          >
            <Text style={styles.nextText}>{isLast ? 'Rotamı Oluştur ✨' : 'İleri →'}</Text>
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

  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm,
  },
  progressTrack: { flex: 1, height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  progressLabel: { fontSize: Typography.size.xs, color: Colors.textTertiary, fontWeight: Typography.weight.bold },

  routePreview: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, marginTop: Spacing.sm, marginHorizontal: Spacing.md,
    backgroundColor: Colors.primaryFaded, borderRadius: Radius.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
  },
  routePreviewText: { fontSize: Typography.size.xs, color: Colors.primary, fontWeight: Typography.weight.semibold, flex: 1, textAlign: 'center' },
  routePreviewDaysPill: { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  routePreviewDaysText: { fontSize: Typography.size.xs, color: '#FFFFFF', fontWeight: Typography.weight.bold },

  header: { alignItems: 'center', paddingVertical: Spacing.lg, gap: Spacing.xs },
  headerEmoji: { fontSize: 44, marginBottom: Spacing.xs },
  headerTitle: { fontSize: Typography.size.xxxl, fontWeight: Typography.weight.extrabold, color: Colors.textPrimary, letterSpacing: -1 },
  headerSub:   { fontSize: Typography.size.base, color: Colors.textTertiary },

  body: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg },

  navRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    gap: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  backBtn:        { height: 52, paddingHorizontal: Spacing.md, alignItems: 'center', justifyContent: 'center', minWidth: 80 },
  backText:       { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.textSecondary },
  nextBtn:        { flex: 1, height: 52, backgroundColor: Colors.primary, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', ...Shadow.sm },
  nextBtnDisabled: { backgroundColor: Colors.border },
  nextText:       { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
});

const sStyles = StyleSheet.create({
  stepContent: { gap: Spacing.md },

  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: Radius.xl, paddingHorizontal: Spacing.md, gap: Spacing.sm },
  inputEmoji:   { fontSize: 20 },
  input:        { flex: 1, height: 56, fontSize: Typography.size.lg, color: Colors.textPrimary },
  suggestions:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  suggestionChip: { backgroundColor: Colors.surface, borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.border },
  suggestionText: { fontSize: Typography.size.sm, color: Colors.textSecondary },

  // Calendar
  calendarWrap:   { gap: Spacing.sm },
  calMonthRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  calNavBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md, backgroundColor: Colors.surface },
  calNavText:     { fontSize: 22, color: Colors.primary, fontWeight: Typography.weight.bold, lineHeight: 26 },
  calMonthLabel:  { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  calDayHeaders:  { flexDirection: 'row' },
  calGrid:        { flexDirection: 'row', flexWrap: 'wrap' },
  calCell:        { width: CELL_SIZE, height: CELL_SIZE, alignItems: 'center', justifyContent: 'center' },
  calDayHeader:   { fontSize: 10, fontWeight: Typography.weight.bold, color: Colors.textTertiary, textAlign: 'center' },
  calDayInner:    { width: CELL_SIZE - 4, height: CELL_SIZE - 4, alignItems: 'center', justifyContent: 'center' },
  calDayText:     { fontSize: Typography.size.sm, textAlign: 'center' },
  dateSummary:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: Colors.primaryFaded, borderRadius: Radius.xl, padding: Spacing.md, marginTop: Spacing.xs },
  dateSummaryText: { fontSize: Typography.size.base, fontWeight: Typography.weight.semibold, color: Colors.primary },
  daysChip:       { backgroundColor: Colors.primary, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  daysChipText:   { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: '#FFFFFF' },
  calHint:        { textAlign: 'center', fontSize: Typography.size.sm, color: Colors.textTertiary, marginTop: Spacing.xs, fontStyle: 'italic' },

  // Accommodation
  accomCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.xl, borderWidth: 1.5, borderColor: 'transparent', padding: Spacing.md, gap: Spacing.md },
  accomEmoji: { fontSize: 32 },
  accomText:  { flex: 1 },
  accomLabel: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  accomDesc:  { fontSize: Typography.size.xs, color: Colors.textTertiary, marginTop: 2 },

  // Meal toggle
  mealToggle: {
    flexDirection: 'row', alignItems: 'center', borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.border, padding: Spacing.md, gap: Spacing.md,
    backgroundColor: Colors.surface,
  },
  mealToggleActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  mealToggleEmoji: { fontSize: 28 },
  mealToggleText: { flex: 1 },
  mealToggleLabel: { fontSize: Typography.size.base, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
  mealToggleDesc: { fontSize: Typography.size.xs, color: Colors.textTertiary, marginTop: 2 },
  toggleSwitch: {
    width: 44, height: 26, borderRadius: 13, backgroundColor: Colors.border,
    justifyContent: 'center', paddingHorizontal: 2,
  },
  toggleSwitchOn: { backgroundColor: Colors.primary },
  toggleThumb: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF',
    ...Shadow.sm, alignSelf: 'flex-start',
  },
  toggleThumbOn: { alignSelf: 'flex-end' },

  // Budget
  budgetCard:  { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.md, gap: Spacing.md },
  budgetEmoji: { fontSize: 30 },
  budgetText:  { flex: 1 },
  budgetLabel: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold },
  budgetDesc:  { fontSize: Typography.size.xs, color: Colors.textTertiary, marginTop: 2 },

  radio:      { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFFFFF' },

  // Interests
  chipsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  interestChip: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2, borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface },
  interestText: { fontSize: Typography.size.base, color: Colors.textSecondary },
  skipHint:     { textAlign: 'center', fontSize: Typography.size.sm, color: Colors.textTertiary, marginTop: Spacing.md },
});
