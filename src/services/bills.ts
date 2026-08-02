import type { Bill, BillInstallment, MonthSummary } from '@/types/models';
import { cancelBillNotifications, scheduleBillReminder } from '@/lib/notifications';
import {
  subscribeToBillsApi as subscribeToBills,
  createBillApi as createBill,
  updateBillApi as updateBill,
  deleteBillApi as deleteBill,
  payInstallmentApi as payInstallment,
  payBillApi as payBill,
  getBillDetailApi as getBillDetail,
  getUpcomingBillsApi as getUpcomingBills,
  getMonthSummaryApi as getMonthSummary,
  fetchBillsApi,
  fetchInstallmentsApi,
} from './bills-api';

export {
  subscribeToBills,
  createBill,
  updateBill,
  deleteBill,
  payInstallment,
  payBill,
  getBillDetail,
  getUpcomingBills,
  getMonthSummary,
  fetchBillsApi,
  fetchInstallmentsApi,
};

export async function scheduleBillNotifications(
  bill: Bill,
  installments: BillInstallment[],
): Promise<void> {
  await cancelBillNotifications(bill.id);

  if (bill.isPaid) return;

  if (installments.length > 1) {
    for (const inst of installments) {
      if (inst.paid) continue;
      await scheduleBillReminder(
        bill.id,
        inst.id,
        bill.title,
        inst.dueDate,
        bill.reminderDays,
      );
    }
  } else {
    await scheduleBillReminder(
      bill.id,
      undefined,
      bill.title,
      bill.dueDate,
      bill.reminderDays,
    );
  }
}

export async function cancelBillNotificationsForBill(billId: string): Promise<void> {
  await cancelBillNotifications(billId);
}
