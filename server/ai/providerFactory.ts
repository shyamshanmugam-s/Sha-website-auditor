import { IAIProvider } from './aiInterface.js';
import { GeminiProvider } from './geminiProvider.js';
import { HeuristicProvider } from './heuristicProvider.js';
import { CONFIG } from '../config.js';

export class AIProviderFactory {
  public static getProvider(): IAIProvider {
    const selected = (CONFIG.AI_PROVIDER || 'gemini').toLowerCase();

    if (selected === 'gemini') {
      const gemini = new GeminiProvider();
      if (gemini.isAvailable()) {
        return gemini;
      }
    }

    // Default to Heuristic Provider (robust offline-ready fallback)
    return new HeuristicProvider();
  }
}
