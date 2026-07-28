import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { register, googleLogin, ApiError } from '../api/client';
import { setAuthToken, setShopName } from '../storage/settings';
import { useGoogleAuth, isGoogleAuthConfigured } from '../hooks/useGoogleAuth';
import { colors, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export default function SignUpScreen({ navigation }: Props) {
  const [shopName, setShopNameInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const finishSignUp = async (token: string, resolvedShopName: string) => {
    await setAuthToken(token);
    await setShopName(resolvedShopName);
    navigation.reset({ index: 0, routes: [{ name: 'ReceiptList' }] });
  };

  const handleGoogleToken = useCallback(async (idToken: string) => {
    setGoogleLoading(true);
    try {
      const result = await googleLogin({ idToken, shopName: shopName.trim() || null });
      await finishSignUp(result.token, result.shopName);
    } catch (err) {
      Alert.alert('Error', err instanceof ApiError ? err.message : 'Could not sign up with Google.');
    } finally {
      setGoogleLoading(false);
    }
  }, [shopName]);

  const { canPromptGoogle, promptAsync } = useGoogleAuth(handleGoogleToken);

  const handleSignUp = async () => {
    if (!shopName.trim() || !email.trim() || !password) {
      Alert.alert('Missing info', 'Please fill in your shop name, email, and password.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const result = await register({ shopName: shopName.trim(), email: email.trim(), password });
      await finishSignUp(result.token, result.shopName);
    } catch (err) {
      Alert.alert(
        'Could not create account',
        err instanceof ApiError ? err.message : 'Check your connection and try again.',
      );
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
      <Text style={styles.title}>Create Your Shop</Text>
      <Text style={styles.subtitle}>Every shop gets its own private receipts and volumes.</Text>

      <Text style={styles.label}>Shop Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Ali's Tailoring"
        placeholderTextColor={colors.textMuted}
        value={shopName}
        onChangeText={setShopNameInput}
      />

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

      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
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

      <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkTextBold}>Log in</Text></Text>
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
    fontSize: 26,
    fontWeight: '800',
    color: colors.primaryDark,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 13,
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
