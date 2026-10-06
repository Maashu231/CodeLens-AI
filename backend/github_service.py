import base64
import os
from urllib.parse import urlparse

import httpx


API_BASE = "https://api.github.com"

GITHUB_HEADERS = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2026-03-10",
}

github_token = os.getenv("GITHUB_TOKEN")

if github_token:
    GITHUB_HEADERS["Authorization"] = (
        f"Bearer {github_token}"
    )


def github_get(url: str, **kwargs):
    request_headers = dict(GITHUB_HEADERS)

    extra_headers = kwargs.pop("headers", None)

    if extra_headers:
        request_headers.update(extra_headers)

    return httpx.get(
        url,
        headers=request_headers,
        timeout=10.0,
        **kwargs,
    )


def parse_github_url(repository_url: str):
    if not isinstance(repository_url, str):
        raise ValueError(
            "Repository URL must be a string"
        )

    parsed = urlparse(
        repository_url.strip()
    )

    if parsed.scheme != "https":
        raise ValueError(
            "GitHub URL must use HTTPS"
        )

    if parsed.netloc.lower() != "github.com":
        raise ValueError(
            "URL must belong to github.com"
        )

    if parsed.query or parsed.fragment:
        raise ValueError(
            "GitHub repository URL must not contain "
            "query parameters or fragments"
        )

    parts = [
        part
        for part in parsed.path.split("/")
        if part
    ]

    if len(parts) != 2:
        raise ValueError(
            "URL must point directly to a GitHub repository"
        )

    owner, repo = parts

    return owner, repo


def get_repository(owner: str, repo: str):
    url = f"{API_BASE}/repos/{owner}/{repo}"

    response = github_get(url)

    response.raise_for_status()

    return response.json()


def get_repository_tree(
    owner: str,
    repo: str,
    branch: str
):
    branch_url = (
        f"{API_BASE}/repos/"
        f"{owner}/{repo}/branches/{branch}"
    )

    branch_response = github_get(branch_url)

    branch_response.raise_for_status()

    tree_sha = (
        branch_response
        .json()["commit"]["commit"]["tree"]["sha"]
    )

    tree_url = (
        f"{API_BASE}/repos/"
        f"{owner}/{repo}/git/trees/{tree_sha}"
    )

    tree_response = github_get(
        tree_url,
        params={"recursive": "1"},
    )

    tree_response.raise_for_status()

    return tree_response.json()


def get_repository_archive(
    owner: str,
    repo: str,
    branch: str
) -> bytes:
    url = (
        f"{API_BASE}/repos/"
        f"{owner}/{repo}/zipball/{branch}"
    )

    response = httpx.get(
        url,
        headers=GITHUB_HEADERS,
        timeout=120.0,
        follow_redirects=True,
    )

    response.raise_for_status()

    return response.content


def get_file_content(
    owner: str,
    repo: str,
    path: str,
    branch: str
):
    url = (
        f"{API_BASE}/repos/"
        f"{owner}/{repo}/contents/{path}"
    )

    response = github_get(
        url,
        params={"ref": branch},
    )

    response.raise_for_status()

    data = response.json()

    if data.get("type") != "file":
        raise ValueError(
            f"{path} is not a file"
        )

    content = base64.b64decode(
        data["content"]
    ).decode("utf-8")

    return content