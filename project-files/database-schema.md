# Database Schema - Who-TF.info WHOIS Microservice

## Overview

Database schema designed for high-performance domain availability checking and WHOIS data retrieval with intelligent caching and comprehensive audit trails.

## Core Tables

### top_level_domains
Stores all valid TLDs from IANA root zone database.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | Integer | No | Auto-increment | Primary key |
| tld | String(63) | No | - | TLD string (e.g., 'com', 'org') |
| type | Enum | No | - | 'generic', 'country-code', 'sponsored', 'infrastructure' |
| whois_server | String(255) | Yes | null | WHOIS server hostname |
| rdap_server | String(255) | Yes | null | RDAP server URL |
| is_active | Boolean | No | true | Whether TLD is currently active |
| created_at | Timestamp | No | Current timestamp | Record creation time |
| updated_at | Timestamp | No | Current timestamp | Last update time |

**Indexes:**
- Primary: id
- Unique: tld
- Index: is_active

### domain_names
Stores unique domain name parts (without TLD).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | Integer | No | Auto-increment | Primary key |
| name | String(253) | No | - | Domain name part (max domain length) |
| created_at | Timestamp | No | Current timestamp | Record creation time |

**Indexes:**
- Primary: id
- Unique: name

### domains
Represents complete domains (domain_name + TLD combination) that have been queried.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | Integer | No | Auto-increment | Primary key |
| domain_name_id | Integer | No | - | Foreign key to domain_names |
| top_level_domain_id | Integer | No | - | Foreign key to top_level_domains |
| full_domain | String(255) | No | - | Complete domain (name.tld) |
| is_available | Boolean | Yes | null | Domain availability status |
| availability_checked_at | Timestamp | Yes | null | Last availability check time |
| availability_method | Enum | Yes | null | 'dns', 'porkbun', 'whois' |
| availability_ttl_expires_at | Timestamp | Yes | null | Availability cache expiration |
| whois_data | JSON | Yes | null | Complete WHOIS response data |
| whois_checked_at | Timestamp | Yes | null | Last WHOIS check time |
| whois_source | Enum | Yes | null | 'rdap', 'whois' |
| whois_ttl_expires_at | Timestamp | Yes | null | WHOIS cache expiration |
| registrar | String(255) | Yes | null | Registrar name (normalized) |
| registration_date | Timestamp | Yes | null | Domain registration date |
| expiration_date | Timestamp | Yes | null | Domain expiration date |
| name_servers | JSON | Yes | null | Array of nameserver hostnames |
| status | JSON | Yes | null | Array of domain status codes |
| created_at | Timestamp | No | Current timestamp | Record creation time |
| updated_at | Timestamp | No | Current timestamp | Last update time |

**Indexes:**
- Primary: id
- Unique: full_domain
- Index: availability_ttl_expires_at
- Index: whois_ttl_expires_at
- Index: expiration_date
- Index: registrar
- Foreign key: domain_name_id → domain_names(id)
- Foreign key: top_level_domain_id → top_level_domains(id)

### users
API users for authentication and request tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | Integer | No | Auto-increment | Primary key |
| name | String(255) | No | - | User/application name |
| api_key | String(64) | No | - | API authentication key |
| is_active | Boolean | No | true | Account active status |
| last_request_at | Timestamp | Yes | null | Last API request timestamp |
| total_requests | Integer | No | 0 | Total lifetime request count |
| created_at | Timestamp | No | Current timestamp | Account creation time |
| updated_at | Timestamp | No | Current timestamp | Last update time |

**Indexes:**
- Primary: id
- Unique: api_key
- Index: is_active

### requests
Comprehensive audit trail of all API requests.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | BigInteger | No | Auto-increment | Primary key |
| user_id | Integer | No | - | Foreign key to users |
| domain_id | Integer | No | - | Foreign key to domains |
| request_type | Enum | No | - | 'availability', 'whois', 'bulk' |
| endpoint | String(255) | No | - | API endpoint called |
| method | String(10) | No | - | HTTP method |
| status_code | Integer | No | - | HTTP response status code |
| response_time_ms | Integer | No | - | Response time in milliseconds |
| cache_hit | Boolean | No | false | Whether response was cached |
| error_code | String(50) | Yes | null | Error code if request failed |
| error_message | Text | Yes | null | Error message if request failed |
| ip_address | String(45) | Yes | null | Client IP address (IPv6 support) |
| user_agent | Text | Yes | null | Client user agent string |
| requested_at | Timestamp | No | Current timestamp | Request timestamp |

**Indexes:**
- Primary: id
- Index: user_id, requested_at (composite)
- Index: domain_id, requested_at (composite)
- Index: request_type
- Index: status_code
- Index: requested_at
- Foreign key: user_id → users(id)
- Foreign key: domain_id → domains(id)

## Configuration Table (Optional)

### settings
Global configuration for the WHOIS service instance.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| key | String(100) | No | - | Configuration key |
| value | Text | Yes | null | Configuration value |
| description | String(255) | Yes | null | Human-readable description |
| updated_at | Timestamp | No | Current timestamp | Last update time |

**Indexes:**
- Primary: key

**Example settings:**
- `external_rate_limit_ms`: Delay between external API calls
- `cache_ttl_availability`: Default availability cache TTL
- `cache_ttl_whois`: Default WHOIS cache TTL
- `enable_rdap`: Whether to use RDAP protocol
- `default_whois_timeout`: Timeout for WHOIS requests

## Data Relationships

```
users (1) ←→ (many) requests

domains (1) ←→ (many) requests
domains (many) ←→ (1) domain_names
domains (many) ←→ (1) top_level_domains
```

## Caching Strategy

### Database-Level Caching
- **Availability Data**: Cached in `domains.is_available` with TTL
- **WHOIS Data**: Cached in `domains.whois_data` JSON column with TTL
- **TTL Management**: Automatic cleanup via TTL expiration timestamps

### Cache Invalidation
```sql
-- Clean expired availability cache
UPDATE domains SET
    is_available = NULL,
    availability_checked_at = NULL,
    availability_method = NULL
WHERE availability_ttl_expires_at < NOW();

-- Clean expired WHOIS cache
UPDATE domains SET
    whois_data = NULL,
    whois_checked_at = NULL,
    whois_source = NULL,
    registrar = NULL,
    registration_date = NULL,
    expiration_date = NULL,
    name_servers = NULL,
    status = NULL
WHERE whois_ttl_expires_at < NOW();
```

## Indexes and Performance

### Primary Performance Indexes
- `domains.full_domain` - Fast domain lookups
- `domains.availability_ttl_expires_at` - Cache TTL management
- `domains.whois_ttl_expires_at` - Cache TTL management
- `requests.user_id, requested_at` - User request history
- `requests.requested_at` - Time-based queries

### Rate Limiting Indexes
- `users.api_key` - API authentication
- `rate_limit_buckets.user_id` - Token bucket lookups

## Storage Estimates

### Per Domain Record
- **domains table**: ~1KB base + JSON data
- **WHOIS JSON**: 2-10KB typical
- **Total per domain**: ~3-11KB

### Per Request Record
- **requests table**: ~200 bytes per request

### Scaling Projections
- **1M domains**: ~3-11GB
- **100M requests/month**: ~20GB/month
- **1-year retention**: ~240GB for requests

## Migration Strategy

### Phase 1: Core Tables
1. Create `top_level_domains` and populate with IANA data
2. Create `domain_names` table
3. Create `domains` table with basic caching
4. Create `users` table with API key management

### Phase 2: Request Tracking
1. Create `requests` table for audit trail
2. Create optional `settings` table for configuration

### Phase 3: Bulk Operations
1. Implement synchronous bulk API endpoints
2. Add parallel domain processing
3. Optimize batch queries

## Authentication Flow

### API Key Authentication (Option 1 - MVP)
- Single API key per user for all requests
- Header: `X-API-Key: {api_key}` or `Authorization: Bearer {api_key}`
- Long-lived tokens (managed through user dashboard)
- Simple implementation, no token expiration complexity

### Future Enhancement (Post-MVP)
- JWT tokens with API key bootstrap
- Short-lived JWTs with refresh tokens
- Better session management

## Sample Data Population

### Sample TLDs
```
top_level_domains:
- com, generic, whois.verisign-grs.com, https://rdap.verisign.com/com/v1/
- org, generic, whois.pir.org, https://rdap.org/
- net, generic, whois.verisign-grs.com, https://rdap.verisign.com/net/v1/
```

### Sample Users
```
users:
- "Main Application", ak_1234567890abcdef
- "Analytics Service", ak_9876543210fedcba
- "Testing", ak_test1234567890abcd
```