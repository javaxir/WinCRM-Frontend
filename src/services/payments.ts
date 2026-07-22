import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface PaymentResponse {
  id: number
  clientId: number
  clientFullName: string | null
  saleOrderId: number | null
  paymentTypeId: number
  paymentTypeName: string
  paymentAmount: number
  paymentDate: string
  comment: string | null
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface PaymentDTO {
  clientId: number
  userId?: number
  paymentTypeId: number
  paymentAmount: number
  paymentDate: string
  saleOrderId?: number
  comment?: string
}

export async function fetchAllPayments() {
  const res = await http.get<ApiResponse<unknown>>('/api/payments?page=0&size=1000')
  return unwrapListContent<PaymentResponse>(res)
}

export async function fetchPaymentById(id: number) {
  const res = await http.get<ApiResponse<PaymentResponse>>(`/api/payments/${id}`)
  return unwrapData(res)
}

export async function fetchPaymentsByClient(clientId: number) {
  const res = await http.get<ApiResponse<unknown>>(`/api/payments/client/${clientId}`)
  return unwrapListContent<PaymentResponse>(res)
}

export async function fetchPaymentsBySaleOrder(saleOrderId: number) {
  const res = await http.get<ApiResponse<unknown>>(`/api/payments/sale-order/${saleOrderId}`)
  return unwrapListContent<PaymentResponse>(res)
}

export async function fetchPaymentsByPaymentType(paymentTypeId: number) {
  const res = await http.get<ApiResponse<unknown>>(`/api/payments/payment-type/${paymentTypeId}`)
  return unwrapListContent<PaymentResponse>(res)
}

export async function createPayment(payload: PaymentDTO) {
  const res = await http.post<ApiResponse<PaymentResponse>>('/api/payments/create', payload)
  return unwrapData(res)
}

export async function updatePayment(id: number, payload: PaymentDTO) {
  const res = await http.put<ApiResponse<PaymentResponse>>(`/api/payments/update/${id}`, payload)
  return unwrapData(res)
}

export function deletePayment(id: number) {
  return http.delete<unknown>(`/api/payments/delete/${id}`)
}
