"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScreenshotManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const config_js_1 = require("../config.js");
class ScreenshotManager {
    /**
     * Ensures the screenshot directory for a specific audit exists.
     */
    static async ensureAuditDir(auditId) {
        const auditDir = path_1.default.join(config_js_1.CONFIG.SCREENSHOTS_DIR, auditId);
        await promises_1.default.mkdir(auditDir, { recursive: true });
        return auditDir;
    }
    /**
     * Captures desktop viewport screenshot (1920x1080).
     */
    static async captureDesktop(page, auditId, filenamePrefix = 'home-desktop') {
        const auditDir = await this.ensureAuditDir(auditId);
        const filename = `${filenamePrefix}-${Date.now()}.png`;
        const absPath = path_1.default.join(auditDir, filename);
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
    static async captureMobile(page, auditId, filenamePrefix = 'home-mobile') {
        const auditDir = await this.ensureAuditDir(auditId);
        const filename = `${filenamePrefix}-${Date.now()}.png`;
        const absPath = path_1.default.join(auditDir, filename);
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
exports.ScreenshotManager = ScreenshotManager;
