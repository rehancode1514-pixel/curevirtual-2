import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../../theme/designSystem';
import { formatToLocalTime, formatToLocalDate } from '../../utils/timeUtils';

export default function AppointmentsListScreen({ navigation }) {
  const { user, userTimezone } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = useCallback(async () => {
    try {
      const response = await api.get('/patient/appointments');
      const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setAppointments(data);
    } catch (error) {
      console.error('[AppointmentsListScreen] Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  
  const handleJoinCall = useCallback((appt) => {
    if (!appt?.roomName) {
      Alert.alert("Waiting for Doctor", "The doctor has not initialized the secure room yet. Please wait a moment.");
      return;
    }
    
    // ZEGO requires alphanumeric IDs — strip hyphens
    const sanitize = (id) => String(id || '').replace(/[^a-zA-Z0-9_]/g, '_');
    const callID = sanitize(appt.roomName);
    const userID = sanitize(user?.id || Date.now());
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Patient';

    console.log(`[AppList] 📞 Navigating to ActiveCall. ID: ${callID}`);

    // Navigate directly to the isolated ZEGO screen
    navigation.navigate('ActiveCall', {
      userID,
      userName: displayName,
      callID,
      isGroup: false,
    });
  }, [user, navigation]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const renderItem = ({ item }) => {
    // 🔍 DEBUG: Inspecting appointment data to find why doctor name is missing
    if (__DEV__) {
        console.log(`[Appointments DEBUG] Item ID ${item.id}:`, {
            hasDoctor: !!item.doctor,
            hasDoctorProfile: !!item.doctorProfile,
            doctorKeys: item.doctor ? Object.keys(item.doctor) : [],
            doctorUser: item.doctor?.user ? 'Yes' : 'No',
            doctorUserName: item.doctor?.user?.firstName
        });
    }

    const doctorName = item.doctor?.user?.firstName
      ? `Dr. ${item.doctor.user.firstName} ${item.doctor.user.lastName || ''}`
      : 'Dr. Unknown';
    
    // ✅ Formatted using centralized timezone logic
    const dateStr = formatToLocalDate(item.appointmentDate, userTimezone);
    const timeStr = formatToLocalTime(item.appointmentDate, userTimezone);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.doctorName}>{doctorName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'CONFIRMED' ? `${COLORS.success}15` : `${COLORS.warning}15` }]}>
            <Text style={[styles.statusText, { color: item.status === 'CONFIRMED' ? COLORS.success : COLORS.warning }]}>{item.status || 'PENDING'}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.dateTime}>{dateStr} at {timeStr}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={styles.detailsBtn}>
              <Text style={styles.detailsBtnText}>Details</Text>
            </TouchableOpacity>

            {/* ✅ JOIN CALL BUTTON: Only show if doctor has started the call */}
            {['requested', 'active'].includes(item.callStatus) && (
              <TouchableOpacity style={styles.listJoinBtn} onPress={() => handleJoinCall(item)}>
                <Text style={styles.listJoinBtnText}>Join</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color={COLORS.brandGreen} style={{ marginTop: SPACING.xxl }} />
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={item => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brandGreen} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No appointments found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMuted },
  header: { padding: SPACING.lg },
  title: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.black, color: COLORS.textMain },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  card: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.base,
    padding: SPACING.lg, marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  doctorName: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: COLORS.textMain },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  statusText: { fontSize: TYPOGRAPHY.xs, fontWeight: 'bold' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.slate50, paddingTop: SPACING.sm },
  dateTime: { fontSize: TYPOGRAPHY.sm, color: COLORS.textMuted },
  detailsBtn: { paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: RADIUS.sm, backgroundColor: COLORS.bgInput },
  detailsBtnText: { color: COLORS.textSoft, fontSize: TYPOGRAPHY.xs, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', marginTop: SPACING.xxxl },
  emptyText: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.md },
  listJoinBtn: {
    backgroundColor: COLORS.brandBlue,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  listJoinBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.xs,
    fontWeight: 'bold',
  },
});
