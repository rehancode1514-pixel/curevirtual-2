import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../services/api';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../../theme/designSystem';
import { useAuth } from '../../context/AuthContext';
import { getLocalDateString, formatToLocalTime, formatToLocalDate } from '../../utils/timeUtils';

export default function AppointmentBookingScreen({ route, navigation }) {
  const { userTimezone } = useAuth();
  // 1. Core Selected State
  const [selectedDoctor, setSelectedDoctor] = useState(route.params?.doctor || null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [reason, setReason] = useState('');

  // 2. Data State
  const [doctors, setDoctors] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  // 3. Loading states
  const [fetchingDoctors, setFetchingDoctors] = useState(false);
  const [fetchingSchedule, setFetchingSchedule] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  // ✅ FIX: Use localized date string instead of toISOString() to prevent day-shifting
  const dateStr = getLocalDateString(selectedDate, userTimezone);

  // ==========================================
  // FETCH LIST OF DOCTORS (if bypassed)
  // ==========================================
  useEffect(() => {
    if (!selectedDoctor) {
      setFetchingDoctors(true);
      // (Using /patient/doctors/all as it's the valid endpoint for patients)
      api.get('/patient/doctors/all')
        .then(res => {
          const docs = res.data?.data || res.data || [];
          setDoctors(docs);
        })
        .catch(err => {
          console.error('[Booking] Error fetching doctors:', err);
        })
        .finally(() => setFetchingDoctors(false));
    }
  }, [selectedDoctor]);

  // ==========================================
  // FETCH SCHEDULE & TIME SLOTS
  // ==========================================
  useEffect(() => {
    if (!selectedDoctor) return;

    // Fetch dates first
    const fetchDatesAndSlots = async () => {
      try {
        setFetchingSchedule(true);
        // GET /api/schedule?doctorId=... -> fetch recurring rules
        await api.get(`/schedule?doctorId=${selectedDoctor.id}`);
        // For now, these are rules, but specific dates would come from a calendar view.
        // We'll keep the current day-by-day logic for simplicity.
      } catch (err) {
        console.log('[Booking] Schedule fetch error:', err.message);
      } finally {
        setFetchingSchedule(false);
      }
    };
    
    fetchDatesAndSlots();
  }, [selectedDoctor, selectedDate, dateStr]);

  useEffect(() => {
    if (!selectedDoctor) {
      setTimeSlots([]);
      return;
    }

    const fetchSlots = async () => {
      try {
        setFetchingSlots(true);
        setSelectedTime(''); // Reset time selection safely
        
        // Fulfilling requirement: GET /schedule/slots?doctorId=...&date=YYYY-MM-DD
        const slotsRes = await api.get(`/schedule/slots?doctorId=${selectedDoctor.id}&date=${dateStr}`);
        const data = slotsRes.data?.data || [];
        
        console.log(`[Booking DEBUG] API Response for ${selectedDoctor.id} on ${dateStr}:`, data);

        // Map to displayable format: [{ id, label, value }]
        const formatted = data
          .filter(s => s.status === 'AVAILABLE')
          .map(s => {
            const label = formatToLocalTime(s.startTime, userTimezone);
            console.log(`  -> Slot Conv: ${s.startTime} (UTC) -> ${label} (Local: ${userTimezone})`);
            return {
              id: s.id,
              label: label,
              value: s.startTime // ISO string
            };
          });

        console.log(`[Booking DEBUG] Formatted ${formatted.length} available slots.`);
        setTimeSlots(formatted);
      } catch (err) {
        console.log('[Booking] Timeslots fetch error:', err.message);
        setTimeSlots([]);
      } finally {
        setFetchingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctor, dateStr, userTimezone]);

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleBook = async () => {
    if (!selectedTime) {
      Alert.alert('Select Time', 'Please select a time slot to continue.');
      return;
    }
    if (!selectedDoctor) return;

    setBooking(true);
    
    try {
      await api.post('/patient/appointments', {
        doctorId: selectedDoctor.id,
        appointmentDate: selectedTime, // Now contains the full ISO string
        reason: reason.trim() || undefined,
      });

      Alert.alert(
        '✅ Appointment Booked!',
        'Your appointment is confirmed and pending approval.',
        [{ 
          text: 'View My Bookings', 
          onPress: () => navigation.navigate('AppointmentsTab') 
        }]
      );
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Booking failed. Try another time.';
      Alert.alert('Booking Failed', msg);
    } finally {
      setBooking(false);
    }
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d >= today) {
      setSelectedDate(d);
    }
  };

  // ==========================================
  // RENDER DOCTOR SELECTION VIEW (Fallback)
  // ==========================================
  if (!selectedDoctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Doctor</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.placeholderBox}>
          <Text style={styles.placeholderTitle}>Please select a doctor first</Text>
          <Text style={styles.placeholderDesc}>You must choose a doctor to view their available dates and time slots.</Text>
        </View>

        {fetchingDoctors ? (
          <ActivityIndicator size="large" color={COLORS.brandGreen} style={{ marginTop: SPACING.xxl }} />
        ) : (
          <FlatList
            data={doctors}
            keyExtractor={item => item.id?.toString() || Math.random().toString()}
            contentContainerStyle={{ padding: SPACING.lg }}
            renderItem={({item}) => {
              const fname = item.user?.firstName || item.firstName || '';
              const lname = item.user?.lastName || item.lastName || '';
              return (
                <TouchableOpacity 
                  style={styles.doctorCard} 
                  activeOpacity={0.7}
                  onPress={() => setSelectedDoctor(item)}
                >
                  <View style={styles.doctorAvatar}>
                    <Text style={styles.doctorAvatarText}>{(fname[0] || 'D').toUpperCase()}</Text>
                  </View>
                  <View>
                    <Text style={styles.doctorName}>Dr. {fname} {lname}</Text>
                    <Text style={styles.doctorSpec}>{item.specialization || 'General Practitioner'}</Text>
                  </View>
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={
              <Text style={{ textAlign: 'center', color: COLORS.textMuted, marginTop: 20 }}>No doctors available.</Text>
            }
          />
        )}
      </SafeAreaView>
    );
  }

  // ==========================================
  // RENDER BOOKING FLOW 
  // ==========================================
  const doctorFirst = selectedDoctor.user?.firstName || selectedDoctor.firstName || '';
  const doctorLast = selectedDoctor.user?.lastName || selectedDoctor.lastName || '';
  const displayDate = formatToLocalDate(selectedDate, userTimezone);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Appointment</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* ── Doctor Card ── */}
        <View style={styles.doctorCard}>
          <View style={styles.doctorAvatar}>
            <Text style={styles.doctorAvatarText}>{(doctorFirst[0] || 'D').toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName}>Dr. {doctorFirst} {doctorLast}</Text>
            <Text style={styles.doctorSpec}>{selectedDoctor.specialization || 'General Practitioner'}</Text>
          </View>
          <TouchableOpacity onPress={() => setSelectedDoctor(null)} style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* ── Date Selector ── */}
        <Text style={styles.sectionLabel}>SELECT DATE</Text>
        <View style={styles.dateCard}>
          <TouchableOpacity style={styles.dateBtnLeft} onPress={prevDay} activeOpacity={0.7} disabled={fetchingSchedule}>
            <Text style={styles.dateArrow}>‹</Text>
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text style={styles.dateValue}>{displayDate}</Text>
            {fetchingSchedule && <ActivityIndicator size="small" color={COLORS.brandGreen} style={{ marginTop: 4 }} />}
          </View>
          <TouchableOpacity style={styles.dateBtnRight} onPress={nextDay} activeOpacity={0.7} disabled={fetchingSchedule}>
            <Text style={styles.dateArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Reason ── */}
        <Text style={styles.sectionLabel}>REASON (OPTIONAL)</Text>
        <TextInput
          style={styles.reasonInput}
          placeholder="Describe your symptoms or reason for visit..."
          placeholderTextColor={COLORS.textPlaceholder}
          value={reason}
          onChangeText={setReason}
          multiline
          numberOfLines={3}
        />

        {/* ── Time Slots ── */}
        <Text style={styles.sectionLabel}>SELECT TIME SLOT</Text>
        <Text style={styles.scheduleNote}>
          ⚠️ Times shown are fetched dynamically based on the doctors actual availability on this date.
        </Text>
        
        {fetchingSlots ? (
          <ActivityIndicator size="large" color={COLORS.brandGreen} style={{ marginTop: SPACING.xl, marginBottom: SPACING.xxl }} />
        ) : timeSlots.length === 0 ? (
          <View style={styles.noSlotsBox}>
            <Text style={styles.noSlotsText}>No slots available for this date.</Text>
          </View>
        ) : (
          <View style={styles.slotGrid}>
            {timeSlots.map((slot) => (
              <TouchableOpacity
                key={slot.id}
                style={[styles.slotBtn, selectedTime === slot.value && styles.selectedSlot]}
                onPress={() => setSelectedTime(slot.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.slotText, selectedTime === slot.value && styles.selectedSlotText]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── Confirm ── */}
        <TouchableOpacity
          style={[styles.confirmBtn, (!selectedTime || booking) && styles.confirmBtnDisabled]}
          onPress={handleBook}
          disabled={!selectedTime || booking}
          activeOpacity={0.85}
        >
          {booking ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.confirmBtnText}>CONFIRM BOOKING →</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMuted },
  scrollContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  backBtn: {
    width: 40, height: 40, backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center',
    ...SHADOWS.sm,
  },
  backIcon: { fontSize: TYPOGRAPHY.xl, color: COLORS.textMain },
  headerTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.black, color: COLORS.textMain },
  
  placeholderBox: {
    margin: SPACING.lg,
    padding: SPACING.xl,
    backgroundColor: `${COLORS.brandOrange}15`,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.brandOrange,
    alignItems: 'center'
  },
  placeholderTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.brandOrange,
    marginBottom: SPACING.sm
  },
  placeholderDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSoft,
    textAlign: 'center',
    lineHeight: 20
  },
  
  doctorCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.base,
    padding: SPACING.base, flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, marginBottom: SPACING.xl, ...SHADOWS.sm,
  },
  doctorAvatar: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: `${COLORS.brandGreen}20`,
    justifyContent: 'center', alignItems: 'center',
  },
  doctorAvatarText: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.black, color: COLORS.brandGreen },
  doctorName: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: COLORS.textMain },
  doctorSpec: { fontSize: TYPOGRAPHY.sm, color: COLORS.textMuted, marginTop: 3 },
  changeBtn: { padding: SPACING.sm, backgroundColor: COLORS.bgInput, borderRadius: RADIUS.sm },
  changeBtnText: { color: COLORS.brandGreen, fontSize: TYPOGRAPHY.xs, fontWeight: 'bold' },

  sectionLabel: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.black, color: COLORS.brandGreen, letterSpacing: 1.5, marginBottom: SPACING.md },
  dateCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.base, marginBottom: SPACING.xl, ...SHADOWS.sm, overflow: 'hidden',
  },
  dateBtnLeft: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, backgroundColor: COLORS.bgInput },
  dateBtnRight: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.lg, backgroundColor: COLORS.bgInput },
  dateArrow: { fontSize: 24, color: COLORS.brandGreen, fontWeight: TYPOGRAPHY.black },
  dateCenter: { flex: 1, alignItems: 'center', padding: SPACING.md },
  dateValue: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semiBold, color: COLORS.textMain },
  
  reasonInput: {
    backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.slate200,
    borderRadius: RADIUS.base, padding: SPACING.base, fontSize: TYPOGRAPHY.base,
    color: COLORS.textMain, marginBottom: SPACING.xl, minHeight: 80, textAlignVertical: 'top',
  },
  scheduleNote: { fontSize: TYPOGRAPHY.xs, color: COLORS.brandOrange, marginBottom: SPACING.base, fontWeight: TYPOGRAPHY.medium },
  
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.xxl },
  slotBtn: {
    width: '22%', paddingVertical: SPACING.md, backgroundColor: COLORS.white,
    borderRadius: RADIUS.base, alignItems: 'center', borderWidth: 1, borderColor: COLORS.slate200,
    ...SHADOWS.sm,
  },
  selectedSlot: { backgroundColor: COLORS.brandGreen, borderColor: COLORS.brandGreen, ...SHADOWS.green },
  slotText: { color: COLORS.textSoft, fontWeight: TYPOGRAPHY.semiBold, fontSize: TYPOGRAPHY.sm },
  selectedSlotText: { color: COLORS.white, fontWeight: TYPOGRAPHY.black },
  
  noSlotsBox: {
    padding: SPACING.xl,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.base,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginBottom: SPACING.xxl
  },
  noSlotsText: {
    color: COLORS.textMuted,
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.semiBold
  },

  confirmBtn: {
    backgroundColor: COLORS.brandGreen, borderRadius: RADIUS.base,
    paddingVertical: SPACING.base, alignItems: 'center', ...SHADOWS.green,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { color: COLORS.white, fontSize: TYPOGRAPHY.base, fontWeight: TYPOGRAPHY.black, letterSpacing: 1.5 },
});
