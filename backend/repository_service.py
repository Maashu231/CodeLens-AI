from github_service import get_repository, get_repository_tree
from file_filter import is_allowed_file


def get_allowed_files(owner: str, repo: str):
    repository = get_repository(owner, repo)

    branch = repository["default_branch"]

    tree = get_repository_tree(
        owner,
        repo,
        branch
    )

    allowed_files = []

    for item in tree["tree"]:
        if item["type"] != "blob":
            continue

        path = item["path"]

        if is_allowed_file(path):
            allowed_files.append(path)
from github_service import get_repository, get_repository_tree
from file_filter import is_allowed_file


def get_allowed_files(owner: str, repo: str):
    repository = get_repository(owner, repo)

    branch = repository["default_branch"]

    tree = get_repository_tree(
        owner,
        repo,
        branch
    )

    allowed_files = []

    for item in tree["tree"]:
        if item["type"] != "blob":
            continue

        path = item["path"]

        if is_allowed_file(path):
            allowed_files.append({
                "path": path,
                "sha": item["sha"],
                "size": item.get("size", 0)
            })

    return {
        "repository": repository["name"],
        "owner": repository["owner"]["login"],
        "branch": branch,
        "files": allowed_files
    }
    return {
        "repository": repository["name"],
        "owner": repository["owner"]["login"],
        "branch": branch,
        "files": allowed_files
    }

from github_service import get_file_content


MAX_FILE_SIZE = 1_000_000


def get_file_contents(owner: str, repo: str):
    repository_data = get_allowed_files(owner, repo)

    files_with_content = []

    for file in repository_data["files"]:
        if file["size"] > MAX_FILE_SIZE:
            continue

        content = get_file_content(
            owner,
            repo,
            file["path"],
            repository_data["branch"]
        )

        files_with_content.append({
            "path": file["path"],
            "sha": file["sha"],
            "size": file["size"],
            "content": content
        })

    return {
        "repository": repository_data["repository"],
        "owner": repository_data["owner"],
        "branch": repository_data["branch"],
        "files": files_with_content
    }