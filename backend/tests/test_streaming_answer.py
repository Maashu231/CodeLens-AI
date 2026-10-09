from fastapi.testclient import TestClient

import main


client = TestClient(main.app)


def test_streaming_answer_endpoint(monkeypatch):
    prepared = {
        "context": "Fake repository evidence",
        "sources": [
            {
                "file": "backend/main.py",
                "start_line": 1,
                "end_line": 5,
                "symbol": "home",
                "language": "python",
                "content": (
                    "def home():\n"
                    "    return {'message': 'ok'}"
                ),
            }
        ],
    }

    class FakeLLM:
        def stream(
            self,
            question,
            context,
        ):
            assert (
                question
                == "Where is the health endpoint?"
            )

            assert (
                context
                == "Fake repository evidence"
            )

            yield "The "
            yield "health "
            yield "endpoint "
            yield "is here."

    monkeypatch.setattr(
        main,
        "prepare_streaming_answer",
        lambda question, owner, repo: prepared,
    )

    monkeypatch.setattr(
        main,
        "GroqLLM",
        FakeLLM,
    )

    response = client.post(
        "/ask/stream",
        json={
            "question": (
                "Where is the health endpoint?"
            ),
            "repository_url": (
                "https://github.com/owner/repo"
            ),
        },
    )

    assert response.status_code == 200

    body = response.text

    assert "event: sources" in body
    assert "backend/main.py" in body

    assert "event: chunk" in body
    assert "The " in body
    assert "health " in body
    assert "endpoint " in body
    assert "is here." in body

    assert "event: done" in body