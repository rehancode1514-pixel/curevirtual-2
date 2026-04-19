import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../../theme/designSystem';
import { formatToLocalTime, formatToLocalDate } from '../../utils/timeUtils';

const QUICK_ACTIONS = [
  { key: 'Doctors', icon: 'search-outline', label: 'Find Doctor', color: COLORS.primary },
  { key: 'Pharmacy', icon: 'medkit-outline', label: 'Pharmacy', color: COLORS.secondary },
  { key: 'Chatbot', icon: 'chatbubbles-outline', label: 'AI Assistant', color: COLORS.secondary },
  { key: 'Map', icon: 'map-outline', label: 'Near Me', color: COLORS.tertiary },
];

const formatDate = (dateStr, timezone = 'auto') => {
  if (!dateStr) return 'Date TBD';
  return `${formatToLocalDate(dateStr, timezone)} at ${formatToLocalTime(dateStr, timezone)}`;
};

const StatusBadge = ({ status }) => {
  const isCompleted = status === 'COMPLETED';
  const isCancelled = status === 'CANCELLED';
  const color = isCompleted ? COLORS.success : (isCancelled ? COLORS.error : COLORS.secondary);
  const bgColor = isCompleted ? 'rgba(5, 150, 105, 0.1)' : (isCancelled ? 'rgba(186, 26, 26, 0.1)' : 'rgba(0, 84, 204, 0.1)');
  
  return (
    <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
      <Text style={[styles.statusBadgeText, { color }]}>{status}</Text>
    </View>
  );
};

const AppointmentCard = ({ item, userTimezone, onJoinCall }) => {
  const doctorName = [item.doctor?.user?.firstName, item.doctor?.user?.lastName].filter(Boolean).join(' ') || 'Doctor';

  return (
    <View style={styles.appointmentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.doctorInfo}>
           <View style={styles.avatar}>
             <Ionicons name="person-outline" size={20} color={COLORS.primary} />
           </View>
           <View>
             <Text style={styles.doctorName}>Dr. {doctorName}</Text>
             <View style={styles.timeRow}>
               <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
               <Text style={styles.timeText}>{formatDate(item.appointmentDate, userTimezone)}</Text>
             </View>
           </View>
        </View>
        <StatusBadge status={item.status} />
      </View>
      {item.reason && (
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>
        </View>
      )}

      {/* ✅ JOIN CALL BUTTON: Only show if doctor has started the call */}
      {['requested', 'active'].includes(item.callStatus) && (
        <TouchableOpacity 
          style={styles.joinCallBtn} 
          onPress={onJoinCall}
          activeOpacity={0.8}
        >
          <Ionicons name="videocam" size={18} color={COLORS.white} />
          <Text style={styles.joinCallBtnText}>Join Video Session</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function PatientDashboard({ navigation }) {
  const { user, logout, userTimezone } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [apptRes, statsRes] = await Promise.allSettled([
        api.get('/patient/appointments'),
        api.get('/patient/stats'),
      ]);

      if (apptRes.status === 'fulfilled') {
        const list = Array.isArray(apptRes.value.data) ? apptRes.value.data : (apptRes.value.data?.data || []);
        setAppointments(list);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data?.data || statsRes.value.data);
      }
    } catch (error) {
      console.error('[PatientDashboard] Error:', error);
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

    console.log(`[Dashboard] 📞 Navigating to ActiveCall. ID: ${callID}`);

    // Navigate directly to the isolated ZEGO screen
    navigation.navigate('ActiveCall', {
      userID,
      userName: displayName,
      callID,
      isGroup: false,
    });
  }, [user, navigation]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };
  const displayName = user?.firstName || 'Patient';

  const ListHeader = (
    <View style={styles.headerContent}>
      {/* ── Welcome Header ── */}
      <View style={styles.topRow}>
        <View>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.displayName}>{displayName} 🌿</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.profileBtn}>
          <Ionicons name="log-out-outline" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      {/* ── Modern Stat Bento ── */}
      <View style={styles.statsBento}>
        <View style={styles.statsMain}>
          <TouchableOpacity 
             style={[styles.bigStat, { backgroundColor: COLORS.primaryContainer }]}
             onPress={() => navigation.navigate('AppointmentsTab')}
          >
            <View style={styles.statIconCircle}>
               <Ionicons name="calendar" size={24} color={COLORS.primary} />
            </View>
            <Text style={styles.bigStatValue}>{stats?.totalAppointments ?? appointments.length}</Text>
            <Text style={styles.bigStatLabel}>Appointments</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsSide}>
          <TouchableOpacity 
            style={[styles.smallStat, { backgroundColor: COLORS.secondaryContainer }]}
            onPress={() => {}}
          >
            <Text style={styles.smallStatValue}>{stats?.totalPrescriptions ?? 0}</Text>
            <Text style={styles.smallStatLabel}>Meds</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.smallStat, { backgroundColor: COLORS.surfaceContainerHigh }]}
            onPress={() => navigation.navigate('HomeTab', { screen: 'Doctors' })}
          >
            <Text style={styles.smallStatValue}>{stats?.totalDoctors ?? 0}</Text>
            <Text style={styles.smallStatLabel}>Doctors</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Quick Actions ── */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Services</Text>
      </View>
      <View style={styles.actionsGrid}>
        {QUICK_ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.key}
            style={styles.actionCard}
            onPress={() => navigation.navigate(action.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBg, { backgroundColor: `${action.color}10` }]}>
              <Ionicons name={action.icon} size={24} color={action.color} />
            </View>
            <Text style={styles.actionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('AppointmentsTab')}>
          <Text style={styles.seeAllText}>See All</Text>
        </TouchableOpacity>
      </View>
      {loading && <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={appointments.slice(0, 3)}
        keyExtractor={(item, i) => item.id?.toString() || `apt-${i}`}
        renderItem={({ item }) => (
          <AppointmentCard 
            item={item} 
            userTimezone={userTimezone} 
            onJoinCall={() => handleJoinCall(item)} 
          />
        )}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="calendar-blank-outline" size={60} color={COLORS.surfaceContainerHighest} />
              <Text style={styles.emptyText}>Clear schedule for now</Text>
              <Text style={styles.emptySubText}>Book a new session via the services above</Text>
            </View>
          ) : null
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceContainerLowest },
  listContent: { paddingBottom: SPACING.xxxl },
  headerContent: { padding: SPACING.lg },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.sm,
  },
  welcomeText: { fontSize: 14, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  displayName: { fontSize: 28, fontWeight: '900', color: COLORS.onSurface, letterSpacing: -1 },
  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainer,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },

  // Bento Stats
  statsBento: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: SPACING.xl,
    height: 160,
  },
  statsMain: { flex: 1.2 },
  statsSide: { flex: 1, gap: 12 },
  bigStat: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    justifyContent: 'flex-end',
  },
  statIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 16,
    right: 16,
  },
  bigStatValue: { fontSize: 36, fontWeight: '900', color: COLORS.onPrimaryContainer, letterSpacing: -1 },
  bigStatLabel: { fontSize: 14, fontWeight: '700', color: COLORS.onPrimaryContainer, opacity: 0.7 },
  smallStat: {
    flex: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  smallStatValue: { fontSize: 24, fontWeight: '900', color: COLORS.onSurface },
  smallStatLabel: { fontSize: 12, fontWeight: '600', color: COLORS.onSurfaceVariant, opacity: 0.8 },

  // Quick Actions
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: { fontSize: 20, fontWeight: '900', color: COLORS.onSurface, letterSpacing: -0.5 },
  seeAllText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  actionsGrid: { flexDirection: 'row', gap: 12, marginBottom: SPACING.xl },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  actionIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.onSurface, textAlign: 'center' },

  // Appointments
  appointmentCard: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceContainerLowest,
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  doctorInfo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: COLORS.primaryContainer, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  doctorName: { fontSize: 16, fontWeight: '800', color: COLORS.onSurface },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timeText: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '500' },
  reasonContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md,
  },
  reasonText: { fontSize: 12, color: COLORS.onSurfaceVariant, fontWeight: '500', fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full },
  statusBadgeText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '800', color: COLORS.onSurface, marginTop: 16 },
  emptySubText: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 4, textAlign: 'center', maxWidth: '80%' },
  
  // Join Call Button
  joinCallBtn: {
    marginTop: 16,
    backgroundColor: COLORS.secondary,
    padding: 14,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...SHADOWS.md,
  },
  joinCallBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
