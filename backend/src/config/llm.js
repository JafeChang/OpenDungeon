import OpenAI from 'openai';
import { getDatabase } from './database.js';

let client = null;

export function getLLMConfig() {
  const db = getDatabase();
  const stmt = db.prepare("SELECT key, value FROM settings WHERE key LIKE 'llm_%'");
  const settings = stmt.all();

  const config = {};
  settings.forEach(setting => {
    const key = setting.key.replace('llm_', '');
    config[key] = setting.value;
  });

  return config;
}

export function initializeLLMClient() {
  const config = getLLMConfig();

  if (!config.api_key) {
    console.warn('LLM API key not configured');
    return null;
  }

  client = new OpenAI({
    baseURL: config.api_url,
    apiKey: config.api_key,
  });

  console.log('LLM client initialized with model:', config.model);
  return client;
}

export function getLLMClient() {
  if (!client) {
    return initializeLLMClient();
  }
  return client;
}

export function updateLLMConfig(updates) {
  const db = getDatabase();
  const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');

  Object.entries(updates).forEach(([key, value]) => {
    stmt.run(`llm_${key}`, value);
  });

  // Reinitialize client with new config
  client = null;
  return initializeLLMClient();
}

export default {
  getLLMConfig,
  initializeLLMClient,
  getLLMClient,
  updateLLMConfig
};
