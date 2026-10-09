from context_builder import build_context
from retrieval_service import search_repository


def prepare_streaming_answer(
    question: str,
    owner: str,
    repo: str,
):
    results = search_repository(
        question,
        owner,
        repo,
        3,
    )

    if not results:
        return None

    context = build_context(
        results
    )

    sources = []

    for result in results:
        payload = result.payload

        sources.append(
            {
                "file": payload["file_path"],
                "start_line": payload["start_line"],
                "end_line": payload["end_line"],
                "symbol": payload["symbol_name"],
                "language": payload["language"],
                "content": payload["content"],
            }
        )

    return {
        "context": context,
        "sources": sources,
    }