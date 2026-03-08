import axios from 'axios'
import apiClient from '@/lib/api/client'

interface ChatResponse {
  answer: string
}

export async function sendChatMessage(fileId: string, message: string): Promise<ChatResponse> {
  try {
    const response = await apiClient.post<ChatResponse>('/api/chat', { fileId, message })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to get response')
    }
    throw error
  }
}