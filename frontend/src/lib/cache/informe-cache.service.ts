/**
 * Servicio de caché para informes
 * Orquesta la persistencia usando un adaptador inyectado (DIP)
 */
import type { ICacheAdapter } from './types';
import type { CacheEntry } from './types';
import { DEFAULT_TTL_INFORMES } from './types';

function buildCacheKey(informeId: string, params: Record<string, unknown>): string {
	const sorted = Object.keys(params)
		.sort()
		.map((k) => `${k}=${String(params[k] ?? '')}`)
		.join('|');
	return `informe_${informeId}_${sorted}`;
}

export class InformeCacheService {
	constructor(private readonly adapter: ICacheAdapter) {}

	async get<T>(informeId: string, params: Record<string, unknown>): Promise<CacheEntry<T> | null> {
		const key = buildCacheKey(informeId, params);
		const result = await this.adapter.get<CacheEntry<T>>(key);
		return result;
	}

	async set<T>(
		informeId: string,
		params: Record<string, unknown>,
		data: T,
		ttlMs = DEFAULT_TTL_INFORMES
	): Promise<void> {
		const key = buildCacheKey(informeId, params);
		const entry: CacheEntry<T> = {
			data,
			params,
			timestamp: Date.now()
		};
		await this.adapter.set(key, entry, ttlMs);
	}
}
