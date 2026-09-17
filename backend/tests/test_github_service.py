import pytest

from github_service import parse_github_url


def test_parse_valid_github_url():
    owner, repo = parse_github_url(
        "https://github.com/Maashu231/CodeLens-AI"
    )

    assert owner == "Maashu231"
    assert repo == "CodeLens-AI"


def test_parse_github_url_with_trailing_slash():
    owner, repo = parse_github_url(
        "https://github.com/Maashu231/CodeLens-AI/"
    )

    assert owner == "Maashu231"
    assert repo == "CodeLens-AI"


@pytest.mark.parametrize(
    "url",
    [
        "https://example.com/owner/repo",
        "not-a-url",
        "https://github.com/",
        "https://github.com/owner",
        "https://github.com/owner/repo/issues",
    ],
)
def test_invalid_github_urls_are_rejected(url):
    with pytest.raises(ValueError):
        parse_github_url(url)