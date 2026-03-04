/**
 * Tipos para el sistema de caché de informes (IndexedDB)
 * Arquitectura SOLID: interfaces mínimas, responsabilidad única
 */

export const DEFAULT_TTL_INFORMES = 30 * 60 * 1000; // 30 minutos

/** Entrada de caché con metadatos */
export interface CacheEntry<T> {
	data: T;
	params: Record<string, unknown>;
	timestamp: number;
}

/** Interfaz mínima del adaptador de persistencia (DIP) */
export interface ICacheAdapter {
	get<T>(key: string): Promise<T | null>;
	set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
}
