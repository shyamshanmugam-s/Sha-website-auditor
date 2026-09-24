"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPrivateOrReservedIP = isPrivateOrReservedIP;
exports.validateUrlForSSRF = validateUrlForSSRF;
const promises_1 = __importDefault(require("dns/promises"));
const ipaddr_js_1 = __importDefault(require("ipaddr.js"));
const BLOCKED_HOSTNAMES = new Set([
    'localhost',
    'metadata.google.internal',
    '169.254.169.254',
    'metadata',
    'instance-data',
    'localhost.localdomain',
    'ip6-localhost',
    'ip6-loopback',
]);
/**
 * Checks if an IP address is in a private, loopback, link-local, or reserved range.
 * Fully supports IPv4, IPv6, and IPv4-mapped IPv6.
 */
function isPrivateOrReservedIP(ipString) {
    try {
        let cleanIp = ipString.trim();
        if (cleanIp.startsWith('[') && cleanIp.endsWith(']')) {
            cleanIp = cleanIp.slice(1, -1);
        }
        let addr = ipaddr_js_1.default.parse(cleanIp);
        // If IPv4-mapped IPv6 address (e.g., ::ffff:127.0.0.1), unwrap to IPv4
        if (addr.kind() === 'ipv6') {
            const ipv6Addr = addr;
            if (ipv6Addr.isIPv4MappedAddress()) {
                addr = ipv6Addr.toIPv4Address();
            }
        }
        const range = addr.range();
        // Blocked ranges across IPv4 and IPv6:
        // loopback, private (10/8, 172.16/12, 192.168/16, fc00::/7), linkLocal (169.254/16, fe80::/10),
        // carrierGradeNat (100.64/10), broadcast, reserved, unspecified (0.0.0.0, ::), uniqueLocal
        const blockedRanges = [
            'loopback',
            'private',
            'linkLocal',
            'carrierGradeNat',
            'broadcast',
            'reserved',
            'unspecified',
            'uniqueLocal',
        ];
        return blockedRanges.includes(range);
    }
    catch {
        // If not a valid IP string, treat as unsafe
        return true;
    }
}
/**
 * Validates a target URL against SSRF attack vectors.
 * 1. Checks scheme (http: or https: only)
 * 2. Checks hostname against known cloud metadata & localhost hostnames
 * 3. Handles IPv4, IPv6, and domain names
 * 4. Resolves DNS to IP address
 * 5. Validates IP address against all private/loopback/cloud metadata ranges
 */
async function validateUrlForSSRF(rawUrl) {
    let parsedUrl;
    try {
        parsedUrl = new URL(rawUrl);
    }
    catch (err) {
        return {
            allowed: false,
            reason: `Invalid URL format: ${err.message}`,
        };
    }
    // 1. Validate Scheme
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return {
            allowed: false,
            reason: `Prohibited URL protocol: ${parsedUrl.protocol}. Only http: and https: are allowed.`,
        };
    }
    let hostname = parsedUrl.hostname.toLowerCase().trim();
    // Strip brackets from IPv6 hostnames like [::1]
    let cleanHost = hostname;
    if (cleanHost.startsWith('[') && cleanHost.endsWith(']')) {
        cleanHost = cleanHost.slice(1, -1);
    }
    // 2. Validate Hostname blocklist
    if (BLOCKED_HOSTNAMES.has(cleanHost) ||
        cleanHost.endsWith('.internal') ||
        cleanHost.endsWith('.local') ||
        cleanHost.endsWith('.localhost')) {
        return {
            allowed: false,
            reason: `Prohibited hostname: ${hostname} (local, internal, or cloud metadata address).`,
        };
    }
    // Check if hostname is directly an IP (IPv4 or IPv6)
    if (ipaddr_js_1.default.isValid(cleanHost)) {
        if (isPrivateOrReservedIP(cleanHost)) {
            return {
                allowed: false,
                reason: `Direct IP ${hostname} is in a private, loopback, or cloud-metadata network range.`,
                resolvedIp: cleanHost,
            };
        }
        return {
            allowed: true,
            resolvedIp: cleanHost,
            normalizedUrl: parsedUrl.toString(),
        };
    }
    // 3. Resolve DNS
    try {
        const lookupResults = await promises_1.default.lookup(cleanHost, { all: true });
        if (!lookupResults || lookupResults.length === 0) {
            return {
                allowed: false,
                reason: `Could not resolve domain ${cleanHost} in DNS.`,
            };
        }
        for (const entry of lookupResults) {
            if (isPrivateOrReservedIP(entry.address)) {
                return {
                    allowed: false,
                    reason: `Domain ${cleanHost} resolved to private/reserved IP: ${entry.address}`,
                    resolvedIp: entry.address,
                };
            }
        }
        return {
            allowed: true,
            resolvedIp: lookupResults[0].address,
            normalizedUrl: parsedUrl.toString(),
        };
    }
    catch (dnsErr) {
        return {
            allowed: false,
            reason: `DNS resolution failed for ${cleanHost}: ${dnsErr.message}`,
        };
    }
}
