import httpx

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from github_service import get_repository, parse_github_url


app = FastAPI()


class RepositoryRequest(BaseModel):
    url: str


@app.get("/")
def home():
    return {"message": "CodeLens AI backend is running"}


@app.post("/repositories")
def add_repository(request: RepositoryRequest):
    try:
        owner, repo = parse_github_url(request.url)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        )

    try:
        repository = get_repository(owner, repo)

    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="Repository not found"
            )

        raise HTTPException(
            status_code=502,
            detail="GitHub API request failed"
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Unable to reach GitHub"
        )

    return {
        "name": repository["name"],
        "owner": repository["owner"]["login"],
        "default_branch": repository["default_branch"]
    }