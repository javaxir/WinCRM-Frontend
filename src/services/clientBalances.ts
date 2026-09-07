import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse } from './roles'

export interface ClientBalanceResponse {
  id: number
  clientId: number
  clientFullName: string
  totalPurchase: number
  totalPaid: number
  totalDebt: number
  lastUpdated: string | null
  periodFrom?: string | null
  periodTo?: string | null
}

export interface ClientBalanceDTO {
  totalPurchase: number
  totalPaid: number
}

export async function fetchAllClientBalances(params?: { fromDate?: string; toDate?: string }) {
  const search = new URLSearchParams()
  if (params?.fromDate) search.set('fromDate', params.fromDate)
  if (params?.toDate) search.set('toDate', params.toDate)
  const query = search.toString()
  const res = await http.get<ApiResponse<unknown>>(`/api/client-balances${query ? `?${query}` : ''}`)
  return unwrapListContent<ClientBalanceResponse>(res)
}

export async function fetchClientBalanceByClientId(
  clientId: number,
  params?: { fromDate?: string; toDate?: string },
) {
  const search = new URLSearchParams()
  if (params?.fromDate) search.set('fromDate', params.fromDate)
  if (params?.toDate) search.set('toDate', params.toDate)
  const query = search.toString()
  const res = await http.get<ApiResponse<ClientBalanceResponse>>(
    `/api/client-balances/${clientId}${query ? `?${query}` : ''}`,
  )
  return unwrapData(res)
}

export async function adjustClientBalance(clientId: number, payload: ClientBalanceDTO) {
  const res = await http.put<ApiResponse<ClientBalanceResponse>>(
    `/api/client-balances/adjust/${clientId}`,
    payload,
  )
  return unwrapData(res)
}

export async function recalculateClientBalance(clientId: number) {
  const res = await http.put<ApiResponse<ClientBalanceResponse>>(
    `/api/client-balances/recalculate/${clientId}`,
  )
  return unwrapData(res)
}
