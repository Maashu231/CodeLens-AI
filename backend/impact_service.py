from collections import defaultdict, deque
from pathlib import Path

from code_parser import (
    extract_functions,
    extract_imports,
    parse_code,
)
from repository_service import get_file_contents


def _normalize_path(path: str) -> str:
    return path.replace("\\", "/").strip("/")


def _python_module_candidates(
    file_path: str,
    import_name: str,
) -> list[str]:
    """
    Convert a Python import into possible repository paths.

    Example:
        backend/main.py + answer_service
        -> backend/answer_service.py
    """
    normalized_path = _normalize_path(file_path)

    parent = Path(normalized_path).parent
    import_parts = import_name.strip().split(".")

    module_path = "/".join(import_parts)

    candidates = []

    if str(parent) != ".":
        candidates.append(
            _normalize_path(
                str(parent / f"{module_path}.py")
            )
        )

        candidates.append(
            _normalize_path(
                str(parent / module_path / "__init__.py")
            )
        )

    candidates.append(
        f"{module_path}.py"
    )

    candidates.append(
        f"{module_path}/__init__.py"
    )

    return candidates


def _extract_import_names(
    imports: list[str],
) -> list[str]:
    names = []

    for statement in imports:
        statement = statement.strip()

        if statement.startswith("import "):
            imported = statement[len("import "):]

            for item in imported.split(","):
                item = item.strip()

                if not item:
                    continue

                names.append(
                    item.split(" as ")[0].strip()
                )

        elif statement.startswith("from "):
            remainder = statement[len("from "):]

            module = remainder.split(
                " import ",
                1,
            )[0].strip()

            if module:
                names.append(module)

    return names


def _build_python_analysis(
    files: list[dict],
) -> list[dict]:
    analyzed_files = []

    for file in files:
        path = _normalize_path(
            file["path"]
        )

        language = file.get("language")

        # get_file_contents() does not provide a language
        # field, so detect Python files from their extension.
        if not language and path.lower().endswith(".py"):
            language = "python"

        analysis = {
            "path": path,
            "language": language,
            "imports": [],
            "functions": [],
        }

        if language != "python":
            analyzed_files.append(
                analysis
            )
            continue

        tree = parse_code(
            file["content"]
        )

        analysis["imports"] = extract_imports(
            tree
        )

        analysis["functions"] = extract_functions(
            tree
        )

        analyzed_files.append(
            analysis
        )

    return analyzed_files


def _resolve_import(
    file_path: str,
    import_name: str,
    available_paths: set[str],
) -> str | None:
    for candidate in _python_module_candidates(
        file_path,
        import_name,
    ):
        if candidate in available_paths:
            return candidate

    return None


def build_dependency_graph(
    files: list[dict],
) -> dict:
    """
    Build a repository dependency graph.

    File import edges:
        importing_file -> imported_file

    Function call edges:
        calling_function -> called_function
    """
    analyzed_files = _build_python_analysis(
        files
    )

    available_paths = {
        analysis["path"]
        for analysis in analyzed_files
    }

    nodes = []
    edges = []

    function_index = defaultdict(list)

    # --------------------------------------------------
    # Build nodes
    # --------------------------------------------------
    for analysis in analyzed_files:
        path = analysis["path"]

        nodes.append(
            {
                "id": f"file:{path}",
                "type": "file",
                "path": path,
                "language": analysis["language"],
            }
        )

        for function in analysis["functions"]:
            symbol_id = (
                f"symbol:{path}:{function['name']}"
            )

            nodes.append(
                {
                    "id": symbol_id,
                    "type": "function",
                    "path": path,
                    "name": function["name"],
                    "start_line": function[
                        "start_line"
                    ],
                    "end_line": function[
                        "end_line"
                    ],
                }
            )

            function_index[
                function["name"]
            ].append(
                {
                    "id": symbol_id,
                    "path": path,
                }
            )

    seen_edges = set()

    # --------------------------------------------------
    # Build edges
    # --------------------------------------------------
    for analysis in analyzed_files:
        path = analysis["path"]

        if analysis["language"] != "python":
            continue

        file_id = f"file:{path}"

        # ----------------------------------------------
        # Import edges
        # ----------------------------------------------
        for import_name in _extract_import_names(
            analysis["imports"]
        ):
            target_path = _resolve_import(
                path,
                import_name,
                available_paths,
            )

            if not target_path:
                continue

            edge_key = (
                file_id,
                f"file:{target_path}",
                "import",
            )

            if edge_key in seen_edges:
                continue

            seen_edges.add(edge_key)

            edges.append(
                {
                    "source": file_id,
                    "target": f"file:{target_path}",
                    "type": "import",
                }
            )

        # ----------------------------------------------
        # Function call edges
        # ----------------------------------------------
        for function in analysis["functions"]:
            source_id = (
                f"symbol:{path}:{function['name']}"
            )

            for called_name in function["calls"]:

                # Ignore object/member calls such as:
                # store.close()
                # client.search()
                if "." in called_name:
                    continue

                matches = function_index.get(
                    called_name,
                    []
                )

                # Only resolve unambiguous function names.
                if len(matches) != 1:
                    continue

                target_id = matches[0]["id"]

                if target_id == source_id:
                    continue

                edge_key = (
                    source_id,
                    target_id,
                    "call",
                )

                if edge_key in seen_edges:
                    continue

                seen_edges.add(edge_key)

                edges.append(
                    {
                        "source": source_id,
                        "target": target_id,
                        "type": "call",
                    }
                )

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": {
            "files": sum(
                1
                for node in nodes
                if node["type"] == "file"
            ),
            "functions": sum(
                1
                for node in nodes
                if node["type"] == "function"
            ),
            "imports": sum(
                1
                for edge in edges
                if edge["type"] == "import"
            ),
            "calls": sum(
                1
                for edge in edges
                if edge["type"] == "call"
            ),
        },
    }


def _find_target_node(
    graph: dict,
    path: str,
    symbol: str | None = None,
) -> dict | None:
    normalized_path = _normalize_path(
        path
    )

    if symbol:
        target_id = (
            f"symbol:{normalized_path}:{symbol}"
        )

        for node in graph["nodes"]:
            if node["id"] == target_id:
                return node

        return None

    target_id = (
        f"file:{normalized_path}"
    )

    for node in graph["nodes"]:
        if node["id"] == target_id:
            return node

    return None


def analyze_impact(
    graph: dict,
    path: str,
    symbol: str | None = None,
) -> dict:
    """
    Find all code that depends on a target.

    Direct dependencies are one edge away.
    Indirect dependencies are two or more edges away.
    """
    target = _find_target_node(
        graph,
        path,
        symbol,
    )

    if target is None:
        raise ValueError(
            "The requested file or function was not found"
        )

    # Reverse graph:
    #
    # A -> B
    #
    # becomes:
    #
    # B -> A
    #
    # This allows us to ask:
    # "Who depends on this?"
    reverse_edges = defaultdict(list)

    for edge in graph["edges"]:
        reverse_edges[
            edge["target"]
        ].append(edge)

    impacted_nodes = []

    visited = {
        target["id"]
    }

    queue = deque()

    # Start with immediate dependencies.
    for edge in reverse_edges[
        target["id"]
    ]:
        source_id = edge["source"]

        if source_id in visited:
            continue

        visited.add(source_id)

        queue.append(
            (
                source_id,
                1,
                edge["type"],
            )
        )

    # --------------------------------------------------
    # Breadth-first traversal
    # --------------------------------------------------
    while queue:
        (
            node_id,
            depth,
            relationship,
        ) = queue.popleft()

        node = next(
            (
                item
                for item in graph["nodes"]
                if item["id"] == node_id
            ),
            None,
        )

        if node is None:
            continue

        impacted_nodes.append(
            {
                "id": node["id"],
                "type": node["type"],
                "path": node["path"],
                "name": node.get("name"),
                "distance": depth,
                "impact": (
                    "direct"
                    if depth == 1
                    else "indirect"
                ),
                "relationship": relationship,
                "start_line": node.get(
                    "start_line"
                ),
                "end_line": node.get(
                    "end_line"
                ),
            }
        )

        for edge in reverse_edges[
            node_id
        ]:
            source_id = edge["source"]

            if source_id in visited:
                continue

            visited.add(source_id)

            queue.append(
                (
                    source_id,
                    depth + 1,
                    edge["type"],
                )
            )

    impacted_files = set()

    for node in impacted_nodes:
        impacted_files.add(
            node["path"]
        )

    return {
        "target": {
            "id": target["id"],
            "type": target["type"],
            "path": target["path"],
            "name": target.get("name"),
            "start_line": target.get(
                "start_line"
            ),
            "end_line": target.get(
                "end_line"
            ),
        },
        "impacted": impacted_nodes,
        "impacted_files": sorted(
            impacted_files
        ),
        "stats": {
            "direct": sum(
                1
                for item in impacted_nodes
                if item["impact"] == "direct"
            ),
            "indirect": sum(
                1
                for item in impacted_nodes
                if item["impact"] == "indirect"
            ),
            "total": len(
                impacted_nodes
            ),
            "files": len(
                impacted_files
            ),
        },
    }


def get_repository_dependency_graph(
    owner: str,
    repo: str,
) -> dict:
    repository = get_file_contents(
        owner,
        repo,
    )

    graph = build_dependency_graph(
        repository["files"]
    )

    graph["repository"] = (
        f"{repository['owner']}/"
        f"{repository['repository']}"
    )

    graph["branch"] = (
        repository["branch"]
    )

    return graph


def get_repository_impact(
    owner: str,
    repo: str,
    path: str,
    symbol: str | None = None,
) -> dict:
    repository = get_file_contents(
        owner,
        repo,
    )

    graph = build_dependency_graph(
        repository["files"]
    )

    result = analyze_impact(
        graph,
        path,
        symbol,
    )

    result["repository"] = (
        f"{repository['owner']}/"
        f"{repository['repository']}"
    )

    result["branch"] = (
        repository["branch"]
    )

    return result