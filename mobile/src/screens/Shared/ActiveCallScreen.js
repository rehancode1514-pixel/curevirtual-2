import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, PermissionsAndroid, Platform, Alert } from 'react-native';
import {
  ZegoUIKitPrebuiltCall,
  ONE_ON_ONE_VIDEO_CALL_CONFIG,
  GROUP_VIDEO_CALL_CONFIG,
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { COLORS, TYPOGRAPHY, SPACING } from '../../../theme/designSystem';

const ZEGO_APP_ID = 1190896146;
const ZEGO_APP_SIGN = '80882939e5db0aae9d1b6b52e072da93';

// ZEGO requires alphanumeric IDs only — strip hyphens/special chars
const sanitizeId = (id) => String(id).replace(/[^a-zA-Z0-9_]/g, '_');

export default function ActiveCallScreen({ route, navigation }) {
  const {
    userID,
    userName,
    callID,
    isGroup = false,
  } = route.params || {};

  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  const safeUserID = sanitizeId(userID || `user_${Date.now()}`);
  const safeCallID = sanitizeId(callID || `call_${Date.now()}`);

  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  const checkPermissions = React.useCallback(async () => {
    if (Platform.OS !== 'android') {
      setHasPermission(true);
      setLoading(false);
      return;
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);

      const isGranted =
        granted[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;

      if (isGranted) {
        setHasPermission(true);
      } else {
        Alert.alert(
          'Permissions Denied',
          'Camera and microphone access are required for video calls. Please enable them in Settings.',
          [{ text: 'Go Back', onPress: () => navigation.goBack() }]
        );
      }
    } catch (err) {
      console.warn('Permission request error:', err);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  const onCallEnd = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.brandGreen} />
        <Text style={styles.loadingText}>Initializing secure connection...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={ZEGO_APP_ID}
        appSign={ZEGO_APP_SIGN}
        userID={safeUserID}
        userName={userName || 'User'}
        callID={safeCallID}
        config={{
          ...(isGroup ? GROUP_VIDEO_CALL_CONFIG : ONE_ON_ONE_VIDEO_CALL_CONFIG),
          onHangUp: onCallEnd,
          onOnlySelfInRoom: onCallEnd,
          notifyWhenAppRunningInBackgroundOrQuit: false,
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true,
          useSpeakerWhenJoining: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    color: '#fff',
    fontSize: TYPOGRAPHY.base,
    fontWeight: '600',
  },
});
