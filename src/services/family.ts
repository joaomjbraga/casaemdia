import type { FamilyMember, Invitation } from '@/types/models';
import {
  createFamilyApi,
  getFamilyApi,
  addFamilyMemberApi,
  removeFamilyMemberApi,
  updateFamilyMemberRoleApi,
  subscribeToFamilyMembersApi,
  fetchPendingInvitationsApi,
  fetchSentInvitationsApi,
  acceptInvitationApi,
  declineInvitationApi,
  sendFamilyInvitationApi,
} from './family-api';
import { removeUserTags } from '../lib/onesignal';
import type { User } from '@/types/models';

interface FamilyResult {
  familyId: string;
  familyName: string;
}

export const initializeFamilyForUser = async (
  user: User,
  options: { allowCreateIfMissing?: boolean } = {},
): Promise<FamilyResult | null> => {
  const { allowCreateIfMissing = false } = options;
  const profile = {
    email: user.email ?? '',
    name: user.displayName ?? user.email?.split('@')[0] ?? 'Usuário',
    photoURL: user.photoURL ?? null,
  };

  try {
    const existing = await getFamilyApi();
    if (existing?.family?.id) {
      return {
        familyId: existing.family.id,
        familyName: existing.family.name ?? 'Minha Família',
      };
    }
  } catch (error: any) {
    const message = error?.message ?? String(error ?? '');
    if (message.includes('Usuário não pertence a nenhuma família')) {
      if (!allowCreateIfMissing) {
        return null;
      }
    } else {
      return null;
    }
  }

  if (!allowCreateIfMissing) {
    return null;
  }

  const created = await createFamilyApi(profile.name);
  return {
    familyId: created.family.id,
    familyName: created.family.name ?? 'Minha Família',
  };
};

export const recoverFamilyAfterRemoval = async (currentUser: User): Promise<FamilyResult | null> => {
  removeUserTags();
  return initializeFamilyForUser(currentUser, { allowCreateIfMissing: true });
};

export const subscribeToFamilyMembers = (
  familyId: string,
  callback: (members: FamilyMember[]) => void,
) => {
  return subscribeToFamilyMembersApi(familyId, (members) => {
    callback(
      members.map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.name,
        email: m.email ?? '',
        photoURL: m.photoURL ?? null,
        role: (m.role ?? 'member') as 'admin' | 'member',
      })),
    );
  });
};

export const fetchPendingInvitations = async (email: string) => {
  const invitations = await fetchPendingInvitationsApi();
  return { invitations, expiredIds: [] as string[] };
};

export const fetchSentInvitations = async (familyId: string) => {
  return fetchSentInvitationsApi(familyId);
};

export const sendFamilyInvitation = async (
  familyId: string,
  familyName: string,
  currentUser: any,
  targetEmail: string,
) => {
  if (!currentUser) throw new Error('Usuário não autenticado');
  const normalizedEmail = targetEmail.trim().toLowerCase();
  return sendFamilyInvitationApi(familyId, familyName, normalizedEmail);
};

export const acceptFamilyInvitation = async (
  invitationId: string,
  currentUser: any,
  currentFamilyId: string | null,
  refreshFamily: () => Promise<void>,
) => {
  if (!currentUser) throw new Error('Usuário não autenticado');
  await acceptInvitationApi(invitationId, currentFamilyId ?? undefined);
  await refreshFamily();
};

export const declineFamilyInvitation = async (invitationId: string) => {
  await declineInvitationApi(invitationId);
};
