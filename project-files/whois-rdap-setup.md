# WHOIS/RDAP Lookup Database Setup Plan

## Overview
Enhance the existing TLD infrastructure for domain availability checking with WHOIS/RDAP server mappings and intelligent fallback mechanisms. Focus on simplicity and leveraging existing database structure.

## Phase 1: Enhance Existing TLD Infrastructure

### 1. Extend TopLevelDomainEntity
- **Add Server Mappings**: Extend existing entity with WHOIS/RDAP server URLs
- **IANA Root Zone Sync**: Import/update official TLD list from IANA
- **Server URL Population**: Map each TLD to its authoritative servers
- **TLD Validation Service**: Fast TLD validation for domain input

### 2. Data Source Integration
- **IANA RDAP Bootstrap**: Import official RDAP server mappings from JSON
- **Community WHOIS Mappings**: Import community-maintained server mappings
- **Static Fallback Configuration**: Define generic fallback servers in config

### 3. Simple Fallback Strategy
- **Primary Server Resolution**: Use TLD-specific RDAP/WHOIS servers first
- **Generic Fallback Chain**: RDAP → WHOIS → IANA fallback
- **Runtime Error Handling**: Simple timeout/retry without persistent health tracking

## Phase 2: Enhanced Database Schema

### Updated TopLevelDomainEntity
- Add `whoisServer?: string` - Primary WHOIS server hostname
- Add `rdapServer?: string` - Primary RDAP server base URL
- Keep existing fields: `tld`, `type`, `isActive`
- No new entities needed - leverage existing structure

## Phase 3: Data Population & Services

### 1. Data Import Services
- **IANA RDAP Bootstrap Importer**: Fetch RDAP server mappings from `https://data.iana.org/rdap/dns.json`
- **Community WHOIS Mappings Importer**: Import from `github.com/FurqanSoftware/node-whois/servers.json`
- **One-Time Data Population**: Run importers to populate server URLs in existing TLD records
- **Optional Refresh Command**: Manual refresh capability for TLD data updates

### 2. Simple Lookup Services
- **TLD Resolver**: Fast TLD validation and server URL retrieval
- **Server Selector**: Return RDAP first, then WHOIS, then fallback
- **Domain Parser**: Extract TLD from domain (handle multi-level TLDs like `.co.uk`)

## Phase 4: Integration & Testing

### 1. Service Integration
- Connect domain availability checking to TLD lookup
- Implement server selection in WHOIS/RDAP clients
- Add TLD validation to domain input endpoints

### 2. Testing
- Unit tests for TLD resolution and domain parsing
- Integration tests with real server lookups
- Fallback testing for missing/invalid TLD data

## Simplified Database Schema

### Enhanced TopLevelDomainEntity
```typescript
interface TopLevelDomainEntity {
    // Existing fields
    id: number;
    tld: string;                    // e.g., "com", "org", "co.uk"
    type: 'generic' | 'country-code' | 'sponsored' | 'infrastructure';
    isActive: boolean;

    // New server mapping fields
    whoisServer?: string;           // e.g., "whois.verisign-grs.com"
    rdapServer?: string;            // e.g., "https://rdap.verisign.com/"

    // Existing timestamp fields
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
```

## Data Sources

### 1. IANA RDAP Bootstrap Registry
- **URL**: https://data.iana.org/rdap/dns.json
- **Format**: JSON
- **Contains**: Official RDAP server mappings for TLDs
- **Example**:
```json
{
  "services": [
    [["com", "net"], ["https://rdap.verisign.com/"]],
    [["org"], ["https://rdap.pir.org/"]]
  ]
}
```

### 2. Community WHOIS Server Mappings
- **URL**: https://raw.githubusercontent.com/FurqanSoftware/node-whois/master/servers.json
- **Format**: JSON
- **Contains**: Community-maintained WHOIS server mappings
- **Example**:
```json
{
  "com": "whois.verisign-grs.com",
  "org": "whois.pir.org",
  "co.uk": "whois.nominet.uk"
}
```

### 3. Static Fallback Configuration
- **Generic RDAP**: Try `https://rdap.iana.org/domain/{domain}`
- **Generic WHOIS**: Try `whois.iana.org:43`
- **Last Resort**: Return error with suggestions

## Simple Service Architecture

### TLD Resolution Flow
1. **Domain Parser**: Extract TLD from input (handle `.co.uk`, `.com.au`, etc.)
2. **TLD Lookup**: Query TopLevelDomainEntity by TLD
3. **Server Selection**: Return RDAP URL first, then WHOIS server
4. **Static Fallback**: Use hardcoded fallbacks if no TLD-specific servers

### Server Selection Logic
```typescript
function getServersForDomain(domain: string): { rdap?: string, whois?: string } {
  const tld = extractTLD(domain);
  const tldEntity = await tldRepo.findByTld(tld);

  return {
    rdap: tldEntity?.rdapServer || 'https://rdap.iana.org/',
    whois: tldEntity?.whoisServer || 'whois.iana.org'
  };
}
```

### No Health Monitoring Needed
- Use simple timeout/retry at request level
- Let external WHOIS/RDAP clients handle failures
- Keep it stateless and simple

## Implementation Priority

### Phase 1: Data Import (Day 1-2)
1. Create IANA RDAP bootstrap importer service
2. Create community WHOIS mappings importer service
3. Run one-time import to populate existing TLD records with server URLs
4. Add CLI commands for future data refreshes

### Phase 2: Lookup Services (Day 3-4)
1. Implement TLD resolution service
2. Create domain parser for multi-level TLD extraction
3. Add simple server selection logic
4. Add TLD validation to domain input

### Phase 3: Integration & Testing (Day 5)
1. Connect lookup services to domain availability logic
2. Add unit tests for TLD resolution and domain parsing
3. Test with real WHOIS/RDAP servers
4. Validate fallback behavior

## Files to Create/Modify

### Database Status
- ✅ `TopLevelDomainEntity` already has `whoisServer` and `rdapServer` fields
- ✅ No database changes needed - ready to populate data

### Import Services
- `src/services/data/IanaRdapImporter.ts` - RDAP bootstrap importer
- `src/services/data/CommunityWhoisImporter.ts` - Community mappings importer
- `src/utils/cli/import-tld-servers.ts` - CLI command for imports

### Lookup Services
- `src/services/lookup/TldResolver.ts` - TLD lookup and validation
- `src/services/lookup/DomainParser.ts` - Extract TLD from domain
- `src/services/lookup/ServerSelector.ts` - Simple server selection

### Configuration
- Add fallback server URLs to `AppConfig`
- Update environment variables for import URLs

## Success Criteria

### Simplicity
- ✅ No new database entities - enhance existing TopLevelDomainEntity only
- ✅ Static configuration for fallbacks - no complex health monitoring
- ✅ One server per TLD per protocol - no multiple server tracking

### Functionality
- ✅ Fast TLD validation and server resolution
- ✅ Reliable fallback to generic servers
- ✅ Handle multi-level TLDs correctly (`.co.uk`, `.com.au`)

### Performance
- ✅ TLD lookup under 5ms (database + caching)
- ✅ Simple server selection without complex algorithms
- ✅ Minimal overhead on domain availability checking

### Maintainability
- ✅ Simple import process for updating server mappings
- ✅ Clear separation between TLD data and lookup logic
- ✅ Easy to extend for new TLDs and server types

This simplified plan focuses on enhancing existing infrastructure rather than creating new entities, making it easier to implement and maintain.