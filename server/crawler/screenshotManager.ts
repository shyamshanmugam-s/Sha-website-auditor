import fs from 'fs/promises';
import path from 'path';
import { Page } from 'playwright';
import { CONFIG } from '../config.js';

export interface ScreenshotPaths {
  desktopScreenshotRel: string;
  mobileScreenshotRel: string;
  desktopScreenshotFullAbs: string;
  mobileScreenshotFullAbs: string;
}

export class ScreenshotManager {
  /**
   * Ensures the screenshot directory for a specific audit exists.
   */
  public static async ensureAuditDir(auditId: string): Promise<string> {
    const auditDir = path.join(CONFIG.SCREENSHOTS_DIR, auditId);
    await fs.mkdir(auditDir, { recursive: true });
    return auditDir;
  }

  /**
   * Captures desktop viewport screenshot (1920x1080).
   */
  public static async captureDesktop(
    page: Page,
    auditId: string,
    filenamePrefix: string = 'home-desktop'
  ): Promise<{ relPath: string; absPath: string }> {
    const auditDir = await this.ensureAuditDir(auditId);
    const filename = `${filenamePrefix}-${Date.now()}.png`;
    const absPath = path.join(auditDir, filename);
    const relPath = `/screenshots/${auditId}/${filename}`;

    await page.setViewportSize({ width: 1440, height: 900 });
    // Wait for animations and render stabilization
    await page.waitForTimeout(800);

    await page.screenshot({
      path: absPath,
      fullPage: false, // Capture above-the-fold / primary visual
      type: 'png',
    });

    return { relPath, absPath };
  }

  /**
   * Captures mobile viewport screenshot (390x844 iPhone/Pixel viewport).
   */
  public static async captureMobile(
    page: Page,
    auditId: string,
    filenamePrefix: string = 'home-mobile'
  ): Promise<{ relPath: string; absPath: string }> {
    const auditDir = await this.ensureAuditDir(auditId);
    const filename = `${filenamePrefix}-${Date.now()}.png`;
    const absPath = path.join(auditDir, filename);
    const relPath = `/screenshots/${auditId}/${filename}`;

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);

    await page.screenshot({
      path: absPath,
      fullPage: false,
      type: 'png',
    });

    return { relPath, absPath };
  }
}
