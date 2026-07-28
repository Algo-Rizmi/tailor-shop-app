import { getApiBaseUrl, getAuthToken, logOut } from '../storage/settings';
import type {
  AuthResponse,
  CreateReceiptRequest,
  GoogleLoginRequest,
  LoginRequest,
  NextPreviewResponse,
  PagedResult,
  Receipt,
  ReceiptStatus,
  RegisterRequest,
  StartVolumeRequest,
  UpdateReceiptRequest,
  Volume,
} from '../types/receipt';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// Set by App.tsx so a 401 (expired/invalid token) can bounce the user back
// to the Login screen from anywhere the API client is used.
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, options: RequestInit = {}, requiresAuth = true): Promise<T> {
  const baseUrl = await getApiBaseUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, { ...options, headers });

  if (response.status === 401 && requiresAuth) {
    await logOut();
    unauthorizedHandler?.();
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore body parse failures, use default message
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export async function testConnection(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

export function register(body: RegisterRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }, false);
}

export function login(body: LoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }, false);
}

export function googleLogin(body: GoogleLoginRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/google', { method: 'POST', body: JSON.stringify(body) }, false);
}

export function getNextPreview(): Promise<NextPreviewResponse> {
  return request<NextPreviewResponse>('/api/receipts/next-preview');
}

export function createReceipt(body: CreateReceiptRequest): Promise<Receipt> {
  return request<Receipt>('/api/receipts', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function listReceipts(params: {
  status?: ReceiptStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<PagedResult<Receipt>> {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.search) query.set('search', params.search);
  if (params.page) query.set('page', String(params.page));
  if (params.pageSize) query.set('pageSize', String(params.pageSize));

  const qs = query.toString();
  return request<PagedResult<Receipt>>(`/api/receipts${qs ? `?${qs}` : ''}`);
}

export function getReceipt(id: number): Promise<Receipt> {
  return request<Receipt>(`/api/receipts/${id}`);
}

export function updateReceipt(id: number, body: UpdateReceiptRequest): Promise<Receipt> {
  return request<Receipt>(`/api/receipts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function getCurrentVolume(): Promise<Volume | null> {
  return request<Volume | null>('/api/volumes/current');
}

export function listVolumes(): Promise<Volume[]> {
  return request<Volume[]>('/api/volumes');
}

export function startVolume(body: StartVolumeRequest): Promise<Volume> {
  return request<Volume>('/api/volumes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
