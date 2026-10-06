from io import BytesIO
from zipfile import BadZipFile, ZipFile

from file_filter import is_allowed_file
from github_service import (
    get_repository,
    get_repository_archive,
    get_repository_tree,
)


MAX_FILE_SIZE = 1_000_000


def get_allowed_files(
    owner: str,
    repo: str
):
    repository = get_repository(
        owner,
        repo
    )

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

        if not is_allowed_file(path):
            continue

        size = item.get("size", 0)

        if size > MAX_FILE_SIZE:
            continue

        allowed_files.append({
            "path": path,
            "sha": item["sha"],
            "size": size,
        })

    return {
        "repository": repository["name"],
        "owner": repository["owner"]["login"],
        "branch": branch,
        "files": allowed_files,
    }


def _build_archive_index(
    archive: ZipFile
):
    files = {}

    for info in archive.infolist():

        if info.is_dir():
            continue

        name = info.filename.replace(
            "\\",
            "/"
        )

        parts = name.split(
            "/",
            1
        )

        if len(parts) != 2:
            continue

        relative_path = parts[1]

        files[relative_path] = info

    return files


def get_file_contents(
    owner: str,
    repo: str,
    progress_callback=None
):
    repository_data = get_allowed_files(
        owner,
        repo
    )

    if progress_callback:
        progress_callback(
            "files_discovered",
            10
        )

    archive_bytes = get_repository_archive(
        owner,
        repo,
        repository_data["branch"]
    )

    if progress_callback:
        progress_callback(
            "source_downloaded",
            25
        )

    files_with_content = []

    try:
        with ZipFile(
            BytesIO(archive_bytes)
        ) as archive:

            archive_files = _build_archive_index(
                archive
            )

            total_files = len(
                repository_data["files"]
            )

            for index, file in enumerate(
                repository_data["files"],
                1
            ):
                path = file["path"]

                archive_info = archive_files.get(
                    path
                )

                if archive_info is None:
                    continue

                try:
                    content = archive.read(
                        archive_info
                    ).decode("utf-8")

                except UnicodeDecodeError:
                    continue

                files_with_content.append({
                    "path": path,
                    "sha": file["sha"],
                    "size": file["size"],
                    "content": content,
                })

                if progress_callback and total_files:
                    progress = 25 + int(
                        (index / total_files) * 25
                    )

                    progress_callback(
                        "reading_source",
                        progress
                    )

    except BadZipFile as exc:
        raise RuntimeError(
            "GitHub repository archive could not be read"
        ) from exc

    return {
        "repository": repository_data["repository"],
        "owner": repository_data["owner"],
        "branch": repository_data["branch"],
        "files": files_with_content,
    }