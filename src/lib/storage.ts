import * as SQLite from 'expo-sqlite';

const memoryStore = new Map<string, string>();
let db: ReturnType<typeof SQLite.openDatabaseSync> | null = null;

function init() {
  try {
    db = SQLite.openDatabaseSync('casaemdia.db');
    db.execSync(`
      CREATE TABLE IF NOT EXISTS app_storage (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
  } catch (error) {
    console.warn('[storage] SQLite unavailable, falling back to memory storage', error);
  }
}

init();

export async function storageSet(key: string, value: string): Promise<void> {
  memoryStore.set(key, value);
  if (!db) return;

  try {
    db.runSync('INSERT OR REPLACE INTO app_storage (key, value) VALUES (?, ?)', [key, value]);
  } catch (error) {
    console.warn('[storage] Failed to persist value to SQLite', error);
  }
}

export async function storageGet(key: string): Promise<string | null> {
  if (!db) {
    return memoryStore.get(key) ?? null;
  }

  try {
    const row = db.getFirstSync('SELECT value FROM app_storage WHERE key = ?', [key]) as { value?: string } | undefined;
    return row?.value ?? memoryStore.get(key) ?? null;
  } catch (error) {
    console.warn('[storage] Failed to read value from SQLite', error);
    return memoryStore.get(key) ?? null;
  }
}

export async function storageRemove(key: string): Promise<void> {
  memoryStore.delete(key);
  if (!db) return;

  try {
    db.runSync('DELETE FROM app_storage WHERE key = ?', [key]);
  } catch (error) {
    console.warn('[storage] Failed to remove value from SQLite', error);
  }
}

export async function storageGetAllKeys(): Promise<string[]> {
  if (!db) {
    return Array.from(memoryStore.keys());
  }

  try {
    const rows = db.getAllSync('SELECT key FROM app_storage') as Array<{ key: string }>;
    const sqliteKeys = rows.map((row) => row.key);
    const merged = new Set([...sqliteKeys, ...memoryStore.keys()]);
    return Array.from(merged);
  } catch (error) {
    console.warn('[storage] Failed to list keys from SQLite', error);
    return Array.from(memoryStore.keys());
  }
}

export async function storageMultiRemove(keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  keys.forEach((key) => memoryStore.delete(key));
  if (!db) return;

  try {
    const placeholders = keys.map(() => '?').join(', ');
    db.runSync(`DELETE FROM app_storage WHERE key IN (${placeholders})`, keys);
  } catch (error) {
    console.warn('[storage] Failed to remove multiple values from SQLite', error);
  }
}
