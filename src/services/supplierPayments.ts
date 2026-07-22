import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse, Status } from './roles'

export interface SupplierPaymentResponse {
  id: number
  supplierId: number
  supplierName: string
  paidSumm: number
  paidDate: string
  comment: string | null
  paymentTypeId: number
  paymentTypeName: string
  status: Status
  createdUsername: string | null
  createdAt: string
  updatedAt: string
  /** Normalized aliases for UI */
  paymentAmount: number
  paymentDate: string
  warehouseOrderId: number | null
  categoryId: number
  categoryName: string
}

export interface SupplierPaymentDTO {
  supplierId: number
  paidSumm: number
  paidDate: string
  comment?: string
  paymentTypeId: number
}

export interface SupplierPaymentUpdateDTO {
  supplierId: number
  paidSumm: number
  paidDate: string
  comment?: string
  paymentTypeId: number
}

export interface SupplierPaymentFilterDTO {
  supplierId?: number
  paymentTypeId?: number
  minSumm?: number
  maxSumm?: number
  status?: Status
  fromDate?: string
  toDate?: string
}

function normalizePayment(row: SupplierPaymentResponse | Record<string, unknown>): SupplierPaymentResponse {
  const r = row as SupplierPaymentResponse
  const paidSumm = Number(r.paidSumm ?? r.paymentAmount ?? 0)
  const paidDate = String(r.paidDate ?? r.paymentDate ?? '')
  return {
    ...r,
    paidSumm,
    paidDate,
    paymentAmount: paidSumm,
    paymentDate: paidDate,
    warehouseOrderId: r.warehouseOrderId ?? null,
    categoryId: Number(r.paymentTypeId ?? r.categoryId ?? 0),
    categoryName: String(r.paymentTypeName ?? r.categoryName ?? ''),
  }
}

export async function fetchAllSupplierPayments() {
  const res = await http.get<ApiResponse<unknown>>('/api/supplier-payments')
  return unwrapListContent<SupplierPaymentResponse>(res).map(normalizePayment)
}

export async function fetchSupplierPaymentById(id: number) {
  const res = await http.get<ApiResponse<SupplierPaymentResponse>>(`/api/supplier-payments/${id}`)
  return normalizePayment(unwrapData(res))
}

export async function filterSupplierPayments(filter: SupplierPaymentFilterDTO) {
  const res = await http.post<ApiResponse<unknown>>('/api/supplier-payments/filter', filter)
  return unwrapListContent<SupplierPaymentResponse>(res).map(normalizePayment)
}

export async function fetchPaymentsBySupplier(
  supplierId: number,
  dateRange?: { startDate: string; endDate: string },
) {
  const filter: SupplierPaymentFilterDTO = { supplierId }
  if (dateRange) {
    filter.fromDate = dateRange.startDate.includes('T')
      ? dateRange.startDate
      : `${dateRange.startDate}T00:00:00`
    filter.toDate = dateRange.endDate.includes('T')
      ? dateRange.endDate
      : `${dateRange.endDate}T23:59:59`
  }
  try {
    return await filterSupplierPayments(filter)
  } catch {
    const all = await fetchAllSupplierPayments()
    return all.filter((p) => p.supplierId === supplierId && p.status === 'ACTIVE')
  }
}

export async function createSupplierPayment(payload: {
  supplierId: number
  paymentAmount?: number
  paidSumm?: number
  paymentDate?: string
  paidDate?: string
  comment?: string
  paymentTypeId?: number
  categoryId?: number
  warehouseOrderId?: number | null
}) {
  const paidSumm = payload.paidSumm ?? payload.paymentAmount ?? 0
  const paidDate = payload.paidDate ?? payload.paymentDate ?? new Date().toISOString()
  const paymentTypeId = payload.paymentTypeId ?? payload.categoryId ?? 0
  const body: SupplierPaymentDTO = {
    supplierId: payload.supplierId,
    paidSumm,
    paidDate: paidDate.includes('T') ? paidDate : `${paidDate}T12:00:00`,
    comment: payload.comment,
    paymentTypeId,
  }
  const res = await http.post<ApiResponse<SupplierPaymentResponse>>(
    '/api/supplier-payments/create',
    body,
  )
  return normalizePayment(unwrapData(res))
}

export async function updateSupplierPayment(
  id: number,
  payload: {
    supplierId: number
    paymentAmount?: number
    paidSumm?: number
    paymentDate?: string
    paidDate?: string
    comment?: string
    paymentTypeId?: number
    categoryId?: number
    warehouseOrderId?: number | null
  },
) {
  const paidSumm = payload.paidSumm ?? payload.paymentAmount ?? 0
  const paidDate = payload.paidDate ?? payload.paymentDate ?? new Date().toISOString()
  const paymentTypeId = payload.paymentTypeId ?? payload.categoryId ?? 0
  const body: SupplierPaymentUpdateDTO = {
    supplierId: payload.supplierId,
    paidSumm,
    paidDate: paidDate.includes('T') ? paidDate : `${paidDate}T12:00:00`,
    comment: payload.comment,
    paymentTypeId,
  }
  const res = await http.put<ApiResponse<SupplierPaymentResponse>>(
    `/api/supplier-payments/update/${id}`,
    body,
  )
  return normalizePayment(unwrapData(res))
}

export function deleteSupplierPayment(id: number) {
  return http.delete<unknown>(`/api/supplier-payments/delete/${id}`)
}
