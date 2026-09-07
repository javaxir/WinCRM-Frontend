import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse, Status } from './roles'

export type CommissionType = 'PERCENT' | 'FIXED'
export type SalaryEntryType =
  | 'COMMISSION'
  | 'COMMISSION_REVERSAL'
  | 'BONUS'
  | 'DEDUCTION'
  | 'ADVANCE'

export interface SalaryConfigDTO {
  userId: number
  baseSalary: number
  commissionType: CommissionType
  commissionValue: number
  effectiveFrom: string
}

export interface SalaryConfigResponse {
  id: number
  userId: number
  userFullName: string | null
  baseSalary: number
  commissionType: CommissionType
  commissionValue: number
  effectiveFrom: string
  effectiveTo: string | null
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface SalaryAdjustmentDTO {
  userId: number
  entryType: 'BONUS' | 'DEDUCTION' | 'ADVANCE'
  amount: number
  periodYear?: number
  periodMonth?: number
  comment?: string
}

export interface SalaryTransactionResponse {
  id: number
  userId: number
  saleOrderId: number | null
  entryType: SalaryEntryType
  amount: number
  commissionTypeSnapshot: CommissionType | null
  rateSnapshot: number | null
  baseAmountSnapshot: number | null
  earnedAt: string | null
  periodYear: number
  periodMonth: number
  comment: string | null
  status: Status
  createdAt?: string
  createdUsername?: string | null
}

export interface SalarySlipResponse {
  userId: number
  userFullName: string | null
  periodYear: number
  periodMonth: number
  baseSalary: number
  totalCommission: number
  totalCommissionReversal: number
  totalBonus: number
  totalDeduction: number
  totalAdvance: number
  netSalary: number
}

export async function fetchSalaryConfigs(page = 0, size = 100) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/salary/configs?page=${page}&size=${size}&sort=id,DESC`,
  )
  return unwrapListContent<SalaryConfigResponse>(res)
}

export async function fetchSalaryConfigById(id: number) {
  const res = await http.get<ApiResponse<SalaryConfigResponse>>(`/api/salary/configs/${id}`)
  return unwrapData(res)
}

export async function fetchSalaryConfigsByUser(userId: number, page = 0, size = 50) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/salary/configs/user/${userId}?page=${page}&size=${size}&sort=id,DESC`,
  )
  return unwrapListContent<SalaryConfigResponse>(res)
}

export async function fetchCurrentSalaryConfig(userId: number) {
  const res = await http.get<ApiResponse<SalaryConfigResponse>>(
    `/api/salary/configs/user/${userId}/current`,
  )
  return unwrapData(res)
}

export async function createSalaryConfig(payload: SalaryConfigDTO) {
  const res = await http.post<ApiResponse<SalaryConfigResponse>>('/api/salary/configs', payload)
  return unwrapData(res)
}

export function deleteSalaryConfig(id: number) {
  return http.delete<unknown>(`/api/salary/configs/${id}`)
}

export async function fetchSalaryTransactionsByUser(userId: number, page = 0, size = 100) {
  const res = await http.get<ApiResponse<unknown>>(
    `/api/salary/transactions/user/${userId}?page=${page}&size=${size}&sort=id,DESC`,
  )
  return unwrapListContent<SalaryTransactionResponse>(res)
}

export async function fetchSalaryTransactionsByPeriod(
  userId: number,
  year: number,
  month: number,
  page = 0,
  size = 100,
) {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
    page: String(page),
    size: String(size),
    sort: 'id,DESC',
  })
  const res = await http.get<ApiResponse<unknown>>(
    `/api/salary/transactions/user/${userId}/period?${params}`,
  )
  return unwrapListContent<SalaryTransactionResponse>(res)
}

export async function createSalaryAdjustment(payload: SalaryAdjustmentDTO) {
  const res = await http.post<ApiResponse<SalaryTransactionResponse>>(
    '/api/salary/transactions/adjustment',
    payload,
  )
  return unwrapData(res)
}

export function deleteSalaryTransaction(id: number) {
  return http.delete<unknown>(`/api/salary/transactions/${id}`)
}

export async function fetchSalarySlip(userId: number, year: number, month: number) {
  const params = new URLSearchParams({ year: String(year), month: String(month) })
  const res = await http.get<ApiResponse<SalarySlipResponse>>(
    `/api/salary/slip/user/${userId}?${params}`,
  )
  return unwrapData(res)
}
