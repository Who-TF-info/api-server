feat: implemented core configuration and dependency injection system

- Added AppConfig type definitions with Zod schema validation
- Created utility functions for logger, cache, config, container, and PorkBun client setup
- Implemented tsyringe-based dependency injection container with service registration
- Added comprehensive unit tests for all utility creation functions focused on creation logic
- Established configuration system supporting environment variables and overrides
- Set up Pino logger with pretty printing for development environments
- Configured Redis/Valkey cache with in-memory fallback using Keyv
- Integrated PorkBun API client with credential validation and error handling