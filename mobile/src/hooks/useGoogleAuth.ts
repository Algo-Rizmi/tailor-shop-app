import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from '../config';

WebBrowser.maybeCompleteAuthSession();

export const isGoogleAuthConfigured = Boolean(GOOGLE_WEB_CLIENT_ID);

// expo-auth-session throws synchronously (during render) if its clientId is
// falsy, so a placeholder is required here even before real Google Cloud
// credentials exist — actually prompting is separately gated behind
// isGoogleAuthConfigured in the screens, so this placeholder is never used.
const PLACEHOLDER_CLIENT_ID = 'not-configured-yet.apps.googleusercontent.com';

// Google's Android OAuth clients expect redirects on a "reversed client ID"
// custom scheme (e.g. com.googleusercontent.apps.123-abc:/oauthredirect),
// NOT the app's own package name scheme, which is what this library uses by
// default — using the wrong one causes Google to reject the request with
// "Access blocked: ...'s request is invalid" (Error 400: invalid_request).
function reversedClientIdScheme(clientId: string): string {
  const prefix = clientId.replace(/\.apps\.googleusercontent\.com$/, '');
  return `com.googleusercontent.apps.${prefix}`;
}

// Wraps expo-auth-session's Google provider: drives the "Continue with
// Google" browser flow and hands back an ID token, which the caller posts to
// POST /api/auth/google for the backend to verify and turn into our own JWT.
export function useGoogleAuth(onIdToken: (idToken: string) => void) {
  const androidClientId = GOOGLE_ANDROID_CLIENT_ID || PLACEHOLDER_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      webClientId: GOOGLE_WEB_CLIENT_ID || PLACEHOLDER_CLIENT_ID,
      androidClientId,
      scopes: ['openid', 'email', 'profile'],
    },
    {
      native: `${reversedClientIdScheme(androidClientId)}:/oauthredirect`,
    },
  );

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      onIdToken(response.authentication.idToken);
    }
  }, [response, onIdToken]);

  return { canPromptGoogle: Boolean(request) && isGoogleAuthConfigured, promptAsync };
}
