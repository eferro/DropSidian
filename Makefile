.PHONY: help local-setup dev build preview lint type-check format validate clean

# Default target
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
	@echo "  validate      Run all checks (lint, type-check)"
	@echo "  clean         Remove build artifacts"
	@echo ""

# Check Node.js version (requires >= 18)
check-node:
	@node --version | grep -qE "^v(1[89]|[2-9][0-9])\." || \
		(echo "Error: Node.js >= 18 required" && exit 1)
	@echo "Node.js version OK: $$(node --version)"

# Install dependencies
local-setup: check-node
	npm install
	@echo ""
	@echo "Setup complete! Run 'make dev' to start development server."

# Development server
dev:
	npm run dev

# Production build
build:
	npm run build

# Preview production build
preview:
	npm run preview

# Run ESLint
lint:
	npm run lint

# TypeScript type checking
type-check:
	npm run type-check

# Format code
format:
	npm run format

# Run all validation checks
validate: lint type-check
	@echo "All checks passed!"

# Clean build artifacts
clean:
	rm -rf dist node_modules/.cache

