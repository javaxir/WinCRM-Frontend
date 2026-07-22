import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface CompanyDetailResponse {
  id: number
  companyName: string
  inn: string
  oked: string | null
  mfo: string | null
  accountNumber: string | null
  bankName: string | null
  director: string | null
  phone: string | null
  email: string | null
  address: string | null
  description: string | null
  status: Status
  createdAt: string
  updatedAt: string
}

export interface CompanyDetailDTO {
  companyName: string
  inn: string
  oked?: string
  mfo?: string
  accountNumber?: string
  bankName?: string
  director?: string
  phone?: string
  email?: string
  address?: string
  description?: string
}

export async function fetchAllCompanyDetails() {
  const res = await http.get<ApiResponse<unknown>>('/api/company-details')
  return unwrapListContent<CompanyDetailResponse>(res)
}

export async function fetchCurrentCompanyDetail() {
  const res = await http.get<ApiResponse<CompanyDetailResponse>>(`/api/company-details/current`)
  return unwrapData(res)
}

export async function fetchCompanyDetailById(id: number) {
  const res = await http.get<ApiResponse<CompanyDetailResponse>>(`/api/company-details/${id}`)
  return unwrapData(res)
}

export async function createCompanyDetail(payload: CompanyDetailDTO) {
  const res = await http.post<ApiResponse<CompanyDetailResponse>>('/api/company-details/create', payload)
  return unwrapData(res)
}

export async function updateCompanyDetail(id: number, payload: CompanyDetailDTO) {
  const res = await http.put<ApiResponse<CompanyDetailResponse>>(`/api/company-details/update/${id}`, payload)
  return unwrapData(res)
}

export function deleteCompanyDetail(id: number) {
  return http.delete<unknown>(`/api/company-details/delete/${id}`)
}
