from datetime import datetime, timezone, timedelta
from threading import Lock
from uuid import uuid4


_jobs = {}
_lock = Lock()

# Jobs older than this are eligible for cleanup.
_JOB_TTL = timedelta(hours=4)


def _cleanup_old_jobs():
    """Remove completed/failed jobs older than _JOB_TTL. Call under _lock."""
    now = datetime.now(timezone.utc)

    stale = [
        job_id
        for job_id, job in _jobs.items()
        if job["status"] in {"completed", "failed"}
        and (
            now - datetime.fromisoformat(job["updated_at"])
            > _JOB_TTL
        )
    ]

    for job_id in stale:
        del _jobs[job_id]


def create_job(owner: str, repo: str) -> str:
    job_id = str(uuid4())

    with _lock:
        _cleanup_old_jobs()

        _jobs[job_id] = {
            "job_id": job_id,
            "repository": f"{owner}/{repo}",
            "status": "queued",
            "stage": "queued",
            "progress": 0,
            "chunks_indexed": None,
            "error": None,
            "created_at": datetime.now(
                timezone.utc
            ).isoformat(),
            "updated_at": datetime.now(
                timezone.utc
            ).isoformat(),
        }

    return job_id


def update_job(
    job_id: str,
    *,
    status: str | None = None,
    stage: str | None = None,
    progress: int | None = None,
    chunks_indexed: int | None = None,
    error: str | None = None,
):
    with _lock:
        job = _jobs.get(job_id)

        if not job:
            return

        if status is not None:
            job["status"] = status

        if stage is not None:
            job["stage"] = stage

        if progress is not None:
            job["progress"] = max(
                0,
                min(progress, 100)
            )

        if chunks_indexed is not None:
            job["chunks_indexed"] = chunks_indexed

        if error is not None:
            job["error"] = error

        job["updated_at"] = datetime.now(
            timezone.utc
        ).isoformat()


def get_job(job_id: str):
    with _lock:
        job = _jobs.get(job_id)

        if not job:
            return None

        return dict(job)