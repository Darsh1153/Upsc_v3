import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  getUserPreferences, 
  saveUserPreferences,
  resetRoadmap,
  exportProgress,
} from '../utils/roadmapStorage';
import { AVAILABLE_OPTIONALS } from '../data/roadmapData';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';

export default function UserPreferencesScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const [preferences, setPreferences] = useState({});
  const [loading, setLoading] = useState(true);
  const [showOptionalPicker, setShowOptionalPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeSection, setActiveSection] = useState('attempt'); // attempt, customization, goals, privacy

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    const prefs = await getUserPreferences();
    setPreferences(prefs);
    setLoading(false);
  };

  const updatePreference = async (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    await saveUserPreferences({ [key]: value });
  };

  const handleExportData = async () => {
    try {
      const data = await exportProgress();
      if (data) {
        const fileUri = FileSystem.documentDirectory + 'upsc_progress_backup.json';
        await FileSystem.writeAsStringAsync(fileUri, data);
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Export Your Progress',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export data. Please try again.');
    }
  };

  const handleResetRoadmap = () => {
    Alert.alert(
      '⚠️ Reset Roadmap',
      'This will delete all your topic progress, study sessions, and achievements. Your preferences will be kept. This cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const success = await resetRoadmap();
            if (success) {
              Alert.alert('✅ Done', 'Roadmap has been reset.');
            }
          },
        },
      ]
    );
  };

  const timeSlots = [
    { id: 'morning', label: '🌅 Morning (5-9 AM)', icon: '🌅' },
    { id: 'forenoon', label: '☀️ Forenoon (9 AM-12 PM)', icon: '☀️' },
    { id: 'afternoon', label: '🌤️ Afternoon (12-5 PM)', icon: '🌤️' },
    { id: 'evening', label: '🌆 Evening (5-9 PM)', icon: '🌆' },
    { id: 'night', label: '🌙 Night (9 PM+)', icon: '🌙' },
  ];

  const studyStyles = [
    { id: 'reading', label: '📖 Reading-focused', desc: 'Books & notes' },
    { id: 'videos', label: '📺 Video-focused', desc: 'Online lectures' },
    { id: 'notes', label: '📝 Notes-focused', desc: 'Self-made notes' },
    { id: 'balanced', label: '⚖️ Balanced', desc: 'Mix of all' },
  ];

  const interestAreas = [
    'Polity', 'Economy', 'History', 'Geography', 'Environment',
    'Science & Tech', 'International Relations', 'Ethics', 'Current Affairs',
  ];

  const reminderTimes = [
    '05:00', '06:00', '07:00', '08:00', '09:00', '10:00',
    '18:00', '19:00', '20:00', '21:00', '22:00',
  ];

  const formatTime = (time) => {
    const [hour, minute] = time.split(':');
    const h = parseInt(hour);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
  };

  const toggleTimeSlot = (slotId) => {
    const current = preferences.preferredTimeSlots || [];
    const updated = current.includes(slotId)
      ? current.filter(id => id !== slotId)
      : [...current, slotId];
    updatePreference('preferredTimeSlots', updated);
  };

  const toggleInterest = (area) => {
    const current = preferences.interestAreas || [];
    const updated = current.includes(area)
      ? current.filter(a => a !== area)
      : [...current, area];
    updatePreference('interestAreas', updated);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const sections = [
    { id: 'attempt', label: '🎯 Attempt Details', icon: '🎯' },
    { id: 'customization', label: '⚙️ Customization', icon: '⚙️' },
    { id: 'goals', label: '📊 Performance Goals', icon: '📊' },
    { id: 'privacy', label: '🔐 Data & Privacy', icon: '🔐' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backText, { color: theme.colors.primary }]}>← Back</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text }]}>Preferences</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Customize your study experience</Text>
        </View>

        {/* Section Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {sections.map((section) => (
            <TouchableOpacity
              key={section.id}
              style={[styles.sectionTab, { backgroundColor: theme.colors.surface }, activeSection === section.id && styles.sectionTabActive]}
              onPress={() => setActiveSection(section.id)}
            >
              <Text style={[styles.sectionTabText, { color: theme.colors.text }, activeSection === section.id && styles.sectionTabTextActive]}>
                {section.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Attempt Details Section */}
        {activeSection === 'attempt' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🎯 Attempt Details</Text>
            
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Previous Attempts</Text>
                  <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>How many times have you appeared?</Text>
                </View>
                <View style={styles.counterContainer}>
                  <TouchableOpacity 
                    style={[styles.counterButton, { backgroundColor: theme.colors.background }]}
                    onPress={() => updatePreference('previousAttempts', Math.max(0, (preferences.previousAttempts || 0) - 1))}
                  >
                    <Text style={[styles.counterButtonText, { color: theme.colors.primary }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.counterValue, { color: theme.colors.text }]}>{preferences.previousAttempts || 0}</Text>
                  <TouchableOpacity 
                    style={[styles.counterButton, { backgroundColor: theme.colors.background }]}
                    onPress={() => updatePreference('previousAttempts', (preferences.previousAttempts || 0) + 1)}
                  >
                    <Text style={[styles.counterButtonText, { color: theme.colors.primary }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>Target Year</Text>
                  <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>When are you planning to appear?</Text>
                </View>
                <View style={styles.yearPicker}>
                  {[2025, 2026, 2027, 2028].map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[styles.yearChip, { backgroundColor: theme.colors.background }, preferences.targetYear === year && styles.yearChipActive]}
                      onPress={() => updatePreference('targetYear', year)}
                    >
                      <Text style={[styles.yearChipText, { color: theme.colors.text }, preferences.targetYear === year && styles.yearChipTextActive]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Target Exam</Text>
                </View>
              </View>
              <View style={styles.optionsRow}>
                {['CSE', 'IFoS', 'Both'].map((exam) => (
                  <TouchableOpacity
                    key={exam}
                    style={[styles.optionChip, preferences.targetExam === exam && styles.optionChipActive]}
                    onPress={() => updatePreference('targetExam', exam)}
                  >
                    <Text style={[styles.optionChipText, preferences.targetExam === exam && styles.optionChipTextActive]}>
                      {exam}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Working Professional?</Text>
                  <Text style={styles.settingHint}>We'll adjust your study plan accordingly</Text>
                </View>
                <Switch
                  value={preferences.isWorkingProfessional}
                  onValueChange={(value) => updatePreference('isWorkingProfessional', value)}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Daily Study Hours</Text>
                  <Text style={styles.settingHint}>How many hours can you dedicate?</Text>
                </View>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderValue}>{preferences.availableHoursDaily || 6}h</Text>
                </View>
              </View>
              <View style={styles.hoursSlider}>
                {[2, 4, 6, 8, 10, 12].map((hours) => (
                  <TouchableOpacity
                    key={hours}
                    style={[styles.hourChip, preferences.availableHoursDaily === hours && styles.hourChipActive]}
                    onPress={() => updatePreference('availableHoursDaily', hours)}
                  >
                    <Text style={[styles.hourChipText, preferences.availableHoursDaily === hours && styles.hourChipTextActive]}>
                      {hours}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.divider} />
              
              <Text style={[styles.settingLabel, { marginBottom: 12 }]}>Preferred Time Slots</Text>
              <View style={styles.timeSlotsGrid}>
                {timeSlots.map((slot) => (
                  <TouchableOpacity
                    key={slot.id}
                    style={[
                      styles.timeSlotChip,
                      preferences.preferredTimeSlots?.includes(slot.id) && styles.timeSlotChipActive
                    ]}
                    onPress={() => toggleTimeSlot(slot.id)}
                  >
                    <Text style={styles.timeSlotIcon}>{slot.icon}</Text>
                    <Text style={[
                      styles.timeSlotText,
                      preferences.preferredTimeSlots?.includes(slot.id) && styles.timeSlotTextActive
                    ]}>
                      {slot.id.charAt(0).toUpperCase() + slot.id.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Customization Section */}
        {activeSection === 'customization' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>⚙️ Customization</Text>
            
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity style={styles.settingRow} onPress={() => setShowOptionalPicker(true)}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>Optional Subject</Text>
                  <Text style={styles.settingHint}>
                    {preferences.optionalSubject || 'Tap to select'}
                  </Text>
                </View>
                <Text style={styles.settingArrow}>→</Text>
              </TouchableOpacity>
              
              <View style={styles.divider} />
              
              <Text style={[styles.settingLabel, { marginBottom: 12, marginTop: 8 }]}>Interest Areas</Text>
              <Text style={styles.settingHint}>Select subjects you want to focus on</Text>
              <View style={styles.interestGrid}>
                {interestAreas.map((area) => (
                  <TouchableOpacity
                    key={area}
                    style={[
                      styles.interestChip,
                      preferences.interestAreas?.includes(area) && styles.interestChipActive
                    ]}
                    onPress={() => toggleInterest(area)}
                  >
                    <Text style={[
                      styles.interestChipText,
                      preferences.interestAreas?.includes(area) && styles.interestChipTextActive
                    ]}>
                      {area}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.divider} />
              
              <Text style={[styles.settingLabel, { marginBottom: 12, marginTop: 8 }]}>Study Style</Text>
              <View style={styles.studyStyleGrid}>
                {studyStyles.map((style) => (
                  <TouchableOpacity
                    key={style.id}
                    style={[
                      styles.studyStyleCard,
                      preferences.studyStyle === style.id && styles.studyStyleCardActive
                    ]}
                    onPress={() => updatePreference('studyStyle', style.id)}
                  >
                    <Text style={styles.studyStyleLabel}>{style.label}</Text>
                    <Text style={styles.studyStyleDesc}>{style.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>🔔 Daily Reminders</Text>
                </View>
                <Switch
                  value={preferences.dailyReminderEnabled}
                  onValueChange={(value) => updatePreference('dailyReminderEnabled', value)}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              {preferences.dailyReminderEnabled && (
                <>
                  <View style={styles.divider} />
                  <TouchableOpacity style={styles.settingRow} onPress={() => setShowTimePicker(true)}>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingLabel}>Reminder Time</Text>
                    </View>
                    <Text style={styles.timeValue}>
                      {formatTime(preferences.dailyReminderTime || '07:00')}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              
              <View style={styles.divider} />
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>🔄 Revision Reminders</Text>
                </View>
                <Switch
                  value={preferences.revisionRemindersEnabled}
                  onValueChange={(value) => updatePreference('revisionRemindersEnabled', value)}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>📰 Current Affairs Reminder</Text>
                </View>
                <Switch
                  value={preferences.currentAffairsReminderEnabled}
                  onValueChange={(value) => updatePreference('currentAffairsReminderEnabled', value)}
                  trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </View>
        )}

        {/* Performance Goals Section */}
        {activeSection === 'goals' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>📊 Performance Goals</Text>
            
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.goalRow}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalLabel}>Daily Target Hours</Text>
                  <Text style={styles.goalValue}>{preferences.dailyTargetHours || 6}h</Text>
                </View>
                <View style={styles.goalSlider}>
                  {[4, 6, 8, 10].map((hours) => (
                    <TouchableOpacity
                      key={hours}
                      style={[styles.goalChip, preferences.dailyTargetHours === hours && styles.goalChipActive]}
                      onPress={() => updatePreference('dailyTargetHours', hours)}
                    >
                      <Text style={[styles.goalChipText, preferences.dailyTargetHours === hours && styles.goalChipTextActive]}>
                        {hours}h
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.goalRow}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalLabel}>Weekly Completion %</Text>
                  <Text style={styles.goalValue}>{preferences.weeklyCompletionTarget || 80}%</Text>
                </View>
                <View style={styles.goalSlider}>
                  {[60, 70, 80, 90, 100].map((pct) => (
                    <TouchableOpacity
                      key={pct}
                      style={[styles.goalChip, preferences.weeklyCompletionTarget === pct && styles.goalChipActive]}
                      onPress={() => updatePreference('weeklyCompletionTarget', pct)}
                    >
                      <Text style={[styles.goalChipText, preferences.weeklyCompletionTarget === pct && styles.goalChipTextActive]}>
                        {pct}%
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.goalRow}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalLabel}>Mock Tests Per Week</Text>
                  <Text style={styles.goalValue}>{preferences.mockTestsPerWeek || 2}</Text>
                </View>
                <View style={styles.goalSlider}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.goalChip, preferences.mockTestsPerWeek === num && styles.goalChipActive]}
                      onPress={() => updatePreference('mockTestsPerWeek', num)}
                    >
                      <Text style={[styles.goalChipText, preferences.mockTestsPerWeek === num && styles.goalChipTextActive]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.goalRow}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalLabel}>Monthly Revision Target</Text>
                  <Text style={styles.goalValue}>{preferences.monthlyRevisionTarget || 4} topics</Text>
                </View>
                <View style={styles.goalSlider}>
                  {[2, 4, 6, 8].map((num) => (
                    <TouchableOpacity
                      key={num}
                      style={[styles.goalChip, preferences.monthlyRevisionTarget === num && styles.goalChipActive]}
                      onPress={() => updatePreference('monthlyRevisionTarget', num)}
                    >
                      <Text style={[styles.goalChipText, preferences.monthlyRevisionTarget === num && styles.goalChipTextActive]}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Privacy & Data Section */}
        {activeSection === 'privacy' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>🔐 Data & Privacy</Text>
            
            <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: theme.colors.text }]}>☁️ Cloud Sync</Text>
                  <Text style={[styles.settingHint, { color: theme.colors.textSecondary }]}>Sync progress across devices</Text>
                </View>
                <Switch
                  value={preferences.cloudSyncEnabled}
                  onValueChange={(value) => updatePreference('cloudSyncEnabled', value)}
                  trackColor={{ false: theme.colors.border, true: '#34C759' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
            
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: theme.colors.surface }]} onPress={handleExportData}>
              <Text style={styles.actionIcon}>📤</Text>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionLabel, { color: theme.colors.text }]}>Export Progress</Text>
                <Text style={[styles.actionHint, { color: theme.colors.textSecondary }]}>Download your data as JSON</Text>
              </View>
              <Text style={[styles.actionArrow, { color: theme.colors.border }]}>→</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionCard, styles.dangerCard, { backgroundColor: isDark ? '#3A1A1A' : '#FFF5F5' }]} onPress={handleResetRoadmap}>
              <Text style={styles.actionIcon}>🗑️</Text>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionLabel, styles.dangerText]}>Reset Roadmap</Text>
                <Text style={[styles.actionHint, { color: theme.colors.textSecondary }]}>Clear all progress and start fresh</Text>
              </View>
              <Text style={[styles.actionArrow, { color: theme.colors.border }]}>→</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Optional Subject Picker Modal */}
      <Modal visible={showOptionalPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Optional Subject</Text>
            <ScrollView style={styles.optionalsList}>
              {AVAILABLE_OPTIONALS.map((optional) => (
                <TouchableOpacity
                  key={optional}
                  style={[
                    styles.optionalItem,
                    { backgroundColor: theme.colors.background },
                    preferences.optionalSubject === optional && [styles.optionalItemActive, { backgroundColor: isDark ? '#1A3A5C' : '#E5F3FF', borderColor: theme.colors.primary }]
                  ]}
                  onPress={() => {
                    updatePreference('optionalSubject', optional);
                    setShowOptionalPicker(false);
                  }}
                >
                  <Text style={[
                    styles.optionalItemText,
                    { color: theme.colors.text },
                    preferences.optionalSubject === optional && { color: theme.colors.primary, fontWeight: '600' }
                  ]}>
                    {optional}
                  </Text>
                  {preferences.optionalSubject === optional && (
                    <Text style={[styles.optionalCheck, { color: theme.colors.primary }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalCloseButton, { backgroundColor: theme.colors.background }]}
              onPress={() => setShowOptionalPicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Time Picker Modal */}
      <Modal visible={showTimePicker} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Select Reminder Time</Text>
            <View style={styles.timeGrid}>
              {reminderTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    { backgroundColor: theme.colors.background },
                    preferences.dailyReminderTime === time && styles.timeOptionActive
                  ]}
                  onPress={() => {
                    updatePreference('dailyReminderTime', time);
                    setShowTimePicker(false);
                  }}
                >
                  <Text style={[
                    styles.timeOptionText,
                    { color: theme.colors.text },
                    preferences.dailyReminderTime === time && styles.timeOptionTextActive
                  ]}>
                    {formatTime(time)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity 
              style={[styles.modalCloseButton, { backgroundColor: theme.colors.background }]}
              onPress={() => setShowTimePicker(false)}
            >
              <Text style={[styles.modalCloseText, { color: theme.colors.primary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16,
  },
  backButton: {
    marginBottom: 12,
  },
  backText: {
    fontSize: 17,
    color: '#007AFF',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginTop: 4,
  },
  tabsContainer: {
    marginBottom: 20,
  },
  tabsContent: {
    gap: 8,
  },
  sectionTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFF',
    marginRight: 8,
  },
  sectionTabActive: {
    backgroundColor: '#007AFF',
  },
  sectionTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  sectionTabTextActive: {
    color: '#FFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  settingHint: {
    fontSize: 13,
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
    marginVertical: 12,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  counterValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    minWidth: 30,
    textAlign: 'center',
  },
  yearPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  yearChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  yearChipActive: {
    backgroundColor: '#007AFF',
  },
  yearChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  yearChipTextActive: {
    color: '#FFF',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  optionChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  optionChipActive: {
    backgroundColor: '#007AFF',
  },
  optionChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  optionChipTextActive: {
    color: '#FFF',
  },
  sliderContainer: {
    alignItems: 'flex-end',
  },
  sliderValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  hoursSlider: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  hourChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  hourChipActive: {
    backgroundColor: '#007AFF',
  },
  hourChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  hourChipTextActive: {
    color: '#FFF',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  timeSlotChipActive: {
    backgroundColor: '#E5F3FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  timeSlotIcon: {
    fontSize: 14,
  },
  timeSlotText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  timeSlotTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  interestChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  interestChipActive: {
    backgroundColor: '#34C759',
  },
  interestChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  interestChipTextActive: {
    color: '#FFF',
  },
  studyStyleGrid: {
    gap: 8,
  },
  studyStyleCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
  },
  studyStyleCardActive: {
    backgroundColor: '#E5F3FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  studyStyleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  studyStyleDesc: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  goalRow: {
    marginBottom: 16,
  },
  goalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
  },
  goalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  goalSlider: {
    flexDirection: 'row',
    gap: 8,
  },
  goalChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  goalChipActive: {
    backgroundColor: '#007AFF',
  },
  goalChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  goalChipTextActive: {
    color: '#FFF',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  dangerCard: {
    backgroundColor: '#FFF5F5',
  },
  actionIcon: {
    fontSize: 24,
    marginRight: 14,
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  dangerText: {
    color: '#FF3B30',
  },
  actionHint: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  actionArrow: {
    fontSize: 18,
    color: '#C7C7CC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionalsList: {
    maxHeight: 400,
  },
  optionalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    marginBottom: 8,
  },
  optionalItemActive: {
    backgroundColor: '#E5F3FF',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  optionalItemText: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  optionalItemTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  optionalCheck: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeOption: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  timeOptionActive: {
    backgroundColor: '#007AFF',
  },
  timeOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  timeOptionTextActive: {
    color: '#FFF',
  },
});

