from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


def test_investigate_endpoint(monkeypatch):
    expected_result = {
        "answer": (
            "## Likely Cause\n"
            "The login lookup may be failing."
        ),
        "sources": [
            {
                "file": "backend/auth_service.py",
                "start_line": 10,
                "end_line": 25,
                "symbol": "login",
                "language": "python",
                "content": "def login():",
            }
        ],
    }

    def fake_investigate_bug(
        question,
        owner,
        repo,
    ):
        assert question == "Why is login failing?"
        assert owner == "owner"
        assert repo == "repo"

        return expected_result

    monkeypatch.setattr(
        main,
        "investigate_bug",
        fake_investigate_bug,
    )

    response = client.get(
        "/repositories/investigate",
        params={
            "repository_url": (
                "https://github.com/owner/repo"
            ),
            "question": "Why is login failing?",
        },
    )

    assert response.status_code == 200
    assert response.json() == expected_result