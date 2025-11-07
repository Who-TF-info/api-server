# Who-TF.info API Server

A high-performance WHOIS and domain availability microservice built with TypeScript and Bun.

## Overview

Fast, reliable domain availability checking and WHOIS data retrieval service with intelligent caching and fallback mechanisms. Features a fail-fast strategy, multi-layer caching, and robust data sources for optimal performance.

## Technology Stack

- **Runtime**: Bun (TypeScript-first, fast startup)
- **Framework**: Hono (lightweight, fast web framework)
- **Database**: TypeORM with MariaDB
- **Cache**: Redis/Valkey
- **DI Container**: Tsyringe for dependency injection
- **Testing**: Bun test runner
- **Linting**: Biome

## Quick Start

### Prerequisites
- Bun >= 1.2.0
- MariaDB/MySQL >= 10.6
- Redis/Valkey >= 7.0

### Installation

```bash
# Install dependencies
bun install

# Copy environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
bun run dev
```

### Docker Development

```bash
# Start all services (database, cache, etc.)
bun run docker:start

# View logs
bun run docker:logs

# Stop services
bun run docker:stop
```

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run check` - Run complete quality check (lint, typecheck, test)
- `bun run typecheck` - TypeScript type checking
- `bun run test` - Run test suite
- `bun run lint` - Check code formatting and linting
- `bun run lint:fix` - Fix linting issues automatically

## API Endpoints

### Domain Availability
```http
GET /api/v1/availability/{domain}
Authorization: Bearer {jwt_token}
```

### WHOIS Data
```http
GET /api/v1/whois/{domain}
Authorization: Bearer {jwt_token}
```

### Health Check
```http
GET /health
```

## Performance Targets

- **Availability Check**: <100ms (cached), <500ms (fresh)
- **WHOIS Lookup**: <200ms (cached), <2000ms (fresh)
- **Cache Hit Rate**: >80%
- **Bulk Processing**: 1000 domains/minute

## Project Structure

```
src/
├── routes/           # Hono route definitions
├── services/         # Business logic services
├── database/         # TypeORM entities and migrations
├── middleware/       # Authentication, rate limiting
├── utils/           # Helper functions
└── types/           # TypeScript type definitions
```

## Development

See [CLAUDE.md](./CLAUDE.md) for detailed development guidelines and project-specific instructions.

Built with [Bun](https://bun.com) - A fast all-in-one JavaScript runtime.
