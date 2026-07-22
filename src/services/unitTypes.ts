import { http } from './http'
import { unwrapData, type PageResponse } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface UnitTypeResponse {
  id: number
  name: string
  status: Status
  createdUsername: string | null
  createdAt: string
  updatedAt: string
}

export interface UnitTypeDTO {
  name: string
}

export interface PageParams {
  page: number
  size: number
  sort?: string
}

function buildPageQuery({ page, size, sort }: PageParams) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (sort) params.set('sort', sort)
  return params.toString()
}

function unwrapPage(res: ApiResponse<PageResponse<UnitTypeResponse>> | PageResponse<UnitTypeResponse>) {
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
  } satisfies PageResponse<UnitTypeResponse>
}

export async function fetchAllUnitTypes() {
  const res = await http.get<ApiResponse<UnitTypeResponse[]> | UnitTypeResponse[]>('/api/unit-types')
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchUnitTypesPage(params: PageParams) {
  const res = await http.get<ApiResponse<PageResponse<UnitTypeResponse>> | PageResponse<UnitTypeResponse>>(
    `/api/unit-types/page?${buildPageQuery(params)}`,
  )
  return unwrapPage(res)
}

export async function fetchUnitTypeById(id: number) {
  const res = await http.get<ApiResponse<UnitTypeResponse>>(`/api/unit-types/${id}`)
  return unwrapData(res)
}

export async function createUnitType(payload: UnitTypeDTO) {
  const res = await http.post<ApiResponse<UnitTypeResponse>>('/api/unit-types', payload)
  return unwrapData(res)
}

export async function updateUnitType(id: number, payload: UnitTypeDTO) {
  const res = await http.put<ApiResponse<UnitTypeResponse>>(`/api/unit-types/${id}`, payload)
  return unwrapData(res)
}

export function deleteUnitType(id: number) {
  return http.delete<unknown>(`/api/unit-types/${id}`)
}
