import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface ExpenseCategoryResponse {
  id: number
  name: string
  description: string | null
  status: Status
  createdAt: string
  updatedAt: string
}

export interface ExpenseCategoryDTO {
  name: string
  description?: string
}

export async function fetchAllExpenseCategories() {
  const res = await http.get<ApiResponse<unknown>>('/api/expense-categories')
  return unwrapListContent<ExpenseCategoryResponse>(res)
}

export async function fetchExpenseCategoryById(id: number) {
  const res = await http.get<ApiResponse<ExpenseCategoryResponse>>(`/api/expense-categories/${id}`)
  return unwrapData(res)
}

export async function createExpenseCategory(payload: ExpenseCategoryDTO) {
  const res = await http.post<ApiResponse<ExpenseCategoryResponse>>('/api/expense-categories/create', payload)
  return unwrapData(res)
}

export async function updateExpenseCategory(id: number, payload: ExpenseCategoryDTO) {
  const res = await http.put<ApiResponse<ExpenseCategoryResponse>>(`/api/expense-categories/update/${id}`, payload)
  return unwrapData(res)
}

export function deleteExpenseCategory(id: number) {
  return http.delete<unknown>(`/api/expense-categories/delete/${id}`)
}
