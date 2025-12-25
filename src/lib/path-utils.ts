export function sanitizeFilename(name: string): string {
  return name
    .replace(/\.\./g, '')
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim()
    .slice(0, 200)
}

export function sanitizePath(path: string): string {
  const parts = path.split('/').filter(Boolean)
  const normalized: string[] = []

  for (const part of parts) {
    if (part === '..') {
      normalized.pop()
    } else if (part !== '.') {
      normalized.push(part)
    }
  }

  return '/' + normalized.join('/')
}

export function isWithinVault(targetPath: string, vaultRoot: string): boolean {
  const normalizedTarget = sanitizePath(targetPath).toLowerCase()
  const normalizedRoot = vaultRoot.toLowerCase()

  return normalizedTarget.startsWith(normalizedRoot)
}

export function getParentPath(filePath: string): string {
  const parts = filePath.split('/')
  parts.pop()
  return parts.join('/')
}

export function removeExtension(filename: string): string {
  return filename.replace(/\.md$/, '')
}

