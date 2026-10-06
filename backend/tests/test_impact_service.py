from impact_service import (
    analyze_impact,
    build_dependency_graph,
)


def test_dependency_graph_builds_import_and_call_edges():
    files = [
        {
            "path": "backend/a.py",
            "language": "python",
            "content": """
from b import foo


def bar():
    return foo()
""",
        },
        {
            "path": "backend/b.py",
            "language": "python",
            "content": """
def foo():
    return 42
""",
        },
    ]

    graph = build_dependency_graph(files)

    assert graph["stats"]["files"] == 2
    assert graph["stats"]["functions"] == 2

    import_edges = [
        edge
        for edge in graph["edges"]
        if edge["type"] == "import"
    ]

    call_edges = [
        edge
        for edge in graph["edges"]
        if edge["type"] == "call"
    ]

    assert {
        "source": "file:backend/a.py",
        "target": "file:backend/b.py",
        "type": "import",
    } in import_edges

    assert {
        "source": "symbol:backend/a.py:bar",
        "target": "symbol:backend/b.py:foo",
        "type": "call",
    } in call_edges


def test_function_impact_finds_direct_caller():
    files = [
        {
            "path": "backend/a.py",
            "language": "python",
            "content": """
from b import foo


def bar():
    return foo()
""",
        },
        {
            "path": "backend/b.py",
            "language": "python",
            "content": """
def foo():
    return 42
""",
        },
    ]

    graph = build_dependency_graph(files)

    result = analyze_impact(
        graph,
        "backend/b.py",
        "foo",
    )

    assert result["target"]["name"] == "foo"
    assert result["stats"]["direct"] == 1
    assert result["stats"]["total"] == 1

    assert result["impacted"][0]["name"] == "bar"
    assert result["impacted"][0]["impact"] == "direct"
    assert result["impacted"][0]["relationship"] == "call"


def test_function_impact_finds_indirect_callers():
    files = [
        {
            "path": "backend/a.py",
            "language": "python",
            "content": """
from b import foo


def bar():
    return foo()


def top():
    return bar()
""",
        },
        {
            "path": "backend/b.py",
            "language": "python",
            "content": """
def foo():
    return 42
""",
        },
    ]

    graph = build_dependency_graph(files)

    result = analyze_impact(
        graph,
        "backend/b.py",
        "foo",
    )

    names = {
        item["name"]
        for item in result["impacted"]
    }

    assert "bar" in names
    assert "top" in names

    assert result["stats"]["direct"] == 1
    assert result["stats"]["indirect"] == 1
    assert result["stats"]["total"] == 2