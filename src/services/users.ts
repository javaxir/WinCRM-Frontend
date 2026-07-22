import { http } from './http'
import type { ApiResponse, RoleResponse, Status } from './roles'

export interface UserResponse {
  id: number
  username: string
  fullName: string
  phone: string
  status: Status
  createdAt: string
  updateAt: string
  role: RoleResponse[]
  photoLink?: string | null
}

export interface UserFormData {
  username: string
  password?: string
  fullName: string
  phone: string
  roleIds: number[]
  photo?: File | null
}

function buildUserFormData(data: UserFormData, isUpdate = false): FormData {
  const formData = new FormData()
  formData.append('username', data.username)
  formData.append('fullName', data.fullName)
  formData.append('phone', data.phone)
  data.roleIds.forEach((id) => formData.append('roleIds', String(id)))

  if (data.password) {
    formData.append('password', data.password)
  } else if (!isUpdate) {
    formData.append('password', '')
  }

  if (data.photo) {
    formData.append('photo', data.photo)
  }

  return formData
}

/** Foydalanuvchi rasmi URL (proxy orqali backend'ga) */
export function getUserPhotoUrl(photoLink?: string | null): string | null {
  if (!photoLink) return null
  if (photoLink.startsWith('http://') || photoLink.startsWith('https://')) {
    return photoLink
  }
  // photoLink fayl nomi yoki yo'l bo'lishi mumkin
  const fileName = photoLink.includes('/') ? photoLink.split('/').pop()! : photoLink
  return `/api/files/${encodeURIComponent(fileName)}`
}

export async function fetchAllUsers() {
  const res = await http.get<ApiResponse<UserResponse[]> | UserResponse[]>('/api/users')
  if (Array.isArray(res)) return res
  return res.data
}

export async function fetchUserById(id: number) {
  const res = await http.get<ApiResponse<UserResponse>>(`/api/users/${id}`)
  return res.data
}

export async function createUser(payload: UserFormData) {
  const formData = buildUserFormData(payload)
  const res = await http.postForm<ApiResponse<UserResponse>>('/api/users/create', formData)
  return res.data
}

export async function updateUser(id: number, payload: UserFormData) {
  const formData = buildUserFormData(payload, true)
  const res = await http.putForm<ApiResponse<UserResponse>>(`/api/users/update/${id}`, formData)
  return res.data
}

export function changeUserStatus(id: number) {
  return http.put<unknown>(`/api/users/change/status/${id}`)
}

export function deleteUser(id: number) {
  return http.delete<unknown>(`/api/users/delete/${id}`)
}

export interface UserStatResponse {
  userId: number
  userFullName: string
  totalOrdersCount: number
  totalOrdersSum: number
  totalPaidSum: number
  totalDebt: number
}

export async function fetchUserStats(id: number) {
  const res = await http.get<ApiResponse<UserStatResponse>>(`/api/users/${id}/stats`)
  return res.data
}
