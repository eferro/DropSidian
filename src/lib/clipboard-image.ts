export function generatePastedImageName(date: Date = new Date()): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = String(date.getUTCSeconds()).padStart(2, '0')

  return `Pasted image ${year}${month}${day}${hours}${minutes}${seconds}.png`
}

export function extractImageFromClipboard(
  clipboardData: DataTransfer | null
): File | null {
  console.log('[DropSidian] extractImageFromClipboard called', {
    hasClipboardData: !!clipboardData,
    hasItems: !!clipboardData?.items,
    itemsLength: clipboardData?.items?.length,
    hasFiles: !!clipboardData?.files,
    filesLength: clipboardData?.files?.length,
  })

  if (!clipboardData) {
    console.log('[DropSidian] No clipboardData')
    return null
  }

  if (clipboardData.items) {
    console.log('[DropSidian] Checking items...')
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i]
      console.log(`[DropSidian] Item ${i}:`, {
        kind: item.kind,
        type: item.type,
      })
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile()
        console.log('[DropSidian] Found image in items:', file)
        return file
      }
    }
  }

  if (clipboardData.files) {
    console.log('[DropSidian] Checking files...')
    for (let i = 0; i < clipboardData.files.length; i++) {
      const file = clipboardData.files[i]
      console.log(`[DropSidian] File ${i}:`, {
        name: file.name,
        type: file.type,
        size: file.size,
      })
      if (file.type.startsWith('image/')) {
        console.log('[DropSidian] Found image in files:', file)
        return file
      }
    }
  }

  console.log('[DropSidian] No image found in clipboard')
  return null
}

