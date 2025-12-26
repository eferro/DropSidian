# OAuth Debug Plan - DropSidian

## Problema Reportado
- Al completar el flujo OAuth, se muestra el error: "Invalid state parameter - possible CSRF attack"
- El flujo no completa correctamente y no redirige a la página principal

## Arquitectura Actual del Flujo OAuth

### Almacenamiento Local Usado

| Storage | Key | Propósito |
|---------|-----|-----------|
| localStorage | `dropbox_code_verifier` | PKCE verifier para intercambio seguro |
| localStorage | `dropbox_oauth_state` | Validación CSRF |
| localStorage | `dropsidian_vault_path` | Path del vault configurado |
| localStorage | `dropsidian_inbox_path` | Path del inbox configurado |
| IndexedDB | `dropsidian.tokens.refresh_token` | Token de refresco |

### Flujo OAuth Paso a Paso

```
1. Usuario → Click "Connect to Dropbox"
2. buildAuthUrl() → Genera verifier + state → Guarda en localStorage
3. Usuario → Redirigido a Dropbox OAuth
4. Dropbox → Redirige a http://localhost:5173/?code=xxx&state=xxx
5. OAuthRedirectHandler → Detecta ?code en URL
6. OAuthRedirectHandler → Navigate to "#/callback?code=xxx&state=xxx"
7. Callback.tsx → Valida state === localStorage.dropbox_oauth_state
8. Callback.tsx → exchangeCodeForTokens() → Guarda tokens
9. Callback.tsx → navigate("/") → Página principal
```

## Problemas Identificados

### 1. Logout Incompleto
**Archivo:** `src/context/AuthContext.tsx`

La función `logout()` solo limpia:
- Token en IndexedDB
- Estado de React

**NO limpia:**
- `dropbox_code_verifier` (localStorage)
- `dropbox_oauth_state` (localStorage)
- `dropsidian_vault_path` (localStorage)
- `dropsidian_inbox_path` (localStorage)

**Impacto:** Datos obsoletos pueden interferir con un nuevo flujo OAuth.

### 2. HashRouter vs Query Parameters
**Archivos:** `src/App.tsx`, `vite.config.ts`

- La app usa `HashRouter` (rutas con #)
- Dropbox redirige con query params en URL principal
- `OAuthRedirectHandler` captura params y redirige a hash route
- Posible pérdida de datos durante la transición

### 3. vite.config.ts base path
**Archivo:** `vite.config.ts`

```js
base: '/DropSidian/'
```

Configurado para GitHub Pages, podría interferir en desarrollo local.

## Tareas de Depuración

### Fase 1: Preparación
- [ ] Verificar configuración `.env.local` (VITE_DROPBOX_APP_KEY, VITE_REDIRECT_URI)
- [ ] Verificar que REDIRECT_URI coincide con la configurada en Dropbox Console
- [ ] Confirmar que en Dropbox está configurado: `http://localhost:5173/`

### Fase 2: Mejorar Logout
- [ ] Crear función `clearAllOAuthData()` que limpie TODO el localStorage relacionado
- [ ] Actualizar `logout()` para usar esta función
- [ ] Añadir logs de debug para verificar limpieza completa

### Fase 3: Añadir Logs Exhaustivos
- [ ] Log al inicio del flujo OAuth (buildAuthUrl)
- [ ] Log cuando se guarda state en localStorage
- [ ] Log cuando Dropbox redirige de vuelta
- [ ] Log en OAuthRedirectHandler mostrando:
  - URL completa
  - Query params
  - State en localStorage antes de procesar
- [ ] Log en Callback.tsx mostrando:
  - State recibido de Dropbox
  - State almacenado en localStorage
  - Comparación exacta

### Fase 4: Validar Flujo Completo
1. Abrir DevTools → Application → LocalStorage + IndexedDB
2. Limpiar TODO manualmente
3. Iniciar servidor de desarrollo
4. Click "Connect to Dropbox"
5. Verificar que state se guardó en localStorage
6. Autorizar en Dropbox
7. Verificar URL de retorno
8. Verificar logs en consola
9. Verificar redirección exitosa a página principal

## Checklist de Validación

### Pre-requisitos
- [ ] App key configurado: `p31ord2nrwewqx3`
- [ ] Redirect URI local: `http://localhost:5173/`
- [ ] Puerto del servidor: 5173

### Ciclo de Test
1. [ ] Estado inicial: No autenticado, localStorage vacío
2. [ ] Click Connect → Redirige a Dropbox
3. [ ] Autorizar en Dropbox → Redirige a localhost
4. [ ] URL contiene `?code=xxx&state=xxx`
5. [ ] Callback procesa correctamente
6. [ ] Redirige a "/" (página principal)
7. [ ] Usuario aparece como autenticado
8. [ ] Click Disconnect → Limpia TODO
9. [ ] Repetir ciclo completo sin errores

## Configuración de Dropbox Actual (según screenshots)

```
App key: p31ord2nrwewqx3
Redirect URIs:
  - https://eferro.github.io/DropSidian/
  - http://localhost:5173/
Permission type: Scoped App
Allow public clients: Allow (Implicit Grant & PKCE)
```

## Comandos de Debug

```bash
# Iniciar servidor de desarrollo
make dev

# Ver logs en consola del navegador
# Filtrar por: [DropSidian]

# Limpiar localStorage desde consola
localStorage.clear()

# Limpiar IndexedDB desde consola
indexedDB.deleteDatabase('dropsidian')
```

