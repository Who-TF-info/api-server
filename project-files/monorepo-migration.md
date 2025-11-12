# Who-TF.info Monorepo Migration Instructions

This document contains step-by-step instructions for migrating the Who-TF.info API server to a monorepo architecture using Turborepo.

## Overview

The migration will restructure the project to support multiple packages while sharing types, schemas, and utilities across the ecosystem.

## Final Structure
```
├── docker/                 # Shared Docker configs (stays)
├── biome.json              # Shared linting/formatting (stays)
├── lefthook.yml            # Git hooks (stays)
├── .commitlintrc.json      # Commit message standards (stays)
├── package.json            # Workspace management (updated)
├── turbo.json              # Build pipeline config (new)
├── .gitignore              # Monorepo gitignore (stays)
├── README.md               # Main project README (stays)
├── project-files/          # Architecture docs (stays)
└── packages/
    ├── api-server/         # Current API server code
    ├── shared/             # Shared types, schemas, utilities
    └── http-client/        # Future HTTP client package
```

## Migration Steps

### 1. Install Turborepo
```bash
bun add -D turbo
```

### 2. Create packages directory structure
```bash
mkdir -p packages/api-server packages/shared/src
```

### 3. Move API server files
```bash
mv src packages/api-server/
mv test packages/api-server/
mv tsconfig.json packages/api-server/
```

### 4. Update root package.json
Replace the entire `package.json` with workspace configuration:
```json
{
  "name": "who-tf-info",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev",
    "check": "turbo check",
    "test": "turbo test",
    "typecheck": "turbo typecheck",
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix",
    "docker:start": "docker compose -f docker/docker-compose.yml up -d",
    "docker:stop": "docker compose -f docker/docker-compose.yml down",
    "docker:clear": "docker compose -f docker/docker-compose.yml down -v",
    "docker:test:start": "docker compose -f docker/docker-compose.test.yml up -d"
  },
  "devDependencies": {
    "turbo": "^2.3.0"
  }
}
```

### 5. Create turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "check": {
      "dependsOn": ["lint:fix", "typecheck", "test"]
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "lint:fix": {}
  }
}
```

### 6. Create packages/api-server/package.json
```json
{
  "name": "@who-tf-info/api-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "bun build src/index.ts --target=bun --outdir=dist",
    "dev": "bun run --watch src/index.ts",
    "start": "bun run dist/index.js",
    "check": "bun run lint:fix && bun run typecheck && bun run test",
    "test": "bun test",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write ."
  },
  "dependencies": {
    "@who-tf-info/shared": "workspace:*",
    "hono": "^4.6.14",
    "tsyringe": "^4.8.0",
    "typeorm": "^0.3.20",
    "reflect-metadata": "^0.2.2",
    "ioredis": "^5.4.1",
    "zod": "^3.23.8",
    "mariadb": "^3.3.2"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.6.3"
  }
}
```

### 7. Create packages/shared/package.json
```json
{
  "name": "@who-tf-info/shared",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write ."
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "typescript": "^5.6.3"
  }
}
```

### 8. Create packages/shared/tsconfig.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "declaration": true,
    "declarationMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["dist", "node_modules"]
}
```

### 9. Install dependencies
```bash
bun install
```

## Phase 2: Extract Shared Code

After completing the basic structure setup, the next phase involves:

### 1. Extract Types
Move types from `packages/api-server/src/types/` to `packages/shared/src/types/`:
- Domain-related types
- WHOIS response types
- API response interfaces
- Error types

### 2. Extract Schemas
Move Zod schemas from `packages/api-server/src/schemas/` to `packages/shared/src/schemas/`:
- Request validation schemas
- Response schemas
- Domain validation schemas

### 3. Extract Utilities
Move common utilities to `packages/shared/src/utils/`:
- Domain validation functions
- Common constants
- Shared helper functions

### 4. Create Shared Index
Create `packages/shared/src/index.ts` to export all shared code:
```typescript
export * from './types/index.js';
export * from './schemas/index.js';
export * from './utils/index.js';
```

### 5. Update API Server Imports
Replace relative imports in `packages/api-server/src/` with:
```typescript
import { SomeType, someSchema } from '@who-tf-info/shared';
```

## Phase 3: Validation

### 1. Build Test
```bash
bun run build
```

### 2. Type Check
```bash
bun run typecheck
```

### 3. Run Tests
```bash
bun run test
```

### 4. Development Server
```bash
bun run dev
```

### 5. Full Check
```bash
bun run check
```

## Benefits After Migration

1. **Shared Types**: Single source of truth for API contracts
2. **Better Client Development**: HTTP client can import types directly
3. **Type Safety**: Compile-time guarantees between packages
4. **Unified Build**: Turborepo caching and parallel builds
5. **Future Packages**: Easy to add CLI tools, web dashboard, etc.

## Troubleshooting

### Import Errors
- Ensure `packages/shared` is built before `packages/api-server`
- Check that workspace dependencies are properly configured
- Verify TypeScript path resolution

### Build Issues
- Check that all dependencies are properly declared in each package
- Ensure TypeScript configurations extend from root correctly
- Verify Turborepo task dependencies

### Development Workflow
- Run `bun run dev` from root to start all development servers
- Individual packages can be developed with `bun run dev --filter=@who-tf-info/api-server`

## Future Enhancements

1. **HTTP Client Package**: `packages/http-client/`
2. **CLI Package**: `packages/cli/`
3. **Web Dashboard**: `packages/web-dashboard/`
4. **Documentation Site**: `packages/docs/`

Each new package will automatically benefit from the shared types and schemas established in this migration.