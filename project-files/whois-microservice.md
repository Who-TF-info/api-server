# who-tf.info
A Domain Availability & WHOIS MicroService

## Overview
Fast, reliable domain availability checking and WHOIS data retrieval service with intelligent caching and fallback mechanisms.

## Technology Stack

- **Runtime**: Bun (TypeScript-first, fast startup)
- **Testing**: Bun test runner
- **Cache**: Valkey/Redis with @keyvhq/redis
- **Database**: MariaDB with TypeORM
- **API Framework**: Hono (fast, lightweight)
- **DI Container**: Tsyringe for dependency injection
- **Containerization**: Docker for deployment

## Core Features

### Intelligent Fail-Fast Strategy
1. **TLD Validation**: Check against IANA root zone database
2. **DNS Pre-check**: Quick DNS lookup to filter registered domains
3. **Availability Check**: Use PorkBun API for unregistered domains
4. **WHOIS Lookup**: Only fetch detailed data when domain is registered

### Multi-Layer Caching
- **Redis Cache**: Configurable TTL (default: 3,600,000ms / 1 hour)
- **Database Cache**: Configurable TTL (default: 86,400,000ms / 24 hours)
- **Per-Data-Type TTLs**: Different cache durations for availability vs WHOIS data
- **Dynamic TTL**: Based on domain status and data freshness requirements

### Robust Data Sources
- **RDAP Protocol**: Modern JSON-based lookups (primary)
- **WHOIS Protocol**: Traditional fallback via raw sockets
- **Community Mappings**: github.com/FurqanSoftware/node-whois servers.json
- **Official Sources**: IANA root zone and RDAP bootstrap data

### Security & Access Control
- **JWT Authentication**: Secure API access
- **Rate Limiting**: Per-client and global limits
- **API Key Management**: Multiple access levels

## API Endpoints

### Domain Availability
```http
GET /api/v1/availability/{domain}
Authorization: Bearer {jwt_token}

Response:
{
  "domain": "example.com",
  "available": false,
  "checked_at": "2025-11-07T10:30:00Z",
  "method": "dns|porkbun|whois",
  "ttl": 3600
}
```

### WHOIS Data
```http
GET /api/v1/whois/{domain}
Authorization: Bearer {jwt_token}

Response:
{
  "domain": "example.com",
  "registrar": "Example Registrar Inc.",
  "created_date": "1995-08-14T00:00:00Z",
  "expires_date": "2025-08-13T23:59:59Z",
  "name_servers": ["ns1.example.com", "ns2.example.com"],
  "status": ["clientTransferProhibited"],
  "raw_data": "...",
  "source": "rdap|whois",
  "cached": true,
  "checked_at": "2025-11-07T10:30:00Z"
}
```

### Bulk Operations
```http
POST /api/v1/bulk/availability
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "domains": ["example1.com", "example2.com", "example3.com"],
  "callback_url": "https://yourapp.com/webhook/bulk-results"
}

Response:
{
  "job_id": "uuid-v4-job-id",
  "status": "queued",
  "estimated_completion": "2025-11-07T10:35:00Z"
}
```

## Performance Targets

- **Availability Check**: < 100ms (cached), < 500ms (fresh)
- **WHOIS Lookup**: < 200ms (cached), < 2000ms (fresh)
- **Bulk Processing**: 1000 domains/minute
- **Uptime**: 99.9%
- **Cache Hit Rate**: > 80%

### Configurable Cache TTLs (in milliseconds)
- **Availability Data**: Default 3,600,000ms (1 hour)
- **WHOIS Data**: Default 86,400,000ms (24 hours)
- **Error Responses**: Default 300,000ms (5 minutes)
- **DNS Negative Cache**: Default 1,800,000ms (30 minutes)
- **TLD Mappings**: Default 604,800,000ms (7 days)

## Error Handling

```http
{
  "error": {
    "code": "INVALID_TLD|RATE_LIMITED|WHOIS_UNAVAILABLE",
    "message": "Human readable error message",
    "retry_after": 60,
    "documentation_url": "https://docs.who-tf.info/errors"
  }
}
```

## Configuration

### Environment Variables
```bash
# Server
PORT=3000
NODE_ENV=production
API_VERSION=v1

# Database
DATABASE_URL=mysql://user:pass@localhost:3306/whois
DB_POOL_SIZE=10
DB_TIMEOUT=30000

# Cache (TTLs in milliseconds)
REDIS_URL=redis://localhost:6379
CACHE_TTL_AVAILABILITY=3600000    # 1 hour
CACHE_TTL_WHOIS=86400000          # 24 hours
CACHE_TTL_ERRORS=300000           # 5 minutes
CACHE_TTL_DNS_NEGATIVE=1800000    # 30 minutes
CACHE_TTL_TLD_MAPPINGS=604800000  # 7 days

# External APIs
PORKBUN_API_KEY=your_key
PORKBUN_SECRET_KEY=your_secret
PORKBUN_TIMEOUT=5000              # 5 seconds

# WHOIS/RDAP Settings
WHOIS_TIMEOUT=10000               # 10 seconds
RDAP_TIMEOUT=5000                 # 5 seconds
MAX_CONCURRENT_WHOIS=50
ENABLE_RDAP=true
ENABLE_WHOIS_FALLBACK=true

# Security
JWT_SECRET=your_jwt_secret
RATE_LIMIT_WINDOW=60000           # 1 minute
RATE_LIMIT_MAX=100                # requests per window
API_KEY_HEADER=X-API-Key

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
LOG_LEVEL=info
```

## Deployment

### Docker Compose
```yaml
version: '3.8'
services:
  whois-service:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=mysql://whois:password@db:3306/whois
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: mariadb:10
    environment:
      MYSQL_DATABASE: whois
      MYSQL_USER: whois
      MYSQL_PASSWORD: password
      MYSQL_ROOT_PASSWORD: rootpass
    volumes:
      - db_data:/var/lib/mysql

  redis:
    image: valkey/valkey:7
    volumes:
      - redis_data:/data
```

## Monitoring & Observability

### Metrics
- Request/response times
- Cache hit rates
- Error rates by provider
- Queue depths for bulk operations

### Health Checks
```http
GET /health
Response:
{
  "status": "healthy",
  "database": "connected",
  "cache": "connected",
  "external_apis": {
    "porkbun": "available",
    "whois_servers": "available"
  }
}
```

## Getting Started

### Prerequisites
- **Bun**: >= 1.0.0
- **MariaDB/MySQL**: >= 10.6
- **Redis/Valkey**: >= 7.0
- **Docker**: >= 20.10 (optional)

### Quick Start
```bash
# Clone repository
git clone https://github.com/your-org/who-tf-info.git
cd who-tf-info

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
bun run db:migrate

# Start development server
bun run dev

# Run tests
bun test
```

### Docker Quick Start
```bash
# Start all services
docker-compose up -d

# Check service health
curl http://localhost:3000/health
```

## Repository Structure
```
who-tf-info/
├── src/
│   ├── routes/             # Hono route definitions
│   │   ├── availability.ts # Domain availability routes
│   │   ├── whois.ts       # WHOIS data routes
│   │   ├── bulk.ts        # Bulk operations routes
│   │   └── health.ts      # Health check routes
│   ├── services/          # Business logic
│   │   ├── availability/  # Domain availability checking
│   │   ├── whois/        # WHOIS data retrieval
│   │   └── cache/        # Caching layer
│   ├── database/         # Database layer
│   │   ├── entities/     # TypeORM entities
│   │   └── migrations/   # Database migrations
│   ├── middleware/       # Auth, rate limiting, etc.
│   ├── utils/           # Helper functions
│   └── types/           # TypeScript type definitions
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── load/           # Load testing
├── docs/               # Documentation
├── docker/             # Docker configurations
└── scripts/            # Utility scripts
```

### Still Missing (Consider Adding):

1. **Database Schema** - Tables and relationships
2. **Testing Strategy** - Unit, integration, load testing
3. **Backup & Recovery** - Data persistence strategy
4. **Compliance** - GDPR, data retention policies
5. **Cost Estimates** - Infrastructure and API costs
6. **Migration Strategy** - From current setup to microservice
7. **Grafana Stack** - Observability and monitoring setup


## Development Roadmap

### Phase 1: MVP
- [ ] Basic availability checking
- [ ] DNS pre-filtering
- [ ] PorkBun integration
- [ ] Redis caching
- [ ] JWT authentication

### Phase 2: WHOIS Data
- [ ] RDAP protocol support
- [ ] WHOIS protocol fallback
- [ ] Community server mappings
- [ ] Response parsing & normalization

### Phase 3: Production Ready
- [ ] Bulk operations
- [ ] Rate limiting
- [ ] Monitoring & metrics
- [ ] Load balancing
- [ ] Multi-region deployment

## Security Considerations

- **Input Validation**: Strict domain format validation
- **Rate Limiting**: Prevent abuse of external APIs
- **Secret Management**: Secure API key storage
- **Audit Logging**: Track all API usage
- **Network Security**: VPC deployment with security groups