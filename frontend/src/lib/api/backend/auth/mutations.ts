import apiClient from '@/lib/api/client'

interface AuthResponse {
  access_token: string
}

export async function register(email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/api/auth/register', { email, password })
  return response.data
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', { email, password })
  return response.data
}
