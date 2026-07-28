import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DEFAULT_API_BASE_URL } from '../config';

const API_BASE_URL_KEY = 'apiBaseUrl';
const AUTH_TOKEN_KEY = 'authToken';
const SHOP_NAME_KEY = 'shopName';

// expo-secure-store has no web implementation (it wraps Keychain/Keystore).
// The app targets Android, but this fallback lets the same code run in a
// browser for quick local preview during development.
const store = Platform.OS === 'web'
  ? {
      getItemAsync: async (key: string) => window.localStorage.getItem(key),
      setItemAsync: async (key: string, value: string) => {
        window.localStorage.setItem(key, value);
      },
      deleteItemAsync: async (key: string) => {
        window.localStorage.removeItem(key);
      },
    }
  : SecureStore;

export async function getApiBaseUrl(): Promise<string> {
  return (await store.getItemAsync(API_BASE_URL_KEY)) ?? DEFAULT_API_BASE_URL;
}

export async function setApiBaseUrl(value: string): Promise<void> {
  await store.setItemAsync(API_BASE_URL_KEY, value);
}

export async function getAuthToken(): Promise<string | null> {
  return store.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setAuthToken(value: string): Promise<void> {
  await store.setItemAsync(AUTH_TOKEN_KEY, value);
}

export async function getShopName(): Promise<string | null> {
  return store.getItemAsync(SHOP_NAME_KEY);
}

export async function setShopName(value: string): Promise<void> {
  await store.setItemAsync(SHOP_NAME_KEY, value);
}

export async function isLoggedIn(): Promise<boolean> {
  return Boolean(await getAuthToken());
}

export async function logOut(): Promise<void> {
  await store.deleteItemAsync(AUTH_TOKEN_KEY);
  await store.deleteItemAsync(SHOP_NAME_KEY);
}
