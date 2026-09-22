from models import CodeChunk


def build_embedding_text(chunk: CodeChunk) -> str:
    parts = [
        f"Repository: {chunk.repository}",
        f"File: {chunk.file_path}",
        f"Language: {chunk.language}",
    ]

    if chunk.symbol_name:
        parts.append(f"{chunk.symbol_type}: {chunk.symbol_name}")

    parts.append("Code:")
    parts.append(chunk.content)

    return "\n".join(parts)