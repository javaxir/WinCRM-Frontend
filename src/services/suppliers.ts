import { http } from './http'
import { unwrapData, type PageResponse } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface SupplierResponse {
  id: number
  name: string
  inn: string | null
  phone: string
  additionalPhone: string | null
  address: string | null
  bankName: string | null
  mfo: string | null
  accountNumber: string | null
  description: string | null
  status: Status
  createdUsername: string | null
  createdAt: string
  updatedAt: string
}

export interface SupplierDTO {
  name: string
  phone: string
  inn?: string
  additionalPhone?: string
  address?: string
  bankName?: string
  mfo?: string
  accountNumber?: string
  description?: string
}

export interface SupplierFilterDTO {
  name?: string
  inn?: string
  phone?: string
  status?: Status
  fromDate?: string
  toDate?: string
}

export interface PageParams {
  page: number
  size: number
  sort?: string
}

function buildPageQuery({ page, size, sort }: PageParams) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  })
  if (sort) params.set('sort', sort)
  return params.toString()
}

function unwrapPage(res: ApiResponse<PageResponse<SupplierResponse>> | PageResponse<SupplierResponse>) {
  const data = unwrapData(res)
  if (data && Array.isArray(data.content)) return data
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 0,
    number: 0,
    first: true,
    last: true,
    empty: true,
  } satisfies PageResponse<SupplierResponse>
}

export async function fetchSuppliersPage(params: PageParams) {
  const res = await http.get<ApiResponse<PageResponse<SupplierResponse>> | PageResponse<SupplierResponse>>(
    `/api/suppliers?${buildPageQuery(params)}`,
  )
  return unwrapPage(res)
}

export async function filterSuppliersPage(filter: SupplierFilterDTO, params: PageParams) {
  const res = await http.post<ApiResponse<PageResponse<SupplierResponse>> | PageResponse<SupplierResponse>>(
    `/api/suppliers/filter?${buildPageQuery(params)}`,
    filter,
  )
  return unwrapPage(res)
}

export async function fetchSupplierById(id: number) {
  const res = await http.get<ApiResponse<SupplierResponse>>(`/api/suppliers/${id}`)
  return unwrapData(res)
}

export async function createSupplier(payload: SupplierDTO) {
  const res = await http.post<ApiResponse<SupplierResponse>>('/api/suppliers/create', payload)
  return unwrapData(res)
}

export async function updateSupplier(id: number, payload: SupplierDTO) {
  const res = await http.put<ApiResponse<SupplierResponse>>(`/api/suppliers/update/${id}`, payload)
  return unwrapData(res)
}

export function changeSupplierStatus(id: number, status: Status) {
  return http.put<unknown>(`/api/suppliers/change/status/${id}?status=${status}`)
}

export function deleteSupplier(id: number) {
  return http.delete<unknown>(`/api/suppliers/delete/${id}`)
}
