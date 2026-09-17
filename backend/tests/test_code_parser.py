from code_parser import extract_functions, extract_imports, parse_code


def test_extract_function_details():
    source_code = """
def login(email, password):
    user = find_user(email)

    if user is None:
        return None

    return create_token(user)
"""

    tree = parse_code(source_code)
    functions = extract_functions(tree)

    assert len(functions) == 1

    function = functions[0]

    assert function["name"] == "login"
    assert function["parameters"] == ["email", "password"]
    assert function["calls"] == ["find_user", "create_token"]
    assert function["returns"] == [
        "return None",
        "return create_token(user)"
    ]


def test_extract_imports():
    source_code = """
import os
import requests
"""

    tree = parse_code(source_code)
    imports = extract_imports(tree)

    assert imports == [
        "import os",
        "import requests"
    ]