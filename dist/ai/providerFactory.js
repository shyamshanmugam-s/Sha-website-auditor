"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIProviderFactory = void 0;
const geminiProvider_js_1 = require("./geminiProvider.js");
const heuristicProvider_js_1 = require("./heuristicProvider.js");
const config_js_1 = require("../config.js");
class AIProviderFactory {
    static getProvider() {
        const selected = (config_js_1.CONFIG.AI_PROVIDER || 'gemini').toLowerCase();
        if (selected === 'gemini') {
            const gemini = new geminiProvider_js_1.GeminiProvider();
            if (gemini.isAvailable()) {
                return gemini;
            }
        }
        // Default to Heuristic Provider (robust offline-ready fallback)
        return new heuristicProvider_js_1.HeuristicProvider();
    }
}
exports.AIProviderFactory = AIProviderFactory;
