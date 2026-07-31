import type { FamilyMember } from '@/types/models';
import { getFamilyMembersApi, removeFamilyMemberApi } from './family-api';

export const fetchFamilyMembersFromStore = async (familyId: string): Promise<FamilyMember[]> => {
  return getFamilyMembersApi(familyId);
};

export const deleteFamilyMemberFromStore = async ({
  familyId,
  memberId,
}: {
  familyId: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  familyName?: string;
}) => {
  await removeFamilyMemberApi(familyId, memberId);
};
