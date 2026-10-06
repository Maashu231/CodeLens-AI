from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


def test_dependencies_endpoint(monkeypatch):
    expected_graph = {
        "repository": "owner/repo",
        "branch": "main",
        "nodes": [
            {
                "id": "file:backend/main.py",
                "type": "file",
                "path": "backend/main.py",
                "language": "python",
            }
        ],
        "edges": [],
        "stats": {
            "files": 1,
            "functions": 0,
            "imports": 0,
            "calls": 0,
        },
    }

    def fake_dependency_graph(owner, repo):
        assert owner == "owner"
        assert repo == "repo"
        return expected_graph

    monkeypatch.setattr(
        main,
        "get_repository_dependency_graph",
        fake_dependency_graph,
    )

    response = client.get(
        "/repositories/dependencies",
        params={
            "repository_url": (
                "https://github.com/owner/repo"
            )
        },
    )

    assert response.status_code == 200
    assert response.json() == expected_graph