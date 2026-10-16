import httpx

from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


def test_root_endpoint():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "CodeLens AI backend is running"
    }


def test_health_check():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "version": "1.0.0",
    }


def test_cors_headers():
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"


def test_invalid_repository_url():
    response = client.post(
        "/repositories",
        json={
            "url": "https://example.com/owner/repo"
        }
    )

    assert response.status_code == 400


def test_repository_not_found(monkeypatch):
    request = httpx.Request(
        "GET",
        "https://api.github.com/repos/owner/missing"
    )

    response = httpx.Response(
        404,
        request=request
    )

    def fake_get_repository(owner, repo):
        raise httpx.HTTPStatusError(
            "Repository not found",
            request=request,
            response=response
        )

    monkeypatch.setattr(
        main,
        "get_repository",
        fake_get_repository
    )

    response = client.post(
        "/repositories",
        json={
            "url": "https://github.com/owner/missing"
        }
    )

    assert response.status_code == 404