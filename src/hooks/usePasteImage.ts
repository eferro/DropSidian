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
      console.log('[DropSidian] handlePaste triggered', {
        hasClipboardData: !!event.clipboardData,
        types: event.clipboardData?.types,
      })

      const imageFile = extractImageFromClipboard(event.clipboardData)
      if (!imageFile) {
        console.log('[DropSidian] No image file extracted, letting default paste happen')
        return
      }

      console.log('[DropSidian] Image file extracted:', {
        name: imageFile.name,
        type: imageFile.type,
        size: imageFile.size,
      })

      event.preventDefault()
      setUploading(true)

      try {
        const filename = generatePastedImageName()
        const parentPath = getParentPath(currentNotePath)
        const uploadPath = `${parentPath}/${filename}`

        console.log('[DropSidian] Uploading image to:', uploadPath)
        await uploadBinaryFile(accessToken, uploadPath, imageFile)
        console.log('[DropSidian] Upload successful')
        onImagePasted(filename)
      } catch (error) {
        console.error('[DropSidian] Upload failed:', error)
      } finally {
        setUploading(false)
      }
    },
    [accessToken, currentNotePath, onImagePasted]
  )

  return { handlePaste, uploading }
}

