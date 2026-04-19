import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, PermissionsAndroid, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../../theme/designSystem';
import { useSocket } from '../../hooks/useSocket';
import { formatToLocalTime, formatToLocalDate } from '../../utils/timeUtils';

export default function VideoCallScreen({ navigation, route }) {
  const { user, userTimezone } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hook into socket events
  const { emit } = useSocket({
    'call-missed': (data) => {
      console.log('Call missed:', data);
    },
    'call-accepted': (data) => {
      console.log('Call accepted by counterparty:', data);
    }
  });

  const checkPermissions = useCallback(async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
    }
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBD';
    return `${formatToLocalDate(dateStr, userTimezone)} at ${formatToLocalTime(dateStr, userTimezone)}`;
  };

  const fetchConsultations = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await api.get('/videocall/list', {
        params: { userId: user.id, role: user.role }
      });
      const data = res.data?.data || res.data || [];
      setConsultations(data.sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt)));
    } catch (err) {
      console.error('[VideoCallScreen] Failed to fetch consultations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConsultations();
    checkPermissions();
  }, [fetchConsultations, checkPermissions]);

  const startCall = useCallback(async (consult) => {
    // ✅ PRIORITY: If this is a standard appointment, use the backend-generated roomName
    const rawRoomId = consult.roomName || consult.meetingUrl || `consult_${consult.id}`;
    
    // Zego IDs must be alphanumeric
    const sanitize = (id) => String(id || '').replace(/[^a-zA-Z0-9_]/g, '_');
    
    const callID = sanitize(rawRoomId);
    const userID = sanitize(user?.id || Date.now());
    const displayName = user?.name || (user?.role === 'DOCTOR' ? 'Doctor' : 'Patient');

    console.log(`[VideoCall] 🚀 Joining Room: ${rawRoomId} as ${callID}`);

    if (consult.isAppointment) {
      // For standard appointments, hit the join-call endpoint to update callStatus to "active"
      try {
        await api.post(`/appointments/${consult.id}/join-call`);
      } catch (err) {
        console.warn('[VideoCall] Could not sync join-call state with backend:', err.message);
      }
    } else {
      // Notify legacy videocall system
      emit('join_room', { roomId: rawRoomId, appointmentId: consult.appointmentId || consult.id });
      emit('start_session', {
        roomId: rawRoomId,
        doctorName: user?.name,
        patientId: user?.role === 'DOCTOR' ? consult.patientId : user?.id,
        appointmentId: consult.id
      });
    }

    // Navigate to the fully isolated call screen
    navigation.navigate('ActiveCall', {
      userID,
      userName: displayName,
      callID,
      isGroup: consult.isGroup || false,
    });
  }, [user, emit, navigation]);


  const renderItem = ({ item }) => {
    const isScheduled = item.status === 'SCHEDULED' || item.status === 'ONGOING';
    
    // Resolve display name based on role
    const isDoctor = user?.role === 'DOCTOR';
    const otherParty = isDoctor ? item.patient : item.doctor;
    const otherUser = otherParty?.user;
    
    const firstName = otherUser?.firstName || '';
    const lastName = otherUser?.lastName || '';
    const otherName = [firstName, lastName].filter(Boolean).join(' ') || (isDoctor ? 'Patient' : 'Doctor');
    const initial = (firstName[0] || (isDoctor ? 'P' : 'D')).toUpperCase();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.miniAvatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View>
              <Text style={styles.cardTitle}>{otherName}</Text>
              <Text style={styles.cardSubTitle}>Video Consultation</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: isScheduled ? COLORS.brandBlue + '20' : COLORS.brandGreen + '20' }]}>
            <Text style={[styles.statusText, { color: isScheduled ? COLORS.brandBlue : COLORS.brandGreen }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSoft} />
            <Text style={styles.infoText}>Time: {formatDate(item.scheduledAt || item.appointmentDate)}</Text>
          </View>
          {item.reason && (
            <View style={styles.infoRow}>
              <Ionicons name="medical-outline" size={14} color={COLORS.brandOrange} />
              <Text style={styles.infoText}>Condition: {item.reason}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Ionicons name="hourglass-outline" size={14} color={COLORS.textSoft} />
            <Text style={styles.infoText}>Duration: {item.durationMins || 30} mins</Text>
          </View>
        </View>

        {!['CANCELLED', 'COMPLETED', 'FAILED'].includes(item.status) && (
          <TouchableOpacity style={styles.joinBtn} onPress={() => startCall(item)}>
            <Ionicons name="videocam" size={20} color={COLORS.white} />
            <Text style={styles.joinBtnText}>Enter Hub</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Video Consultations</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.brandGreen} />
        </View>
      ) : (
        <FlatList
          data={consultations}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No consultation history found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMuted },
  header: { padding: SPACING.lg, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.slate100 },
  title: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.black, color: COLORS.textMain },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: SPACING.md },
  
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.md, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.sm },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  miniAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.brandGreen}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 14, fontWeight: TYPOGRAPHY.black, color: COLORS.brandGreen },
  cardTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: COLORS.textMain },
  cardSubTitle: { fontSize: 10, color: COLORS.textMuted, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.bold },
  cardBody: { marginBottom: SPACING.lg, paddingLeft: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSoft },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brandBlue, padding: SPACING.md, borderRadius: RADIUS.sm, gap: 8 },
  joinBtnText: { color: COLORS.white, fontWeight: TYPOGRAPHY.bold, fontSize: TYPOGRAPHY.sm },

  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', fontSize: TYPOGRAPHY.base, textAlign: 'center' },

  // Call View Styles
  callContainer: { flex: 1, backgroundColor: '#0f172a' },
  videoHeader: { padding: SPACING.md, backgroundColor: '#1e293b', alignItems: 'center' },
  videoRoomText: { color: '#cbd5e1', fontSize: TYPOGRAPHY.sm, fontWeight: 'bold' },
  videoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  placeholderText: { color: '#64748b', fontSize: 16, fontWeight: 'semiBold', marginTop: 20 },
  patientContext: { alignItems: 'center', marginBottom: 20 },
  patientWaitName: { color: COLORS.white, fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  patientWaitReason: { color: COLORS.brandOrange, fontSize: 14, fontWeight: '500', opacity: 0.9 },
  localVideo: { position: 'absolute', bottom: 24, right: 24, width: 100, height: 150, backgroundColor: '#334155', borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 6 },
  localText: { color: '#94a3b8', fontSize: 14, marginTop: 8 },
  controlsContainer: { height: 100, backgroundColor: '#020617', flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' },
  controlButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  endCallButton: { backgroundColor: '#ef4444' }
});
