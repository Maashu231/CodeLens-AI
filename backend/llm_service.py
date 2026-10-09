import json
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
        self.api_key = os.getenv(
            "GROQ_API_KEY"
        )

        if not self.api_key:
            raise RuntimeError(
                "GROQ_API_KEY environment variable is not set"
            )

    def _build_payload(
        self,
        question: str,
        context: str,
        system_prompt: str | None = None,
        stream: bool = False,
    ) -> dict:
        effective_system_prompt = (
            system_prompt
            or SYSTEM_PROMPT
        )

        return {
            "model": MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": effective_system_prompt,
                },
                {
                    "role": "user",
                    "content": (
                        "Repository evidence:\n\n"
                        f"{context}\n\n"
                        "Question:\n"
                        f"{question}"
                    ),
                },
            ],
            "stream": stream,
        }

    def generate(
        self,
        question: str,
        context: str,
        system_prompt: str | None = None,
    ) -> str:
        response = httpx.post(
            API_URL,
            headers={
                "Authorization": (
                    f"Bearer {self.api_key}"
                ),
                "Content-Type": (
                    "application/json"
                ),
            },
            json=self._build_payload(
                question,
                context,
                system_prompt,
                stream=False,
            ),
            timeout=60.0,
        )

        response.raise_for_status()

        data = response.json()

        return data["choices"][0]["message"]["content"]

    def stream(
        self,
        question: str,
        context: str,
        system_prompt: str | None = None,
    ):
        """
        Stream text chunks from Groq.

        Groq uses the OpenAI-compatible SSE format:
            data: {...}
            data: {...}
            data: [DONE]
        """
        with httpx.stream(
            "POST",
            API_URL,
            headers={
                "Authorization": (
                    f"Bearer {self.api_key}"
                ),
                "Content-Type": (
                    "application/json"
                ),
            },
            json=self._build_payload(
                question,
                context,
                system_prompt,
                stream=True,
            ),
            timeout=60.0,
        ) as response:

            response.raise_for_status()

            for line in response.iter_lines():
                if not line:
                    continue

                if line.startswith("data: "):
                    data_text = line[6:].strip()

                    if data_text == "[DONE]":
                        break

                    try:
                        data = json.loads(
                            data_text
                        )
                    except json.JSONDecodeError:
                        continue

                    choices = data.get(
                        "choices",
                        [],
                    )

                    if not choices:
                        continue

                    delta = choices[0].get(
                        "delta",
                        {}
                    )

                    content = delta.get(
                        "content"
                    )

                    if content:
                        yield content