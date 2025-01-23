import axios, { AxiosProgressEvent } from 'axios'

interface UploadFileResponse {
  fileId: string
  url: string
  // Add other response fields as needed
}

interface UploadProgressCallback {
  (progress: number): void
}

export async function uploadFile(
  file: File,
  onProgress?: UploadProgressCallback
): Promise<UploadFileResponse> {
  const formData = new FormData()
  formData.append('file', file)

  try {    
    const response = await axios.post<UploadFileResponse>(
      `${process.env.NEXT_PUBLIC_API_URL}/api/files/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              )
              onProgress(percentCompleted)
            }
        },
      }
    )

    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error('Failed to upload file');
    }
    throw error
  }
}