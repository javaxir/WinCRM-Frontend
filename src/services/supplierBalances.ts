import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse, Status } from './roles'

export interface SupplierBalanceResponse {
  id: number
  supplierId: number
  supplierName: string
  totalPurchase: number
  totalPaid: number
  totalDebt: number
  lastUpdated: string | null
  status: Status
  createdAt: string
  updatedAt: string
}

export interface SupplierBalanceFilterDTO {
  supplierId?: number
  minDebt?: number
  maxDebt?: number
  status?: Status
}

export async function fetchAllSupplierBalances() {
  const res = await http.get<ApiResponse<unknown>>('/api/supplier-balances')
  return unwrapListContent<SupplierBalanceResponse>(res)
}

export async function fetchSupplierBalanceBySupplierId(supplierId: number) {
  const res = await http.get<ApiResponse<SupplierBalanceResponse>>(
    `/api/supplier-balances/${supplierId}`,
  )
  return unwrapData(res)
}

export async function filterSupplierBalances(filter: SupplierBalanceFilterDTO) {
  const res = await http.post<ApiResponse<unknown>>('/api/supplier-balances/filter', filter)
  return unwrapListContent<SupplierBalanceResponse>(res)
}
