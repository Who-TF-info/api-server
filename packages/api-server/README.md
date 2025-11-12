# Who-TF.info API Server

A self-hosted, high-performance WHOIS and domain availability microservice built with TypeScript and Bun.

## 🏠 Self-Hosted Architecture

**This is NOT a SaaS platform.** Who-TF.info is designed for organizations to run their own private WHOIS microservice instances. You deploy it, you control it, you own your data.

### Why Self-Hosted?
- **Privacy**: Your domain queries never leave your infrastructure
- **Cost Control**: You pay only for your own external API usage (PorkBun, WHOIS servers)
- **Customization**: Configure cache TTLs, timeouts, and features for your needs
- **No Rate Limits**: Set your own usage patterns and external API rate limiting
- **Data Ownership**: All request logs and cached data stays in your database

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

### Docker Deployment (Recommended)

```bash
# Production deployment
docker compose up -d

# Development with hot reload
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
X-API-Key: your_api_key_here
```

### WHOIS Data
```http
GET /api/v1/whois/{domain}
X-API-Key: your_api_key_here
```

### Bulk Operations
```http
POST /api/v1/bulk/availability
X-API-Key: your_api_key_here
Content-Type: application/json

{
  "domain_name": "mycompany",
  "tlds": ["com", "org", "net", "io"]
}
```

### Health Check
```http
GET /health
```

## Performance Targets

- **Availability Check**: <100ms (cached), <500ms (fresh)
- **WHOIS Lookup**: <200ms (cached), <2000ms (fresh)
- **Cache Hit Rate**: >80%
- **Bulk Processing**: Synchronous, configurable concurrency

## Authentication & Configuration

### API Keys
Create API keys for different applications/services in your organization:
- Web applications
- CI/CD pipelines
- Analytics services
- Testing environments

### Configuration
All settings are configurable via environment variables:
- Cache TTLs (availability, WHOIS data, errors)
- External API timeouts and delays
- Database and Redis connection settings
- Feature flags (RDAP, WHOIS fallback)

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

### Documentation
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines and project-specific instructions
- **[TypeORM Conventions](./docs/typeorm-conventions.md)** - Entity development patterns and database conventions

### Database Development
All entities must extend `AppEntity` and follow our naming conventions. The project uses automatic table/column name conversion with Zod validation. See the [TypeORM Conventions guide](./docs/typeorm-conventions.md) for complete patterns and examples.

Built with [Bun](https://bun.com) - A fast all-in-one JavaScript runtime.
