# @who-tf-info/http-client-js

TypeScript HTTP client for Who-TF.info API - Domain WHOIS lookup and availability checking service.

## Features

- 🔍 **Domain WHOIS lookups** - Retrieve comprehensive domain registration data
- ✅ **Domain availability checks** - Check if domains are available for registration
- 📊 **Bulk processing** - Process multiple domains efficiently
- 🚀 **TypeScript support** - Full type safety with shared response types
- ⚡ **Modern API client** - Built with Axios and modern JavaScript
- 🔐 **API key authentication** - Secure access to Who-TF.info services

## Installation

```bash
# Using bun
bun add @who-tf-info/http-client-js

# Using npm
npm install @who-tf-info/http-client-js

# Using yarn
yarn add @who-tf-info/http-client-js
```

## Quick Start

```typescript
import axios from 'axios';
import { WhoTfApiClient } from '@who-tf-info/http-client-js';

// Create HTTP client instance
const httpClient = axios.create({
    timeout: 30000,
    headers: {
        'User-Agent': 'My-App/1.0'
    }
});

// Initialize client
const client = new WhoTfApiClient({
    baseUrl: 'https://api.who-tf.info', // Your Who-TF.info instance URL
    apiKey: 'your-api-key-here',
    httpClient
});

// Check domain availability
const availability = await client.checkDomainAvailability('example.com');
console.log(availability.available); // true/false

// Get WHOIS data
const whoisData = await client.getWhoisData('example.com');
console.log(whoisData.whoisData);

// Bulk processing
const bulkResults = await client.bulkWhoisLookup([
    'example.com',
    'test.net',
    'demo.org'
], {
    skip_availability_check: false,
    max_concurrent: 3
});
```

## API Reference

### Client Configuration

```typescript
interface WhoTfApiClientOptions {
    baseUrl: string;        // Who-TF.info API base URL
    apiKey: string;         // Your API key
    httpClient: AxiosInstance; // Configured Axios instance
}
```

### Methods

#### `getHealth()`
Check API health status.

```typescript
const health = await client.getHealth();
// Returns: HealthResponse
```

#### `authenticate()`
Verify API key and get user information.

```typescript
const auth = await client.authenticate();
// Returns: AuthResponse with user details
```

#### `checkDomainAvailability(domain: string)`
Check if a single domain is available for registration.

```typescript
const result = await client.checkDomainAvailability('example.com');
// Returns: WhoisResponse with availability data
```

#### `getWhoisData(domain: string)`
Get comprehensive WHOIS data for a domain.

```typescript
const whois = await client.getWhoisData('example.com');
// Returns: WhoisResponse with full WHOIS details
```

#### `bulkWhoisLookup(domains: string[], options?)`
Process multiple domains in a single request.

```typescript
const results = await client.bulkWhoisLookup(
    ['domain1.com', 'domain2.net'],
    {
        skip_availability_check: false,
        max_concurrent: 5
    }
);
// Returns: BulkWhoisResponse with array of results
```

## Response Types

All responses are fully typed using shared types from `@who-tf-info/shared`:

- `HealthResponse` - API health status
- `AuthResponse` - Authentication and user data
- `WhoisResponse` - Single domain WHOIS/availability data
- `BulkWhoisResponse` - Multiple domain processing results

## Error Handling

The client provides enhanced error handling with custom error types:

### API Errors (WhoTfApiError)

When the Who-TF.info API returns an error response, it's automatically converted to a `WhoTfApiError`:

```typescript
import { WhoTfApiClient, WhoTfApiError } from '@who-tf-info/http-client-js';

try {
    const result = await client.getWhoisData('example.com');
    console.log(result);
} catch (error) {
    if (error instanceof WhoTfApiError) {
        // API returned a structured error response
        console.error('API Error:', {
            message: error.message,        // Error message
            status: error.status,          // HTTP status code
            code: error.code,              // Optional error code
            details: error.details,        // Additional error details
            requestId: error.requestId     // Request ID for tracing
        });

        // Handle specific error cases
        if (error.status === 401) {
            console.error('Invalid API key');
        } else if (error.status === 429) {
            console.error('Rate limited');
        } else if (error.status === 400) {
            console.error('Bad request:', error.details);
        }
    } else {
        // Network error, timeout, or other non-API error
        console.error('Network/Client error:', error.message);
    }
}
```

### Error Types

| Error Type | Description |
|------------|-------------|
| `WhoTfApiError` | API returned a structured error response (4xx/5xx) |
| `AxiosError` | Network errors, timeouts, connection issues |
| `Error` | Other client-side errors |

### Common HTTP Status Codes

| Status | Meaning |
|--------|---------|
| `400` | Bad Request - Invalid input parameters |
| `401` | Unauthorized - Invalid or missing API key |
| `404` | Not Found - Domain or endpoint not found |
| `429` | Too Many Requests - Rate limiting |
| `500` | Internal Server Error - Server-side issue |

## Configuration Examples

### Basic Setup

```typescript
import axios from 'axios';
import { WhoTfApiClient } from '@who-tf-info/http-client-js';

const client = new WhoTfApiClient({
    baseUrl: 'https://api.who-tf.info',
    apiKey: process.env.WHO_TF_API_KEY!,
    httpClient: axios.create()
});
```

### Advanced Configuration

```typescript
import axios from 'axios';
import { WhoTfApiClient } from '@who-tf-info/http-client-js';

const httpClient = axios.create({
    timeout: 60000,
    headers: {
        'User-Agent': 'MyApp/2.1.0',
        'Accept': 'application/json'
    },
    maxRedirects: 3
});

// Add request interceptor for logging
httpClient.interceptors.request.use(request => {
    console.log('API Request:', request.url);
    return request;
});

// Add response interceptor for error handling
httpClient.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.status);
        return Promise.reject(error);
    }
);

const client = new WhoTfApiClient({
    baseUrl: process.env.WHO_TF_API_URL || 'https://api.who-tf.info',
    apiKey: process.env.WHO_TF_API_KEY!,
    httpClient
});
```

## Development

### Building

```bash
bun run build
```

### Type Checking

```bash
bun run typecheck
```

### Testing

```bash
bun run test
```

### Development Mode

```bash
bun run dev
```

## Dependencies

- **axios** - HTTP client library
- **@who-tf-info/shared** - Shared types and validation schemas

## License

This package is part of the Who-TF.info project and follows the same license terms.