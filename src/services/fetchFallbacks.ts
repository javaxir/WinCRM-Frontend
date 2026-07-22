import { HttpRequestError, isHttpRequestError } from './http'

export async function fetchByGoodsWithListFallback<T extends { goodsId: number }>(
  fetchByGoods: () => Promise<T[]>,
  fetchAll: () => Promise<T[]>,
  goodsId: number,
): Promise<T[]> {
  try {
    return await fetchByGoods()
  } catch (error) {
    if (isHttpRequestError(error) && error.status !== 403) {
      throw error
    }

    try {
      const all = await fetchAll()
      return all.filter((item) => item.goodsId === goodsId)
    } catch (fallbackError) {
      if (isHttpRequestError(fallbackError) && fallbackError.status === 403) {
        return []
      }
      throw fallbackError
    }
  }
}

export function getRequestErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

export function isAccessDeniedError(error: unknown) {
  return isHttpRequestError(error) && error.status === 403
}
