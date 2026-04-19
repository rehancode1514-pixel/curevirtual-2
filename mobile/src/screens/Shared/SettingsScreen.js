import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../../theme/designSystem';
import { COMMON_TIMEZONES, getDeviceTimezone } from '../../utils/timezones';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const { userTimezone, updateUserTimezone } = useAuth();
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(false);
  const [showTzModal, setShowTzModal] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const activeTz = userTimezone === 'auto' ? getDeviceTimezone() : userTimezone;
  const activeLabel = COMMON_TIMEZONES.find(t => t.value === userTimezone)?.label || activeTz;

  const handleTzSelect = async (val) => {
    setSaving(true);
    try {
      await updateUserTimezone(val);
      setShowTzModal(false);
    } catch (_e) {
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Push Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: COLORS.brandGreen }} />
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: COLORS.brandGreen }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Timezone</Text>
          <TouchableOpacity style={styles.row} onPress={() => setShowTzModal(true)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Account Timezone</Text>
              <Text style={styles.rowSublabel}>{activeLabel}</Text>
            </View>
            <Text style={styles.arrow}>{saving ? '...' : '›'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Help Center</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.row}>
            <Text style={styles.rowLabel}>Terms of Service</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Version 1.0.0 (Build 123)</Text>

        <Modal visible={showTzModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Timezone</Text>
                <TouchableOpacity onPress={() => setShowTzModal(false)}>
                  <Text style={styles.closeBtn}>Close</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={COMMON_TIMEZONES}
                keyExtractor={item => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={[styles.tzItem, userTimezone === item.value && styles.tzItemActive]} 
                    onPress={() => handleTzSelect(item.value)}
                  >
                    <Text style={[styles.tzLabel, userTimezone === item.value && styles.tzLabelActive]}>{item.label}</Text>
                    {userTimezone === item.value && <Text style={styles.checkIcon}>✓</Text>}
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMuted },
  scrollContent: { padding: SPACING.lg },
  title: { fontSize: TYPOGRAPHY.xxl, fontWeight: TYPOGRAPHY.black, color: COLORS.textMain, marginBottom: SPACING.xl },
  section: { backgroundColor: COLORS.white, borderRadius: RADIUS.base, paddingHorizontal: SPACING.lg, marginBottom: SPACING.xl, ...SHADOWS.sm },
  sectionTitle: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.bold, color: COLORS.brandGreen, marginTop: SPACING.lg, marginBottom: SPACING.sm, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  rowLabel: { fontSize: TYPOGRAPHY.md, color: COLORS.textMain, fontWeight: TYPOGRAPHY.medium },
  rowSublabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textMuted, marginTop: 2 },
  arrow: { fontSize: 24, color: COLORS.slate400 },
  version: { textAlign: 'center', color: COLORS.textPlaceholder, fontSize: TYPOGRAPHY.xs, marginTop: SPACING.xl },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, minHeight: '50%', padding: SPACING.lg },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.slate100, paddingBottom: SPACING.md },
  modalTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.black, color: COLORS.textMain },
  closeBtn: { color: COLORS.brandGreen, fontWeight: TYPOGRAPHY.bold },
  tzItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.slate50 },
  tzItemActive: { backgroundColor: COLORS.bgMuted, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md },
  tzLabel: { fontSize: TYPOGRAPHY.md, color: COLORS.textSoft },
  tzLabelActive: { color: COLORS.brandGreen, fontWeight: TYPOGRAPHY.bold },
  checkIcon: { color: COLORS.brandGreen, fontSize: 18, fontWeight: 'bold' }
});
