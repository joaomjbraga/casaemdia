import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useFamily } from './FamilyContext';
import type { Bill, BillInstallment, MonthSummary } from '@/types/models';
import {
  subscribeToBills,
  createBill,
  updateBill,
  deleteBill,
  payInstallment,
  payBill,
  getBillDetail,
  scheduleBillNotifications,
  cancelBillNotificationsForBill,
} from '@/services/bills';
import { fetchBillsApi, fetchInstallmentsApi, fetchMonthSummaryApi } from '@/services/bills-api';
import logger from '@/lib/logger';

interface BillsContextType {
  bills: Bill[];
  installments: BillInstallment[];
  monthSummary: MonthSummary | null;
  loading: boolean;
  createBill: (data: {
    title: string;
    description?: string | null;
    amount: number;
    dueDate: Date;
    type: 'recurring' | 'unique';
    category: string;
    totalInstallments: number;
    reminderDays: number[];
  }) => Promise<Bill>;
  updateBill: (billId: string, data: Partial<{
    title: string;
    description: string | null;
    amount: number;
    dueDate: Date;
    category: string;
    reminderDays: number[];
  }>) => Promise<void>;
  deleteBill: (billId: string) => Promise<void>;
  payInstallment: (
    billId: string,
    installmentId: string,
    payment?: { amount?: number; receiptUrl?: string | null; receiptPublicId?: string | null },
  ) => Promise<void>;
  payBill: (billId: string) => Promise<void>;
  getBillDetail: (billId: string) => Promise<{ bill: Bill; installments: BillInstallment[] } | null>;
  refreshBills: () => Promise<void>;
}

const BillsContext = createContext<BillsContextType | undefined>(undefined);

export const useBills = () => {
  const context = useContext(BillsContext);
  if (!context) {
    throw new Error('useBills must be used within a BillsProvider');
  }
  return context;
};

export const BillsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isTokenReady, initialized: authInitialized } = useAuth();
  const { familyId, isReady: familyReady } = useFamily();
  const [bills, setBills] = useState<Bill[]>([]);
  const [installments, setInstallments] = useState<BillInstallment[]>([]);
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const familyIdRef = useRef<string | null>(null);
  familyIdRef.current = familyId;

  const handleBillsChange = useCallback((newBills: Bill[]) => {
    setBills(newBills);
  }, []);

  const handleInstallmentsChange = useCallback((newInstallments: BillInstallment[]) => {
    setInstallments(newInstallments);
  }, []);

  const handleSummaryChange = useCallback((summary: MonthSummary) => {
    setMonthSummary(summary);
  }, []);

  useEffect(() => {
    if (!isTokenReady || !authInitialized) return;
    if (!familyReady || !familyId) return;

    setLoading(true);

    let cleanup: (() => void) | undefined;

    subscribeToBills(familyId, handleBillsChange, handleInstallmentsChange, handleSummaryChange)
      .then((unsubscribe) => {
        cleanup = unsubscribe;
        setLoading(false);
      })
      .catch((error) => {
        logger.error('[BillsContext] Error subscribing to bills:', error);
        setLoading(false);
      });

    return () => {
      cleanup?.();
    };
  }, [isTokenReady, authInitialized, familyReady, familyId, handleBillsChange, handleInstallmentsChange, handleSummaryChange]);

  useEffect(() => {
    if (!familyId) return;

    const updateNotifications = async () => {
      for (const bill of bills) {
        if (bill.isPaid) {
          await cancelBillNotificationsForBill(bill.id);
        } else {
          const billInstallments = installments.filter((i) => i.billId === bill.id);
          await scheduleBillNotifications(bill, billInstallments);
        }
      }
    };

    updateNotifications().catch((error) => {
      logger.error('[BillsContext] Error updating notifications:', error);
    });
  }, [bills, installments, familyId]);

  const createBillAction = useCallback(
    async (data: {
      title: string;
      description?: string | null;
      amount: number;
      dueDate: Date;
      type: 'recurring' | 'unique';
      category: string;
      totalInstallments: number;
      reminderDays: number[];
    }): Promise<Bill> => {
      const currentFamilyId = familyIdRef.current;
      if (!currentFamilyId) throw new Error('Família não carregada');

      const result = await createBill(currentFamilyId, data);
      await scheduleBillNotifications(result.bill, result.installments);
      return result.bill;
    },
    [],
  );

  const updateBillAction = useCallback(
    async (billId: string, data: Partial<{
      title: string;
      description: string | null;
      amount: number;
      dueDate: Date;
      category: string;
      reminderDays: number[];
    }>): Promise<void> => {
      const currentFamilyId = familyIdRef.current;
      if (!currentFamilyId) throw new Error('Família não carregada');

      await updateBill(currentFamilyId, billId, data);
    },
    [],
  );

  const deleteBillAction = useCallback(
    async (billId: string): Promise<void> => {
      const currentFamilyId = familyIdRef.current;
      if (!currentFamilyId) throw new Error('Família não carregada');

      await deleteBill(currentFamilyId, billId);
      await cancelBillNotificationsForBill(billId);
    },
    [],
  );

  const payInstallmentAction = useCallback(
    async (
      billId: string,
      installmentId: string,
      payment?: { amount?: number; receiptUrl?: string | null; receiptPublicId?: string | null },
    ): Promise<void> => {
      const currentFamilyId = familyIdRef.current;
      if (!currentFamilyId) throw new Error('Família não carregada');

      const installment = await payInstallment(currentFamilyId, billId, installmentId, payment);
      await cancelBillNotificationsForBill(billId);
    },
    [],
  );

  const payBillAction = useCallback(
    async (billId: string): Promise<void> => {
      const currentFamilyId = familyIdRef.current;
      if (!currentFamilyId) throw new Error('Família não carregada');

      await payBill(currentFamilyId, billId);
      await cancelBillNotificationsForBill(billId);
    },
    [],
  );

  const getBillDetailAction = useCallback(
    async (billId: string): Promise<{ bill: Bill; installments: BillInstallment[] } | null> => {
      const currentFamilyId = familyIdRef.current;
      if (!currentFamilyId) throw new Error('Família não carregada');

      return getBillDetail(currentFamilyId, billId);
    },
    [],
  );

  const refreshBills = useCallback(async (): Promise<void> => {
    const currentFamilyId = familyIdRef.current;
    if (!currentFamilyId) return;
    try {
      const [billsData, installmentsData, summaryData] = await Promise.all([
        fetchBillsApi(currentFamilyId),
        fetchInstallmentsApi(currentFamilyId),
        fetchMonthSummaryApi(currentFamilyId),
      ]);
      setBills(billsData);
      setInstallments(installmentsData);
      setMonthSummary(summaryData);
    } catch (error) {
      logger.error('[BillsContext] Error refreshing bills:', error);
    }
  }, []);

  const value: BillsContextType = {
    bills,
    installments,
    monthSummary,
    loading,
    createBill: createBillAction,
    updateBill: updateBillAction,
    deleteBill: deleteBillAction,
    payInstallment: payInstallmentAction,
    payBill: payBillAction,
    getBillDetail: getBillDetailAction,
    refreshBills,
  };

  return <BillsContext.Provider value={value}>{children}</BillsContext.Provider>;
};
