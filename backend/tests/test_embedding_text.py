from embedding_text import build_embedding_text
from models import CodeChunk


def test_embedding_text_contains_useful_context():
    chunk = CodeChunk(
        chunk_id="test-123",
        repository="Maashu231/CodeLens-AI",
        file_path="backend/auth.py",
        file_sha="abc123",
        language="python",
        symbol_name="login",
        symbol_type="function",
        start_line=10,
        end_line=18,
        content="""def login(email, password):
    user = find_user(email)
    return create_token(user)
"""
    )

    text = build_embedding_text(chunk)

    assert "Maashu231/CodeLens-AI" in text
    assert "backend/auth.py" in text
    assert "python" in text
    assert "login" in text
    assert "find_user(email)" in text
    assert "create_token(user)" in text


def test_embedding_text_does_not_need_internal_identifiers():
    chunk = CodeChunk(
        chunk_id="internal-id",
        repository="Maashu231/CodeLens-AI",
        file_path="main.py",
        file_sha="secret-sha",
        language="python",
        symbol_name="home",
        symbol_type="function",
        start_line=1,
        end_line=2,
        content="def home():\n    return 'ok'"
    )

    text = build_embedding_text(chunk)

    assert "internal-id" not in text
    assert "secret-sha" not in text