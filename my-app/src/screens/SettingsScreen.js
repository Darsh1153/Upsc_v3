import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getSettings, updateSettings, clearAllData } from '../utils/storage';
import {
  scheduleDailyReminder,
  cancelAllReminders,
  sendTestNotification,
  requestNotificationPermissions,
} from '../utils/notifications';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';

export default function SettingsScreen({ navigation }) {
  const { user, signOut, deleteAccount } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const [settings, setSettings] = useState({
    reminderEnabled: false,
    reminderTime: '09:00',
    language: 'English',
  });
  const [loading, setLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await getSettings();
    setSettings(data);
    setLoading(false);
  };

  const handleReminderToggle = async (value) => {
    if (value) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily reminders.',
          [{ text: 'OK' }]
        );
        return;
      }

      const [hour, minute] = settings.reminderTime.split(':').map(Number);
      const success = await scheduleDailyReminder(hour, minute);
      
      if (success) {
        setSettings({ ...settings, reminderEnabled: true });
        Alert.alert(
          'Reminder Set! 🔔',
          `You'll receive a daily reminder at ${settings.reminderTime}`,
          [{ text: 'Great!' }]
        );
      }
    } else {
      await cancelAllReminders();
      setSettings({ ...settings, reminderEnabled: false });
    }
  };

  const handleTimeChange = async (time) => {
    setSettings({ ...settings, reminderTime: time });
    await updateSettings({ reminderTime: time });

    if (settings.reminderEnabled) {
      const [hour, minute] = time.split(':').map(Number);
      await scheduleDailyReminder(hour, minute);
    }
  };

  const handleTestNotification = async () => {
    const success = await sendTestNotification();
    if (!success) {
      Alert.alert(
        'Error',
        'Could not send test notification. Please check permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your progress, saved questions, and settings. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllData();
            if (success) {
              Alert.alert('Done', 'All data has been cleared.');
              loadSettings();
            }
          },
        },
      ]
    );
  };

  const handleSignOut = async () => {
    // On web, use window.confirm instead of Alert.alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to sign out?');
      if (confirmed) {
        try {
          setIsSigningOut(true);
          await signOut();
        } catch (error) {
          window.alert('Failed to sign out. Please try again.');
          setIsSigningOut(false);
        }
      }
      return;
    }

    // Native (iOS/Android)
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSigningOut(true);
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    // On web, use window.confirm instead of Alert.alert
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'This will permanently delete your account and all associated data. This action cannot be undone.'
      );
      if (confirmed) {
        const doubleConfirmed = window.confirm(
          'Are you absolutely sure? All your progress, saved questions, and settings will be permanently deleted.'
        );
        if (doubleConfirmed) {
          try {
            setIsDeletingAccount(true);
            await deleteAccount();
          } catch (error) {
            window.alert('Failed to delete account. Please try again.');
            setIsDeletingAccount(false);
          }
        }
      }
      return;
    }

    // Native (iOS/Android)
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Double confirmation for account deletion
            Alert.alert(
              'Are you absolutely sure?',
              'All your progress, saved questions, and settings will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      setIsDeletingAccount(true);
                      await deleteAccount();
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete account. Please try again.');
                      setIsDeletingAccount(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const getProviderIcon = () => {
    switch (user?.provider) {
      case 'google':
        return '🔵';
      case 'apple':
        return '🍎';
      case 'guest':
        return '👤';
      default:
        return '📧';
    }
  };

  const getProviderName = () => {
    switch (user?.provider) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      case 'guest':
        return 'Guest Account';
      default:
        return 'Email';
    }
  };

  const timeOptions = [
    '06:00', '07:00', '08:00', '09:00', '10:00',
    '11:00', '12:00', '18:00', '19:00', '20:00', '21:00',
  ];

  const formatTime = (time) => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Settings</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Customize your experience</Text>
        </View>

        {/* Account Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Account</Text>
        <View style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
          <LinearGradient
            colors={theme.gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.profileAvatar}
          >
            <Text style={styles.profileInitial}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </LinearGradient>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text }]}>{user?.name || 'UPSC Aspirant'}</Text>
            <View style={styles.profileProviderRow}>
              <Text style={styles.profileProviderIcon}>{getProviderIcon()}</Text>
              <Text style={[styles.profileProvider, { color: theme.colors.textSecondary }]}>
                {user?.isGuest ? 'Guest Mode' : `Signed in with ${getProviderName()}`}
              </Text>
            </View>
            {user?.email && !user?.isGuest && (
              <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>{user.email}</Text>
            )}
          </View>
        </View>

        {user?.isGuest && (
          <View style={[styles.guestWarning, { backgroundColor: isDark ? '#4A3F00' : '#FFF3CD', borderColor: isDark ? '#6B5A00' : '#FFE69C' }]}>
            <Text style={styles.guestWarningIcon}>⚠️</Text>
            <View style={styles.guestWarningContent}>
              <Text style={[styles.guestWarningTitle, { color: isDark ? '#FFD700' : '#856404' }]}>Limited Access</Text>
              <Text style={[styles.guestWarningText, { color: isDark ? '#FFD700' : '#856404' }]}>
                Sign in with Google or Apple to sync your progress across devices.
              </Text>
            </View>
          </View>
        )}

        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Appearance</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>{isDark ? '🌙' : '☀️'}</Text>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Dark Mode</Text>
                <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>
                  {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#E5E5EA', true: '#34C759' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Notifications Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Notifications</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Daily Reminder</Text>
                <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>Get notified to practice daily</Text>
              </View>
            </View>
            <Switch
              value={settings.reminderEnabled}
              onValueChange={handleReminderToggle}
              trackColor={{ false: isDark ? '#475569' : '#E5E5EA', true: theme.colors.success }}
              thumbColor="#FFFFFF"
            />
          </View>

          {settings.reminderEnabled && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              <View style={styles.timeSection}>
                <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Reminder Time</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                  {timeOptions.map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeChip,
                        { backgroundColor: theme.colors.surfaceSecondary },
                        settings.reminderTime === time && { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary },
                      ]}
                      onPress={() => handleTimeChange(time)}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          { color: theme.colors.text },
                          settings.reminderTime === time && { color: theme.colors.primary },
                        ]}
                      >
                        {formatTime(time)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </>
          )}
        </View>

        {/* Test Notification */}
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.surface }]} onPress={handleTestNotification}>
          <Text style={styles.actionIcon}>📨</Text>
          <View style={styles.actionInfo}>
            <Text style={[styles.actionTitle, { color: theme.colors.text }]}>Test Notification</Text>
            <Text style={[styles.actionDesc, { color: theme.colors.textSecondary }]}>Send a test notification now</Text>
          </View>
          <Text style={[styles.actionArrow, { color: theme.colors.textTertiary }]}>→</Text>
        </TouchableOpacity>

        {/* Offline Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Offline Mode</Text>
        <View style={[styles.infoCard, { backgroundColor: theme.colors.infoBg }]}>
          <Text style={styles.infoIcon}>📱</Text>
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: theme.colors.info }]}>Works Offline!</Text>
            <Text style={[styles.infoText, { color: theme.colors.text }]}>
              Your saved questions in the Question Bank are available offline. 
              Save questions while online to practice anytime, anywhere.
            </Text>
          </View>
        </View>

        {/* Data Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Data Management</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity style={styles.settingRow} onPress={handleClearData}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🗑️</Text>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.error }]}>Clear All Data</Text>
                <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>Delete all progress and saved data</Text>
              </View>
            </View>
            <Text style={[styles.settingArrow, { color: theme.colors.textTertiary }]}>→</Text>
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>About</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.colors.text }]}>App Version</Text>
            <Text style={[styles.aboutValue, { color: theme.colors.textSecondary }]}>1.0.0</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.aboutRow}>
            <Text style={[styles.aboutLabel, { color: theme.colors.text }]}>Platform</Text>
            <Text style={[styles.aboutValue, { color: theme.colors.textSecondary }]}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
          </View>
        </View>

        {/* Account Actions */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Account Actions</Text>
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleSignOut}
            disabled={isSigningOut}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🚪</Text>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.text }]}>Sign Out</Text>
                <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>Sign out of your account</Text>
              </View>
            </View>
            {isSigningOut ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text style={[styles.settingArrow, { color: theme.colors.textTertiary }]}>→</Text>
            )}
          </TouchableOpacity>
          
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleDeleteAccount}
            disabled={isDeletingAccount}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>⚠️</Text>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: theme.colors.error }]}>Delete Account</Text>
                <Text style={[styles.settingDesc, { color: theme.colors.textSecondary }]}>Permanently delete your account</Text>
              </View>
            </View>
            {isDeletingAccount ? (
              <ActivityIndicator size="small" color={theme.colors.error} />
            ) : (
              <Text style={[styles.settingArrow, { color: theme.colors.textTertiary }]}>→</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Tips */}
        <View style={[styles.tipsCard, { backgroundColor: theme.colors.warningBg }]}>
          <Text style={[styles.tipsTitle, { color: theme.colors.warning }]}>💡 Pro Tips</Text>
          <Text style={[styles.tipItem, { color: theme.colors.text }]}>• Practice daily to maintain your streak</Text>
          <Text style={[styles.tipItem, { color: theme.colors.text }]}>• Save important questions for revision</Text>
          <Text style={[styles.tipItem, { color: theme.colors.text }]}>• Use tags to organize your Question Bank</Text>
          <Text style={[styles.tipItem, { color: theme.colors.text }]}>• Enable reminders to stay consistent</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    color: '#8E8E93',
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
    letterSpacing: -0.4,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  settingDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 18,
    color: '#C7C7CC',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginLeft: 54,
  },
  timeSection: {
    padding: 16,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 12,
  },
  timeScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  timeChip: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeChipActive: {
    backgroundColor: '#E5F3FF',
    borderColor: '#007AFF',
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  timeChipTextActive: {
    color: '#007AFF',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  actionDesc: {
    fontSize: 13,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 18,
    color: '#C7C7CC',
  },
  infoCard: {
    backgroundColor: '#E5F3FF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 28,
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 20,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  aboutLabel: {
    fontSize: 17,
    fontWeight: '400',
    color: '#1C1C1E',
  },
  aboutValue: {
    fontSize: 17,
    fontWeight: '400',
    color: '#8E8E93',
  },
  tipsCard: {
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 16,
    marginTop: 24,
  },
  tipsTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 12,
  },
  tipItem: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 24,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4776E6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileInitial: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  profileProviderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  profileProviderIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  profileProvider: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  profileEmail: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  guestWarning: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  guestWarningIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  guestWarningContent: {
    flex: 1,
  },
  guestWarningTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 2,
  },
  guestWarningText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
});

