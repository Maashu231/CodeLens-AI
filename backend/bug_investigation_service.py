from collections import OrderedDict

from answer_service import search_repository
from context_builder import build_context
from github_service import get_file_content, get_repository
from llm_service import GroqLLM
from vector_store import VectorStore


BUG_SYSTEM_INSTRUCTIONS = """
You are CodeLens AI acting as a senior software debugging assistant.

Investigate the user's reported bug using ONLY the provided repository evidence.

Your job is to identify the most likely cause from the actual source code.

Important reasoning rules:

1. Do not invent repository facts.
2. Do not assume a reverse proxy, middleware, load balancer, or deployment layer
   unless the provided evidence explicitly shows it.
3. Distinguish observed facts from hypotheses.
4. Prefer code that directly handles the reported error or status code.
5. Prefer backend implementation files over frontend files and tests when
   diagnosing runtime bugs.
6. When an error/status code appears in the question, search for that exact
   signal and related error-handling code.
7. Use only file paths and line numbers present in the evidence.
8. Every repository-specific claim must use an exact citation.
9. If the evidence is insufficient, say so clearly.
10. Never claim a dependency, token, configuration, or infrastructure component
    is missing unless the repository evidence proves it.
11. When the evidence shows that CodeLens itself converts an external error into
    a different HTTP status, clearly distinguish the upstream error from the
    final CodeLens response.

Return the answer using these sections:

## Likely Cause
Explain the most likely technical cause.

## Code Path
Explain the relevant execution path.

## Evidence
List the strongest repository evidence with exact citations.

## What To Check
Give a small number of practical checks.

## Confidence
State High, Medium, or Low confidence.

Do not claim the bug is definitely fixed.
Do not invent missing infrastructure.
"""


class EvidenceResult:
    def __init__(
        self,
        payload: dict,
        score: float = 0.0,
    ):
        self.payload = payload
        self.score = score


def _build_investigation_queries(
    question: str,
) -> list[str]:
    queries = [
        question.strip()
    ]

    lowered = question.lower()

    if (
        "502" in lowered
        or "bad gateway" in lowered
    ):
        queries.extend(
            [
                "502 Bad Gateway HTTP error handling",
                "HTTPStatusError external_service_error",
                "FastAPI 502 external service error",
                "status_code=502 exception",
            ]
        )

    if (
        "403" in lowered
        or "rate limit" in lowered
        or "rate limited" in lowered
    ):
        queries.extend(
            [
                "GitHub API 403 rate limit exceeded",
                "GitHub rate limit authentication GITHUB_TOKEN",
                "external service 403 rate limit",
                "Authorization GITHUB_TOKEN GitHub API",
            ]
        )

    if "401" in lowered:
        queries.extend(
            [
                "GitHub API 401 authentication",
                "Authorization GITHUB_TOKEN",
            ]
        )

    if "404" in lowered:
        queries.extend(
            [
                "GitHub API 404 repository not found",
                "HTTPStatusError 404 error handling",
            ]
        )

    if (
        "github" in lowered
        or "repository" in lowered
    ):
        queries.extend(
            [
                "GitHub API repository request error handling",
                "get_repository GitHub API",
            ]
        )

    unique_queries = []

    for query in queries:
        query = query.strip()

        if not query:
            continue

        if query not in unique_queries:
            unique_queries.append(query)

    return unique_queries


def _build_keyword_signals(
    question: str,
) -> list[str]:
    lowered = question.lower()

    signals = []

    if (
        "502" in lowered
        or "bad gateway" in lowered
    ):
        signals.extend(
            [
                "502",
                "bad gateway",
                "HTTPStatusError",
                "external_service_error",
                "status_code=502",
            ]
        )

    if (
        "403" in lowered
        or "rate limit" in lowered
        or "rate limited" in lowered
    ):
        signals.extend(
            [
                "403",
                "rate limit",
                "rate limited",
                "GITHUB_TOKEN",
                "Authorization",
                "external_service_error",
            ]
        )

    if "401" in lowered:
        signals.extend(
            [
                "401",
                "authentication",
                "GITHUB_TOKEN",
                "Authorization",
            ]
        )

    if "404" in lowered:
        signals.extend(
            [
                "404",
                "Repository not found",
                "HTTPStatusError",
            ]
        )

    if "github" in lowered:
        signals.extend(
            [
                "GitHub",
                "api.github.com",
                "github_get",
            ]
        )

    for token in (
        question.replace("(", " ")
        .replace(")", " ")
        .replace(",", " ")
        .split()
    ):
        clean = token.strip(
            "`'\".,:;!?[]{}"
        )

        if (
            len(clean) >= 4
            and (
                "_" in clean
                or "." in clean
                or clean.isupper()
            )
        ):
            signals.append(clean)

    unique_signals = []

    seen = set()

    for signal in signals:
        normalized = signal.lower()

        if normalized not in seen:
            seen.add(normalized)
            unique_signals.append(signal)

    return unique_signals


def _keyword_retrieve(
    question: str,
    owner: str,
    repo: str,
) -> list:
    signals = _build_keyword_signals(
        question
    )

    if not signals:
        return []

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

    scored = []

    for payload in payloads:
        file_path = (
            payload.get("file_path")
            or ""
        )

        symbol_name = (
            payload.get("symbol_name")
            or ""
        )

        content = (
            payload.get("content")
            or ""
        )

        searchable_path = file_path.lower()
        searchable_symbol = symbol_name.lower()
        searchable_content = content.lower()

        score = 0.0
        matched_signals = []

        for signal in signals:
            normalized_signal = signal.lower()

            path_matches = (
                normalized_signal
                in searchable_path
            )

            symbol_matches = (
                normalized_signal
                in searchable_symbol
            )

            content_matches = (
                normalized_signal
                in searchable_content
            )

            if not (
                path_matches
                or symbol_matches
                or content_matches
            ):
                continue

            matched_signals.append(
                normalized_signal
            )

            if path_matches:
                score += 8.0

            if symbol_matches:
                score += 10.0

            if content_matches:
                score += 5.0

        if not matched_signals:
            continue

        if file_path.startswith(
            "backend/"
        ):
            score += 3.0

        if (
            "/tests/" in searchable_path
            or "\\tests\\" in searchable_path
            or searchable_path.startswith("tests/")
        ):
            score -= 5.0

        if file_path.endswith(
            "main.py"
        ):
            score += 4.0

        if file_path.endswith(
            "github_service.py"
        ):
            score += 4.0

        scored.append(
            (
                score,
                len(matched_signals),
                payload,
            )
        )

    scored.sort(
        key=lambda item: (
            item[0],
            item[1],
        ),
        reverse=True,
    )

    return [
        EvidenceResult(
            payload=payload,
            score=score,
        )
        for score, _, payload in scored[:8]
    ]


def _source_windows(
    content: str,
    signals: list[str],
    window: int = 12,
    max_lines: int = 90,
) -> list[tuple[int, int]]:
    """
    Find small source windows around important debugging signals.
    """
    lines = content.splitlines()

    matches = []

    lowered_lines = [
        line.lower()
        for line in lines
    ]

    for index, line in enumerate(
        lowered_lines
    ):
        if any(
            signal.lower() in line
            for signal in signals
        ):
            matches.append(index)

    if not matches:
        return []

    ranges = []

    for index in matches:
        start = max(
            0,
            index - window,
        )

        end = min(
            len(lines),
            index + window + 1,
        )

        ranges.append(
            (start, end)
        )

    merged = []

    for start, end in ranges:
        if not merged:
            merged.append(
                [start, end]
            )
            continue

        previous_start, previous_end = (
            merged[-1]
        )

        if start <= previous_end:
            merged[-1][1] = max(
                previous_end,
                end,
            )
        else:
            merged.append(
                [start, end]
            )

    result = []

    total = 0

    for start, end in merged:
        size = end - start

        if total + size > max_lines:
            remaining = max_lines - total

            if remaining <= 0:
                break

            end = start + remaining

        result.append(
            (start, end)
        )

        total += (
            end - start
        )

        if total >= max_lines:
            break

    return result


def _live_debug_evidence(
    question: str,
    owner: str,
    repo: str,
) -> list:
    """
    Fetch critical implementation files directly from GitHub
    when exact runtime-error investigation benefits from code
    that may exist outside function-level indexed chunks.
    """
    lowered = question.lower()

    needs_github_sources = (
        "502" in lowered
        or "bad gateway" in lowered
        or "403" in lowered
        or "401" in lowered
        or "rate limit" in lowered
        or "rate limited" in lowered
        or "github" in lowered
    )

    if not needs_github_sources:
        return []

    repository = get_repository(
        owner,
        repo,
    )

    branch = repository[
        "default_branch"
    ]

    signals = [
        "external_service_error",
        "HTTPStatusError",
        "GITHUB_TOKEN",
        "Authorization",
        "github_get",
        "status_code=502",
        "status_code=503",
    ]

    priority_paths = [
        "backend/main.py",
        "backend/github_service.py",
    ]

    results = []

    for path in priority_paths:
        try:
            content = get_file_content(
                owner,
                repo,
                path,
                branch,
            )
        except Exception:
            continue

        windows = _source_windows(
            content,
            signals,
        )

        for start, end in windows:
            window_lines = content.splitlines()[
                start:end
            ]

            window_content = "\n".join(
                window_lines
            )

            payload = {
                "file_path": path,
                "start_line": start + 1,
                "end_line": end,
                "symbol_name": None,
                "language": "python",
                "content": window_content,
            }

            results.append(
                EvidenceResult(
                    payload=payload,
                    score=100.0,
                )
            )

    return results


def _retrieve_bug_evidence(
    question: str,
    owner: str,
    repo: str,
) -> list:
    queries = _build_investigation_queries(
        question
    )

    candidates = OrderedDict()

    # Semantic retrieval.
    for query in queries:
        results = search_repository(
            query,
            owner,
            repo,
            limit=4,
        )

        for result in results:
            payload = result.payload

            key = (
                payload.get("chunk_id")
                or (
                    f"{payload.get('file_path', '')}:"
                    f"{payload.get('start_line', '')}:"
                    f"{payload.get('end_line', '')}:"
                    f"{payload.get('symbol_name', '')}"
                )
            )

            if key not in candidates:
                candidates[key] = result

    # Exact indexed keyword retrieval.
    keyword_results = _keyword_retrieve(
        question,
        owner,
        repo,
    )

    for result in keyword_results:
        payload = result.payload

        key = (
            payload.get("chunk_id")
            or (
                f"{payload.get('file_path', '')}:"
                f"{payload.get('start_line', '')}:"
                f"{payload.get('end_line', '')}:"
                f"{payload.get('symbol_name', '')}"
            )
        )

        candidates[key] = result

    # Live implementation fallback for exact debugging signals.
    live_results = _live_debug_evidence(
        question,
        owner,
        repo,
    )

    for result in live_results:
        payload = result.payload

        key = (
            f"live:{payload['file_path']}:"
            f"{payload['start_line']}:"
            f"{payload['end_line']}"
        )

        candidates[key] = result

    evidence = list(
        candidates.values()
    )

    evidence.sort(
        key=lambda result: getattr(
            result,
            "score",
            0.0,
        ),
        reverse=True,
    )

    return evidence[:10]


def investigate_bug(
    question: str,
    owner: str,
    repo: str,
):
    question = question.strip()

    if not question:
        raise ValueError(
            "Bug investigation question cannot be empty"
        )

    results = _retrieve_bug_evidence(
        question,
        owner,
        repo,
    )

    if not results:
        return {
            "answer": (
                "I couldn't find enough relevant "
                "repository evidence to investigate this issue."
            ),
            "sources": [],
        }

    context = build_context(
        results
    )

    llm = GroqLLM()

    answer = llm.generate(
        question,
        context,
        system_prompt=BUG_SYSTEM_INSTRUCTIONS,
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
        "answer": answer,
        "sources": sources,
    }