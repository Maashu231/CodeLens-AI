import bug_investigation_service


class FakeResult:
    def __init__(self):
        self.payload = {
            "file_path": "backend/auth_service.py",
            "start_line": 10,
            "end_line": 25,
            "symbol_name": "login",
            "language": "python",
            "content": (
                "def login(email, password):\n"
                "    user = find_user(email)\n"
                "    return create_token(user)\n"
            ),
        }


class FakeLLM:
    def generate(
        self,
        question,
        context,
        system_prompt=None,
    ):
        assert "Why is login failing?" in question
        assert "auth_service.py" in context
        assert system_prompt is not None
        assert "senior software debugging assistant" in system_prompt

        return (
            "## Likely Cause\n"
            "Authentication lookup may be failing.\n\n"
            "## Code Path\n"
            "login() calls find_user().\n\n"
            "## Evidence\n"
            "[backend/auth_service.py:10-25]\n\n"
            "## What To Check\n"
            "Check the user lookup result.\n\n"
            "## Confidence\n"
            "Medium"
        )


def test_bug_investigation(monkeypatch):
    monkeypatch.setattr(
        bug_investigation_service,
        "search_repository",
        lambda question, owner, repo, limit: [
            FakeResult()
        ],
    )

    monkeypatch.setattr(
        bug_investigation_service,
        "GroqLLM",
        FakeLLM,
    )

    result = (
        bug_investigation_service.investigate_bug(
            "Why is login failing?",
            "owner",
            "repo",
        )
    )

    assert "Likely Cause" in result["answer"]
    assert "Code Path" in result["answer"]
    assert "Evidence" in result["answer"]
    assert "Confidence" in result["answer"]

    assert len(result["sources"]) == 1

    assert (
        result["sources"][0]["file"]
        == "backend/auth_service.py"
    )