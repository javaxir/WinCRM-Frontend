import type { SaleOrderStatus } from '@/services/saleOrders'

export const SALE_ORDER_STATUS_LABELS: Record<SaleOrderStatus, string> = {
  NEW: 'Yangi',
  CONFIRMED: 'Tasdiqlangan',
  PROCESSING: 'Jarayonda',
  DELIVERED: 'Yetkazilgan',
  COMPLETED: 'Yakunlangan',
  CANCELLED: 'Bekor qilingan',
}

export function saleOrderStatusLabel(status: SaleOrderStatus): string {
  return SALE_ORDER_STATUS_LABELS[status] || status
}

export function saleOrderStatusClass(status: SaleOrderStatus): string[] {
  const base = 'rounded-full px-2 py-0.5 text-theme-xs font-medium'
  if (status === 'DELIVERED' || status === 'COMPLETED') {
    return [base, 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500']
  }
  if (status === 'CANCELLED') {
    return [base, 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500']
  }
  if (status === 'PROCESSING' || status === 'CONFIRMED') {
    return [base, 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400']
  }
  return [base, 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400']
}

export const SALE_ORDER_STATUS_COLORS: Record<SaleOrderStatus, string> = {
  NEW: '#465FFF',
  CONFIRMED: '#F59E0B',
  PROCESSING: '#FB923C',
  DELIVERED: '#22C55E',
  COMPLETED: '#16A34A',
  CANCELLED: '#EF4444',
}

export function saleOrderStatusColor(status: SaleOrderStatus): string {
  return SALE_ORDER_STATUS_COLORS[status] || '#465FFF'
}

export const SALE_ORDER_STATUSES: SaleOrderStatus[] = [
  'NEW',
  'CONFIRMED',
  'PROCESSING',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED',
]
