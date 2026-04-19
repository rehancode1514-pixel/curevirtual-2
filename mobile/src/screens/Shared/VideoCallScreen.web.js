import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, FlatList, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../../theme/designSystem';
import { useSocket } from '../../hooks/useSocket';

export default function VideoCallScreen({ navigation, route }) {
  const { user } = useContext(AuthContext);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null);

  const { emit } = useSocket({});

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Date TBD';
    try {
      const normalized = dateStr.endsWith('Z') ? dateStr.slice(0, -1) : dateStr;
      const date = new Date(normalized);
      return date.toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch { return 'Date TBD'; }
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
  }, [fetchConsultations]);

  const endCall = () => setActiveCall(null);
  const startCall = (consult) => setActiveCall(consult);

  if (activeCall) {
    return (
      <View style={[styles.callContainer, styles.center]}>
        <Ionicons name="videocam-off" size={64} color={COLORS.brandOrange} />
        <Text style={styles.placeholderTitle}>Consultation Hub (Web Mode)</Text>
        <Text style={styles.placeholderDesc}>
          Real-time video consultation is optimized for the mobile application. 
          Please use the Android app to enter this secure hub.
        </Text>
        <TouchableOpacity style={styles.closeBtn} onPress={endCall}>
          <Text style={styles.closeBtnText}>Back to List</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const isScheduled = item.status === 'SCHEDULED' || item.status === 'ONGOING';
    const isDoctor = user?.role === 'DOCTOR';
    const otherParty = isDoctor ? item.patient : item.doctor;
    const otherUser = otherParty?.user;
    const otherName = [otherUser?.firstName, otherUser?.lastName].filter(Boolean).join(' ') || (isDoctor ? 'Patient' : 'Doctor');

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.miniAvatar}>
              <Text style={styles.avatarText}>{otherName[0]}</Text>
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
        </View>

        {!['CANCELLED', 'COMPLETED', 'FAILED'].includes(item.status) && (
          <TouchableOpacity style={styles.joinBtn} onPress={() => startCall(item)}>
            <Ionicons name="videocam" size={20} color={COLORS.white} />
            <Text style={styles.joinBtnText}>Enter Hub (Preview)</Text>
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
  miniAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${COLORS.brandGreen}15`, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontWeight: TYPOGRAPHY.black, color: COLORS.brandGreen },
  cardTitle: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: COLORS.textMain },
  cardSubTitle: { fontSize: 10, color: COLORS.textMuted },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.bold },
  cardBody: { marginBottom: SPACING.lg },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSoft },
  joinBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.brandBlue, padding: SPACING.md, borderRadius: RADIUS.sm, gap: 8 },
  joinBtnText: { color: COLORS.white, fontWeight: TYPOGRAPHY.bold },
  empty: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94a3b8', textAlign: 'center' },
  callContainer: { flex: 1, backgroundColor: '#0f172a', padding: 40 },
  placeholderTitle: { color: COLORS.white, fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  placeholderDesc: { color: '#94a3b8', textAlign: 'center', marginTop: 12, lineHeight: 20 },
  closeBtn: { marginTop: 32, backgroundColor: COLORS.brandBlue, paddingVertical: 12, paddingHorizontal: 24, borderRadius: RADIUS.md },
  closeBtnText: { color: COLORS.white, fontWeight: 'bold' }
});
