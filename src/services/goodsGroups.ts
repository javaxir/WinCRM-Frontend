import { http } from './http'
import { unwrapData, type PageResponse } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface GoodsGroupResponse {
  id: number
  name: string
  status: Status
  createdUsername: string | null
  createdAt: string
  updatedAt: string
}

export interface GoodsGroupDTO {
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

function unwrapPage(res: ApiResponse<PageResponse<GoodsGroupResponse>> | PageResponse<GoodsGroupResponse>) {
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
  } satisfies PageResponse<GoodsGroupResponse>
}

export async function fetchAllGoodsGroups() {
  const res = await http.get<ApiResponse<GoodsGroupResponse[]> | GoodsGroupResponse[]>('/api/goods-groups')
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchGoodsGroupsPage(params: PageParams) {
  const res = await http.get<ApiResponse<PageResponse<GoodsGroupResponse>> | PageResponse<GoodsGroupResponse>>(
    `/api/goods-groups/page?${buildPageQuery(params)}`,
  )
  return unwrapPage(res)
}

export async function fetchGoodsGroupById(id: number) {
  const res = await http.get<ApiResponse<GoodsGroupResponse>>(`/api/goods-groups/${id}`)
  return unwrapData(res)
}

export async function createGoodsGroup(payload: GoodsGroupDTO) {
  const res = await http.post<ApiResponse<GoodsGroupResponse>>('/api/goods-groups', payload)
  return unwrapData(res)
}

export async function updateGoodsGroup(id: number, payload: GoodsGroupDTO) {
  const res = await http.put<ApiResponse<GoodsGroupResponse>>(`/api/goods-groups/${id}`, payload)
  return unwrapData(res)
}

export function deleteGoodsGroup(id: number) {
  return http.delete<unknown>(`/api/goods-groups/${id}`)
}
