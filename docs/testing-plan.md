# DropSidian — Testing Plan

> Plan for introducing testing infrastructure and achieving comprehensive test coverage following TDD.

---

## Overview

| Phase | Goal | Status |
|-------|------|--------|
| T0 | Testing Infrastructure Setup | ⬜ Not started |
| T1 | Testing Utilities & Patterns | ⬜ Not started |
| T2 | Existing Code Coverage | ⬜ Not started |
| T3 | TDD Workflow Integration | ⬜ Not started |

---

## Current State

**Missing:**
- No test files (`*.test.*`, `*.spec.*`)
- No test directories (`tests/`, `__tests__/`)
- No `test` script in `package.json`
- No testing libraries installed (Vitest, Testing Library, jsdom)
- No coverage configuration

**Existing tooling:**
- Vite as build tool
- TypeScript for type checking
- ESLint for linting
- Prettier for formatting
- Makefile as task runner

---

# 🧪 Phase T0 — Testing Infrastructure Setup

## T0.1 — Install Testing Dependencies

**Goal:** Install all required testing libraries.

**Tasks:**
1. Install Vitest (test runner native to Vite)
2. Install @testing-library/react and @testing-library/jest-dom
3. Install @testing-library/user-event for user interaction simulation
4. Install jsdom for browser environment simulation

**Technical details:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node
```

**Packages explanation:**
| Package | Purpose |
|---------|---------|
| `vitest` | Test runner with native Vite integration |
| `@testing-library/react` | React component testing utilities |
| `@testing-library/jest-dom` | Custom matchers (toBeInTheDocument, etc.) |
| `@testing-library/user-event` | User interaction simulation |
| `jsdom` | Browser DOM simulation for Node.js |
| `@types/node` | Node.js type definitions |

**Validation:**
- [ ] All packages installed without errors
- [ ] No version conflicts

---

## T0.2 — Configure Vitest

**Goal:** Set up Vitest configuration for React testing.

**Tasks:**
1. Create `vitest.config.ts` with proper settings
2. Add test setup file for global matchers
3. Update `tsconfig.json` to include test types

**Technical details:**

`vitest.config.ts`:
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'src/main.tsx',
        'src/vite-env.d.ts',
      ],
    },
  },
});
```

`src/test/setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

`tsconfig.json` update (add to compilerOptions):
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

**Files to create/modify:**
- `vitest.config.ts` — Vitest configuration
- `src/test/setup.ts` — Global test setup
- `tsconfig.json` — Add test types

**Validation:**
- [ ] `vitest.config.ts` created with correct settings
- [ ] Setup file imports jest-dom matchers
- [ ] TypeScript recognizes test globals (describe, it, expect)

---

## T0.3 — Add npm Scripts

**Goal:** Add test-related scripts to package.json.

**Tasks:**
1. Add `test` script for running tests
2. Add `test:watch` for TDD workflow
3. Add `test:coverage` for coverage reports
4. Add `test:ui` for visual test interface (optional)

**Technical details:**

`package.json` scripts section:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

**Validation:**
- [ ] `npm test` runs all tests
- [ ] `npm run test:watch` starts watch mode
- [ ] `npm run test:coverage` generates coverage report

---

## T0.4 — Update Makefile

**Goal:** Add testing targets to Makefile.

**Tasks:**
1. Add `test` target for running tests once
2. Add `test-watch` target for TDD workflow
3. Add `test-coverage` target for coverage reports
4. Update `validate` target to include tests

**Technical details:**

Add to Makefile:
```makefile
.PHONY: test test-watch test-coverage

# Run tests once
test:
	npm test

# Run tests in watch mode (for TDD)
test-watch:
	npm run test:watch

# Run tests with coverage report
test-coverage:
	npm run test:coverage

# Update validate target
validate: lint type-check test
	@echo "All checks passed!"
```

Update `help` target:
```makefile
help:
	@echo "DropSidian - Available targets:"
	@echo ""
	@echo "  local-setup   Install dependencies and setup environment"
	@echo "  dev           Start development server"
	@echo "  build         Production build"
	@echo "  preview       Preview production build"
	@echo "  lint          Run ESLint"
	@echo "  type-check    Run TypeScript compiler"
	@echo "  format        Format code with Prettier"
	@echo "  test          Run tests once"
	@echo "  test-watch    Run tests in watch mode (TDD)"
	@echo "  test-coverage Run tests with coverage report"
	@echo "  validate      Run all checks (lint, type-check, test)"
	@echo "  clean         Remove build artifacts"
	@echo ""
```

**Validation:**
- [ ] `make test` runs tests
- [ ] `make test-watch` starts watch mode
- [ ] `make test-coverage` shows coverage
- [ ] `make validate` includes tests

---

## T0.5 — Create First Smoke Test

**Goal:** Verify testing infrastructure works with a simple test.

**Tasks:**
1. Create a simple utility test
2. Run the test to verify setup
3. Confirm test output is correct

**Technical details:**

`src/lib/pkce.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateCodeVerifier } from './pkce';

describe('PKCE utilities', () => {
  describe('generateCodeVerifier', () => {
    it('generates a string of correct length', () => {
      const verifier = generateCodeVerifier();
      
      expect(verifier).toBeDefined();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);
    });
  });
});
```

**Validation:**
- [ ] Test file created
- [ ] `make test` passes
- [ ] Test output shows 1 test passed

---

# 🧪 Phase T1 — Testing Utilities & Patterns

## T1.1 — Component Test Utilities

**Goal:** Create reusable utilities for component testing.

**Tasks:**
1. Create custom render function with providers
2. Create mock factories for common objects
3. Document testing patterns

**Technical details:**

`src/test/test-utils.tsx`:
```typescript
import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';

interface WrapperProps {
  children: ReactNode;
}

function AllProviders({ children }: WrapperProps) {
  return (
    <BrowserRouter>
      <AuthProvider>
        {children}
      </AuthProvider>
    </BrowserRouter>
  );
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
```

**Files to create:**
- `src/test/test-utils.tsx` — Custom render with providers
- `src/test/mocks/` — Directory for mock factories

**Validation:**
- [ ] Custom render function works
- [ ] Providers are properly wrapped
- [ ] Tests can import from `test-utils`

---

## T1.2 — Mock Factories

**Goal:** Create factories for generating test data.

**Tasks:**
1. Create auth state mock factory
2. Create Dropbox API response mock factories
3. Create user account mock factory

**Technical details:**

`src/test/mocks/auth.ts`:
```typescript
interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
}

export function createAuthState(overrides: Partial<AuthState> = {}): AuthState {
  return {
    isAuthenticated: false,
    accessToken: null,
    isLoading: false,
    ...overrides,
  };
}

export function createAuthenticatedState(): AuthState {
  return createAuthState({
    isAuthenticated: true,
    accessToken: 'mock-access-token',
  });
}
```

`src/test/mocks/dropbox.ts`:
```typescript
interface DropboxAccount {
  account_id: string;
  email: string;
  name: {
    display_name: string;
  };
}

export function createDropboxAccount(
  overrides: Partial<DropboxAccount> = {}
): DropboxAccount {
  return {
    account_id: 'dbid:test-account-id',
    email: 'test@example.com',
    name: {
      display_name: 'Test User',
    },
    ...overrides,
  };
}
```

**Files to create:**
- `src/test/mocks/auth.ts` — Auth state factories
- `src/test/mocks/dropbox.ts` — Dropbox response factories
- `src/test/mocks/index.ts` — Re-exports

**Validation:**
- [ ] Mock factories generate valid data
- [ ] Overrides work correctly
- [ ] Types are properly inferred

---

## T1.3 — API Mocking Setup

**Goal:** Set up fetch mocking for API tests.

**Tasks:**
1. Install MSW (Mock Service Worker) or use vi.mock
2. Create mock handlers for Dropbox API
3. Document API mocking patterns

**Technical details:**

Option A: Using vi.mock (simpler, for unit tests):
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockClear();
});

it('exchanges code for token', async () => {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_in: 14400,
    }),
  });

  const result = await exchangeCodeForToken('test-code', 'test-verifier');
  
  expect(result.access_token).toBe('test-token');
});
```

Option B: Using MSW (more realistic, for integration tests):
```bash
npm install -D msw
```

```typescript
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const server = setupServer(
  http.post('https://api.dropboxapi.com/oauth2/token', () => {
    return HttpResponse.json({
      access_token: 'test-token',
      refresh_token: 'test-refresh',
      expires_in: 14400,
    });
  })
);
```

**Recommendation:** Start with `vi.mock` for simplicity, add MSW later if needed.

**Validation:**
- [ ] API calls can be mocked
- [ ] Mock responses are realistic
- [ ] Tests are isolated from network

---

# 🧪 Phase T2 — Existing Code Coverage

## T2.1 — Test `pkce.ts` Utilities

**Goal:** Full coverage for PKCE utilities.

**Tests to write:**
1. `generateCodeVerifier` returns valid string
2. `generateCodeVerifier` returns different values each call
3. `generateCodeChallenge` produces correct hash format
4. `generateCodeChallenge` is deterministic for same input

**File:** `src/lib/pkce.test.ts`

**Validation:**
- [ ] All PKCE functions tested
- [ ] Edge cases covered
- [ ] 100% coverage for pkce.ts

---

## T2.2 — Test `token-storage.ts`

**Goal:** Full coverage for token storage.

**Tests to write:**
1. `saveTokens` stores tokens correctly
2. `getTokens` retrieves stored tokens
3. `clearTokens` removes all tokens
4. Handle missing/corrupted data gracefully

**Technical details:**
- Mock localStorage/IndexedDB
- Test error scenarios

**File:** `src/lib/token-storage.test.ts`

**Validation:**
- [ ] Storage operations tested
- [ ] Error handling tested
- [ ] 100% coverage for token-storage.ts

---

## T2.3 — Test `dropbox-auth.ts`

**Goal:** Full coverage for auth utilities.

**Tests to write:**
1. `buildAuthUrl` generates correct URL
2. `buildAuthUrl` includes all required parameters
3. `exchangeCodeForToken` makes correct API call
4. `exchangeCodeForToken` handles errors

**File:** `src/lib/dropbox-auth.test.ts`

**Validation:**
- [ ] URL building tested
- [ ] Token exchange tested
- [ ] Error scenarios tested

---

## T2.4 — Test `dropbox-client.ts`

**Goal:** Full coverage for API client.

**Tests to write:**
1. `getCurrentAccount` makes correct API call
2. `getCurrentAccount` returns account info
3. Handle API errors gracefully
4. Handle network errors

**File:** `src/lib/dropbox-client.test.ts`

**Validation:**
- [ ] API client methods tested
- [ ] Error handling tested
- [ ] Token refresh scenarios (when implemented)

---

## T2.5 — Test `AuthContext.tsx`

**Goal:** Full coverage for auth context.

**Tests to write:**
1. Initial state is unauthenticated
2. `login` updates state correctly
3. `logout` clears state
4. Context provides values to children

**Technical details:**
```typescript
import { render, screen } from '../test/test-utils';
import { useAuth } from './AuthContext';

function TestComponent() {
  const { isAuthenticated } = useAuth();
  return <div>{isAuthenticated ? 'logged in' : 'logged out'}</div>;
}

it('provides auth state to children', () => {
  render(<TestComponent />);
  expect(screen.getByText('logged out')).toBeInTheDocument();
});
```

**File:** `src/context/AuthContext.test.tsx`

**Validation:**
- [ ] Context provider tested
- [ ] Hook returns correct values
- [ ] State updates work

---

## T2.6 — Test Components

**Goal:** Test all existing React components.

**Components to test:**
1. `ConnectDropboxButton` — renders, click triggers auth
2. `AccountInfo` — displays account information
3. `Home` — renders connect button when not authenticated
4. `Callback` — handles OAuth callback
5. `NotFound` — renders 404 message
6. `App` — routes work correctly

**File pattern:** `src/components/{Component}.test.tsx`, `src/pages/{Page}.test.tsx`

**Validation:**
- [ ] All components have tests
- [ ] User interactions tested
- [ ] Edge cases covered

---

# 🧪 Phase T3 — TDD Workflow Integration

## T3.1 — Document TDD Workflow

**Goal:** Establish clear TDD process for new features.

**Workflow:**
1. Write failing test first
2. Run `make test-watch` for continuous feedback
3. Implement minimum code to pass
4. Refactor if needed
5. Repeat

**Documentation:**
- Add TDD section to project README or development guide
- Include examples of test-first development

**Validation:**
- [ ] TDD workflow documented
- [ ] Team understands process

---

## T3.2 — Coverage Thresholds

**Goal:** Enforce minimum coverage levels.

**Tasks:**
1. Configure coverage thresholds in Vitest
2. Fail CI if coverage drops below threshold

**Technical details:**

Add to `vitest.config.ts`:
```typescript
test: {
  coverage: {
    thresholds: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
}
```

**Validation:**
- [ ] Thresholds configured
- [ ] CI fails on low coverage

---

## T3.3 — CI Integration

**Goal:** Run tests in GitHub Actions.

**Tasks:**
1. Add test step to existing workflow
2. Upload coverage reports
3. Add coverage badge to README

**Technical details:**

Add to `.github/workflows/deploy.yml`:
```yaml
- name: Run tests
  run: npm test

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

**Validation:**
- [ ] Tests run in CI
- [ ] Coverage reported
- [ ] Badge shows in README

---

# 📁 Final Directory Structure

```
src/
├── components/
│   ├── AccountInfo.tsx
│   ├── AccountInfo.test.tsx
│   ├── ConnectDropboxButton.tsx
│   └── ConnectDropboxButton.test.tsx
├── context/
│   ├── AuthContext.tsx
│   └── AuthContext.test.tsx
├── lib/
│   ├── dropbox-auth.ts
│   ├── dropbox-auth.test.ts
│   ├── dropbox-client.ts
│   ├── dropbox-client.test.ts
│   ├── pkce.ts
│   ├── pkce.test.ts
│   ├── token-storage.ts
│   └── token-storage.test.ts
├── pages/
│   ├── Callback.tsx
│   ├── Callback.test.tsx
│   ├── Home.tsx
│   ├── Home.test.tsx
│   ├── NotFound.tsx
│   └── NotFound.test.tsx
├── test/
│   ├── setup.ts
│   ├── test-utils.tsx
│   └── mocks/
│       ├── auth.ts
│       ├── dropbox.ts
│       └── index.ts
├── App.tsx
├── App.test.tsx
├── main.tsx
└── vite-env.d.ts
```

---

# 📋 Implementation Checklist

## Phase T0 — Infrastructure (Do First)
- [ ] T0.1 — Install dependencies
- [ ] T0.2 — Configure Vitest
- [ ] T0.3 — Add npm scripts
- [ ] T0.4 — Update Makefile
- [ ] T0.5 — Create smoke test

## Phase T1 — Utilities (Do Second)
- [ ] T1.1 — Component test utilities
- [ ] T1.2 — Mock factories
- [ ] T1.3 — API mocking setup

## Phase T2 — Coverage (Incremental)
- [ ] T2.1 — Test pkce.ts
- [ ] T2.2 — Test token-storage.ts
- [ ] T2.3 — Test dropbox-auth.ts
- [ ] T2.4 — Test dropbox-client.ts
- [ ] T2.5 — Test AuthContext.tsx
- [ ] T2.6 — Test components

## Phase T3 — TDD Workflow
- [ ] T3.1 — Document workflow
- [ ] T3.2 — Coverage thresholds
- [ ] T3.3 — CI integration

---

# 🚀 Quick Start (After T0 Complete)

```bash
# Run all tests
make test

# TDD workflow (watch mode)
make test-watch

# Check coverage
make test-coverage

# Full validation (lint + types + tests)
make validate
```

---

# Appendix

## Testing Philosophy

1. **Test behavior, not implementation** — Focus on what the code does, not how
2. **Prefer integration over unit** — For components, test user interactions
3. **Mock at boundaries** — Mock external APIs, not internal modules
4. **Fast feedback** — Tests should run in seconds
5. **Deterministic** — Same input = same output, always

## Recommended Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Guiding Principles](https://testing-library.com/docs/guiding-principles)
- [Kent C. Dodds Testing Articles](https://kentcdodds.com/blog?q=testing)

