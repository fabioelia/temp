"""Minimal Ollama client over stdlib urllib — no `requests`, no SDK.

Talks to a local Ollama server (default http://127.0.0.1:11434). Streaming is
supported so tokens appear as they generate — important for perceived latency
on a laptop. If the server or model is missing we raise a clear, actionable
error rather than a stack trace.
"""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from typing import Iterator

DEFAULT_HOST = "http://127.0.0.1:11434"
DEFAULT_MODEL = "qwen2.5-coder:7b"


class OllamaError(RuntimeError):
    pass


def _post(url: str, payload: dict, stream: bool, timeout: float):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        return urllib.request.urlopen(req, timeout=timeout)
    except urllib.error.URLError as e:
        raise OllamaError(
            f"Could not reach Ollama at {url}. Is it running? "
            f"Start it with `ollama serve` and pull a model, e.g. "
            f"`ollama pull {DEFAULT_MODEL}`.\n  ({e})"
        ) from e


def chat_stream(
    messages: list[dict],
    model: str = DEFAULT_MODEL,
    host: str = DEFAULT_HOST,
    temperature: float = 0.2,
    timeout: float = 600.0,
) -> Iterator[str]:
    """Yield assistant text chunks from Ollama's /api/chat streaming endpoint."""
    url = f"{host.rstrip('/')}/api/chat"
    payload = {
        "model": model,
        "messages": messages,
        "stream": True,
        "options": {"temperature": temperature},
    }
    resp = _post(url, payload, stream=True, timeout=timeout)
    with resp:
        for raw in resp:
            raw = raw.strip()
            if not raw:
                continue
            try:
                obj = json.loads(raw)
            except json.JSONDecodeError:
                continue
            if obj.get("error"):
                raise OllamaError(str(obj["error"]))
            piece = obj.get("message", {}).get("content", "")
            if piece:
                yield piece
            if obj.get("done"):
                break


def chat(messages: list[dict], **kw) -> str:
    return "".join(chat_stream(messages, **kw))


def list_models(host: str = DEFAULT_HOST, timeout: float = 10.0) -> list[str]:
    url = f"{host.rstrip('/')}/api/tags"
    req = urllib.request.Request(url)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            obj = json.loads(resp.read().decode("utf-8"))
    except urllib.error.URLError as e:
        raise OllamaError(f"Could not reach Ollama at {url}: {e}") from e
    return [m.get("name", "") for m in obj.get("models", [])]
