def build_context(results) -> str:
    sections = []

    for index, result in enumerate(results, 1):
        payload = result.payload

        citation = (
            f"[{payload['file_path']}:"
            f"{payload['start_line']}-"
            f"{payload['end_line']}]"
        )

        section = f"""[Evidence {index}]
Citation: {citation}
File: {payload["file_path"]}
Lines: {payload["start_line"]}-{payload["end_line"]}
Symbol: {payload["symbol_name"] or "file"}
Language: {payload["language"]}

{payload["content"]}
"""

        sections.append(section)

    return "\n".join(sections)