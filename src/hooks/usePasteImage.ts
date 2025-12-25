import { useCallback, useState } from 'react'
import {
  extractImageFromClipboard,
  generatePastedImageName,
} from '../lib/clipboard-image'
import { uploadBinaryFile } from '../lib/dropbox-client'

interface UsePasteImageOptions {
  accessToken: string
  currentNotePath: string
  onImagePasted: (filename: string) => void
}

interface UsePasteImageResult {
  handlePaste: (event: React.ClipboardEvent) => Promise<void>
  uploading: boolean
}

function getParentPath(filePath: string): string {
  const parts = filePath.split('/')
  parts.pop()
  return parts.join('/')
}

export function usePasteImage({
  accessToken,
  currentNotePath,
  onImagePasted,
}: UsePasteImageOptions): UsePasteImageResult {
  const [uploading, setUploading] = useState(false)

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const imageFile = extractImageFromClipboard(event.clipboardData)
      if (!imageFile) {
        return
      }

      event.preventDefault()
      setUploading(true)

      try {
        const filename = generatePastedImageName()
        const parentPath = getParentPath(currentNotePath)
        const uploadPath = `${parentPath}/${filename}`

        await uploadBinaryFile(accessToken, uploadPath, imageFile)
        onImagePasted(filename)
      } finally {
        setUploading(false)
      }
    },
    [accessToken, currentNotePath, onImagePasted]
  )

  return { handlePaste, uploading }
}

