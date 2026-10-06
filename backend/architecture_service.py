from collections import Counter
from pathlib import Path

from ingestion_service import detect_language
from repository_service import get_allowed_files
from vector_store import VectorStore


def _top_level_directory(path: str) -> str:
    parts = path.split("/")

    if len(parts) == 1:
        return "(root)"

    return parts[0]


def build_repository_overview(
    owner: str,
    repo: str,
):
    repository_data = get_allowed_files(
        owner,
        repo,
    )

    files = repository_data["files"]

    language_counts = Counter()
    directory_counts = Counter()

    total_size = 0

    for file in files:
        language = (
            detect_language(file["path"])
            or "other"
        )

        language_counts[language] += 1
        directory_counts[
            _top_level_directory(file["path"])
        ] += 1

        total_size += file.get("size", 0)

    repository_name = (
        f"{owner}/{repo}"
    )

    store = VectorStore()

    try:
        payloads = store.get_repository_payloads(
            repository_name
        )
    finally:
        store.close()

    function_count = sum(
        1
        for payload in payloads
        if payload.get("symbol_type") == "function"
    )

    symbol_count = sum(
        1
        for payload in payloads
        if payload.get("symbol_name")
    )

    languages = [
        {
            "language": language,
            "files": count,
        }
        for language, count in language_counts.most_common()
    ]

    directories = [
        {
            "name": name,
            "files": count,
        }
        for name, count in directory_counts.most_common()
    ]

    largest_files = sorted(
        files,
        key=lambda file: file.get("size", 0),
        reverse=True,
    )[:5]

    return {
        "repository": repository_data["repository"],
        "owner": repository_data["owner"],
        "branch": repository_data["branch"],
        "file_count": len(files),
        "chunk_count": len(payloads),
        "symbol_count": symbol_count,
        "function_count": function_count,
        "total_size": total_size,
        "languages": languages,
        "directories": directories,
        "largest_files": [
            {
                "path": file["path"],
                "size": file.get("size", 0),
            }
            for file in largest_files
        ],
    }