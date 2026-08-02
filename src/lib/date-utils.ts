import logger from '@/lib/logger';

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toCalendarDate(date: Date | string): Date {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return d;
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function formatDate(date: Date): string {
  try {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    logger.error('Error formatting date', e);
    return date.toISOString().split('T')[0];
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function getDaysOverdue(dueDate: Date | string): number {
  const d = toCalendarDate(dueDate);
  const now = toCalendarDate(new Date());
  return Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDaysUntil(dueDate: Date | string): number {
  const d = toCalendarDate(dueDate);
  const now = toCalendarDate(new Date());
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}
