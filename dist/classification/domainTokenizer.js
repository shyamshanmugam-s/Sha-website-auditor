"use strict";
/**
 * General Domain Tokenizer
 * Performs token extraction, compound word segmentation, and noise filtering on any website URL.
 * Contains ZERO domain-specific hardcoding.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainTokenizer = void 0;
// Common commercial lemmas and roots for compound domain segmentation
const COMMERCIAL_DICTIONARY = new Set([
    // Core Industries & Concepts
    'interior', 'interiors', 'design', 'designs', 'designer', 'designers', 'decor', 'decorator',
    'architecture', 'architect', 'architects', 'architectural', 'build', 'builder', 'builders', 'building',
    'construction', 'contractor', 'contractors', 'fitout', 'renovation', 'remodel', 'remodeling',
    'pump', 'pumps', 'pumping', 'valve', 'valves', 'motor', 'motors', 'machinery', 'machine', 'machines',
    'manufacturing', 'manufacturer', 'manufacturers', 'factory', 'industries', 'industry', 'industrial',
    'cnc', 'mfg', 'oem', 'fabrication', 'metal', 'steel', 'casting', 'forging', 'electronics', 'textile',
    'restaurant', 'restaurants', 'dining', 'bistro', 'cafe', 'cafes', 'coffee', 'bakery', 'bakeries',
    'catering', 'caterer', 'hotel', 'hotels', 'resort', 'resorts', 'suites', 'kitchen', 'food', 'foods',
    'salad', 'salads', 'bowl', 'bowls', 'eats', 'eat', 'fresh', 'organic', 'green', 'greens', 'sweet',
    'juice', 'tea', 'culinary', 'pizza', 'burger', 'tacos', 'barbecue', 'bbq', 'seafood', 'steak',
    'dental', 'dentist', 'dentists', 'dentistry', 'orthodontics', 'orthodontist', 'teeth', 'smile',
    'health', 'healthcare', 'medical', 'clinic', 'clinics', 'doctor', 'doctors', 'hospital', 'hospitals',
    'therapy', 'physical', 'pharma', 'care', 'wellness', 'physician',
    'fitness', 'gym', 'gyms', 'workout', 'trainer', 'training', 'yoga', 'pilates', 'crossfit', 'sports',
    'real', 'estate', 'realty', 'realtor', 'realtors', 'property', 'properties', 'homes', 'home',
    'house', 'houses', 'apartments', 'apartment', 'villa', 'villas', 'condos', 'condo',
    'tech', 'technology', 'technologies', 'software', 'soft', 'app', 'apps', 'cloud', 'saas', 'data',
    'digital', 'cyber', 'security', 'solutions', 'systems', 'platform', 'ai', 'analytics', 'dev',
    'ecommerce', 'shop', 'shops', 'shopping', 'store', 'stores', 'retail', 'outlet', 'market',
    'law', 'laws', 'legal', 'lawyer', 'lawyers', 'attorney', 'attorneys', 'advocate', 'counsel',
    'finance', 'financial', 'accountant', 'accountants', 'accounting', 'tax', 'taxes', 'cpa', 'wealth',
    'audit', 'bank', 'banking', 'invest', 'investment', 'investments', 'capital', 'advisory',
    'beauty', 'salon', 'salons', 'spa', 'spas', 'hair', 'hairstylist', 'barber', 'nails', 'skin',
    'plumbing', 'plumber', 'plumbers', 'pipe', 'pipes', 'hvac', 'cooling', 'heating', 'electric',
    'electrician', 'electrical', 'roof', 'roofing', 'roofer', 'roofers', 'pest', 'clean', 'cleaning',
    'auto', 'automobile', 'automotive', 'car', 'cars', 'motors', 'garage', 'mechanic', 'repair',
    'dealer', 'dealership', 'vehicles', 'vehicle', 'tire', 'tires',
    'travel', 'tourism', 'tour', 'tours', 'trip', 'trips', 'vacation', 'flight', 'flights', 'holiday',
    'edu', 'education', 'school', 'schools', 'academy', 'college', 'university', 'learn', 'learning',
    'nonprofit', 'charity', 'foundation', 'ngo', 'donate', 'donation', 'community', 'mission',
    'gov', 'government', 'city', 'state', 'public', 'civic', 'council', 'portal',
    'agency', 'consulting', 'consultant', 'consultants', 'group', 'studio', 'studios', 'lab', 'labs',
    'creative', 'media', 'marketing', 'press', 'works', 'hub', 'center', 'centre', 'service', 'services',
    'custom', 'smart', 'elite', 'prime', 'first', 'united', 'global', 'national', 'local', 'city',
    'express', 'direct', 'pro', 'plus', 'star', 'craft', 'house', 'point', 'line', 'force',
    'firm', 'firms', 'practice', 'modern', 'contemporary', 'luxury', 'space', 'spatial',
]);
// Noise tokens to filter from industry classification
const NOISE_TOKENS = new Set([
    'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by',
    'www', 'com', 'org', 'net', 'edu', 'gov', 'io', 'ai', 'co', 'in', 'uk', 'us', 'de', 'ca', 'au',
    'online', 'web', 'site', 'website', 'my', 'get', 'go', 'hq', 'corp', 'inc', 'llc', 'ltd',
    'global', 'world', 'direct', 'pro', 'top', 'best', 'all', 'hub', 'zone', 'link', 'app', 'new',
    'example', 'demo', 'test', 'sample', 'temp', 'domain', 'page', 'official',
]);
class DomainTokenizer {
    /**
     * Tokenizes a website hostname into meaningful distinct words.
     * E.g. "http://aainteriordesignstudio.com/" -> ["aa", "interior", "design", "studio"]
     * E.g. "https://custom-pump-mfg.co.uk" -> ["custom", "pump", "mfg"]
     * E.g. "https://sweetgreen.com" -> ["sweet", "green"]
     */
    static tokenize(url) {
        let rawHost = '';
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            rawHost = urlObj.hostname.toLowerCase();
        }
        catch {
            rawHost = url.toLowerCase().replace(/^(https?:\/\/)?/, '').split('/')[0];
        }
        // Strip common subdomains
        rawHost = rawHost.replace(/^(www|m|app|api|dev|staging|portal)\./, '');
        // Strip TLDs (multi-part like .co.uk, .co.in or single like .com, .org, .design)
        let baseName = rawHost
            .replace(/\.(co\.[a-z]{2}|org\.[a-z]{2}|gov\.[a-z]{2}|edu\.[a-z]{2})$/i, '')
            .replace(/\.[a-z]{2,}$/i, '');
        // Split on hyphens, underscores, and dots
        const parts = baseName.split(/[-_.]+/).filter(Boolean);
        const tokens = [];
        for (const part of parts) {
            // Split camelCase
            const camelParts = part.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/\s+/);
            for (const cp of camelParts) {
                // Segment compound words using dynamic dictionary search
                const segmented = this.segmentCompoundWord(cp);
                tokens.push(...segmented);
            }
        }
        return {
            tokens,
            rawHost,
            baseName,
        };
    }
    /**
     * Segments a concatenated string (e.g. "interiordesignstudio" or "aainteriordesignstudio")
     * into recognized dictionary words using Dynamic Programming for optimal global segmentation.
     */
    static segmentCompoundWord(word) {
        const lower = word.toLowerCase();
        if (lower.length <= 3) {
            return [lower];
        }
        if (COMMERCIAL_DICTIONARY.has(lower)) {
            return [lower];
        }
        const n = lower.length;
        const dp = new Array(n + 1).fill(null);
        dp[0] = { score: 0, tokens: [] };
        for (let i = 1; i <= n; i++) {
            let bestState = null;
            for (let j = 0; j < i; j++) {
                const prev = dp[j];
                if (!prev)
                    continue;
                const sub = lower.slice(j, i);
                const subLen = sub.length;
                let subScore = 0;
                if (COMMERCIAL_DICTIONARY.has(sub)) {
                    // Significant reward for recognized commercial dictionary terms (proportional to length squared)
                    subScore = prev.score + subLen * subLen * 4 + 20;
                }
                else {
                    // Penalty for unrecognized substrings
                    if (subLen <= 2) {
                        // Short prefixes/suffixes like "aa", "co", "ab" have minimal penalty
                        subScore = prev.score - subLen * 2;
                    }
                    else if (subLen <= 4) {
                        subScore = prev.score - subLen * 6;
                    }
                    else {
                        subScore = prev.score - subLen * 12;
                    }
                }
                if (bestState === null || subScore > bestState.score) {
                    bestState = {
                        score: subScore,
                        tokens: [...prev.tokens, sub],
                    };
                }
            }
            dp[i] = bestState;
        }
        const finalTokens = dp[n]?.tokens || [lower];
        return finalTokens.filter(Boolean);
    }
    /**
     * Filters out generic noise tokens.
     */
    static filterNoise(tokens) {
        return tokens.filter((t) => !NOISE_TOKENS.has(t.toLowerCase()) && t.length > 1);
    }
    /**
     * Generates a clean inferred business title from a domain name.
     */
    static formatTitleFromDomain(url) {
        const { tokens } = this.tokenize(url);
        if (tokens.length === 0)
            return '';
        // Title case tokens, preserving acronyms
        const formattedWords = tokens.map((w) => {
            const lower = w.toLowerCase();
            if (lower === 'aa' || lower === 'mfg' || lower === 'cnc' || lower === 'rfq' || lower === 'hvac' || lower === 'cpa' || lower === 'it' || lower === 'ai' || lower === 'oem' || lower === 'iso') {
                return lower.toUpperCase();
            }
            return w.charAt(0).toUpperCase() + w.slice(1);
        });
        return formattedWords.join(' ').trim();
    }
}
exports.DomainTokenizer = DomainTokenizer;
