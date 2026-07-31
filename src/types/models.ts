export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface Task {
  id: string;
  title: string;
  done: boolean;
  assignee: string;
  assigneeId?: string;
  createdAt?: Date | string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: 'admin' | 'member';
}

export interface ShoppingItem {
  id: string;
  name: string;
  done: boolean;
  quantity?: string | null;
  assignee?: string;
  assigneeId?: string;
}

export interface ChatAttachment {
  url: string;
  type: 'image' | 'audio' | 'file';
  name?: string;
  mimeType?: string;
  publicId?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  createdAt: Date | string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  attachment?: ChatAttachment;
}

export interface Invitation {
  id: string;
  familyId: string;
  familyName: string;
  fromUserId: string;
  fromUserName: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
}

export type BillType = 'recurring' | 'unique';

export type BillCategory =
  | 'water'
  | 'electricity'
  | 'internet'
  | 'rent'
  | 'condominium'
  | 'ipva'
  | 'iptu'
  | 'insurance'
  | 'school_fee'
  | 'other';

export const BILL_CATEGORY_LABELS: Record<BillCategory, string> = {
  water: 'Água',
  electricity: 'Energia',
  internet: 'Internet',
  rent: 'Aluguel',
  condominium: 'Condomínio',
  ipva: 'IPVA',
  iptu: 'IPTU',
  insurance: 'Seguro',
  school_fee: 'Matrícula Escolar',
  other: 'Outro',
};

export const BILL_TYPE_LABELS: Record<BillType, string> = {
  recurring: 'Recorrente',
  unique: 'Única',
};

export interface Bill {
  id: string;
  familyId: string;
  title: string;
  description: string | null;
  amount: number;
  dueDate: Date | string;
  type: BillType;
  category: BillCategory;
  totalInstallments: number;
  paidInstallments: number;
  isPaid: boolean;
  reminderDays: number[];
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface BillInstallment {
  id: string;
  billId: string;
  familyId: string;
  amount: number;
  dueDate: Date | string;
  paid: boolean;
  paidAt: Date | string | null;
  installmentNumber: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface MonthSummary {
  totalBills: number;
  totalInstallments: number;
  totalPaid: number;
  totalPending: number;
  byCategory: Record<string, { total: number; paid: number; pending: number }>;
}
