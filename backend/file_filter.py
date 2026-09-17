ALLOWED_EXTENSIONS = {
    ".py",
    ".java",
    ".js",
    ".ts",
    ".tsx",
    ".jsx",
    ".sql",
    ".html",
    ".css",
    ".md",
    ".json",
    ".yml",
    ".yaml"
}


IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    "dist",
    "build",
    "coverage"
}


def is_allowed_file(path: str) -> bool:
    parts = path.split("/")

    for part in parts[:-1]:
        if part in IGNORED_DIRECTORIES:
            return False

    filename = parts[-1]

    for extension in ALLOWED_EXTENSIONS:
        if filename.endswith(extension):
            return True

    return False