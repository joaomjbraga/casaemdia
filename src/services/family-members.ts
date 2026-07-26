import type { FamilyMember } from '@/types/models';
import { getFamilyMembersApi, removeFamilyMemberApi } from './family-api';

export const fetchFamilyMembersFromStore = async (familyId: string): Promise<FamilyMember[]> => {
  return getFamilyMembersApi(familyId);
};

export const deleteFamilyMemberFromStore = async ({
  familyId,
  memberId,
  memberName,
  memberEmail,
  familyName,
}: {
  familyId: string;
  memberId: string;
  memberName: string;
  memberEmail?: string;
  familyName?: string;
}) => {
  await removeFamilyMemberApi(familyId, memberId);

  if (memberEmail) {
    try {
      const { sendNotificationToEmail } = await import('../lib/onesignal');
      await sendNotificationToEmail({
        email: memberEmail,
        title: 'Você saiu da família',
        body: `Você foi removido da família "${familyName ?? 'Minha Família'}".`,
        data: { type: 'member_removed' },
      });
    } catch (error) {
      console.error('Erro ao enviar notificação (membro removido):', error);
    }
  }
};
