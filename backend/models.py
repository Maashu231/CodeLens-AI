from dataclasses import dataclass


@dataclass
class CodeChunk:
    chunk_id: str
    repository: str
    file_path: str
    file_sha: str
    language: str
    symbol_name: str | None
    symbol_type: str
    start_line: int
    end_line: int
    content: str