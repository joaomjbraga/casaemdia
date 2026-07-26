import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  acceptFamilyInvitation,
  declineFamilyInvitation,
  fetchPendingInvitations as fetchPendingInvitationsService,
  fetchSentInvitations as fetchSentInvitationsService,
  sendFamilyInvitation,
} from '../services/family';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import type { Invitation } from '@/types/models';
import logger from '@/lib/logger';

interface InvitationContextType {
  pendingInvitations: Invitation[];
  sentInvitations: Invitation[];
  loading: boolean;
  sendInvitation: (email: string) => Promise<void>;
  acceptInvitation: (invitationId: string) => Promise<void>;
  declineInvitation: (invitationId: string) => Promise<void>;
}

const InvitationContext = createContext<InvitationContextType | undefined>(undefined);

export const useInvitations = () => {
  const context = useContext(InvitationContext);
  if (!context) {
    throw new Error('useInvitations must be used within an InvitationProvider');
  }
  return context;
};

export const InvitationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { familyId, familyName, members, refreshFamily } = useFamily();
  const { user, isTokenReady } = useAuth();
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingInvitations = useCallback(async () => {
    const email = user?.email;
    if (!email || !isTokenReady) return;

    try {
      const { invitations } = await fetchPendingInvitationsService(email);
      setPendingInvitations(invitations as Invitation[]);
    } catch (error) {
      logger.error('Error fetching invitations:', error);
    }
  }, [user?.email, isTokenReady]);

  const fetchSentInvitations = useCallback(async () => {
    if (!familyId || !isTokenReady) return;

    try {
      const invitations = await fetchSentInvitationsService(familyId);
      setSentInvitations(invitations as Invitation[]);
    } catch (error) {
      logger.error('Error fetching sent invitations:', error);
    }
  }, [familyId, isTokenReady]);

  useEffect(() => {
    const email = user?.email;
    if (!email || !isTokenReady) {
      setPendingInvitations([]);
      setSentInvitations([]);
      return;
    }

    fetchPendingInvitations();
    fetchSentInvitations();
    const interval = setInterval(() => {
      fetchPendingInvitations();
      fetchSentInvitations();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPendingInvitations, fetchSentInvitations, user?.email, isTokenReady]);

  const sendInvitation = useCallback(
    async (email: string) => {
      if (!familyId || !familyName) throw new Error('Família não carregada');
      if (!user || !isTokenReady) throw new Error('Usuário não autenticado');

      setLoading(true);
      try {
        await sendFamilyInvitation(familyId, familyName, user, email, members);
        await fetchSentInvitations();
      } finally {
        setLoading(false);
      }
    },
    [familyId, familyName, members, user, isTokenReady, fetchSentInvitations],
  );

  const acceptInvitation = useCallback(
    async (invitationId: string) => {
      if (!user || !isTokenReady) throw new Error('Usuário não autenticado');

      setLoading(true);
      try {
        await acceptFamilyInvitation(invitationId, user, familyId, refreshFamily);
        await fetchPendingInvitations();
      } finally {
        setLoading(false);
      }
    },
    [user, familyId, refreshFamily, isTokenReady, fetchPendingInvitations],
  );

  const declineInvitation = useCallback(
    async (invitationId: string) => {
      setLoading(true);
      try {
        await declineFamilyInvitation(invitationId);
        await fetchPendingInvitations();
      } finally {
        setLoading(false);
      }
    },
    [fetchPendingInvitations],
  );

  return (
    <InvitationContext.Provider
      value={{
        pendingInvitations,
        sentInvitations,
        loading,
        sendInvitation,
        acceptInvitation,
        declineInvitation,
      }}
    >
      {children}
    </InvitationContext.Provider>
  );
};
