import os
import time

import httpx


class VoyageCodeEmbeddingProvider:
    MODEL = "voyage-code-4"
    API_URL = "https://api.voyageai.com/v1/embeddings"

    MAX_RETRIES = 4
    INITIAL_BACKOFF_SECONDS = 2

    def __init__(self):
        self.api_key = os.getenv("VOYAGE_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "VOYAGE_API_KEY environment variable is not set"
            )

    def embed_documents(
        self,
        texts: list[str]
    ) -> list[list[float]]:
        return self._embed(texts, "document")

    def embed_query(
        self,
        text: str
    ) -> list[float]:
        return self._embed([text], "query")[0]

    def _embed(
        self,
        texts: list[str],
        input_type: str
    ) -> list[list[float]]:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "input": texts,
            "model": self.MODEL,
            "input_type": input_type,
            "output_dimension": 1024,
            "output_dtype": "float",
        }

        for attempt in range(self.MAX_RETRIES + 1):
            response = httpx.post(
                self.API_URL,
                headers=headers,
                json=payload,
                timeout=60.0,
            )

            if response.status_code != 429:
                response.raise_for_status()

                return [
                    item["embedding"]
                    for item in response.json()["data"]
                ]

            if attempt == self.MAX_RETRIES:
                raise httpx.HTTPStatusError(
                    "Voyage API rate limit exceeded after "
                    f"{self.MAX_RETRIES} retries",
                    request=response.request,
                    response=response,
                )

            retry_after = response.headers.get("Retry-After")

            if retry_after:
                try:
                    wait_seconds = float(retry_after)
                except ValueError:
                    wait_seconds = (
                        self.INITIAL_BACKOFF_SECONDS
                        * (2 ** attempt)
                    )
            else:
                wait_seconds = (
                    self.INITIAL_BACKOFF_SECONDS
                    * (2 ** attempt)
                )

            print(
                f"Voyage rate limit reached. "
                f"Retrying in {wait_seconds:.1f}s..."
            )

            time.sleep(wait_seconds)

        raise RuntimeError("Unexpected embedding provider state")