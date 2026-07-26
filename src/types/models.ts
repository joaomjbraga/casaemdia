export interface Task {
  id: string;
  title: string;
  done: boolean;
  assignee: string;
  assigneeId?: string;
  createdAt?: any;
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
  quantity?: string;
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
  createdAt: any;
  status?: 'sending' | 'sent' | 'error';
  attachment?: ChatAttachment;
}

export interface Invitation {
  id: string;
  familyId: string;
  familyName: string;
  fromUserId: string;
  fromUserName: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}
