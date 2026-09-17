from chunker import create_chunks
from models import CodeChunk


def test_python_functions_create_separate_chunks():
    file = {
        "path": "auth.py",
        "sha": "abc123",
        "size": 200,
        "language": "python",
        "content": """def login(email, password):
    user = find_user(email)
    return create_token(user)


def logout(user):
    return clear_session(user)
""",
        "analysis": {
            "functions": [
                {
                    "name": "login",
                    "parameters": ["email", "password"],
                    "calls": ["find_user", "create_token"],
                    "returns": ["return create_token(user)"],
                    "start_line": 1,
                    "end_line": 3
                },
                {
                    "name": "logout",
                    "parameters": ["user"],
                    "calls": ["clear_session"],
                    "returns": ["return clear_session(user)"],
                    "start_line": 6,
                    "end_line": 7
                }
            ]
        }
    }

    chunks = create_chunks(
        file,
        "Maashu231/CodeLens-AI"
    )

    assert len(chunks) == 2

    assert isinstance(chunks[0], CodeChunk)
    assert isinstance(chunks[1], CodeChunk)

    assert chunks[0].symbol_name == "login"
    assert chunks[0].start_line == 1
    assert chunks[0].end_line == 3

    assert chunks[1].symbol_name == "logout"
    assert chunks[1].start_line == 6
    assert chunks[1].end_line == 7


def test_chunk_contains_actual_source_code():
    file = {
        "path": "calculator.py",
        "sha": "def456",
        "size": 100,
        "language": "python",
        "content": """def add(a, b):
    return a + b
""",
        "analysis": {
            "functions": [
                {
                    "name": "add",
                    "parameters": ["a", "b"],
                    "calls": [],
                    "returns": ["return a + b"],
                    "start_line": 1,
                    "end_line": 2
                }
            ]
        }
    }

    chunks = create_chunks(
        file,
        "Maashu231/CodeLens-AI"
    )

    assert chunks[0].content == """def add(a, b):
    return a + b"""