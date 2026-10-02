from context_builder import build_context
from llm_service import GroqLLM
from retrieval_service import search_repository


def answer_question(
    question: str,
    owner: str,
    repo: str
):
    results = search_repository(
        question,
        owner,
        repo,
        3
    )

    if not results:
        return {
            "answer": "I couldn't find relevant evidence in the repository.",
            "sources": []
        }

    context = build_context(results)

    llm = GroqLLM()

    answer = llm.generate(
        question,
        context
    )

    sources = []

    for result in results:
        payload = result.payload

        sources.append({
            "file": payload["file_path"],
            "start_line": payload["start_line"],
            "end_line": payload["end_line"],
            "symbol": payload["symbol_name"],
            "language": payload["language"],
            "content": payload["content"]
        })

    return {
        "answer": answer,
        "sources": sources
    }