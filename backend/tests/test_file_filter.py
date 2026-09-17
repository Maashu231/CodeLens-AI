from file_filter import is_allowed_file


def test_allowed_source_files():
    assert is_allowed_file("backend/main.py") is True
    assert is_allowed_file("src/AuthService.java") is True
    assert is_allowed_file("src/app.ts") is True
    assert is_allowed_file("README.md") is True


def test_ignored_directories():
    assert is_allowed_file("node_modules/library/index.js") is False
    assert is_allowed_file(".git/config") is False
    assert is_allowed_file(".venv/lib/python.py") is False
    assert is_allowed_file("backend/__pycache__/main.pyc") is False


def test_unsupported_files():
    assert is_allowed_file("image.png") is False
    assert is_allowed_file("application.exe") is False


def test_secret_files_are_not_allowed():
    assert is_allowed_file(".env") is False
    assert is_allowed_file("server.key") is False
    assert is_allowed_file("certificate.pem") is False