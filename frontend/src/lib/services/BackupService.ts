import { fetchWithAuth } from '$lib/utils/fetchWithAuth';

export interface BackupItem {
	id: string;
	filename: string;
	bytes: number;
	createdAt: string;
	createdBy: string | null;
	sha256: string | null;
	kind: string;
	empresaNombre: string | null;
	dbName: string | null;
}

export interface BackupJob {
	id: string;
	empresaId: string;
	type: 'dump' | 'restore' | string;
	status: 'queued' | 'running' | 'done' | 'error' | string;
	createdBy: string | null;
	createdAt: string;
	error: string | null;
	backupId: string | null;
	message: string | null;
}

async function parseError(res: Response, fallback: string): Promise<string> {
	try {
		const data = await res.json();
		return data.error || data.message || fallback;
	} catch {
		return fallback;
	}
}

export class BackupService {
	static async listar(): Promise<BackupItem[]> {
		const res = await fetchWithAuth('/backups');
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || data.message || 'Error al listar backups');
		return data.data || [];
	}

	static async crear(): Promise<BackupJob> {
		const res = await fetchWithAuth('/backups', { method: 'POST' });
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || data.message || 'Error al generar backup');
		return data.data;
	}

	static async obtenerJob(jobId: string): Promise<BackupJob> {
		const res = await fetchWithAuth(`/backups/jobs/${jobId}`);
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || data.message || 'Error al consultar el trabajo');
		return data.data;
	}

	static async esperarJob(jobId: string, onTick?: (job: BackupJob) => void): Promise<BackupJob> {
		for (;;) {
			const job = await this.obtenerJob(jobId);
			onTick?.(job);
			if (job.status === 'done' || job.status === 'error') {
				if (job.status === 'error') {
					throw new Error(job.error || job.message || 'El trabajo falló');
				}
				return job;
			}
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	}

	static async descargar(item: BackupItem): Promise<void> {
		const res = await fetchWithAuth(`/backups/${encodeURIComponent(item.id)}/download`, {
			headers: { Accept: 'application/gzip' }
		});
		if (!res.ok) {
			throw new Error(await parseError(res, 'Error al descargar el backup'));
		}
		const blob = await res.blob();
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = item.filename;
		document.body.appendChild(a);
		a.click();
		a.remove();
		URL.revokeObjectURL(url);
	}

	static async restaurar(backupId: string, confirmName: string): Promise<BackupJob> {
		const res = await fetchWithAuth(`/backups/${encodeURIComponent(backupId)}/restore`, {
			method: 'POST',
			body: JSON.stringify({ confirmName })
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || data.message || 'Error al restaurar');
		return data.data;
	}

	static async restaurarUpload(file: File, confirmName: string): Promise<BackupJob> {
		const form = new FormData();
		form.append('file', file);
		form.append('confirmName', confirmName);
		const res = await fetchWithAuth('/backups/restore-upload', {
			method: 'POST',
			body: form
		});
		const data = await res.json();
		if (!res.ok) throw new Error(data.error || data.message || 'Error al restaurar');
		return data.data;
	}
}
