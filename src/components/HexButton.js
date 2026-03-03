import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS } from '../constants/theme';

export default function HexButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary', // 'primary' | 'secondary' | 'outline'
  style,
}) {
  const isPrimary = variant === 'primary';
  const isSecondary = variant === 'secondary';
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.wrapper, style]}
    >
      {isPrimary ? (
        <LinearGradient
          colors={['#00FFD1', '#0094FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.btn, disabled && styles.disabled]}
        >
          <Content label={label} loading={loading} textStyle={styles.textDark} />
        </LinearGradient>
      ) : isSecondary ? (
        <View style={[styles.btn, styles.secondaryBtn, disabled && styles.disabled]}>
          <Content label={label} loading={loading} textStyle={styles.textLight} />
        </View>
      ) : (
        <View style={[styles.btn, styles.outlineBtn, disabled && styles.disabled]}>
          <Content label={label} loading={loading} textStyle={styles.textPrimary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

function Content({ label, loading, textStyle }) {
  return loading ? (
    <ActivityIndicator color={textStyle.color} size="small" />
  ) : (
    <Text style={[styles.label, textStyle]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  btn: {
    height: 52,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    // Hexagon-like clipped corners via border radius
    borderTopLeftRadius: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 16,
  },
  secondaryBtn: {
    backgroundColor: COLORS.secondaryDim,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  outlineBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: FONTS.orbitron.bold,
    fontSize: 13,
    letterSpacing: 1.5,
  },
  textDark: {
    color: COLORS.background,
  },
  textLight: {
    color: COLORS.secondary,
  },
  textPrimary: {
    color: COLORS.primary,
  },
});
