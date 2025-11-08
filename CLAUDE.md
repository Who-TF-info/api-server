# Who-TF.info API Server - Claude Guidelines

This document contains project-specific guidelines for Claude when working on the Who-TF.info WHOIS microservice.

## Project Overview

**IMPORTANT: This is a self-hosted microservice, NOT a SaaS platform.**

Organizations deploy their own instances of Who-TF.info to run private WHOIS services. There are no central servers, user accounts, or subscription tiers. Each deployment is independent and owned by the deploying organization.

### Self-Hosted Architecture Implications
- **No rate limiting between users** - each organization controls their own usage
- **Simple authentication** - API keys for internal applications/services
- **Configuration-driven** - all settings via environment variables
- **Data ownership** - all data stays within the organization's infrastructure
- **Cost control** - organizations pay for their own external API usage

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
- Design for single-organization deployment (no multi-tenancy complexity)

### API Design
- RESTful endpoints under `/api/v1/`
- Simple API key authentication (X-API-Key header)
- Proper error handling with structured responses
- Support for synchronous bulk operations (domain + multiple TLDs)
- External API protection (not user rate limiting)

### Testing Strategy
- Unit tests for business logic
- Integration tests for API endpoints
- Docker-based testing environment
- Mock external dependencies properly
- Test with realistic self-hosted deployment scenarios

### Performance Targets (Per Instance)
- Availability check: <100ms cached, <500ms fresh
- WHOIS lookup: <200ms cached, <2000ms fresh
- Cache hit rate: >80%
- Bulk processing: Synchronous with configurable concurrency
- External API respect: Configurable delays to protect API quotas

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

Key environment variables for self-hosted deployment:
- `DATABASE_URL` - MariaDB connection
- `REDIS_URL` - Redis/Valkey connection
- `PORKBUN_API_KEY` - Domain availability API (deployer's account)
- Cache TTL configurations (deployer-configurable)
- External API timeouts and delays
- Feature flags (RDAP, WHOIS fallback)

## Security Considerations

- Input validation for domain names
- External API protection (prevent quota exhaustion)
- Secure secret management (API keys, database credentials)
- Audit logging for internal usage tracking
- Simple API key authentication
- Network security for self-hosted deployment

## Deployment

- **Primary delivery method**: Docker container for easy self-hosting
- Docker Compose for complete stack deployment
- Health check endpoints for monitoring
- Documentation for various deployment scenarios (cloud, on-premises)
- No central infrastructure or SaaS concerns