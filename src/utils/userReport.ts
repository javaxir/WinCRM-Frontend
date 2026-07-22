import type { SaleOrderResponse } from '@/services/saleOrders'
import type { UserResponse } from '@/services/users'

export interface UserReportSummary {
  userId: number
  userName: string
  phone: string
  orderCount: number
  totalAmount: number
  paidAmount: number
  debtAmount: number
  completedCount: number
}

export function filterOrdersByDateRange(
  orders: SaleOrderResponse[],
  startDate: string,
  endDate: string,
): SaleOrderResponse[] {
  const start = new Date(`${startDate}T00:00:00`).getTime()
  const end = new Date(`${endDate}T23:59:59`).getTime()
  return orders.filter((order) => {
    const ts = new Date(order.orderDate).getTime()
    return ts >= start && ts <= end
  })
}

export function summarizeOrdersForUser(orders: SaleOrderResponse[]): Omit<UserReportSummary, 'userId' | 'userName' | 'phone'> {
  return orders.reduce(
    (acc, order) => {
      acc.orderCount += 1
      acc.totalAmount += order.totalSum
      acc.paidAmount += order.paidSum
      acc.debtAmount += order.debtSum
      if (order.orderStatus === 'COMPLETED') acc.completedCount += 1
      return acc
    },
    {
      orderCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      debtAmount: 0,
      completedCount: 0,
    },
  )
}

export function buildUserReportSummaries(
  users: UserResponse[],
  orders: SaleOrderResponse[],
): UserReportSummary[] {
  const ordersByUser = new Map<number, SaleOrderResponse[]>()
  for (const order of orders) {
    if (!order.userId) continue
    const list = ordersByUser.get(order.userId) ?? []
    list.push(order)
    ordersByUser.set(order.userId, list)
  }

  return users
    .filter((user) => user.status === 'ACTIVE')
    .map((user) => {
      const userOrders = ordersByUser.get(user.id) ?? []
      return {
        userId: user.id,
        userName: user.fullName,
        phone: user.phone,
        ...summarizeOrdersForUser(userOrders),
      }
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
}
