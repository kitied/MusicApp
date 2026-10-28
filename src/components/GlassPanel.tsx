import React from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

export function GlassPanel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const nativeGlass = Platform.OS === 'ios' && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  return <View style={[styles.panel, style]}>
    {nativeGlass ? <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill} /> : <BlurView tint="dark" intensity={65} style={StyleSheet.absoluteFill} />}
    {children}
  </View>;
}

const styles = StyleSheet.create({
  panel: { overflow: 'hidden', borderRadius: 24, backgroundColor: '#342F4A80', borderWidth: 1, borderColor: '#FFFFFF24' },
});
