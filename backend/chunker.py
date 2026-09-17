import hashlib

from models import CodeChunk


def get_lines(source_code: str, start_line: int, end_line: int) -> str:
    lines = source_code.splitlines()

    return "\n".join(
        lines[start_line - 1:end_line]
    )


def create_chunk_id(
    repository: str,
    file_sha: str,
    symbol_name: str | None,
    start_line: int,
    end_line: int
) -> str:
    raw_id = (
        f"{repository}:"
        f"{file_sha}:"
        f"{symbol_name or 'file'}:"
        f"{start_line}:"
        f"{end_line}"
    )

    return hashlib.sha256(
        raw_id.encode("utf-8")
    ).hexdigest()


def create_chunks(file: dict, repository: str):
    chunks = []

    analysis = file.get("analysis")

    if file["language"] == "python" and analysis:
        for function in analysis["functions"]:
            start_line = function["start_line"]
            end_line = function["end_line"]

            content = get_lines(
                file["content"],
                start_line,
                end_line
            )

            chunk_id = create_chunk_id(
                repository,
                file["sha"],
                function["name"],
                start_line,
                end_line
            )

            chunks.append(
                CodeChunk(
                    chunk_id=chunk_id,
                    repository=repository,
                    file_path=file["path"],
                    file_sha=file["sha"],
                    language=file["language"],
                    symbol_name=function["name"],
                    symbol_type="function",
                    start_line=start_line,
                    end_line=end_line,
                    content=content
                )
            )

    else:
        start_line = 1
        end_line = len(file["content"].splitlines())

        chunk_id = create_chunk_id(
            repository,
            file["sha"],
            None,
            start_line,
            end_line
        )

        chunks.append(
            CodeChunk(
                chunk_id=chunk_id,
                repository=repository,
                file_path=file["path"],
                file_sha=file["sha"],
                language=file["language"],
                symbol_name=None,
                symbol_type="file",
                start_line=start_line,
                end_line=end_line,
                content=file["content"]
            )
        )

    return chunks