export interface Task {
  id: string;
  title: string;
  done: boolean;
  assignee: string;
  assigneeId?: string;
  points: number;
  createdAt?: any;
}

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  photoURL: string | null;
  role: "admin" | "member";
  points: number;
  tasksCompleted: number;
  shoppingCompleted: number;
  contributions: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  done: boolean;
  quantity?: string;
  points?: number;
}

export interface CoupleStat {
  id: string;
  name: string;
  points: number;
  avatar: "person" | "person-outline" | "trophy";
  tasksCompleted: number;
  photoURL?: string | null;
}

export interface Invitation {
  id: string;
  familyId: string;
  familyName: string;
  fromUserId: string;
  fromUserName: string;
  toEmail: string;
  status: "pending" | "accepted" | "declined";
  createdAt: any;
}
