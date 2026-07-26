import { api } from './api';
import logger from '@/lib/logger';
import { connectSocket } from './socket';

export const createFamilyApi = async (name: string) => {
  const response = await api.family.create(name);
  return response;
};

export const getFamilyApi = async () => {
  try {
    const response = await api.family.get();
    logger.info('[family-api] getFamily response', { hasFamily: !!response?.family });
    return response;
  } catch (error) {
    logger.error('[family-api] getFamily error', error);
    throw error;
  }
};

export const getFamilyMembersApi = async (familyId: string) => {
  try {
    const response = await api.family.getMembers(familyId);
    const members = response?.members ?? [];
    logger.info('[family-api] getFamilyMembers response', { familyId, count: members.length });
    return members;
  } catch (error) {
    logger.error('[family-api] getFamilyMembers error', { familyId, error });
    throw error;
  }
};

export const addFamilyMemberApi = async (familyId: string, data: { userId?: string; email: string; name: string; familyRelation?: string | null }) => {
  const response = await api.family.addMember(familyId, data);
  return response.member;
};

export const removeFamilyMemberApi = async (familyId: string, memberId: string) => {
  await api.family.removeMember(familyId, memberId);
};

export const updateFamilyMemberRoleApi = async (familyId: string, memberId: string, role: string) => {
  const response = await api.family.updateMemberRole(familyId, memberId, role);
  return response.member;
};

export const updateFamilyMemberRelationApi = async (familyId: string, memberId: string, familyRelation: string | null) => {
  const response = await api.family.updateMemberRelation(familyId, memberId, familyRelation);
  return response.member;
};

export const subscribeToFamilyMembersApi = async (familyId: string, callback: (members: any[]) => void) => {
  const socket = await connectSocket('');

  socket.on('connect', () => {
    socket.emit('family:join', { familyId });
  });

  const fetchMembers = async () => {
    try {
      const members = await getFamilyMembersApi(familyId);
      callback(members);
    } catch (error) {
      console.error('fetchMembers error:', error);
    }
  };

  fetchMembers();

  socket.on('family:member:added', async (_member: any) => {
    await fetchMembers();
  });

  socket.on('family:member:removed', async (_payload: any) => {
    await fetchMembers();
  });

  socket.on('family:member:updated', async (_payload: any) => {
    await fetchMembers();
  });

  return () => {
    socket.off('family:member:added');
    socket.off('family:member:removed');
    socket.off('family:member:updated');
    socket.emit('family:leave', { familyId });
  };
};

export const acceptInvitationApi = async (invitationId: string, currentFamilyId?: string) => {
  const response = await api.invitations.accept(invitationId, currentFamilyId);
  return response;
};

export const declineInvitationApi = async (invitationId: string) => {
  await api.invitations.decline(invitationId);
};

export const fetchPendingInvitationsApi = async () => {
  const response = await api.invitations.listPending();
  return response.invitations ?? [];
};

export const fetchSentInvitationsApi = async (familyId: string) => {
  const response = await api.invitations.listSent(familyId);
  return response.invitations ?? [];
};

export const sendFamilyInvitationApi = async (familyId: string, familyName: string, toEmail: string) => {
  const response = await api.invitations.create({ familyId, toEmail });
  return response;
};
