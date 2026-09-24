import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { validateUrlForSSRF } from '../security/ssrfGuard.js';
import { CONFIG } from '../config.js';

export class BrowserPool {
  private static browserInstance: Browser | null = null;
  private static activeContextsCount = 0;

  /**
   * Retrieves or launches the shared headless Chromium instance.
   */
  public static async getBrowser(): Promise<Browser> {
    if (!this.browserInstance || !this.browserInstance.isConnected()) {
      this.browserInstance = await chromium.launch({
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
  public static async createSecureContext(viewport = { width: 1440, height: 900 }): Promise<BrowserContext> {
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

      const ssrfCheck = await validateUrlForSSRF(requestUrl);
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
  public static async closeContext(context: BrowserContext): Promise<void> {
    try {
      await context.close();
    } finally {
      this.activeContextsCount = Math.max(0, this.activeContextsCount - 1);
    }
  }

  /**
   * Shuts down the browser entirely.
   */
  public static async cleanup(): Promise<void> {
    if (this.browserInstance) {
      await this.browserInstance.close();
      this.browserInstance = null;
    }
  }
}
