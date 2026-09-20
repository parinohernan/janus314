const crypto = require('crypto');

const jobs = new Map();
const MAX_JOBS = 100;

function pruneJobs() {
  if (jobs.size <= MAX_JOBS) return;
  const done = [...jobs.values()]
    .filter((job) => job.status === 'done' || job.status === 'error')
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  const extra = jobs.size - MAX_JOBS;
  for (let i = 0; i < extra && i < done.length; i += 1) {
    jobs.delete(done[i].id);
  }
}

function createJob({ empresaId, type, createdBy }) {
  const id = crypto.randomUUID();
  const job = {
    id,
    empresaId: String(empresaId),
    type,
    status: 'queued',
    createdBy: createdBy || null,
    createdAt: new Date().toISOString(),
    error: null,
    backupId: null,
    message: null
  };
  jobs.set(id, job);
  pruneJobs();
  return job;
}

function getJob(id) {
  return jobs.get(id) || null;
}

function updateJob(id, patch) {
  const job = jobs.get(id);
  if (!job) return null;
  Object.assign(job, patch);
  return job;
}

function empresaHasActiveJob(empresaId) {
  const key = String(empresaId);
  for (const job of jobs.values()) {
    if (job.empresaId === key && (job.status === 'queued' || job.status === 'running')) {
      return job;
    }
  }
  return null;
}

function publicJob(job) {
  if (!job) return null;
  return {
    id: job.id,
    empresaId: job.empresaId,
    type: job.type,
    status: job.status,
    createdBy: job.createdBy,
    createdAt: job.createdAt,
    error: job.error,
    backupId: job.backupId,
    message: job.message
  };
}

function resetForTests() {
  jobs.clear();
}

module.exports = {
  createJob,
  getJob,
  updateJob,
  empresaHasActiveJob,
  publicJob,
  resetForTests
};
