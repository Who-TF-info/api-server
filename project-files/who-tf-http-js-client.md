# Who-TF.info HTTP JavaScript Client

This document outlines the design and implementation of a JavaScript/TypeScript HTTP client library for the Who-TF.info API server.

## Overview

The HTTP client will provide a simple, type-safe interface for interacting with the Who-TF.info WHOIS microservice API. Since this is a self-hosted service, the client will be designed for internal organizational use.

## Design Goals

### Core Principles
- **Type Safety**: Full TypeScript support with proper type definitions
- **Simplicity**: Clean, intuitive API that mirrors the REST endpoints
- **Self-Hosted Focus**: Designed for single-organization deployment scenarios
- **Error Handling**: Structured error responses with proper typing
- **Flexible Configuration**: Support for various deployment endpoints

### Key Features
- Domain availability checking
- WHOIS data retrieval
- Bulk operations support
- Built-in retry logic with backoff
- Request/response logging
- Configurable timeouts
- API key management

## API Client Structure

### Configuration
```typescript
interface WhoTFClientConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableLogging?: boolean;
}
```

### Core Methods
- `checkAvailability(domain: string, tlds?: string[]): Promise<AvailabilityResponse>`
- `getWhoisData(domain: string): Promise<WhoisResponse>`
- `bulkAvailabilityCheck(domains: BulkAvailabilityRequest): Promise<BulkAvailabilityResponse>`
- `bulkWhoisLookup(domains: string[]): Promise<BulkWhoisResponse>`

### Response Types
All response types should match the API server's response schemas:
- `AvailabilityResponse`
- `WhoisResponse`
- `BulkAvailabilityResponse`
- `BulkWhoisResponse`
- `ErrorResponse`

## Implementation Considerations

### HTTP Client Base
- Use fetch API (Node.js 18+ / modern browsers)
- Fallback to node-fetch for older Node.js versions
- Support for both ESM and CommonJS

### Error Handling
- Custom error classes for different error types
- Proper HTTP status code handling
- Network error retry logic
- API rate limit handling

### Authentication
- Simple API key via X-API-Key header
- Support for environment variable configuration
- Secure storage recommendations

### Caching (Optional)
- Optional client-side caching layer
- Configurable cache TTLs
- Memory-based cache for short-term storage

## Package Distribution

### NPM Package
- Package name: `@who-tf-info/client` or similar
- Dual ESM/CommonJS support
- TypeScript declarations included
- Minimal dependencies

### Documentation
- README with quick start guide
- API reference documentation
- Self-hosted deployment examples
- Error handling examples

## Usage Examples

### Basic Setup
```typescript
import { WhoTFClient } from '@who-tf-info/client';

const client = new WhoTFClient({
  baseUrl: 'https://whois.yourorg.com',
  apiKey: process.env.WHOIS_API_KEY
});
```

### Domain Availability
```typescript
const availability = await client.checkAvailability('example.com', ['com', 'org', 'net']);
console.log(availability.results);
```

### WHOIS Lookup
```typescript
const whoisData = await client.getWhoisData('google.com');
console.log(whoisData.registrar);
```

### Bulk Operations
```typescript
const bulkResults = await client.bulkAvailabilityCheck({
  domain: 'mycompany',
  tlds: ['com', 'org', 'net', 'io']
});
```

## Testing Strategy

### Unit Tests
- Mock HTTP responses for all endpoints
- Test error handling scenarios
- Validate request formatting
- Test retry logic

### Integration Tests
- Test against actual API server instance
- Validate response parsing
- Test timeout scenarios
- Error response handling

## Development Timeline

1. **Phase 1**: Core client implementation with basic endpoints
2. **Phase 2**: Error handling and retry logic
3. **Phase 3**: Bulk operations support
4. **Phase 4**: Optional caching layer
5. **Phase 5**: Documentation and examples
6. **Phase 6**: NPM package publishing

## Related Files

This client will consume the API endpoints defined in:
- `src/routes/` - API route handlers
- `src/types/` - Response type definitions
- `src/schemas/` - Request/response validation schemas

The client should maintain compatibility with the API versioning strategy defined in the main API server.