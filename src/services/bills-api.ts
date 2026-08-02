import type { Bill, BillInstallment, MonthSummary } from '@/types/models';
import { api } from './api';
import { connectSocket } from './socket';
import logger from '@/lib/logger';

export const subscribeToBillsApi = async (
  familyId: string,
  onBills: (bills: Bill[]) => void,
  onInstallments: (installments: BillInstallment[]) => void,
  onSummary?: (summary: MonthSummary) => void,
) => {
  const socket = await connectSocket();

  socket.on('connect', () => {
    socket.emit('family:join', { familyId });
  });

  const fetchBills = async () => {
    try {
      const data = await api.bills.list(familyId);
      onBills(data?.bills ?? []);
    } catch (error) {
      logger.error('[bills-api] fetchBills error:', error);
    }
  };

  const fetchInstallments = async () => {
    try {
      const data = await api.bills.listInstallments(familyId);
      onInstallments(data?.installments ?? []);
    } catch (error) {
      logger.error('[bills-api] fetchInstallments error:', error);
    }
  };

  const fetchSummary = async () => {
    if (!onSummary) return;
    try {
      const now = new Date();
      const data = await api.bills.getMonthSummary(
        familyId,
        now.getMonth() + 1,
        now.getFullYear(),
      );
      onSummary(data);
    } catch (error) {
      logger.error('[bills-api] fetchSummary error:', error);
    }
  };

  await Promise.all([fetchBills(), fetchInstallments(), fetchSummary()]);

  socket.on('bill:created', (data: { bill: Bill; installments: BillInstallment[] }) => {
    fetchBills();
    if (data.installments && data.installments.length > 0) {
      fetchInstallments();
    }
    fetchSummary();
  });

  socket.on('bill:updated', (data: { bill: Bill }) => {
    fetchBills();
    fetchSummary();
  });

  socket.on('bill:paid', (data: { bill: Bill }) => {
    fetchBills();
    fetchInstallments();
    fetchSummary();
  });

  socket.on('bill:installment:paid', (data: { installment: BillInstallment }) => {
    fetchBills();
    fetchInstallments();
    fetchSummary();
  });

  socket.on('bill:deleted', (data: { billId: string }) => {
    fetchBills();
    fetchInstallments();
    fetchSummary();
  });

  return () => {
    socket.off('bill:created');
    socket.off('bill:updated');
    socket.off('bill:paid');
    socket.off('bill:installment:paid');
    socket.off('bill:deleted');
    socket.emit('family:leave', { familyId });
  };
};

export const createBillApi = async (
  familyId: string,
  payload: {
    title: string;
    description?: string | null;
    amount: number;
    dueDate: Date;
    type: 'recurring' | 'unique';
    category: string;
    totalInstallments: number;
    reminderDays: number[];
  },
): Promise<{ bill: Bill; installments: BillInstallment[] }> => {
  const data = await api.bills.create(familyId, {
    ...payload,
    dueDate: payload.dueDate.toISOString(),
  });
  return data;
};

export const updateBillApi = async (
  familyId: string,
  billId: string,
  data: Partial<{
    title: string;
    description: string | null;
    amount: number;
    dueDate: Date;
    category: string;
    reminderDays: number[];
  }>,
): Promise<Bill> => {
  const response = await api.bills.update(familyId, billId, {
    ...data,
    dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
  });
  return response.bill;
};

export const deleteBillApi = async (familyId: string, billId: string): Promise<void> => {
  await api.bills.delete(familyId, billId);
};

export const payInstallmentApi = async (
  familyId: string,
  billId: string,
  installmentId: string,
  payment?: { amount?: number; receiptUrl?: string | null; receiptPublicId?: string | null },
): Promise<BillInstallment> => {
  const data = await api.bills.payInstallment(familyId, billId, installmentId, payment);
  return data.installment;
};

export const payBillApi = async (familyId: string, billId: string): Promise<Bill> => {
  const data = await api.bills.payBill(familyId, billId);
  return data.bill;
};

export const getBillDetailApi = async (familyId: string, billId: string): Promise<{ bill: Bill; installments: BillInstallment[] }> => {
  const data = await api.bills.get(familyId, billId);
  return data;
};

export const getUpcomingBillsApi = async (familyId: string, limit?: number): Promise<Bill[]> => {
  const data = await api.bills.getUpcoming(familyId, limit);
  return data?.bills ?? [];
};

export const getMonthSummaryApi = async (familyId: string, month?: number, year?: number): Promise<MonthSummary> => {
  const data = await api.bills.getMonthSummary(familyId, month, year);
  return data;
};

export const fetchMonthSummaryApi = async (familyId: string, month?: number, year?: number): Promise<MonthSummary> => {
  const data = await api.bills.getMonthSummary(familyId, month, year);
  return data;
};

export const fetchBillsApi = async (familyId: string): Promise<Bill[]> => {
  const data = await api.bills.list(familyId);
  return data?.bills ?? [];
};

export const fetchPaidBillsApi = async (familyId: string): Promise<Bill[]> => {
  const data = await api.bills.history(familyId);
  return data?.bills ?? [];
};

export const fetchInstallmentsApi = async (familyId: string): Promise<BillInstallment[]> => {
  const data = await api.bills.listInstallments(familyId);
  return data?.installments ?? [];
};
