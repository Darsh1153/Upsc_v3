import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { SmartTextInput } from '../components/SmartTextInput';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const { signInWithEmail, signUpWithEmail, signInAsGuest } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const showError = (message) => {
    setError(message);
    setTimeout(() => setError(''), 3000);
  };

  const handleEmailLogin = async () => {
    if (!email.trim()) {
      showError('Please enter your email');
      return;
    }

    if (!password.trim()) {
      showError('Please enter your password');
      return;
    }

    if (isSignUp && !name.trim()) {
      showError('Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      setLoadingType('email');
      setError('');

      console.log('Attempting', isSignUp ? 'sign up' : 'sign in', 'with email:', email);

      if (isSignUp) {
        await signUpWithEmail(
          email.trim().toLowerCase(),
          password,
          name.trim()
        );
      } else {
        await signInWithEmail(
          email.trim().toLowerCase(),
          password
        );
      }

      console.log('Authentication successful');
    } catch (err) {
      console.error('Login error:', err);

      let errorMessage = 'Failed to sign in. Please check your credentials.';

      if (typeof err === 'string') {
        errorMessage = err;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.error?.message) {
        errorMessage = err.error.message;
      } else if (err?.error_description) {
        errorMessage = err.error_description;
      }

      showError(errorMessage);
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <LinearGradient
      colors={['#4c669f', '#3b5998', '#192f6a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.glassContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* Logo Section */}
              <View style={styles.headerSection}>
                <View style={styles.iconCircle}>
                  <Text style={styles.logoEmoji}>📖</Text>
                </View>
                <Text style={styles.appTitle}>UPSC Prep</Text>
                <Text style={styles.appSubtitle}>Your Success Starts Here</Text>
              </View>

              {/* Title */}
              <Text style={styles.formTitle}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Text>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Feather name="alert-circle" size={18} color="#FF5252" style={{ marginRight: 8 }} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Form Config */}
              <View style={styles.formContainer}>
                {isSignUp && (
                  <View style={styles.inputWrapper}>
                    <Feather name="user" size={20} color="#666" style={styles.inputIcon} />
                    <SmartTextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#999"
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                      editable={!isLoading}
                    />
                  </View>
                )}

                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={20} color="#666" style={styles.inputIcon} />
                  <SmartTextInput
                    style={styles.input}
                    placeholder="Email Address"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={20} color="#666" style={styles.inputIcon} />
                  <SmartTextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.buttonDisabled]}
                  onPress={handleEmailLogin}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#4c669f', '#3b5998']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {loadingType === 'email' ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.submitButtonText}>
                        {isSignUp ? 'Sign Up' : 'Sign In'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Switch Mode */}
                <TouchableOpacity
                  onPress={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                  }}
                  style={styles.switchModeButton}
                >
                  <Text style={styles.switchModeText}>
                    {isSignUp
                      ? 'Already have an account? Sign In'
                      : "Don't have an account? Sign Up"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Terms */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  By continuing, you agree to our{' '}
                  <Text style={styles.linkText}>Terms</Text> and{' '}
                  <Text style={styles.linkText}>Privacy</Text>
                </Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  glassContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 30,
    paddingVertical: 40,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 20,
    },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 10,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoEmoji: {
    fontSize: 32,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1a2b4b',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#6e7a93',
    fontWeight: '500',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a2b4b',
    textAlign: 'center',
    marginBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF5252',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  formContainer: {
    gap: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E4E8',
    height: 56,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1a2b4b',
  },
  submitButton: {
    marginTop: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3b5998',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  switchModeButton: {
    marginTop: 16,
    alignItems: 'center',
    padding: 8,
  },
  switchModeText: {
    color: '#3b5998',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  linkText: {
    color: '#3b5998',
    fontWeight: '600',
  },
});
