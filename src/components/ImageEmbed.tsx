import { useEffect, useState } from 'react'
import { getTemporaryLink } from '../lib/dropbox-client'

interface ImageEmbedProps {
  target: string
  filePath: string
  accessToken: string
}

function ImageEmbed({ filePath, accessToken }: ImageEmbedProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTemporaryLink(accessToken, filePath)
      .then((url) => {
        setImageUrl(url)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [accessToken, filePath])

  if (loading) {
    return <span>Loading image...</span>
  }

  if (!imageUrl) {
    return <span>[Image not found]</span>
  }

  return <img src={imageUrl} alt={filePath} style={{ maxWidth: '100%' }} />
}

export default ImageEmbed

