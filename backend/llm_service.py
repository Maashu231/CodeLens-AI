import os

import httpx


MODEL = "openai/gpt-oss-20b"
API_URL = "https://api.groq.com/openai/v1/chat/completions"


SYSTEM_PROMPT = """You are CodeLens AI, a codebase analysis assistant.

Answer questions using ONLY the provided repository evidence.

Rules:
1. Do not invent facts about the repository.
2. Prefer relevant implementation code when the question asks where something is defined or implemented.
3. When making a claim about repository code, copy the exact citation provided in the evidence.
4. Citations must use this format:
   [path:start-end]
5. Do not invent file paths or line numbers.
6. If the evidence is insufficient, say so clearly.
7. Keep the answer concise and technical.
"""


class GroqLLM:

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "GROQ_API_KEY environment variable is not set"
            )

    def generate(self, question: str, context: str) -> str:
        response = httpx.post(
            API_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": SYSTEM_PROMPT,
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Repository evidence:\n\n"
                            f"{context}\n\n"
                            f"Question:\n{question}"
                        ),
                    },
                ],
            },
            timeout=60.0,
        )

        response.raise_for_status()

        data = response.json()

        return data["choices"][0]["message"]["content"]