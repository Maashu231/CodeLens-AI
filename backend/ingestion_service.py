from pathlib import Path

from repository_service import get_file_contents
from code_parser import parse_code, extract_functions, extract_imports
from chunker import create_chunks


LANGUAGE_BY_EXTENSION = {
    ".py": "python",
    ".java": "java",
    ".js": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".jsx": "javascript",
    ".sql": "sql",
    ".html": "html",
    ".css": "css",
    ".md": "markdown",
    ".json": "json",
    ".yml": "yaml",
    ".yaml": "yaml",
}


def detect_language(path: str):
    extension = Path(path).suffix.lower()
    return LANGUAGE_BY_EXTENSION.get(extension)


def analyze_file(file: dict, repository: str):
    path = file["path"]
    language = detect_language(path)

    result = {
        "path": path,
        "sha": file["sha"],
        "size": file["size"],
        "language": language,
        "content": file["content"],
        "analysis": None,
        "chunks": []
    }

    if language == "python":
        tree = parse_code(file["content"])

        result["analysis"] = {
            "imports": extract_imports(tree),
            "functions": extract_functions(tree)
        }

    result["chunks"] = create_chunks(result, repository)

    return result


def ingest_repository(owner: str, repo: str):
    repository = get_file_contents(owner, repo)

    analyzed_files = []

    repository_name = f"{repository['owner']}/{repository['repository']}"

    for file in repository["files"]:
        analyzed_files.append(
            analyze_file(file, repository_name)
        )

    return {
        "repository": repository["repository"],
        "owner": repository["owner"],
        "branch": repository["branch"],
        "files": analyzed_files
    }