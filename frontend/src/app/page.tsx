"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadFile } from "@/lib/api/backend/file-upload/mutations"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setUploading(true)
    
    try {
      const result = await uploadFile(file, (progress) => {
        setProgress(progress)
      })
      
      router.push('/chat')
    } catch (error) {
      console.error('Upload failed:', error)
      // Optionally show error toast here
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload Your File</CardTitle>
          <CardDescription>
            Upload a file to start asking questions about its contents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>

            {uploading && (
              <div className="space-y-2">
                <Label>Upload Progress</Label>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!file || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload and Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}