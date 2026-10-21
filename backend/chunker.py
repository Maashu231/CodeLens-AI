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
    imports = analysis.get("imports", []) if analysis else []

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
                    content=content,
                    imports=imports
                )
            )

    else:
        # For non-Python files, use a sliding-window line chunker so large files
        # don't exceed the embedding model's token limit and are retrievable at
        # finer granularity. Small files (under the window) become a single chunk.
        lines = file["content"].splitlines()
        total_lines = len(lines)

        WINDOW_SIZE = 80   # lines per chunk
        STRIDE = 60        # lines to advance (20-line overlap)

        if total_lines == 0:
            # Empty file — emit one placeholder chunk.
            chunk_id = create_chunk_id(
                repository,
                file["sha"],
                None,
                1,
                1,
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
                    start_line=1,
                    end_line=1,
                    content="",
                    imports=imports,
                )
            )

        elif total_lines <= WINDOW_SIZE:
            # File fits in a single chunk.
            chunk_id = create_chunk_id(
                repository,
                file["sha"],
                None,
                1,
                total_lines,
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
                    start_line=1,
                    end_line=total_lines,
                    content=file["content"],
                    imports=imports,
                )
            )

        else:
            # Sliding window over the file.
            window_start = 0

            while window_start < total_lines:
                window_end = min(
                    window_start + WINDOW_SIZE,
                    total_lines,
                )

                start_line = window_start + 1
                end_line = window_end

                content = "\n".join(
                    lines[window_start:window_end]
                )

                chunk_id = create_chunk_id(
                    repository,
                    file["sha"],
                    None,
                    start_line,
                    end_line,
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
                        content=content,
                        imports=imports,
                    )
                )

                if window_end == total_lines:
                    break

                window_start += STRIDE

    return chunks
