from tree_sitter import Parser
from tree_sitter_language_pack import get_language


python_language = get_language("python")
parser = Parser(python_language)


def parse_code(source_code: str):
    source_bytes = source_code.encode("utf-8")
    return parser.parse(source_bytes)


def get_node_text(node) -> str:
    return node.text.decode("utf-8")


def extract_imports(tree):
    imports = []

    def visit(node):
        if node.type in {"import_statement", "import_from_statement"}:
            imports.append(get_node_text(node).strip())

        for child in node.children:
            visit(child)

    visit(tree.root_node)

    return imports


def extract_functions(tree):
    functions = []

    def visit(node):
        if node.type == "function_definition":
            name_node = node.child_by_field_name("name")
            parameters_node = node.child_by_field_name("parameters")

            name = get_node_text(name_node)

            parameters = []

            if parameters_node:
                for child in parameters_node.children:
                    if child.type == "identifier":
                        parameters.append(get_node_text(child))

            calls = []
            returns = []

            def inspect_function_body(child):
                if child.type == "call":
                    function_node = child.child_by_field_name("function")

                    if function_node:
                        calls.append(get_node_text(function_node))

                elif child.type == "return_statement":
                    returns.append(get_node_text(child).strip())

                for grandchild in child.children:
                    inspect_function_body(grandchild)

            inspect_function_body(node)

            functions.append({
                "name": name,
                "parameters": parameters,
                "calls": calls,
                "returns": returns,
                "start_line": node.start_point[0] + 1,
                "end_line": node.end_point[0] + 1
            })

        for child in node.children:
            visit(child)

    visit(tree.root_node)

    return functions