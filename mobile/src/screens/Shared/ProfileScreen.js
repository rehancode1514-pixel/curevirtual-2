import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  TextInput,
  Modal,
  FlatList 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { fetchUserProfile, updateUserProfile } from '../../services/authService';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../../theme/designSystem';
import { COMMON_TIMEZONES } from '../../utils/timezones';

/**
 * ProfileScreen.js — CureVirtual Mobile
 * 
 * Redesigned to match the "Premium" web design system.
 * Handles detailed editing for Doctors, Patients, and Pharmacies.
 */

export default function ProfileScreen({ navigation }) {
  const { 
    user: authUser, 
    updateUser, 
    resolvedTimezone,
    updateUserTimezone 
  } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showTzModal, setShowTzModal] = useState(false);
  
  // Edit form state — covers all roles
  const [editForm, setEditForm] = useState({
    // Common
    firstName: '',
    middleName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    maritalStatus: 'SINGLE',
    timezone: 'UTC',

    // Doctor Specific
    specialization: '',
    qualifications: '',
    licenseNumber: '',
    hospitalAffiliation: '',
    yearsOfExperience: '0',
    consultationFee: '0',
    bio: '',
    languages: '["English"]',
    availability: '{}',

    // Patient Specific
    bloodGroup: 'UNKNOWN',
    disabilityStatus: 'Normal',
    height: '',
    weight: '',
    medicalHistory: '',
    allergies: '',
    medications: '',
    insuranceProvider: '',
    insuranceMemberId: '',

    // Pharmacy Specific
    displayName: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    openingHours: '',
    services: '',

    // Emergency Contact (Shared)
    emergencyContactName: '',
    emergencyContactEmail: '',
    emergencyContact: '', // Additional details
  });

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      if (authUser?.id) {
        const data = await fetchUserProfile(authUser.id, authUser.role);
        
        // ✅ NORMALIZE: Ensure we don't shadow the User ID with the Profile ID
        const normalizedData = {
          // Fields from the user object (if nested)
          firstName: data.user?.firstName || data.firstName || '',
          lastName: data.user?.lastName || data.lastName || '',
          email: data.user?.email || data.email || '',
          phone: data.user?.phone || data.phone || '',
          
          // Fields from the profile object
          ...data,
          
          // 🛡️ SECURITY: Explicitly keep the record ID separate from the User ID
          profileRecordId: data.id, 
          id: authUser?.id, // Ensure form state 'id' matches the global User ID
        };
        
        // Initialize form
        setEditForm({
          firstName: normalizedData.firstName,
          lastName: normalizedData.lastName,
          middleName: normalizedData.middleName || '',
          phone: normalizedData.phone,
          dateOfBirth: normalizedData.dateOfBirth ? normalizedData.dateOfBirth.split('T')[0] : '',
          gender: normalizedData.gender || 'MALE',
          maritalStatus: normalizedData.maritalStatus || 'SINGLE',
          timezone: normalizedData.timezone || resolvedTimezone || 'UTC',

          specialization: normalizedData.specialization || '',
          qualifications: normalizedData.qualifications || '',
          licenseNumber: normalizedData.licenseNumber || '',
          hospitalAffiliation: normalizedData.hospitalAffiliation || '',
          yearsOfExperience: String(normalizedData.yearsOfExperience || '0'),
          consultationFee: String(normalizedData.consultationFee || '0'),
          bio: normalizedData.bio || '',
          languages: normalizedData.languages || '["English"]',
          availability: normalizedData.availability || '{}',

          bloodGroup: normalizedData.bloodGroup || 'UNKNOWN',
          disabilityStatus: normalizedData.disabilityStatus || 'Normal',
          height: String(normalizedData.height || ''),
          weight: String(normalizedData.weight || ''),
          medicalHistory: normalizedData.medicalHistory || '',
          allergies: normalizedData.allergies || '',
          medications: normalizedData.medications || '',
          insuranceProvider: normalizedData.insuranceProvider || '',
          insuranceMemberId: normalizedData.insuranceMemberId || '',

          displayName: normalizedData.displayName || '',
          address: normalizedData.address || '',
          city: normalizedData.city || '',
          state: normalizedData.state || '',
          country: normalizedData.country || '',
          postalCode: normalizedData.postalCode || '',
          openingHours: normalizedData.openingHours || '',
          services: normalizedData.services || '',

          emergencyContactName: normalizedData.emergencyContactName || '',
          emergencyContactEmail: normalizedData.emergencyContactEmail || '',
          emergencyContact: normalizedData.emergencyContact || '',
        });
      }
    } catch (error) {
      console.error('[ProfileScreen] Load failed:', error);
    } finally {
      setLoading(false);
    }
  }, [authUser?.id, authUser?.role, resolvedTimezone]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const handleSave = async () => {
    try {
      setSaving(true);
      // Clean numeric fields
      const payload = {
        ...editForm,
        yearsOfExperience: parseInt(editForm.yearsOfExperience) || 0,
        consultationFee: parseFloat(editForm.consultationFee) || 0,
        height: parseFloat(editForm.height) || null,
        weight: parseFloat(editForm.weight) || null,
      };

      console.log(`[ProfileScreen] Attempting save. UserID: ${authUser.id}, Timezone: ${payload.timezone}`);

      // Step 1: Save to Backend
      const result = await updateUserProfile(authUser.id, payload, authUser.role);

      // Step 2: Sync global context user state + storage
      // IMPORTANT: Use the actual data returned from server to ensure persistence
      const serverData = result?.data || payload;
      
      console.log(`[ProfileScreen] Syncing with server data. Timezone: ${serverData.timezone}`);
      
      await updateUser(serverData);

      // Step 3: Explicitly sync timezone to global state if changed
      if (serverData.timezone) {
        await updateUserTimezone(serverData.timezone, true); // true = skip redundant backend sync
      }

      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully.');
      
      // Reload profile data to confirm all server changes are reflected
      await loadProfile();
    } catch (error) {
      console.error('[ProfileScreen] Save failed:', error);
      Alert.alert('Update Failed', error.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  const renderInputField = (label, field, placeholder = '', options = {}) => {
    return (
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>{label}</Text>
        <TextInput
          style={[styles.textInput, options.multiline && styles.textArea]}
          value={editForm[field]}
          onChangeText={(val) => setEditForm(prev => ({ ...prev, [field]: val }))}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textPlaceholder}
          keyboardType={options.type || 'default'}
          multiline={options.multiline}
          numberOfLines={options.multiline ? 4 : 1}
          editable={isEditing}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.brandGreen} />
      </View>
    );
  }

  const roleLabel = authUser?.role === 'DOCTOR' ? 'Professional Account' : 
                    authUser?.role === 'PHARMACY' ? 'Pharmacy Outlet' : 'Patient Profile';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Section */}
        <View style={styles.header}>
            <View>
                <Text style={styles.headerSubtitle}>{roleLabel}</Text>
                <Text style={styles.headerTitle}>{authUser?.role === 'PHARMACY' ? 'Pharmacy Info' : (authUser?.role === 'DOCTOR' ? 'Doctor Profile' : 'Member Profile')}</Text>
            </View>
            <TouchableOpacity 
                style={[styles.editToggle, isEditing && styles.cancelToggle]} 
                onPress={() => setIsEditing(!isEditing)}
            >
                <Ionicons name={isEditing ? "close-outline" : "create-outline"} size={22} color={isEditing ? COLORS.error : COLORS.brandGreen} />
                <Text style={[styles.editToggleText, isEditing && { color: COLORS.error }]}>{isEditing ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.card}>
            {/* ── IDENTITY SECTION ── */}
            <View style={styles.row}>
                <View style={{ flex: 1 }}>{renderInputField('First Name', 'firstName', 'Rehan')}</View>
                <View style={{ flex: 1, marginHorizontal: SPACING.sm }}>{renderInputField('Middle Name', 'middleName', 'Optional')}</View>
                <View style={{ flex: 1 }}>{renderInputField('Last Name', 'lastName', 'Hussain')}</View>
            </View>

            {renderInputField('Phone Number', 'phone', '+1 555-0123', { type: 'phone-pad' })}
            
            {/* ── DOCTOR / PROFESSIONAL SECTION ── */}
            {authUser?.role === 'DOCTOR' && (
                <>
                    {renderSectionHeader('Professional Credentials')}
                    {renderInputField('Specialization', 'specialization', 'e.g. Cardiology')}
                    {renderInputField('Qualifications', 'qualifications', 'e.g. MBBS, MD')}
                    {renderInputField('License Number', 'licenseNumber', 'LIC-123456')}
                    {renderInputField('Hospital Affiliation', 'hospitalAffiliation', 'Optional')}
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: SPACING.sm }}>{renderInputField('Experience (Years)', 'yearsOfExperience', '0', { type: 'numeric' })}</View>
                        <View style={{ flex: 1 }}>{renderInputField('Consultation Fee (USD)', 'consultationFee', '0', { type: 'numeric' })}</View>
                    </View>
                    {renderInputField('Availability', 'availability', 'e.g. Mon-Fri 9AM-5PM', { multiline: true })}
                    {renderInputField('Bio / About', 'bio', 'Describe your expertise...', { multiline: true })}
                    {renderInputField('Languages', 'languages', '["English", "Urdu"]')}
                </>
            )}

            {/* ── PHARMACY SECTION ── */}
            {authUser?.role === 'PHARMACY' && (
                <>
                    {renderSectionHeader('Pharmacy Information')}
                    {renderInputField('Display Name', 'displayName', 'Cure Pharmacy')}
                    {renderInputField('License Number', 'licenseNumber', 'PH-112233')}
                    {renderInputField('Full Address', 'address', '123 Main St', { multiline: true })}
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: SPACING.sm }}>{renderInputField('City', 'city', '')}</View>
                        <View style={{ flex: 1 }}>{renderInputField('State/Province', 'state', '')}</View>
                    </View>
                    {renderInputField('Opening Hours', 'openingHours', 'Daily 8am - 10pm', { multiline: true })}
                    {renderInputField('Services Offered', 'services', 'Home Delivery, Vaccination', { multiline: true })}
                </>
            )}

            {/* ── PATIENT SECTION ── */}
            {authUser?.role === 'PATIENT' && (
                <>
                    {renderSectionHeader('Medical Information')}
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: SPACING.sm }}>{renderInputField('Blood Group', 'bloodGroup', 'A+')}</View>
                        <View style={{ flex: 1 }}>{renderInputField('Disability', 'disabilityStatus', 'Normal')}</View>
                    </View>
                    <View style={styles.row}>
                        <View style={{ flex: 1, marginRight: SPACING.sm }}>{renderInputField('Height (cm)', 'height', '170', { type: 'numeric' })}</View>
                        <View style={{ flex: 1 }}>{renderInputField('Weight (kg)', 'weight', '70', { type: 'numeric' })}</View>
                    </View>
                    {renderInputField('Allergies', 'allergies', 'None', { multiline: true })}
                    {renderInputField('Chronic Conditions', 'medicalHistory', 'None', { multiline: true })}
                    {renderInputField('Current Medications', 'medications', 'None', { multiline: true })}
                </>
            )}

            {/* ── GLOBAL SETTINGS (TIMEZONE) ── */}
            <View style={styles.topSettingsCard}>
              <View style={styles.topSettingsHeader}>
                <Ionicons name="globe-outline" size={20} color={COLORS.brandGreen} />
                <Text style={styles.topSettingsTitle}>Account Settings</Text>
              </View>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Display Timezone</Text>
                <TouchableOpacity 
                  style={[
                    styles.tzButton, 
                    !isEditing && { backgroundColor: COLORS.bgDisabled, borderColor: COLORS.divider },
                    isEditing && styles.tzButtonActive
                  ]}
                  disabled={false}
                  onPress={() => setShowTzModal(true)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ 
                      color: editForm.timezone ? COLORS.textMain : COLORS.textPlaceholder, 
                      fontSize: TYPOGRAPHY.base,
                      fontWeight: '500'
                    }}>
                      {editForm.timezone === 'auto' 
                        ? `Auto (${resolvedTimezone})` 
                        : (COMMON_TIMEZONES.find(t => t.value === editForm.timezone)?.label || editForm.timezone || 'Select Timezone')}
                    </Text>
                    {isEditing && <Ionicons name="chevron-down" size={18} color={COLORS.brandGreen} />}
                  </View>
                </TouchableOpacity>
                <Text style={styles.inputHelp}>Used for all appointment times and notifications.</Text>
              </View>
            </View>

            {/* ── PERSONAL INFORMATION ── */}
            {renderSectionHeader('Personal Information')}
            {renderInputField('Full Name', 'emergencyContactName', 'Jane Doe')}
            {renderInputField('Email Address', 'emergencyContactEmail', 'emergency@example.com', { type: 'email-address' })}
            

            {renderInputField('Additional Details (Relation, Phone, etc.)', 'emergencyContact', 'Mother - +1 555-0123', { multiline: true })}

            {/* Timezone Selection Modal */}
            <Modal visible={showTzModal} animationType="slide" transparent>
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Select Timezone</Text>
                        <TouchableOpacity onPress={() => setShowTzModal(false)}>
                            <Ionicons name="close" size={24} color={COLORS.textMain} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={COMMON_TIMEZONES}
                        keyExtractor={(item) => item.value}
                        renderItem={({ item }) => (
                            <TouchableOpacity 
                                style={styles.tzItem}
                                onPress={() => {
                                    setEditForm(prev => ({ ...prev, timezone: item.value }));
                                    setShowTzModal(false);
                                }}
                            >
                                <Text style={[styles.tzItemText, editForm.timezone === item.value && styles.tzItemSelected]}>{item.label}</Text>
                                {editForm.timezone === item.value && <Ionicons name="checkmark-circle" size={20} color={COLORS.brandGreen} />}
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ paddingBottom: 40 }}
                    />
                </View>
              </View>
            </Modal>

            {/* Save Button */}
            {isEditing && (
                <TouchableOpacity 
                    style={[styles.saveBtn, saving && { opacity: 0.7 }]} 
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={COLORS.white} />
                    ) : (
                        <Text style={styles.saveBtnText}>Save Profile</Text>
                    )}
                </TouchableOpacity>
            )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgMuted },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: SPACING.lg },
  
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: SPACING.lg 
  },
  topSettingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
    paddingBottom: SPACING.sm,
  },
  topSettingsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.brandGreen,
    marginLeft: SPACING.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tzButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E8EAED',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    justifyContent: 'center',
  },
  tzButtonActive: {
    borderColor: COLORS.brandGreen,
    backgroundColor: '#F0FDF4',
  },
  inputHelp: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  headerSubtitle: { 
    fontSize: 10, 
    color: COLORS.brandGreen, 
    fontWeight: TYPOGRAPHY.black, 
    textTransform: 'uppercase', 
    letterSpacing: 1 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: TYPOGRAPHY.black, 
    color: COLORS.textMain,
    marginTop: 2,
  },
  editToggle: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4, 
    padding: 8, 
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  cancelToggle: { backgroundColor: COLORS.white },
  editToggleText: { 
    fontSize: TYPOGRAPHY.sm, 
    fontWeight: TYPOGRAPHY.bold, 
    color: COLORS.brandGreen 
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    padding: SPACING.xl,
    ...SHADOWS.premium,
  },
  
  row: { flexDirection: 'row', gap: SPACING.sm },
  
  sectionHeader: { 
    marginTop: SPACING.xl, 
    marginBottom: SPACING.md, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  sectionHeaderText: { 
    fontSize: TYPOGRAPHY.sm, 
    fontWeight: TYPOGRAPHY.black, 
    color: COLORS.brandGreen,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: COLORS.slate100 },
  
  inputWrapper: { marginBottom: SPACING.lg },
  inputLabel: { 
    fontSize: 10, 
    color: COLORS.textMuted, 
    fontWeight: TYPOGRAPHY.bold, 
    textTransform: 'uppercase', 
    marginBottom: 6,
    letterSpacing: 0.5 
  },
  textInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: RADIUS.md,
    padding: 14,
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textMain,
    fontWeight: '500',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  saveBtn: {
    backgroundColor: COLORS.brandGreen,
    borderRadius: RADIUS.base,
    padding: 18,
    alignItems: 'center',
    marginTop: SPACING.xl,
    ...SHADOWS.md,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.black,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bgDisabled: {
    backgroundColor: COLORS.slate50,
    borderColor: COLORS.slate100,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '70%',
    padding: SPACING.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.black,
    color: COLORS.textMain,
  },
  tzItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate50,
  },
  tzItemText: {
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textSoft,
    fontWeight: '500',
  },
  tzItemSelected: {
    color: COLORS.brandGreen,
    fontWeight: TYPOGRAPHY.black,
  },
});
