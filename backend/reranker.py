import re


def tokenize(text: str) -> set[str]:
    return {
        token.lower()
        for token in re.findall(r"[a-zA-Z0-9_]+", text)
        if len(token) > 2
    }


def rerank_results(query: str, results: list, limit: int = 5):
    query_tokens = tokenize(query)

    reranked = []

    implementation_query = any(
        word in query.lower()
        for word in [
            "where is",
            "defined",
            "implementation",
            "endpoint",
            "route",
        ]
    )

    endpoint_query = any(
        word in query.lower()
        for word in [
            "endpoint",
            "route",
            "api",
        ]
    )

    for result in results:
        payload = result.payload

        content = payload.get("content", "")
        file_path = payload.get("file_path", "")
        symbol_name = payload.get("symbol_name") or ""

        searchable_text = (
            f"{content} "
            f"{file_path} "
            f"{symbol_name}"
        )

        content_tokens = tokenize(searchable_text)

        overlap = len(query_tokens & content_tokens)

        score = result.score

        # Small boost for direct keyword matches.
        score += overlap * 0.03

        # Endpoint-related queries should favor actual route definitions.
        if endpoint_query:
            if re.search(
                r"@\w+\.(get|post|put|patch|delete|api_route)\s*\(",
                content
            ):
                score += 0.08

        # For implementation questions, prefer source code over tests.
        if implementation_query:
            if "/tests/" in file_path.lower() or "\\tests\\" in file_path.lower():
                score -= 0.04

            if symbol_name.lower().startswith("test_"):
                score -= 0.04

        reranked.append((score, result))

    reranked.sort(key=lambda item: item[0], reverse=True)

    return [
        result
        for _, result in reranked[:limit]
    ]