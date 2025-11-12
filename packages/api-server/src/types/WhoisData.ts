// Contact information structure (used in both RDAP and WHOIS)
export interface ContactInfo {
    name?: string;
    organization?: string;
    email?: string;
    phone?: string;
    address?: {
        street?: string[];
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
    };
}

// Unified WHOIS data structure
export interface WhoisData {
    domain: string;
    registrar?: string;
    registrant?: ContactInfo;
    admin?: ContactInfo;
    tech?: ContactInfo;
    billing?: ContactInfo;
    creationDate?: Date;
    expirationDate?: Date;
    updatedDate?: Date;
    nameServers?: string[];
    status?: string[];
    dnssec?: boolean;
    source: 'rdap' | 'whois';
    rawWhois?: string; // Original WHOIS text response
    rawRdap?: RdapDomainResponse; // Original RDAP JSON response
}

// RDAP Types - RFC 9083 Compliant

export interface RdapLink {
    href: string;
    rel: string;
    type: string;
    value: string;
    hreflang?: string[];
    title?: string;
    media?: string;
}

export interface RdapEvent {
    eventAction: string;
    eventDate: string;
    eventActor?: string;
}

export interface RdapPublicId {
    identifier: string;
    type: string;
}

export interface RdapRemark {
    description: string[];
    title: string;
    type: string;
}

export interface RdapNotice {
    title: string;
    description: string[];
    links?: RdapLink[];
}

// vCard format: ["vcard", [["property", {params}, "type", "value"], ...]]
export type VCardParameter = Record<string, string | string[]>;
export type VCardProperty = [string, VCardParameter, string, string];
export type VCardArray = ['vcard', VCardProperty[]];

export interface RdapEntity {
    objectClassName: 'entity';
    handle?: string;
    roles?: string[];
    status?: string[];
    vcardArray?: VCardArray;
    entities?: RdapEntity[];
    events?: RdapEvent[];
    links?: RdapLink[];
    publicIds?: RdapPublicId[];
    remarks?: RdapRemark[];
}

export interface RdapNameserver {
    objectClassName: 'nameserver';
    handle?: string;
    ldhName?: string;
    unicodeName?: string;
    status?: string[];
    links?: RdapLink[];
    remarks?: RdapRemark[];
    ipAddresses?: {
        v4?: string[];
        v6?: string[];
    };
}

export interface RdapDsData {
    algorithm: number;
    digest: string;
    digestType: number;
    keyTag: number;
}

export interface RdapSecureDns {
    delegationSigned: boolean;
    dsData?: RdapDsData[];
    zoneSigned: boolean;
}

// Main RDAP Domain Response
export interface RdapDomainResponse {
    rdapConformance: string[];
    objectClassName: 'domain';
    handle?: string;
    ldhName: string;
    unicodeName?: string;
    status?: string[];
    entities?: RdapEntity[];
    nameservers?: RdapNameserver[];
    events?: RdapEvent[];
    links?: RdapLink[];
    secureDNS?: RdapSecureDns;
    notices?: RdapNotice[];
}

// Legacy alias for backward compatibility
export type RdapResponse = RdapDomainResponse;
