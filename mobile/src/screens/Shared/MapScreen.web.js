import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../../theme/designSystem';

export default function MapScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={styles.title}>Clinic Locations</Text>
      </View>

      <View style={styles.center}>
        <Ionicons name="map-outline" size={64} color={COLORS.brandBlue} />
        <Text style={styles.placeholderTitle}>Interactive Maps (Preview)</Text>
        <Text style={styles.placeholderDesc}>
          The interactive location finder is optimized for mobile GPS. 
          For web browsing, please use the main platform at portal.codevertex.solutions.
        </Text>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMuted },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: SPACING.lg, 
    backgroundColor: COLORS.white, 
    borderBottomWidth: 1, 
    borderBottomColor: COLORS.slate100 
  },
  backBtn: { marginRight: SPACING.md },
  title: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.black, color: COLORS.textMain },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  placeholderTitle: { color: COLORS.textMain, fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  placeholderDesc: { color: COLORS.textMuted, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  closeBtn: { marginTop: 32, backgroundColor: COLORS.brandBlue, paddingVertical: 12, paddingHorizontal: 24, borderRadius: RADIUS.md },
  closeBtnText: { color: COLORS.white, fontWeight: 'bold' }
});
