import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthContext } from '../../context/AuthContext';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS, COMPONENTS } from '../../../theme/designSystem';
import FloatingChatbotButton from '../../components/FloatingChatbotButton';
import { Ionicons } from '@expo/vector-icons';

const logo = require('../../../assets/images/logo.png');

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter both email and password.');
      return;
    }

    const result = await login(email.trim(), password);
    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Please check your credentials and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Card ── */}
          <View style={styles.card}>
            {/* Logo and SECURE badge matching the ref Image */}
            <View style={styles.brandRow}>
              <View style={styles.logoTextWrapper}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
                <Text style={styles.brandName}>
                  CURE<Text style={styles.brandNameBlue}>VIRTUAL</Text>
                </Text>
              </View>
            </View>

            <View style={styles.secureBadgeWrapper}>
              <View style={styles.secureBadge}>
                <Ionicons name="lock-closed-outline" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                <Text style={styles.secureBadgeText}>SECURE</Text>
              </View>
            </View>

            <Text style={styles.title}>LOGIN</Text>
            <Text style={styles.subtitle}>Enter your credentials to access your dashboard.</Text>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="operator@curevirtual.io"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotLink}>FORGOT PASSWORD?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.passwordWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.inputWithIcon, styles.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textPlaceholder}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.primaryButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.onPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>SUBMIT →</Text>
              )}
            </TouchableOpacity>

            {/* OTP Link */}
            <TouchableOpacity style={styles.otpRow} onPress={() => {}}>
              <Text style={styles.otpLink}>LOGIN WITH OTP INSTEAD?</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />

            {/* Register Link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>DON&apos;T HAVE AN ACCOUNT? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>REGISTER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <FloatingChatbotButton />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.surfaceContainerLowest,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.surfaceContainerLowest,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.premium,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logoTextWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: SPACING.xs,
  },
  brandName: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.black,
    color: COLORS.onSurface,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  brandNameBlue: {
    color: COLORS.primary,
    fontStyle: 'italic',
  },
  secureBadgeWrapper: {
    flexDirection: 'row',
    marginBottom: SPACING.xl,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 108, 10, 0.1)',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 108, 10, 0.05)',
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.black,
    color: COLORS.primary,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 32,
    fontWeight: TYPOGRAPHY.black,
    color: COLORS.onSurface,
    marginBottom: 4,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.onSurfaceVariant,
    marginBottom: SPACING.xxl,
    opacity: 0.7,
    lineHeight: 20,
  },
  fieldGroup: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...COMPONENTS.label,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  forgotLink: {
    fontSize: 10,
    fontWeight: TYPOGRAPHY.black,
    color: COLORS.secondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  inputIcon: {
    marginRight: SPACING.xs,
    opacity: 0.5,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 14,
    color: COLORS.onSurface,
    fontWeight: '600',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeBtn: {
    padding: SPACING.sm,
    position: 'absolute',
    right: 8,
  },
  primaryButton: {
    ...COMPONENTS.primaryButton,
    paddingVertical: 20,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    ...COMPONENTS.primaryButtonText,
  },
  otpRow: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  otpLink: {
    color: COLORS.secondary,
    fontSize: 11,
    fontWeight: TYPOGRAPHY.black,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: SPACING.xl,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerText: {
    color: COLORS.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '700',
  },
  registerLink: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '900',
  },
});
