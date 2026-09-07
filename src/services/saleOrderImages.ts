import { http } from './http'
import { unwrapData } from './api'
import type { ApiResponse, Status } from './roles'

export type SaleOrderImageType = 'OBJECT' | 'PROJECT' | 'OTHER'

export interface SaleOrderImageResponse {
  id: number
  saleOrderId: number
  fileName: string
  originalFileName: string | null
  downloadUrl: string | null
  contentType: string | null
  size: number | null
  imageType: SaleOrderImageType | null
  status: Status
  createdAt: string
  createdBy: number | null
}

export async function fetchSaleOrderImages(saleOrderId: number) {
  const res = await http.get<ApiResponse<SaleOrderImageResponse[]> | SaleOrderImageResponse[]>(
    `/api/sale-orders/${saleOrderId}/images`,
  )
  const data = unwrapData(res)
  return (Array.isArray(data) ? data : []).filter((img) => img.status !== 'DELETED')
}

export async function uploadSaleOrderImages(
  saleOrderId: number,
  files: File[],
  imageType?: SaleOrderImageType,
) {
  const form = new FormData()
  for (const file of files) {
    form.append('files', file)
  }
  const qs = imageType ? `?imageType=${encodeURIComponent(imageType)}` : ''
  const res = await http.postForm<ApiResponse<SaleOrderImageResponse[]> | SaleOrderImageResponse[]>(
    `/api/sale-orders/${saleOrderId}/images${qs}`,
    form,
  )
  const data = unwrapData(res)
  return Array.isArray(data) ? data : []
}

export function deleteSaleOrderImage(saleOrderId: number, imageId: number) {
  return http.delete<unknown>(`/api/sale-orders/${saleOrderId}/images/${imageId}`)
}

export function resolveSaleOrderImageUrl(image: SaleOrderImageResponse) {
  if (image.downloadUrl?.trim()) return image.downloadUrl
  return `/api/files/${encodeURIComponent(image.fileName)}`
}
