import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getSettings, updateSettings } from './storage';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Request notification permissions
export const requestNotificationPermissions = async () => {
  if (!Device.isDevice) {
    console.log('Notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission not granted for notifications');
    return false;
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily-reminder', {
      name: 'Daily Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#007AFF',
    });
  }

  return true;
};

// Schedule daily reminder
export const scheduleDailyReminder = async (hour = 9, minute = 0) => {
  try {
    // Cancel existing reminders first
    await cancelAllReminders();

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    // Schedule the notification
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: '📚 Time to Study!',
        body: "Don't break your streak! Take a quick test today.",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { screen: 'Home' },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    // Update settings
    await updateSettings({
      reminderEnabled: true,
      reminderTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
      notificationId: identifier,
    });

    console.log('Daily reminder scheduled:', identifier);
    return true;
  } catch (error) {
    console.error('Error scheduling reminder:', error);
    return false;
  }
};

// Cancel all scheduled reminders
export const cancelAllReminders = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    await updateSettings({ reminderEnabled: false, notificationId: null });
    return true;
  } catch (error) {
    console.error('Error canceling reminders:', error);
    return false;
  }
};

// Get all scheduled notifications
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

// Send immediate notification (for testing)
export const sendTestNotification = async () => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Notifications Working!',
        body: 'You will receive daily reminders to study.',
        sound: true,
      },
      trigger: null, // Immediate
    });

    return true;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
};

// Motivational messages for notifications
export const motivationalMessages = [
  { title: '📚 Time to Study!', body: "Don't break your streak! Take a quick test today." },
  { title: '🔥 Keep the Fire Burning!', body: 'Your daily practice awaits. Stay consistent!' },
  { title: '🎯 Focus on Your Goal!', body: 'UPSC success comes one question at a time.' },
  { title: '💪 You Got This!', body: 'A few minutes of practice makes a big difference.' },
  { title: '📖 Knowledge Awaits!', body: 'Start your day with a quick revision.' },
  { title: '🏆 Champions Practice Daily!', body: 'Keep your preparation on track.' },
];

// Get random motivational message
export const getRandomMotivation = () => {
  const index = Math.floor(Math.random() * motivationalMessages.length);
  return motivationalMessages[index];
};

