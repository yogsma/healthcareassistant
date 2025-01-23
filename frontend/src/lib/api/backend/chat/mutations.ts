import axios from 'axios'

interface ChatResponse {
  answer: string
}

export async function sendChatMessage(message: string): Promise<ChatResponse> {
  try {
    const response = await axios.post<ChatResponse>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/chat`,
      { message }
    )
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to get response')
    }
    throw error
  }
}