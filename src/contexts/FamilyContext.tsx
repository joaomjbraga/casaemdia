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
import { connectSocket } from '../services/socket';
import logger from '@/lib/logger';
import { storageGet, storageRemove, storageSet } from '@/lib/storage';

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
  const { user, backendUserId } = useAuth();
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [familyName, setFamilyName] = useState<string>('Minha Família');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [wasRemoved, setWasRemoved] = useState(false);
  const intentionalExit = useRef(false);
  const hasRestoredCachedFamilyRef = useRef(false);
  const hasTriggeredStartupRevalidationRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const restoreCachedFamily = async () => {
      try {
        const cachedId = await storageGet('last_family_id');
        const cachedName = await storageGet('last_family_name');

        if (!mounted || !cachedId) return;

        hasRestoredCachedFamilyRef.current = true;
        setFamilyId(cachedId);
        setFamilyName(cachedName ?? 'Minha Família');
      } catch (error) {
        logger.warn('Error restoring cached family:', error);
      }
    };

    restoreCachedFamily();

    return () => {
      mounted = false;
    };
  }, []);

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
      } catch (error: any) {
        const message = error?.message ?? String(error ?? '');
        if (message.includes('Usuário não pertence a nenhuma família') || message.includes('Você não é membro desta família')) {
          setMembers([]);
          return;
        }
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

  useEffect(() => {
    if (!familyId) return;

    const persistFamily = async () => {
      try {
        await storageSet('last_family_id', familyId);
        await storageSet('last_family_name', familyName);
      } catch (error) {
        logger.warn('Error persisting family state:', error);
      }
    };

    persistFamily();
  }, [familyId, familyName]);

  const refreshFamily = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const result = await initializeFamilyForUser(user, { allowCreateIfMissing: false });
      if (!result) {
        setFamilyId(null);
        setFamilyName('Minha Família');
        setMembers([]);
        return;
      }

      setFamilyId(result.familyId);
      setFamilyName(result.familyName);
      await fetchMembers(result.familyId);
    } catch (error) {
      logger.error('Error refreshing family:', error);
    } finally {
      setLoading(false);
    }
  }, [user, fetchMembers]);

  useEffect(() => {
    if (!authInitialized || !user || !isTokenReady) {
      if (authInitialized && !user) {
        setFamilyId(null);
        setFamilyName('Minha Família');
        setMembers([]);
        setLoading(false);
        setInitialized(true);
        storageRemove('last_family_id').catch(() => undefined);
        storageRemove('last_family_name').catch(() => undefined);
      }
      return;
    }

    const init = async () => {
      try {
        setLoading(true);
        const result = await initializeFamilyForUser(user);
        if (!result) {
          if (!hasRestoredCachedFamilyRef.current) {
            setFamilyId(null);
            setFamilyName('Minha Família');
            setMembers([]);
          }
          return;
        }

        hasRestoredCachedFamilyRef.current = true;
        setFamilyId(result.familyId);
        setFamilyName(result.familyName);
      } catch (error) {
        logger.error('Error initializing family:', error);
      } finally {
        setInitialized(true);
        setLoading(false);
      }
    };

    hasTriggeredStartupRevalidationRef.current = true;
    init();
  }, [user, authInitialized, isTokenReady]);

  useEffect(() => {
    if (!familyId) return;

    let mounted = true;

    const hydrateMembers = async () => {
      try {
        await fetchMembers(familyId);
      } catch (error) {
        logger.warn('Error hydrating family members on startup:', error);
      }
    };

    const setupSocket = async () => {
      const socket = await connectSocket();
      const handleMemberRemoved = async (data: { memberId: string; userId?: string }) => {
        if (!mounted) return;
        if (data.userId && backendUserId && data.userId === backendUserId) {
          setWasRemoved(true);
          await recoverFamilyAfterRemoval(user);
          await refreshFamily();
        }
      };

      const handleFamilyNameUpdated = async (data: { familyName: string }) => {
        if (!mounted) return;
        setFamilyName(data.familyName);
        await storageSet('last_family_name', data.familyName);
      };

      socket.on('family:member:removed', handleMemberRemoved);
      socket.on('family:name:updated', handleFamilyNameUpdated);

      return () => {
        socket.off('family:member:removed', handleMemberRemoved);
        socket.off('family:name:updated', handleFamilyNameUpdated);
      };
    };

    hydrateMembers();

    let cleanupSocket: (() => void) | undefined;
    setupSocket().then((cleanup) => {
      cleanupSocket = cleanup;
    });

    subscribeToFamilyMembers(familyId, (membersList) => {
      if (mounted) {
        setMembers(membersList);
      }
    }).then(() => {
      if (mounted) {
        fetchMembers(familyId);
      }
    });

    return () => {
      mounted = false;
      cleanupSocket?.();
    };
  }, [familyId, fetchMembers, refreshFamily, user]);

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
