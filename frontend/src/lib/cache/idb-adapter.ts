/**
 * Adaptador IndexedDB para caché de informes
 * Implementa ICacheAdapter usando la librería idb
 */
import { openDB } from 'idb';
import { browser } from '$app/environment';
import type { ICacheAdapter } from './types';
import { DEFAULT_TTL_INFORMES } from './types';

const DB_NAME = 'janus314_informes_cache';
const DB_VERSION = 1;
const STORE_NAME = 'informes';

interface StoredEntry<T> {
	key: string;
	data: T;
	params: Record<string, unknown>;
	timestamp: number;
	ttlMs?: number;
}

/** CacheEntry que devolvemos al leer (sin key) */
export interface CacheEntryResult<T> {
	data: T;
	params: Record<string, unknown>;
	timestamp: number;
}

let dbPromise: ReturnType<typeof openDB> | null = null;

function getDb() {
	if (!browser) return null;
	if (!dbPromise) {
		dbPromise = openDB(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME, { keyPath: 'key' });
				}
			}
		});
	}
	return dbPromise;
}

export const idbCacheAdapter: ICacheAdapter = {
	async get<T>(key: string): Promise<T | null> {
		const db = await getDb();
		if (!db) return null;

		const entry = await db.get(STORE_NAME, key) as StoredEntry<T> | undefined;
		if (!entry) return null;

		const ttl = entry.ttlMs ?? DEFAULT_TTL_INFORMES;
		if (Date.now() - entry.timestamp > ttl) {
			await db.delete(STORE_NAME, key);
			return null;
		}

		return { data: entry.data, params: entry.params, timestamp: entry.timestamp } as T;
	},

	async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
		const db = await getDb();
		if (!db) return;

		const v = value as { data: unknown; params?: Record<string, unknown> };
		const entry: StoredEntry<unknown> = {
			key,
			data: v.data ?? value,
			params: v.params ?? {},
			timestamp: Date.now(),
			ttlMs
		};

		await db.put(STORE_NAME, entry);
	}
};
