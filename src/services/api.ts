import type { ApiResponse } from './roles'

export function unwrapData<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === 'object' && 'data' in res && 'message' in res) {
    return (res as ApiResponse<T>).data
  }
  return res as T
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
  first: boolean
  last: boolean
  empty: boolean
}

export interface NestedPageData<T> {
  content: T[]
  page?: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

/** API javobidan ro'yxatni ajratib oladi (massiv yoki paginatsiyalangan content). */
export function unwrapListContent<T>(res: unknown): T[] {
  const data = unwrapData(res as ApiResponse<unknown>)

  if (Array.isArray(data)) {
    return data
  }

  if (data && typeof data === 'object' && 'content' in data) {
    const pageData = data as NestedPageData<T>
    if (Array.isArray(pageData.content)) {
      return pageData.content
    }
  }

  return []
}
