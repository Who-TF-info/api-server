# Who-TF.info API Server - Claude Guidelines

This document contains project-specific guidelines for Claude when working on the Who-TF.info WHOIS microservice.

## Project Overview

This is a TypeScript-based WHOIS and domain availability microservice built with:
- **Runtime**: Bun
- **Framework**: Hono (lightweight web framework)
- **DI Container**: Tsyringe for dependency injection
- **Database**: TypeORM with MariaDB
- **Cache**: Redis/Valkey
- **Testing**: Bun test runner
- **Linting**: Biome

## Project Scripts

- `bun run dev` - Start development server with hot reload
- `bun run check` - Run full check suite (lint fix + typecheck + test)
- `bun run typecheck` - TypeScript type checking
- `bun run test` - Run test suite
- `bun run lint` - Check code formatting and linting
- `bun run lint:fix` - Fix linting issues automatically

## Docker Commands

- `bun run docker:start` - Start development environment
- `bun run docker:stop` - Stop development environment
- `bun run docker:clear` - Stop and remove volumes
- `bun run docker:test:start` - Start test environment

## Development Guidelines

### Code Quality
- **ALWAYS run `bun run check` before considering work complete**
- Fix ALL lint, type, and test issues before marking tasks done
- Never use `any` type - create proper TypeScript types
- Use protected visibility over private in classes
- Follow dependency injection patterns with Tsyringe

### Architecture Patterns
- Use Hono for API routes and middleware
- Implement services with dependency injection
- Use TypeORM entities for database models
- Implement caching layer with configurable TTLs
- Follow fail-fast strategy for domain availability checks

### API Design
- RESTful endpoints under `/api/v1/`
- JWT authentication for protected endpoints
- Rate limiting implementation
- Proper error handling with structured responses
- Support for bulk operations

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Load testing for performance validation
- Mock external dependencies properly

### Performance Targets
- Availability check: <100ms cached, <500ms fresh
- WHOIS lookup: <200ms cached, <2000ms fresh
- Cache hit rate: >80%
- Bulk processing: 1000 domains/minute

## Key Features Implementation

### Domain Availability Flow
1. TLD validation against IANA database
2. DNS pre-check for quick filtering
3. PorkBun API for availability checking
4. Multi-layer caching (Redis + Database)

### WHOIS Data Flow
1. RDAP protocol (primary)
2. Traditional WHOIS fallback
3. Community server mappings
4. Response normalization

### Caching Strategy
- Redis for short-term caching (1 hour default)
- Database for longer-term storage (24 hours default)
- Different TTLs for different data types
- Error response caching (5 minutes)

## Environment Configuration

Key environment variables to be aware of:
- `DATABASE_URL` - MariaDB connection
- `REDIS_URL` - Redis/Valkey connection
- `PORKBUN_API_KEY` - Domain availability API
- `JWT_SECRET` - Authentication
- Various cache TTL configurations

## Security Considerations

- Input validation for domain names
- Rate limiting to prevent API abuse
- Secure secret management
- Audit logging for API usage
- JWT token authentication

## Deployment

- Docker containerization
- Docker Compose for development
- Health check endpoints
- Metrics and monitoring setup