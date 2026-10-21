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


# Exact filenames that are always excluded regardless of extension.
# These are sensitive, noisy, or generated files with no retrieval value.
BLOCKED_FILENAMES = {
    ".env",
    ".env.local",
    ".env.development",
    ".env.production",
    ".env.test",
    ".gitignore",
    ".gitattributes",
    ".dockerignore",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "poetry.lock",
    "Pipfile.lock",
    "composer.lock",
    "Gemfile.lock",
}


def is_allowed_file(path: str) -> bool:
    parts = path.split("/")

    filename = parts[-1]

    # Reject blocked exact filenames before extension check.
    if filename in BLOCKED_FILENAMES:
        return False

    for part in parts[:-1]:
        if part in IGNORED_DIRECTORIES:
            return False

    for extension in ALLOWED_EXTENSIONS:
        if filename.endswith(extension):
            return True

    return False