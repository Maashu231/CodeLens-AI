import logging

import httpx
from fastapi import (
    BackgroundTasks,
    FastAPI,
    HTTPException,
    status,
)
from pydantic import BaseModel, Field

from answer_service import answer_question
from github_service import (
    get_repository,
    parse_github_url,
)
from indexing_jobs import (
    create_job,
    get_job,
    update_job,
)
from retrieval_service import index_repository


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger(__name__)


app = FastAPI(
    title="CodeLens AI",
    description="AI-powered codebase intelligence API",
    version="1.0.0",
)


class RepositoryRequest(BaseModel):
    url: str = Field(
        ...,
        min_length=1,
        description="GitHub repository URL",
    )


class AskRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=1,
        description="Question about the repository",
    )

    repository_url: str = Field(
        ...,
        min_length=1,
        description="GitHub repository URL",
    )


def get_repository_owner_and_name(
    url: str
):
    try:
        return parse_github_url(url)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


def external_service_error(
    exc: Exception,
    operation: str,
):
    logger.exception(
        "%s failed: %s",
        operation,
        exc,
    )

    if isinstance(
        exc,
        httpx.HTTPStatusError
    ):
        response_status = (
            exc.response.status_code
        )

        if response_status == 404:
            return HTTPException(
                status_code=404,
                detail="Repository not found",
            )

        if response_status == 401:
            return HTTPException(
                status_code=502,
                detail=(
                    f"{operation} failed because "
                    "the external service rejected "
                    "authentication"
                ),
            )

        if response_status == 429:
            return HTTPException(
                status_code=503,
                detail=(
                    f"{operation} is temporarily "
                    "rate limited. Please try again "
                    "later."
                ),
            )

        return HTTPException(
            status_code=502,
            detail=(
                f"{operation} failed because an "
                f"external service returned HTTP "
                f"{response_status}"
            ),
        )

    if isinstance(
        exc,
        httpx.RequestError
    ):
        return HTTPException(
            status_code=502,
            detail=(
                f"{operation} failed because an "
                "external service could not be reached"
            ),
        )

    return HTTPException(
        status_code=500,
        detail=f"{operation} failed",
    )


@app.get("/")
def home():
    return {
        "message": "CodeLens AI backend is running"
    }


@app.post("/repositories")
def add_repository(
    request: RepositoryRequest
):
    owner, repo = (
        get_repository_owner_and_name(
            request.url
        )
    )

    try:
        repository = get_repository(
            owner,
            repo
        )

        return {
            "name": repository["name"],
            "owner": repository["owner"]["login"],
            "default_branch": repository[
                "default_branch"
            ],
        }

    except (
        httpx.HTTPStatusError,
        httpx.RequestError,
    ) as exc:
        raise external_service_error(
            exc,
            "Repository lookup",
        ) from exc


def run_indexing_job(
    job_id: str,
    owner: str,
    repo: str
):
    def progress_callback(
        stage: str,
        progress: int
    ):
        update_job(
            job_id,
            status="running",
            stage=stage,
            progress=progress,
        )

        logger.info(
            "Indexing job %s | %s | %s%%",
            job_id,
            stage,
            progress,
        )

    update_job(
        job_id,
        status="running",
        stage="starting",
        progress=5,
    )

    try:
        chunks_indexed = index_repository(
            owner,
            repo,
            progress_callback
        )

        update_job(
            job_id,
            status="completed",
            stage="complete",
            progress=100,
            chunks_indexed=chunks_indexed,
        )

        logger.info(
            "Indexing job completed: %s",
            job_id,
        )

    except Exception as exc:
        logger.exception(
            "Indexing job failed: %s",
            job_id,
        )

        update_job(
            job_id,
            status="failed",
            stage="failed",
            error=str(exc),
        )


@app.post(
    "/repositories/index",
    status_code=status.HTTP_202_ACCEPTED,
)
def index_repository_endpoint(
    request: RepositoryRequest,
    background_tasks: BackgroundTasks,
):
    owner, repo = (
        get_repository_owner_and_name(
            request.url
        )
    )

    job_id = create_job(
        owner,
        repo
    )

    background_tasks.add_task(
        run_indexing_job,
        job_id,
        owner,
        repo,
    )

    logger.info(
        "Indexing job created: %s | %s/%s",
        job_id,
        owner,
        repo,
    )

    return {
        "job_id": job_id,
        "repository": f"{owner}/{repo}",
        "status": "queued",
    }


@app.get("/repositories/jobs/{job_id}")
def get_indexing_job(job_id: str):
    job = get_job(job_id)

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Indexing job not found",
        )

    return job


@app.post("/ask")
def ask_question(
    request: AskRequest
):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    owner, repo = (
        get_repository_owner_and_name(
            request.repository_url
        )
    )

    try:
        return answer_question(
            question,
            owner,
            repo,
        )

    except (
        httpx.HTTPStatusError,
        httpx.RequestError,
    ) as exc:
        raise external_service_error(
            exc,
            "Question answering",
        ) from exc

    except RuntimeError as exc:
        logger.exception(
            "Question answering runtime error"
        )

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "Unexpected question answering error"
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to answer the question",
        ) from exc