# TypeORM Entity Development Guide

## Overview

This project uses a sophisticated TypeORM setup with custom naming strategies, Zod integration for runtime validation, and standardized entity patterns. All entities must follow these conventions for consistency and automatic database mapping.

## Core Architecture

### Base Entity Class

All entities **MUST** extend from `src/database/core/AppEntity.ts`:

```typescript
import { AppEntity } from '@app/database/core/AppEntity';

@Entity()
export class YourEntity extends AppEntity {
    // Your properties here
}
```

The `AppEntity` provides:
- **Primary Key**: Auto-incrementing `id` field
- **Timestamps**: `createdAt`, `updatedAt` automatically managed
- **Soft Delete**: `deletedAt` for logical deletion
- **Zod Integration**: Runtime validation for all base fields

### Naming Strategy

We use `InflectionNamingStrategy` which automatically converts:

| Entity Class | Table Name | Property | Column Name |
|--------------|------------|----------|-------------|
| `UserEntity` | `users` | `apiKey` | `api_key` |
| `DomainNameEntity` | `domain_names` | `fullDomain` | `full_domain` |
| `TopLevelDomainEntity` | `top_level_domains` | `whoisServer` | `whois_server` |

**Key Rules:**
- Entity classes ending with `Entity` → suffix stripped for table name
- CamelCase properties → snake_case columns
- Acronym-safe conversion (`APIKey` → `api_key`, not `a_p_i_key`)
- Automatic pluralization (`User` → `users`)

## Entity Development Patterns

### 1. Basic Entity Structure

```typescript
import { AppEntity } from '@app/database/core/AppEntity';
import { Column, Entity, Index } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';

@Entity()
export class ExampleEntity extends AppEntity {
    @Column({ type: 'varchar', length: 255, nullable: false })
    @ZodProperty(z.string().max(255))
    name: string;

    @Column({ type: 'boolean', default: true, nullable: false })
    @Index() // For frequently queried columns
    @ZodProperty(z.boolean().default(true))
    isActive: boolean;
}
```

### 2. Required Decorators

#### Every Property Needs TWO Decorators:

1. **TypeORM Decorator**: `@Column()`, `@ManyToOne()`, etc.
2. **Zod Decorator**: `@ZodProperty()` for runtime validation

```typescript
@Column({ type: 'varchar', length: 64, nullable: false })
@ZodProperty(z.string().max(64).min(32)) // ✅ Both decorators required
apiKey: string;
```

### 3. Column Types & Validation

#### Strings
```typescript
// Short strings
@Column({ type: 'varchar', length: 255, nullable: false })
@ZodProperty(z.string().max(255))
name: string;

// Long text
@Column({ type: 'text', nullable: true })
@ZodProperty(z.string().optional())
description?: string;

// Enums
@Column({ type: 'enum', enum: ['dns', 'porkbun', 'whois'], nullable: true })
@ZodProperty(z.enum(['dns', 'porkbun', 'whois']).optional())
method?: 'dns' | 'porkbun' | 'whois';
```

#### Numbers
```typescript
// Integers
@Column({ type: 'int', nullable: false, default: 0 })
@ZodProperty(z.number().int().default(0))
count: number;

// Big integers (for large IDs)
@Column({ type: 'bigint', nullable: false })
@ZodProperty(z.number())
requestId: number;
```

#### Dates & Timestamps
```typescript
// Optional date
@Column({ type: 'timestamp', nullable: true })
@ZodProperty(z.date().optional())
checkedAt?: Date;

// Required timestamp
@Column({ type: 'timestamp', nullable: false })
@ZodProperty(z.date())
requestedAt: Date;
```

#### JSON Columns
```typescript
// JSON data with proper typing
@Column({ type: 'json', nullable: true })
@ZodProperty(z.array(z.string()).optional())
nameServers?: string[];

@Column({ type: 'json', nullable: true })
@ZodProperty(z.record(z.unknown()).optional())
whoisData?: Record<string, unknown>;
```

### 4. Indexes & Constraints

#### Single Column Indexes
```typescript
@Column({ type: 'varchar', length: 64, nullable: false })
@Index({ unique: true }) // Unique constraint
@ZodProperty(z.string().max(64))
apiKey: string;

@Column({ type: 'boolean', default: true, nullable: false })
@Index() // Regular index for queries
@ZodProperty(z.boolean().default(true))
isActive: boolean;
```

#### Composite Indexes (at class level)
```typescript
@Entity()
@Index(['userId', 'requestedAt']) // Composite index for queries
@Index(['domainId', 'requestType']) // Multiple indexes allowed
export class RequestEntity extends AppEntity {
    // properties...
}
```

### 5. Relationships

#### Many-to-One (Foreign Keys)
```typescript
import { Relation } from 'typeorm';

@Entity()
export class DomainEntity extends AppEntity {
    @ManyToOne(() => DomainNameEntity, { nullable: false })
    @JoinColumn({ name: 'domain_name_id' }) // Explicit FK name
    @ZodProperty(z.instanceof(DomainNameEntity))
    domainName: Relation<DomainNameEntity>;

    @Column({ type: 'int', nullable: false })
    @Index() // Index foreign keys
    @ZodProperty(z.number())
    domainNameId: number;
}
```

#### One-to-Many
```typescript
@Entity()
export class UserEntity extends AppEntity {
    @OneToMany(() => RequestEntity, (request) => request.user)
    @ZodProperty(z.array(z.instanceof(RequestEntity)))
    requests: Relation<RequestEntity[]>;
}
```

### 6. Nullable vs Optional Properties

```typescript
// Database allows NULL, TypeScript optional
@Column({ type: 'timestamp', nullable: true })
@ZodProperty(z.date().nullable().optional())
lastRequestAt?: Date | null;

// Database NOT NULL, but optional with default
@Column({ type: 'boolean', default: false, nullable: false })
@ZodProperty(z.boolean().default(false))
isActive: boolean; // Not optional in TS
```

## Complete Entity Example

Based on the database schema, here's a complete domain entity:

```typescript
import { AppEntity } from '@app/database/core/AppEntity';
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ZodProperty } from 'typeorm-zod';
import { z } from 'zod';
import type { Relation } from 'typeorm';
import { DomainNameEntity } from './DomainNameEntity';
import { TopLevelDomainEntity } from './TopLevelDomainEntity';

@Entity()
@Index(['availabilityTtlExpiresAt'])
@Index(['whoisTtlExpiresAt'])
@Index(['expirationDate'])
@Index(['registrar'])
export class DomainEntity extends AppEntity {
    // Foreign key relationships
    @ManyToOne(() => DomainNameEntity, { nullable: false })
    @JoinColumn({ name: 'domain_name_id' })
    @ZodProperty(z.instanceof(DomainNameEntity))
    domainName: Relation<DomainNameEntity>;

    @Column({ type: 'int', nullable: false })
    @Index()
    @ZodProperty(z.number())
    domainNameId: number;

    @ManyToOne(() => TopLevelDomainEntity, { nullable: false })
    @JoinColumn({ name: 'top_level_domain_id' })
    @ZodProperty(z.instanceof(TopLevelDomainEntity))
    topLevelDomain: Relation<TopLevelDomainEntity>;

    @Column({ type: 'int', nullable: false })
    @Index()
    @ZodProperty(z.number())
    topLevelDomainId: number;

    // Core domain data
    @Column({ type: 'varchar', length: 255, nullable: false })
    @Index({ unique: true })
    @ZodProperty(z.string().max(255))
    fullDomain: string;

    // Availability caching
    @Column({ type: 'boolean', nullable: true })
    @ZodProperty(z.boolean().nullable().optional())
    isAvailable?: boolean | null;

    @Column({ type: 'timestamp', nullable: true })
    @ZodProperty(z.date().nullable().optional())
    availabilityCheckedAt?: Date | null;

    @Column({
        type: 'enum',
        enum: ['dns', 'porkbun', 'whois'],
        nullable: true
    })
    @ZodProperty(z.enum(['dns', 'porkbun', 'whois']).nullable().optional())
    availabilityMethod?: 'dns' | 'porkbun' | 'whois' | null;

    @Column({ type: 'timestamp', nullable: true })
    @Index()
    @ZodProperty(z.date().nullable().optional())
    availabilityTtlExpiresAt?: Date | null;

    // WHOIS caching
    @Column({ type: 'json', nullable: true })
    @ZodProperty(z.record(z.unknown()).nullable().optional())
    whoisData?: Record<string, unknown> | null;

    @Column({ type: 'timestamp', nullable: true })
    @ZodProperty(z.date().nullable().optional())
    whoisCheckedAt?: Date | null;

    @Column({ type: 'enum', enum: ['rdap', 'whois'], nullable: true })
    @ZodProperty(z.enum(['rdap', 'whois']).nullable().optional())
    whoisSource?: 'rdap' | 'whois' | null;

    @Column({ type: 'timestamp', nullable: true })
    @Index()
    @ZodProperty(z.date().nullable().optional())
    whoisTtlExpiresAt?: Date | null;

    // Parsed WHOIS fields
    @Column({ type: 'varchar', length: 255, nullable: true })
    @Index()
    @ZodProperty(z.string().max(255).nullable().optional())
    registrar?: string | null;

    @Column({ type: 'timestamp', nullable: true })
    @ZodProperty(z.date().nullable().optional())
    registrationDate?: Date | null;

    @Column({ type: 'timestamp', nullable: true })
    @Index()
    @ZodProperty(z.date().nullable().optional())
    expirationDate?: Date | null;

    @Column({ type: 'json', nullable: true })
    @ZodProperty(z.array(z.string()).nullable().optional())
    nameServers?: string[] | null;

    @Column({ type: 'json', nullable: true })
    @ZodProperty(z.array(z.string()).nullable().optional())
    status?: string[] | null;
}
```

## Best Practices

### ✅ DO
- Always extend `AppEntity`
- Use both `@Column()` and `@ZodProperty()` decorators
- Add indexes for frequently queried columns
- Use explicit column types and lengths
- Prefer `nullable: true` over TypeScript optionals for database fields
- Use `Relation<T>` wrapper for relationship properties
- Create composite indexes for common query patterns

### ❌ DON'T
- Skip Zod validation decorators
- Use `any` types in Zod schemas
- Forget to index foreign keys
- Mix database nullability with TypeScript optionality incorrectly
- Use overly long varchar lengths without constraints

### Performance Tips
- Index columns used in WHERE clauses
- Use composite indexes for multi-column queries
- Consider JSON column types for flexible data
- Use appropriate integer sizes (int vs bigint)
- Add partial indexes for conditional queries

### Validation Patterns
```typescript
// API keys with specific format
@ZodProperty(z.string().regex(/^ak_[a-f0-9]{32}$/))

// URLs with protocol validation
@ZodProperty(z.string().url())

// Enum with specific values
@ZodProperty(z.enum(['pending', 'completed', 'failed']))

// Numbers with constraints
@ZodProperty(z.number().int().min(0).max(9999))
```

## Data Transfer Objects (DTOs)

The project uses a clean DTO pattern for API layer data validation and transformation. DTOs are manually crafted TypeScript interfaces that define the shape of data for different operations, with runtime validation powered by the same Zod schemas used in entities.

### DTO Structure

Each entity has a corresponding DTO file in `src/database/dtos/` with four main interfaces:

```typescript
// Example: UserDtos.ts
export interface UserDto extends BaseDto {
    name: string;
    apiKey: string;
    isActive: boolean;
    lastRequestAt: Date | null | undefined;
    totalRequests: number;
}

export interface CreateUserDto extends Omit<UserDto, 'id' | 'created' | 'updated'> {}

export interface UpdateUserDto extends Omit<Partial<UserDto>, 'id' | 'created' | 'updated'> {}

export interface UserQueryDto extends Partial<UserDto> {}
```

### DTO Types Explained

#### 1. **EntityDto** (Main Interface)
- Extends `BaseDto` which provides `id`, `created`, `updated` fields
- Represents the complete entity structure for API responses
- Matches entity properties but uses simpler types (no relationships)

#### 2. **CreateEntityDto**
- For creating new records via API
- Omits system-managed fields (`id`, `created`, `updated`)
- All business-required fields are required

#### 3. **UpdateEntityDto**
- For updating existing records via API
- All fields are optional (partial updates)
- Omits system-managed fields
- No `id` requirement (ID typically comes from URL path)

#### 4. **EntityQueryDto**
- For filtering/searching records via API
- All fields are optional for flexible queries
- Used in GET endpoints with query parameters

### Runtime Validation

Each DTO file includes validation functions powered by typeorm-zod:

```typescript
import { createEntitySchemas } from 'typeorm-zod';
import { UserEntity } from '@app/database/entities';

export const UserSchemas = createEntitySchemas(UserEntity, undefined);

export const validateCreateUser = (data: unknown): CreateUserDto =>
    UserSchemas.create.parse(data) as CreateUserDto;

export const validateUpdateUser = (data: unknown): UpdateUserDto =>
    UserSchemas.update.parse(data) as UpdateUserDto;

export const validateQueryUser = (data: unknown): UserQueryDto =>
    UserSchemas.query.parse(data) as UserQueryDto;
```

### Usage in API Endpoints

DTOs provide type-safe API validation and clean separation between database entities and API contracts:

```typescript
// API Controller Example
import { validateCreateUser, validateUpdateUser, type UserDto } from '@who-tf-info/shared';

async function createUser(request: Request): Promise<UserDto> {
    // Validate incoming request data
    const userData = validateCreateUser(request.body);

    // Create entity (ORM handles relationships)
    const user = userRepository.create(userData);
    const savedUser = await userRepository.save(user);

    // Return clean DTO response
    return {
        id: savedUser.id,
        name: savedUser.name,
        apiKey: savedUser.apiKey,
        isActive: savedUser.isActive,
        lastRequestAt: savedUser.lastRequestAt,
        totalRequests: savedUser.totalRequests,
        created: savedUser.createdAt,
        updated: savedUser.updatedAt,
    };
}

async function updateUser(id: number, request: Request): Promise<UserDto> {
    // Validate partial update data
    const updateData = validateUpdateUser(request.body);

    // Update entity
    await userRepository.update(id, updateData);
    const updatedUser = await userRepository.findOneByOrFail({ id });

    // Return updated DTO
    return mapEntityToDto(updatedUser);
}
```

### DTO Benefits

1. **Type Safety**: Compile-time checking for API data structures
2. **Runtime Validation**: Zod schemas validate incoming requests
3. **Clean APIs**: Consistent, predictable API contracts
4. **Separation of Concerns**: API layer separate from database layer
5. **Flexibility**: Different validation rules for create/update/query operations
6. **Documentation**: DTOs serve as API documentation

### DTO vs Entity Differences

| Aspect | Entity | DTO |
|--------|--------|-----|
| **Purpose** | Database mapping | API contracts |
| **Relationships** | Full TypeORM relations | Simple references (IDs) |
| **Validation** | Database constraints | Request validation |
| **Nullability** | Database-specific | API-friendly |
| **Timestamps** | `createdAt`/`updatedAt` | `created`/`updated` |

### Testing DTOs

Each DTO validation function is thoroughly tested:

```typescript
// Example test patterns
describe('validateCreateUser', () => {
    it('should pass with valid complete data', () => {
        const validData = {
            name: 'John Doe',
            apiKey: 'abcdef1234567890123456789012345678901234',
            isActive: true,
            totalRequests: 0,
        };

        const result = validateCreateUser(validData);
        expect(result.name).toBe('John Doe');
    });

    it('should fail with missing required fields', () => {
        const invalidData = { name: 'John Doe' }; // Missing apiKey

        expect(() => validateCreateUser(invalidData)).toThrow();
    });
});
```

This DTO pattern provides a robust foundation for API development with clear contracts, validation, and type safety throughout the application stack.

## Repository Services

The project includes standardized repository services that provide a consistent data access layer. Each entity has a corresponding repository service that extends the base functionality:

### Available Repository Services

- **DomainRepoService** (`src/database/db-service/DomainRepoService.ts`)
- **DomainNameRepoService** (`src/database/db-service/DomainNameRepoService.ts`)
- **TopLevelDomainRepoService** (`src/database/db-service/TopLevelDomainRepoService.ts`)
- **RequestRepoService** (`src/database/db-service/RequestRepoService.ts`)
- **SettingRepoService** (`src/database/db-service/SettingRepoService.ts`)
- **UsersRepoService** (`src/database/db-service/UsersRepoService.ts`)

### Repository Service Pattern

All repository services follow a consistent pattern:

```typescript
import { BaseRepositoryService } from '@app/database/core/BaseRepositoryService';
import type { RepositoryServiceInterface } from '@app/database/core/RepositoryServiceInterface';
import { EntityName } from '@app/database/entities';
import { inject, singleton } from 'tsyringe';
import { DataSource } from 'typeorm';

@singleton()
export class EntityRepoService
    extends BaseRepositoryService<EntityName>
    implements RepositoryServiceInterface<EntityName>
{
    constructor(@inject(DataSource) dataSource: DataSource) {
        super(dataSource, EntityName);
    }
}
```

### Repository Service Features

Each repository service inherits comprehensive CRUD operations from `BaseRepositoryService`:

- **Basic Operations**: `findById`, `findMany`, `findOne`, `save`, `update`, `remove`
- **Advanced Operations**: `upsert`, `softDelete`, `restore`, `exists`, `count`
- **Pagination**: `findPaginated` with configurable page size and sorting
- **Type Safety**: Full TypeScript typing with entity-specific generics
- **Dependency Injection**: Singleton pattern with tsyringe container

### Usage in Services

Repository services are injected into business logic services:

```typescript
@singleton()
export class DomainService {
    constructor(
        @inject(DomainRepoService) private domainRepo: DomainRepoService,
        @inject(DomainNameRepoService) private domainNameRepo: DomainNameRepoService
    ) {}

    async findDomainByName(name: string): Promise<DomainEntity | null> {
        return this.domainRepo.findOne({ fullDomain: name });
    }
}
```

## Summary

This setup provides type safety, runtime validation, consistent naming, and excellent database performance through proper indexing strategies. The combination of well-designed entities, clean DTOs, and standardized repository services creates a maintainable architecture that scales from development to production.