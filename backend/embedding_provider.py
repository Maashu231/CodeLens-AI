import os
import random
import time
from functools import lru_cache

import httpx


LOCAL_MODEL_NAME = "nomic-ai/CodeRankEmbed"
LOCAL_VECTOR_SIZE = 768

VOYAGE_MODEL_NAME = "voyage-code-4"
VOYAGE_VECTOR_SIZE = 1024
VOYAGE_API_URL = "https://api.voyageai.com/v1/embeddings"


class LocalCodeEmbeddingProvider:
    """
    Local code embedding provider using CodeRankEmbed.

    The model is configured conservatively for CPU memory usage.
    """

    dimension = LOCAL_VECTOR_SIZE

    def __init__(self):
        self.model = get_local_model()

    def embed_documents(
        self,
        texts: list[str],
    ) -> list[list[float]]:
        if not texts:
            return []

        embeddings = self.model.encode(
            texts,
            batch_size=1,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )

        return embeddings.tolist()

    def embed_query(
        self,
        text: str,
    ) -> list[float]:
        query = (
            "Represent this query for searching relevant code: "
            f"{text}"
        )

        embedding = self.model.encode(
            [query],
            batch_size=1,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        )

        return embedding[0].tolist()


@lru_cache(maxsize=1)
def get_local_model():
    from sentence_transformers import SentenceTransformer

    print(
        f"Loading local embedding model: {LOCAL_MODEL_NAME}"
    )

    model = SentenceTransformer(
        LOCAL_MODEL_NAME,
        trust_remote_code=True,
    )

    # The default model context is too memory-heavy for CPU
    # inference on a typical development machine.
    model.max_seq_length = 1024

    print(
        "Local embedding model loaded "
        f"(max_seq_length={model.max_seq_length})."
    )

    return model


class VoyageCodeEmbeddingProvider:
    """
    Optional managed embedding provider.

    Kept for future production deployments.
    """

    dimension = VOYAGE_VECTOR_SIZE

    MAX_RETRIES = 6
    INITIAL_BACKOFF_SECONDS = 2
    MAX_BACKOFF_SECONDS = 60

    def __init__(self):
        self.api_key = os.getenv("VOYAGE_API_KEY")

        if not self.api_key:
            raise RuntimeError(
                "VOYAGE_API_KEY environment variable is not set"
            )

    def embed_documents(
        self,
        texts: list[str],
    ) -> list[list[float]]:
        return self._embed(texts, "document")

    def embed_query(
        self,
        text: str,
    ) -> list[float]:
        return self._embed([text], "query")[0]

    def _embed(
        self,
        texts: list[str],
        input_type: str,
    ) -> list[list[float]]:
        if not texts:
            return []

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "input": texts,
            "model": VOYAGE_MODEL_NAME,
            "input_type": input_type,
            "output_dimension": VOYAGE_VECTOR_SIZE,
            "output_dtype": "float",
        }

        for attempt in range(self.MAX_RETRIES + 1):
            response = httpx.post(
                VOYAGE_API_URL,
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
                detail = response.text.strip()

                if len(detail) > 500:
                    detail = detail[:500] + "..."

                raise httpx.HTTPStatusError(
                    "Voyage API rate limit persisted after "
                    f"{self.MAX_RETRIES} retries. "
                    f"Voyage response: {detail}",
                    request=response.request,
                    response=response,
                )

            retry_after = response.headers.get("Retry-After")

            if retry_after:
                try:
                    wait_seconds = float(retry_after)
                except ValueError:
                    wait_seconds = self._backoff(attempt)
            else:
                wait_seconds = self._backoff(attempt)

            print(
                "Voyage API rate limit reached. "
                f"Attempt {attempt + 1}/{self.MAX_RETRIES}. "
                f"Retrying in {wait_seconds:.1f}s..."
            )

            time.sleep(wait_seconds)

        raise RuntimeError(
            "Unexpected embedding provider state"
        )

    def _backoff(self, attempt: int) -> float:
        base = min(
            self.INITIAL_BACKOFF_SECONDS * (2 ** attempt),
            self.MAX_BACKOFF_SECONDS,
        )

        jitter = random.uniform(0, 1)

        return min(
            base + jitter,
            self.MAX_BACKOFF_SECONDS,
        )


def get_embedding_provider():
    provider_name = os.getenv(
        "EMBEDDING_PROVIDER",
        "local",
    ).strip().lower()

    if provider_name == "local":
        return LocalCodeEmbeddingProvider()

    if provider_name == "voyage":
        return VoyageCodeEmbeddingProvider()

    raise RuntimeError(
        "Unsupported EMBEDDING_PROVIDER. "
        "Use 'local' or 'voyage'."
    )


def get_embedding_dimension() -> int:
    provider_name = os.getenv(
        "EMBEDDING_PROVIDER",
        "local",
    ).strip().lower()

    if provider_name == "local":
        return LOCAL_VECTOR_SIZE

    if provider_name == "voyage":
        return VOYAGE_VECTOR_SIZE

    raise RuntimeError(
        "Unsupported EMBEDDING_PROVIDER. "
        "Use 'local' or 'voyage'."
    )