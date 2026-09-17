from fastapi import FastAPI
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
    owner, repo = parse_github_url(request.url)

    repository = get_repository(owner, repo)

    return {
        "name": repository["name"],
        "owner": repository["owner"]["login"],
        "default_branch": repository["default_branch"]
    }