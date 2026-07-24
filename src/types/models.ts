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
