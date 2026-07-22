import { http } from './http'
import { unwrapData } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export type GoodsType = 'PRODUCT' | 'SERVICE' | 'WINDOW'

export interface GoodsResponse {
  id: number
  name: string
  goodsGroupId: number
  goodsGroupName: string
  unitTypeId: number
  unitTypeName: string
  type: GoodsType
  typeLabel: string
  priceCost: number
  priceSelling: number
  barcode: string | null
  photo?: string | null
  status: Status
  createdAt: string
  updatedAt: string
  createdUsername: string | null
}

export interface GoodsFormData {
  name: string
  goodsGroupId: number
  unitTypeId: number
  type: GoodsType
  priceCost: number
  priceSelling: number
  barcode?: string
  photo?: File | null
}

function buildGoodsFormData(data: GoodsFormData): FormData {
  const formData = new FormData()
  formData.append('name', data.name)
  formData.append('goodsGroupId', String(data.goodsGroupId))
  formData.append('unitTypeId', String(data.unitTypeId))
  formData.append('type', data.type)
  formData.append('priceCost', String(data.priceCost))
  formData.append('priceSelling', String(data.priceSelling))
  if (data.barcode?.trim()) {
    formData.append('barcode', data.barcode.trim())
  }
  if (data.photo) {
    formData.append('photo', data.photo)
  }
  return formData
}

export function getGoodsPhotoUrl(photo?: string | null): string | null {
  if (!photo) return null
  if (photo.startsWith('http://') || photo.startsWith('https://')) return photo
  const fileName = photo.includes('/') ? photo.split('/').pop()! : photo
  return `/api/files/${encodeURIComponent(fileName)}`
}

export async function fetchAllGoods() {
  const res = await http.get<ApiResponse<GoodsResponse[]> | GoodsResponse[]>('/api/goods')
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export async function fetchGoodsById(id: number) {
  const res = await http.get<ApiResponse<GoodsResponse>>(`/api/goods/${id}`)
  return unwrapData(res)
}

export async function createGoods(payload: GoodsFormData) {
  const formData = buildGoodsFormData(payload)
  const res = await http.postForm<ApiResponse<GoodsResponse>>('/api/goods/create', formData)
  return unwrapData(res)
}

export async function updateGoods(id: number, payload: GoodsFormData) {
  const formData = buildGoodsFormData(payload)
  const res = await http.putForm<ApiResponse<GoodsResponse>>(`/api/goods/update/${id}`, formData)
  return unwrapData(res)
}

export function deleteGoods(id: number) {
  return http.delete<unknown>(`/api/goods/delete/${id}`)
}
