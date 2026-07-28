import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { login, googleLogin, ApiError } from '../api/client';
import { setAuthToken, setShopName } from '../storage/settings';
import { useGoogleAuth, isGoogleAuthConfigured } from '../hooks/useGoogleAuth';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const finishLogin = async (token: string, shopName: string) => {
    await setAuthToken(token);
    await setShopName(shopName);
    navigation.reset({ index: 0, routes: [{ name: 'ReceiptList' }] });
  };

  const handleGoogleToken = useCallback(async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const result = await googleLogin({ idToken });
      await finishLogin(result.token, result.shopName);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Could not sign in with Google.');
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  const { canPromptGoogle, promptAsync } = useGoogleAuth(handleGoogleToken);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email: email.trim(), password });
      await finishLogin(result.token, result.shopName);
    } catch (err) {
      Alert.alert('Could not log in', err instanceof ApiError ? err.message : 'Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = () => {
    if (!isGoogleAuthConfigured) {
      Alert.alert('Not set up yet', 'Google Sign-In hasn’t been configured for this app yet. Use email and password instead.');
      return;
    }
    promptAsync();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tailor Shop</Text>
      <Text style={styles.subtitle}>Log in to your shop's account</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={handleGooglePress} disabled={googleLoading}>
        {googleLoading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('SignUp')}>
        <Text style={styles.linkText}>New shop? <Text style={styles.linkTextBold}>Create an account</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    color: colors.textMuted,
    fontSize: 12,
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  linkTextBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});
