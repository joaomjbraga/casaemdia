import type { FamilyMember } from '@/types/models';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
  deleteFamilyMemberFromStore,
  fetchFamilyMembersFromStore,
} from '../services/family-members';
import {
  initializeFamilyForUser,
  recoverFamilyAfterRemoval,
  subscribeToFamilyMembers,
} from '../services/family';
import logger from '@/lib/logger';

interface FamilyContextType {
  familyId: string | null;
  familyName: string;
  members: FamilyMember[];
  loading: boolean;
  initialized: boolean;
  isReady: boolean;
  wasRemoved: boolean;
  acknowledgeRemoval: () => void;
  beginIntentionalExit: () => void;
  cancelIntentionalExit: () => void;
  refreshFamily: () => Promise<void>;
  deleteFamilyMember: (id: string) => Promise<void>;
  fetchMembers: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};

export const FamilyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initialized: authInitialized, isTokenReady } = useAuth();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string>('Minha Família');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [wasRemoved, setWasRemoved] = useState(false);
  const intentionalExit = useRef(false);

  const acknowledgeRemoval = useCallback(() => setWasRemoved(false), []);
  const beginIntentionalExit = useCallback(() => {
    intentionalExit.current = true;
  }, []);
  const cancelIntentionalExit = useCallback(() => {
    intentionalExit.current = false;
  }, []);

  const familyIdRef = useRef(familyId);
  familyIdRef.current = familyId;

  const fetchMembers = useCallback(
    async (fId?: string) => {
      const targetFamilyId = fId || familyIdRef.current;
      if (!targetFamilyId) return;
      try {
        const membersList = await fetchFamilyMembersFromStore(targetFamilyId);
        setMembers(membersList);
      } catch (error) {
        logger.error('Error fetching family members:', error);
      }
    },
    [],
  );

  const deleteFamilyMember = useCallback(
    async (id: string) => {
      if (!familyId) throw new Error('Família não carregada');

      try {
        setLoading(true);

        const member = members.find((m) => m.id === id);
        if (!member) throw new Error('Membro não encontrado.');

        await deleteFamilyMemberFromStore({
          familyId,
          memberId: id,
          memberName: member.name,
          memberEmail: member.email,
          familyName,
        });

        await fetchMembers();
      } catch (error: any) {
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [familyId, familyName, members, fetchMembers],
  );

  const refreshFamily = useCallback(async () => {
    if (!familyId) return;
    await fetchMembers(familyId);
  }, [familyId, fetchMembers]);

  useEffect(() => {
    if (!authInitialized || !user || !isTokenReady) {
      if (authInitialized && !user) {
        setFamilyId(null);
        setFamilyName('Minha Família');
        setMembers([]);
        setLoading(false);
        setInitialized(true);
      }
      return;
    }

    const init = async () => {
      try {
        setLoading(true);
        const result = await initializeFamilyForUser(user);
        setFamilyId(result.familyId);
        setFamilyName(result.familyName);
      } catch (error) {
        logger.error('Error initializing family:', error);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    init();
  }, [user, authInitialized, isTokenReady]);

  useEffect(() => {
    if (!familyId) return;

    return subscribeToFamilyMembers(familyId, (membersList) => {
      setMembers(membersList);
    });
  }, [familyId]);

  const isReady = initialized && !loading && !!familyId;

  return (
    <FamilyContext.Provider
      value={{
        familyId,
        familyName,
        members,
        loading,
        initialized,
        isReady,
        wasRemoved,
        acknowledgeRemoval,
        beginIntentionalExit,
        cancelIntentionalExit,
        refreshFamily,
        deleteFamilyMember,
        fetchMembers,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
};
