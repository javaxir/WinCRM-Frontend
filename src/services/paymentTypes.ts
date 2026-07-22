import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface PaymentTypeResponse {
  id: number
  name: string
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface PaymentTypeDTO {
  name: string
}

export async function fetchAllPaymentTypes() {
  const res = await http.get<ApiResponse<unknown>>('/api/payment-types?page=0&size=1000')
  return unwrapListContent<PaymentTypeResponse>(res)
}

export async function fetchPaymentTypeById(id: number) {
  const res = await http.get<ApiResponse<PaymentTypeResponse>>(`/api/payment-types/${id}`)
  return unwrapData(res)
}

export async function createPaymentType(payload: PaymentTypeDTO) {
  const res = await http.post<ApiResponse<PaymentTypeResponse>>('/api/payment-types/create', payload)
  return unwrapData(res)
}

export async function updatePaymentType(id: number, payload: PaymentTypeDTO) {
  const res = await http.put<ApiResponse<PaymentTypeResponse>>(`/api/payment-types/update/${id}`, payload)
  return unwrapData(res)
}

export function deletePaymentType(id: number) {
  return http.delete<unknown>(`/api/payment-types/delete/${id}`)
}
