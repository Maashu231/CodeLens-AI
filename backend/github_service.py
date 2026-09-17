from urllib.parse import urlparse
import httpx


def parse_github_url(repository_url: str):
    if not isinstance(repository_url, str):
        raise ValueError("Repository URL must be a string")

    parsed = urlparse(repository_url.strip())

    if parsed.scheme != "https":
        raise ValueError("GitHub URL must use HTTPS")

    if parsed.netloc.lower() != "github.com":
        raise ValueError("URL must belong to github.com")

    if parsed.query or parsed.fragment:
        raise ValueError("GitHub repository URL must not contain query parameters or fragments")

    parts = [part for part in parsed.path.split("/") if part]

    if len(parts) != 2:
        raise ValueError("URL must point directly to a GitHub repository")

    owner, repo = parts

    return owner, repo


def get_repository(owner: str, repo: str):
    url = f"https://api.github.com/repos/{owner}/{repo}"

    response = httpx.get(url, timeout=10.0)
    response.raise_for_status()

    return response.json()

def get_repository_tree(owner: str, repo: str, branch: str):
    branch_url = f"https://api.github.com/repos/{owner}/{repo}/branches/{branch}"

    branch_response = httpx.get(branch_url, timeout=10.0)
    branch_response.raise_for_status()

    tree_sha = branch_response.json()["commit"]["commit"]["tree"]["sha"]

    tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{tree_sha}"

    tree_response = httpx.get(
        tree_url,
        params={"recursive": "1"},
        timeout=10.0
    )
    tree_response.raise_for_status()

    return tree_response.json()

import base64
import httpx


def get_file_content(owner: str, repo: str, path: str, branch: str):
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"

    response = httpx.get(
        url,
        params={"ref": branch},
        timeout=10.0
    )
    response.raise_for_status()

    data = response.json()

    if data.get("type") != "file":
        raise ValueError(f"{path} is not a file")

    content = base64.b64decode(data["content"]).decode("utf-8")

    return content