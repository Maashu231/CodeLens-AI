import logging

import httpx
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from answer_service import answer_question
from github_service import get_repository, parse_github_url
from retrieval_service import index_repository


# ---------------------------------------------------------
# App setup
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# Request models
# ---------------------------------------------------------

class RepositoryRequest(BaseModel):
    url: str = Field(
        ...,
        min_length=1,
        description="GitHub repository URL",
    )


class IndexRepositoryRequest(BaseModel):
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


# ---------------------------------------------------------
# Helper functions
# ---------------------------------------------------------

def get_repository_owner_and_name(url: str):
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

    if isinstance(exc, httpx.HTTPStatusError):
        status_code = exc.response.status_code

        if status_code == 404:
            return HTTPException(
                status_code=404,
                detail="Repository not found",
            )

        if status_code == 401:
            return HTTPException(
                status_code=502,
                detail=(
                    f"{operation} failed because the "
                    "external service rejected authentication"
                ),
            )

        if status_code == 429:
            return HTTPException(
                status_code=503,
                detail=(
                    f"{operation} is temporarily rate limited. "
                    "Please try again later."
                ),
            )

        return HTTPException(
            status_code=502,
            detail=(
                f"{operation} failed because an external "
                f"service returned HTTP {status_code}"
            ),
        )

    if isinstance(exc, httpx.RequestError):
        return HTTPException(
            status_code=502,
            detail=(
                f"{operation} failed because an external "
                "service could not be reached"
            ),
        )

    return HTTPException(
        status_code=500,
        detail=f"{operation} failed",
    )


# ---------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "CodeLens AI backend is running",
        
    }


# ---------------------------------------------------------
# Repository information
# ---------------------------------------------------------

@app.post("/repositories")
def add_repository(request: RepositoryRequest):
    owner, repo = get_repository_owner_and_name(
        request.url
    )

    try:
        repository = get_repository(
            owner,
            repo,
        )

        return {
            "name": repository["name"],
            "owner": repository["owner"]["login"],
            "default_branch": repository["default_branch"],
        }

    except (
        httpx.HTTPStatusError,
        httpx.RequestError,
    ) as exc:
        raise external_service_error(
            exc,
            "Repository lookup",
        ) from exc


# ---------------------------------------------------------
# Repository indexing
# ---------------------------------------------------------

@app.post("/repositories/index")
def index_repository_endpoint(
    request: IndexRepositoryRequest,
):
    owner, repo = get_repository_owner_and_name(
        request.url
    )

    logger.info(
        "Indexing repository: %s/%s",
        owner,
        repo,
    )

    try:
        chunks_indexed = index_repository(
            owner,
            repo,
        )

        logger.info(
            "Repository indexed successfully: %s/%s | chunks=%s",
            owner,
            repo,
            chunks_indexed,
        )

        return {
            "repository": f"{owner}/{repo}",
            "chunks_indexed": chunks_indexed,
            "status": "indexed",
        }

    except (
        httpx.HTTPStatusError,
        httpx.RequestError,
    ) as exc:
        raise external_service_error(
            exc,
            "Repository indexing",
        ) from exc

    except RuntimeError as exc:
        logger.exception(
            "Repository indexing runtime error: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "Unexpected repository indexing error: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Repository indexing failed",
        ) from exc


# ---------------------------------------------------------
# Ask CodeLens
# ---------------------------------------------------------

@app.post("/ask")
def ask_question(request: AskRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty",
        )

    owner, repo = get_repository_owner_and_name(
        request.repository_url
    )

    logger.info(
        "Question received for %s/%s: %s",
        owner,
        repo,
        question,
    )

    try:
        result = answer_question(
            question,
            owner,
            repo,
        )

        return result

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
            "Question answering runtime error: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "Unexpected question answering error: %s",
            exc,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to answer the question",
        ) from exc