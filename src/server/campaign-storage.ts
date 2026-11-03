import fs from 'fs';
import os from 'os';
import path from 'path';
import { Campaign, INITIAL_CAMPAIGNS } from '../lib/campaigns';

const BUNDLED_DATA_DIR = path.resolve(process.cwd(), 'data');
const RUNTIME_DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'aerothor-data')
  : BUNDLED_DATA_DIR;

const CAMPAIGNS_FILE_PATH = path.join(RUNTIME_DATA_DIR, 'campaigns-db.json');

function ensureDataDirectoryExists() {
  try {
    if (!fs.existsSync(RUNTIME_DATA_DIR)) {
      fs.mkdirSync(RUNTIME_DATA_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('[CAMPAIGN STORAGE] Failed to create data directory:', err);
  }
}

export function loadPersistedCampaigns(): Campaign[] {
  ensureDataDirectoryExists();
  try {
    if (fs.existsSync(CAMPAIGNS_FILE_PATH)) {
      const raw = fs.readFileSync(CAMPAIGNS_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[CAMPAIGN STORAGE] Could not load persisted campaigns, returning defaults:', err);
  }
  return INITIAL_CAMPAIGNS;
}

export function savePersistedCampaigns(campaigns: Campaign[]): void {
  ensureDataDirectoryExists();
  try {
    fs.writeFileSync(CAMPAIGNS_FILE_PATH, JSON.stringify(campaigns, null, 2), 'utf-8');
  } catch (err) {
    console.error('[CAMPAIGN STORAGE] Failed to write campaigns file:', err);
  }
}
