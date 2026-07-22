import { http } from './http'

export function getFileUrl(fileName: string) {
  return `/api/files/${encodeURIComponent(fileName)}`
}

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  return http.postForm<string>('/api/files/upload', form)
}

export function deleteFile(fileName: string) {
  return http.delete<unknown>(`/api/files/${encodeURIComponent(fileName)}`)
}
