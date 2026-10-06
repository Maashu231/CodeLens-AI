from datetime import datetime, timezone
from threading import Lock
from uuid import uuid4


_jobs = {}
_lock = Lock()


def create_job(owner: str, repo: str) -> str:
    job_id = str(uuid4())

    with _lock:
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