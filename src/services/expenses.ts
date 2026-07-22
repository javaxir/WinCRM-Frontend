import { http } from './http'
import { unwrapData, unwrapListContent } from './api'
import type { ApiResponse } from './roles'
import type { Status } from './roles'

export interface ExpenseResponse {
  id: number
  categoryId: number
  categoryName: string
  amount: number
  expenseDate: string
  description: string | null
  status: Status
  createdAt: string
  updatedAt: string
}

export interface ExpenseDTO {
  categoryId: number
  amount: number
  expenseDate: string
  description?: string
}

export async function fetchAllExpenses() {
  const res = await http.get<ApiResponse<unknown>>('/api/expenses')
  return unwrapListContent<ExpenseResponse>(res)
}

export async function fetchExpensesByCategory(categoryId: number) {
  const res = await http.get<ApiResponse<unknown>>(`/api/expenses/category/${categoryId}`)
  return unwrapListContent<ExpenseResponse>(res)
}

export async function fetchExpensesByDateRange(startDate: string, endDate: string) {
  const params = new URLSearchParams({ startDate, endDate })
  const res = await http.get<ApiResponse<unknown>>(`/api/expenses/date-range?${params}`)
  return unwrapListContent<ExpenseResponse>(res)
}

export async function fetchExpensesByDateRangePaginated(
  startDate: string,
  endDate: string,
  page = 0,
  size = 50,
) {
  const params = new URLSearchParams({
    startDate,
    endDate,
    page: String(page),
    size: String(size),
  })
  const res = await http.get<ApiResponse<unknown>>(`/api/expenses/date-range/paginated?${params}`)
  return unwrapListContent<ExpenseResponse>(res)
}

export async function fetchExpenseById(id: number) {
  const res = await http.get<ApiResponse<ExpenseResponse>>(`/api/expenses/${id}`)
  return unwrapData(res)
}

export async function createExpense(payload: ExpenseDTO) {
  const res = await http.post<ApiResponse<ExpenseResponse>>('/api/expenses/create', payload)
  return unwrapData(res)
}

export async function updateExpense(id: number, payload: ExpenseDTO) {
  const res = await http.put<ApiResponse<ExpenseResponse>>(`/api/expenses/update/${id}`, payload)
  return unwrapData(res)
}

export function deleteExpense(id: number) {
  return http.delete<unknown>(`/api/expenses/delete/${id}`)
}
