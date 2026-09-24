import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const isVercel = process.env.VERCEL === '1' || !!process.env.NOW_REGION;
const baseDataDir = process.env.DATA_DIR || (isVercel ? path.resolve('/tmp', 'data') : path.resolve(process.cwd(), 'data'));

export const CONFIG = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  IS_VERCEL: isVercel,
  
  // AI Provider configuration (Active: Gemini and Heuristic)
  AI_PROVIDER: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  
  // Crawling limits & timeouts
  MAX_PAGES_DEFAULT: parseInt(process.env.MAX_PAGES_DEFAULT || '20', 10),
  MAX_PAGES_LIMIT: parseInt(process.env.MAX_PAGES_LIMIT || '50', 10),
  AUDIT_TIMEOUT_MS: parseInt(process.env.AUDIT_TIMEOUT_MS || '300000', 10), // 5 minutes
  PAGE_TIMEOUT_MS: 30000, // 30s per page
  MAX_CONCURRENT_AUDITS: parseInt(process.env.MAX_CONCURRENT_AUDITS || '2', 10),
  MAX_CONCURRENT_PAGE_CRAWLS: parseInt(process.env.MAX_CONCURRENT_PAGE_CRAWLS || '3', 10),
  MAX_RESPONSE_SIZE_BYTES: parseInt(process.env.MAX_RESPONSE_SIZE_BYTES || '10485760', 10), // 10MB
  
  // Storage paths
  DATA_DIR: baseDataDir,
  AUDITS_DIR: path.resolve(baseDataDir, 'audits'),
  SCREENSHOTS_DIR: path.resolve(baseDataDir, 'screenshots'),
  PDFS_DIR: path.resolve(baseDataDir, 'pdfs'),
};
