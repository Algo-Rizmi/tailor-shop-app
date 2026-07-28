export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';
export type ReceiptStatus = 'Pending' | 'InProgress' | 'Ready' | 'PickedUp';

export interface ReceiptItem {
  id?: number;
  clothingType: string;
  color: string | null;
  quantity: number;
}

export interface Volume {
  id: number;
  label: string;
  startingNumber: number;
  nextNumber: number;
  isActive: boolean;
  createdAt: string;
  closedAt: string | null;
}

export interface Receipt {
  id: number;
  volumeId: number;
  volume: Volume | null;
  receiptNumber: number;
  customerName: string;
  customerPhone: string | null;
  items: ReceiptItem[];
  instructions: string | null;
  price: number | null;
  paymentStatus: PaymentStatus;
  dueDate: string | null; // ISO date (yyyy-MM-dd)
  status: ReceiptStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReceiptRequest {
  customerName?: string | null;
  customerPhone?: string | null;
  items: ReceiptItem[];
  instructions?: string | null;
  price?: number | null;
  paymentStatus: PaymentStatus;
  dueDate?: string | null;
}

export interface UpdateReceiptRequest extends CreateReceiptRequest {
  status: ReceiptStatus;
}

export interface NextPreviewResponse {
  nextReceiptNumber: number | null;
}

export interface StartVolumeRequest {
  startingNumber: number;
  label?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  shopName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
  shopName?: string | null;
}

export interface AuthResponse {
  token: string;
  email: string;
  shopName: string;
}

export function totalItemCount(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  Unpaid: 'Unpaid',
  Partial: 'Partially Paid',
  Paid: 'Paid',
};

export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  Pending: 'Pending',
  InProgress: 'In Progress',
  Ready: 'Ready for Pickup',
  PickedUp: 'Picked Up',
};
