# Development Guide

This guide covers everything you need to contribute to DropSidian.

## Prerequisites

- **Node.js 18+** — Required for development
- **npm** — Package manager

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/DropSidian.git
cd DropSidian

# Install dependencies and setup git hooks
make local-setup

# Start development server
make dev
```

The app will be available at `http://localhost:5173`

## Available Commands

| Command | Description |
|---------|-------------|
| `make local-setup` | Install dependencies and setup git hooks |
| `make dev` | Start development server |
| `make build` | Create production build |
| `make preview` | Preview production build |
| `make test` | Run tests once |
| `make test-watch` | Run tests in watch mode (TDD) |
| `make test-coverage` | Run tests with coverage report |
| `make lint` | Run ESLint |
| `make type-check` | Run TypeScript compiler |
| `make format` | Format code with Prettier |
| `make validate` | Run all checks (lint, type-check, test) |
| `make clean` | Remove build artifacts |

Run `make help` to see all available commands.

## Tech Stack

- **React 18** — UI library
- **TypeScript** — Type safety
- **Vite** — Build tool and dev server
- **Vitest** — Testing framework
- **ESLint + Prettier** — Code quality
- **Husky** — Git hooks

## Project Structure

```
src/
├── components/     # React components
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── lib/            # Core utilities and services
├── pages/          # Page components (routes)
└── test/           # Test utilities and setup
```

## Development Workflow

This project follows **Test-Driven Development (TDD)**:

1. Write a failing test first
2. Implement the minimum code to pass
3. Refactor while keeping tests green
4. Run `make validate` before committing

### Before Every Commit

```bash
make validate
```

This runs linting, type-checking, and all tests. Only commit when all checks pass.

## Code Style

- **TypeScript**: All code must be fully typed
- **Small functions**: Keep functions under 20 lines
- **Clear naming**: Use descriptive names, avoid comments
- **OOP design**: Use small, focused classes with clear responsibilities

## Testing

Tests are co-located with source files (`*.test.ts` / `*.test.tsx`).

```bash
# Run all tests once
make test

# Watch mode for TDD
make test-watch

# Generate coverage report
make test-coverage
```

## Building for Production

```bash
make build
```

Output goes to `dist/` directory.

## License

MIT

