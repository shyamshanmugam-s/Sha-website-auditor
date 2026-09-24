"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserPool = void 0;
const playwright_1 = require("playwright");
const ssrfGuard_js_1 = require("../security/ssrfGuard.js");
class BrowserPool {
    static browserInstance = null;
    static activeContextsCount = 0;
    /**
     * Retrieves or launches the shared headless Chromium instance.
     */
    static async getBrowser() {
        if (!this.browserInstance || !this.browserInstance.isConnected()) {
            this.browserInstance = await playwright_1.chromium.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu',
                ],
            });
        }
        return this.browserInstance;
    }
    /**
     * Creates an isolated browser context with hardened security and SSRF route interception.
     */
    static async createSecureContext(viewport = { width: 1440, height: 900 }) {
        const browser = await this.getBrowser();
        this.activeContextsCount++;
        const context = await browser.newContext({
            viewport,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36 SHA-Website-Auditor/1.0',
            ignoreHTTPSErrors: true, // Allow inspecting self-signed/expired cert sites so we can report them accurately
            locale: 'en-US',
            timezoneId: 'UTC',
        });
        // Enforce SSRF protection on every sub-resource request and navigation
        await context.route('**/*', async (route) => {
            const request = route.request();
            const requestUrl = request.url();
            // Allow data: and blob: URLs for inline fonts/images
            if (requestUrl.startsWith('data:') || requestUrl.startsWith('blob:')) {
                return route.continue();
            }
            const ssrfCheck = await (0, ssrfGuard_js_1.validateUrlForSSRF)(requestUrl);
            if (!ssrfCheck.allowed) {
                // Block request to private or loopback resources
                return route.abort('blockedbyclient');
            }
            return route.continue();
        });
        return context;
    }
    /**
     * Closes a browser context safely.
     */
    static async closeContext(context) {
        try {
            await context.close();
        }
        finally {
            this.activeContextsCount = Math.max(0, this.activeContextsCount - 1);
        }
    }
    /**
     * Shuts down the browser entirely.
     */
    static async cleanup() {
        if (this.browserInstance) {
            await this.browserInstance.close();
            this.browserInstance = null;
        }
    }
}
exports.BrowserPool = BrowserPool;
